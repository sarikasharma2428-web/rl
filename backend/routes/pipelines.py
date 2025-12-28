"""
Pipelines Routes
Handles pipeline triggering and status updates from Jenkins
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import logging
import os

from services.jenkins import get_jenkins_client, JenkinsBuildParams
from services.kubernetes import get_kubernetes_client
from services.websocket import manager, handle_websocket_client

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response Models
class PipelineTriggerRequest(BaseModel):
    """Request to trigger a pipeline"""
    environment: str = "dev"
    skip_tests: bool = False
    skip_security_scan: bool = False
    deploy_tag: str = ""

class PipelineTriggerResponse(BaseModel):
    """Response from pipeline trigger"""
    id: str
    status: str
    message: str
    jenkins_queue_id: Optional[str] = None
    timestamp: str

class PipelineStatusResponse(BaseModel):
    """Pipeline status response"""
    id: str
    pipeline_name: str
    build_number: int
    status: str
    branch: str
    started_at: str
    completed_at: Optional[str] = None

class StageUpdateRequest(BaseModel):
    """Stage status update from Jenkins"""
    pipeline_id: str
    stage_name: str
    status: str
    message: str = ""

class LogEntryRequest(BaseModel):
    """Log entry from Jenkins"""
    pipeline_id: str
    level: str  # info, success, error, warning
    message: str
    stage: Optional[str] = None

# In-memory storage for demo (replace with database in production)
pipelines = {}

@router.post("/trigger", response_model=PipelineTriggerResponse)
async def trigger_pipeline(
    request: PipelineTriggerRequest,
    background_tasks: BackgroundTasks
):
    """
    Trigger a new deployment pipeline
    
    Steps:
    1. Creates pipeline record
    2. Calls Jenkins to trigger build
    3. Broadcasts WebSocket update
    4. Returns pipeline ID and status
    """
    try:
        pipeline_id = str(uuid.uuid4())[:12]
        
        # Create pipeline record
        pipeline_data = {
            "id": pipeline_id,
            "status": "pending",
            "pipeline_name": "AutoDeployX",
            "build_number": 0,
            "branch": "main",
            "environment": request.environment,
            "skip_tests": request.skip_tests,
            "skip_security_scan": request.skip_security_scan,
            "deploy_tag": request.deploy_tag,
            "started_at": datetime.utcnow().isoformat(),
            "completed_at": None,
            "jenkins_queue_id": None,
            "jenkins_build_number": None,
            "stages": [
                {"name": "Checkout", "status": "pending"},
                {"name": "Test", "status": "pending"},
                {"name": "Build", "status": "pending"},
                {"name": "Push", "status": "pending"},
                {"name": "Deploy", "status": "pending"},
            ],
            "logs": []
        }
        
        pipelines[pipeline_id] = pipeline_data
        
        logger.info(f"Pipeline triggered: {pipeline_id}")
        
        # Broadcast to all WebSocket clients
        background_tasks.add_task(
            manager.broadcast_pipeline_status,
            {
                "pipelineId": pipeline_id,
                "status": "pending",
                "message": "Pipeline triggered, waiting for Jenkins",
                "currentStage": "Waiting for Jenkins..."
            }
        )
        
        # Trigger Jenkins in background
        background_tasks.add_task(
            trigger_jenkins_build,
            pipeline_id,
            request
        )
        
        return PipelineTriggerResponse(
            id=pipeline_id,
            status="pending",
            message="Pipeline triggered successfully",
            timestamp=datetime.utcnow().isoformat()
        )
    
    except Exception as e:
        logger.error(f"Error triggering pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{pipeline_id}", response_model=PipelineStatusResponse)
async def get_pipeline_status(pipeline_id: str):
    """Get pipeline status"""
    if pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    pipeline = pipelines[pipeline_id]
    return PipelineStatusResponse(
        id=pipeline["id"],
        pipeline_name=pipeline["pipeline_name"],
        build_number=pipeline["jenkins_build_number"] or 0,
        status=pipeline["status"],
        branch=pipeline["branch"],
        started_at=pipeline["started_at"],
        completed_at=pipeline.get("completed_at")
    )

@router.get("/", tags=["Pipelines"])
async def list_pipelines(limit: int = Query(10, ge=1, le=100)):
    """List recent pipelines"""
    all_pipelines = list(pipelines.values())
    # Sort by started_at descending
    all_pipelines.sort(key=lambda x: x["started_at"], reverse=True)
    return all_pipelines[:limit]

@router.post("/status", tags=["Pipelines"])
async def update_pipeline_status(
    pipeline_id: str,
    status: str,
    build_number: int = 0,
    stage: str = "",
    message: str = ""
):
    """
    Update pipeline status from Jenkins
    Called by Jenkins pipeline
    """
    if pipeline_id not in pipelines:
        logger.warning(f"Pipeline not found: {pipeline_id}")
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    pipeline = pipelines[pipeline_id]
    pipeline["status"] = status
    
    if build_number:
        pipeline["jenkins_build_number"] = build_number
    
    if stage:
        pipeline["current_stage"] = stage
    
    pipeline["updated_at"] = datetime.utcnow().isoformat()
    
    # If status is completed or failed, set completed_at
    if status in ["success", "failed", "aborted"]:
        pipeline["completed_at"] = datetime.utcnow().isoformat()
    
    logger.info(f"Pipeline {pipeline_id} status updated to {status}")
    
    # Broadcast update
    await manager.broadcast_pipeline_status({
        "pipelineId": pipeline_id,
        "status": status,
        "buildNumber": build_number,
        "stage": stage,
        "message": message
    })
    
    return {"success": True, "message": "Pipeline status updated"}

@router.post("/stage", tags=["Pipelines"])
async def update_stage_status(request: StageUpdateRequest):
    """
    Update stage status from Jenkins
    Called by Jenkins pipeline for each stage
    """
    if request.pipeline_id not in pipelines:
        logger.warning(f"Pipeline not found: {request.pipeline_id}")
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    pipeline = pipelines[request.pipeline_id]
    
    # Update stage in pipeline
    for stage in pipeline.get("stages", []):
        if stage["name"] == request.stage_name:
            stage["status"] = request.status
            stage["updated_at"] = datetime.utcnow().isoformat()
            break
    
    logger.info(f"Stage {request.stage_name} updated to {request.status}")
    
    # Broadcast stage update
    await manager.broadcast_stage_update({
        "pipelineId": request.pipeline_id,
        "stageName": request.stage_name,
        "status": request.status,
        "message": request.message
    })
    
    return {"success": True, "message": f"Stage {request.stage_name} updated"}

@router.post("/log", tags=["Pipelines"])
async def add_log_entry(request: LogEntryRequest):
    """
    Add log entry from Jenkins
    Called by Jenkins pipeline during execution
    """
    if request.pipeline_id not in pipelines:
        logger.warning(f"Pipeline not found: {request.pipeline_id}")
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    pipeline = pipelines[request.pipeline_id]
    
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "level": request.level,
        "message": request.message,
        "stage": request.stage
    }
    
    pipeline["logs"].append(log_entry)
    
    logger.info(f"Log entry added: [{request.level}] {request.message}")
    
    # Broadcast log entry
    await manager.broadcast_log({
        "pipelineId": request.pipeline_id,
        "timestamp": log_entry["timestamp"],
        "level": request.level,
        "message": request.message,
        "stage": request.stage
    })
    
    return {"success": True, "message": "Log entry added"}

# WebSocket endpoint
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    client_id = str(uuid.uuid4())[:8]
    await handle_websocket_client(websocket, client_id)

# Background task to trigger Jenkins
async def trigger_jenkins_build(
    pipeline_id: str,
    request: PipelineTriggerRequest
):
    """Background task to trigger Jenkins build"""
    try:
        jenkins_client = await get_jenkins_client()
        
        # Get backend URL from environment or construct it
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8001")
        
        # Build Jenkins parameters
        jenkins_params = JenkinsBuildParams(
            PIPELINE_ID=pipeline_id,
            ENVIRONMENT=request.environment,
            SKIP_TESTS=request.skip_tests,
            SKIP_SECURITY_SCAN=request.skip_security_scan,
            DEPLOY_TAG=request.deploy_tag,
            BACKEND_URL=backend_url
        )
        
        # Trigger Jenkins
        result = await jenkins_client.trigger_pipeline(jenkins_params)
        
        if result["success"]:
            pipelines[pipeline_id]["jenkins_queue_id"] = result["queue_id"]
            pipelines[pipeline_id]["status"] = "queued"
            
            logger.info(f"Jenkins build triggered for pipeline {pipeline_id}")
            logger.info(f"Queue ID: {result['queue_id']}")
            
            # Broadcast update
            await manager.broadcast_pipeline_status({
                "pipelineId": pipeline_id,
                "status": "queued",
                "message": "Waiting in Jenkins queue",
                "queueId": result["queue_id"]
            })
            
            # Poll for build number
            await poll_queue_item(pipeline_id, result["queue_id"])
        else:
            pipelines[pipeline_id]["status"] = "failed"
            logger.error(f"Failed to trigger Jenkins: {result['error']}")
            
            await manager.broadcast_pipeline_status({
                "pipelineId": pipeline_id,
                "status": "failed",
                "message": f"Jenkins error: {result['error']}"
            })
    
    except Exception as e:
        logger.error(f"Error triggering Jenkins build: {e}")
        pipelines[pipeline_id]["status"] = "failed"
        
        await manager.broadcast_pipeline_status({
            "pipelineId": pipeline_id,
            "status": "failed",
            "message": f"Error: {str(e)}"
        })

async def poll_queue_item(pipeline_id: str, queue_id: str):
    """Poll queue item to get build number"""
    import asyncio
    
    jenkins_client = await get_jenkins_client()
    max_attempts = 60
    attempt = 0
    
    while attempt < max_attempts:
        try:
            result = await jenkins_client.get_queue_item(queue_id)
            
            if result["success"]:
                executable = result.get("executable")
                if executable:
                    build_number = executable.get("number")
                    pipelines[pipeline_id]["jenkins_build_number"] = build_number
                    pipelines[pipeline_id]["status"] = "running"
                    
                    logger.info(f"Build number assigned: {build_number}")
                    
                    await manager.broadcast_pipeline_status({
                        "pipelineId": pipeline_id,
                        "status": "running",
                        "buildNumber": build_number,
                        "message": f"Build #{build_number} started"
                    })
                    
                    return
            
            await asyncio.sleep(2)
            attempt += 1
        
        except Exception as e:
            logger.error(f"Error polling queue item: {e}")
            await asyncio.sleep(2)
            attempt += 1
    
    logger.warning(f"Could not get build number for queue {queue_id}")
