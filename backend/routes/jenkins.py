"""
Jenkins Callback Routes
Handles callbacks from Jenkins pipeline during execution
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging

from services.websocket import manager

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory pipeline storage (imported from pipelines.py)
from routes.pipelines import pipelines

class JenkinsStatusUpdate(BaseModel):
    """Status update from Jenkins"""
    status: str
    pipeline_name: str
    build_number: int
    stage: str = ""
    message: str = ""
    branch: str = "main"
    pipeline_id: Optional[str] = None

class JenkinsStageUpdate(BaseModel):
    """Stage update from Jenkins"""
    stage_name: str
    status: str
    pipeline_id: Optional[str] = None

@router.post("/status")
async def jenkins_status_callback(update: JenkinsStatusUpdate):
    """
    Receive status updates from Jenkins
    Jenkins calls this endpoint during pipeline execution
    
    Matches Jenkinsfile calls:
    - Line 38: Pipeline Started
    - Line 413: Success
    - Line 437: Failure
    """
    logger.info(f"Jenkins status update: {update.status} - {update.message}")
    
    # Find pipeline by build_number if pipeline_id not provided
    pipeline_id = update.pipeline_id
    if not pipeline_id:
        # Search for pipeline with matching build_number
        for pid, pipeline in pipelines.items():
            if pipeline.get("jenkins_build_number") == update.build_number:
                pipeline_id = pid
                break
    
    if pipeline_id and pipeline_id in pipelines:
        pipeline = pipelines[pipeline_id]
        pipeline["status"] = update.status
        pipeline["jenkins_build_number"] = update.build_number
        pipeline["current_stage"] = update.stage
        pipeline["updated_at"] = datetime.utcnow().isoformat()
        
        if update.status in ["success", "failure", "aborted"]:
            pipeline["completed_at"] = datetime.utcnow().isoformat()
        
        # Broadcast to WebSocket clients
        await manager.broadcast_pipeline_status({
            "pipelineId": pipeline_id,
            "status": update.status,
            "buildNumber": update.build_number,
            "stage": update.stage,
            "message": update.message,
            "branch": update.branch
        })
    else:
        logger.warning(f"Pipeline not found for build #{update.build_number}")
    
    return {
        "success": True,
        "message": "Status update received",
        "build_number": update.build_number,
        "status": update.status
    }

@router.post("/stage")
async def jenkins_stage_callback(update: JenkinsStageUpdate):
    """
    Receive stage updates from Jenkins
    Jenkins calls this endpoint for each pipeline stage
    
    Matches Jenkinsfile calls:
    - Line 50, 63: Checkout
    - Line 85, 96: Test
    - Line 144, 170: Build
    - Line 236, 254: Push
    - Line 272, 313: Deploy
    - Line 348, 375: HealthCheck
    """
    logger.info(f"Jenkins stage update: {update.stage_name} - {update.status}")
    
    # Find pipeline by pipeline_id or latest running pipeline
    pipeline_id = update.pipeline_id
    if not pipeline_id:
        # Find latest running pipeline
        for pid, pipeline in pipelines.items():
            if pipeline.get("status") in ["running", "queued"]:
                pipeline_id = pid
                break
    
    if pipeline_id and pipeline_id in pipelines:
        pipeline = pipelines[pipeline_id]
        
        # Update stage in pipeline
        for stage in pipeline.get("stages", []):
            if stage["name"] == update.stage_name:
                stage["status"] = update.status
                stage["updated_at"] = datetime.utcnow().isoformat()
                break
        
        # Broadcast stage update
        await manager.broadcast_stage_update({
            "pipelineId": pipeline_id,
            "stageName": update.stage_name,
            "status": update.status
        })
    else:
        logger.warning(f"Pipeline not found for stage update: {update.stage_name}")
    
    return {
        "success": True,
        "message": f"Stage {update.stage_name} updated to {update.status}"
    }
