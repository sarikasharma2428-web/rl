"""
Deployment Events and Manual Deployment Routes
Handles deployment events from Jenkins and manual deployments
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import logging
import os

from services.kubernetes import get_kubernetes_client
from services.websocket import manager

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory event storage
deployment_events = []

class DeploymentEvent(BaseModel):
    """Event from Jenkins deployment pipeline"""
    event_type: str  # checkout, test, build, security_scan, push, deploy, rollback, health_check
    status: str      # running, success, failed
    details: Dict[str, Any] = {}

class ManualDeployRequest(BaseModel):
    """Manual deployment request"""
    image_tag: str
    replicas: int = 3
    namespace: str = "default"

@router.post("/event")
async def deployment_event(event: DeploymentEvent):
    """
    Receive deployment events from Jenkins
    
    Matches Jenkinsfile calls:
    - Line 68: Checkout event
    - Line 100: Test event
    - Line 176: Build event
    - Line 193, 210: Security scan events
    - Line 260: Push event
    - Line 318: Deploy event
    - Line 333: Rollback event
    - Line 380: Health check event
    """
    logger.info(f"Deployment event: {event.event_type} - {event.status}")
    
    event_record = {
        "event_type": event.event_type,
        "status": event.status,
        "details": event.details,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    deployment_events.append(event_record)
    
    # Broadcast event to WebSocket clients
    await manager.broadcast({
        "type": "deployment_event",
        "timestamp": datetime.utcnow().isoformat(),
        "data": event_record
    })
    
    # Special handling for deploy event - fetch K8s status
    if event.event_type == "deploy" and event.status == "success":
        # Trigger background task to fetch and broadcast K8s status
        import asyncio
        asyncio.create_task(broadcast_kubernetes_status())
    
    return {
        "success": True,
        "message": f"Event {event.event_type} recorded"
    }

@router.get("/events")
async def get_deployment_events(limit: int = 50):
    """Get recent deployment events"""
    return deployment_events[-limit:]

@router.post("/manual")
async def manual_deploy(
    request: ManualDeployRequest,
    background_tasks: BackgroundTasks
):
    """
    Trigger manual deployment (without full pipeline)
    Used by "Quick Deploy" button in frontend
    """
    logger.info(f"Manual deployment triggered: {request.image_tag}")
    
    # Get Docker image name from environment
    docker_image = os.getenv("DOCKER_IMAGE", "sarika1731/autodeployx")
    
    # Trigger deployment in background
    background_tasks.add_task(
        run_manual_deployment,
        docker_image,
        request.image_tag,
        request.replicas,
        request.namespace
    )
    
    return {
        "success": True,
        "message": "Manual deployment initiated",
        "image": f"{docker_image}:{request.image_tag}",
        "timestamp": datetime.utcnow().isoformat()
    }

async def run_manual_deployment(
    image: str,
    tag: str,
    replicas: int,
    namespace: str
):
    """Background task for manual deployment"""
    try:
        k8s_client = get_kubernetes_client(namespace)
        
        # Deploy to Kubernetes
        result = await k8s_client.deploy(
            image=image,
            tag=tag,
            replicas=replicas
        )
        
        if result["success"]:
            logger.info(f"Manual deployment successful: {image}:{tag}")
            
            # Broadcast success
            await manager.broadcast_deployment_update({
                "type": "manual",
                "status": "success",
                "image": f"{image}:{tag}",
                "replicas": replicas,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Fetch and broadcast K8s status
            await broadcast_kubernetes_status()
        else:
            logger.error(f"Manual deployment failed: {result['error']}")
            await manager.broadcast_deployment_update({
                "type": "manual",
                "status": "failed",
                "error": result["error"],
                "timestamp": datetime.utcnow().isoformat()
            })
    
    except Exception as e:
        logger.error(f"Error in manual deployment: {e}")
        await manager.broadcast_deployment_update({
            "type": "manual",
            "status": "failed",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        })

async def broadcast_kubernetes_status():
    """Fetch and broadcast current Kubernetes status"""
    try:
        k8s_client = get_kubernetes_client()
        
        # Get pods
        pods_result = await k8s_client.get_pods("autodeployx-app")
        
        if pods_result["success"]:
            await manager.broadcast_kubernetes_update({
                "pods": pods_result["pods"],
                "namespace": pods_result["namespace"],
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Get deployment status
        deployment_result = await k8s_client.get_deployment_status("autodeployx-app")
        
        if deployment_result["success"]:
            await manager.broadcast_deployment_update({
                "deployment_name": deployment_result["deployment_name"],
                "desired_replicas": deployment_result["desired_replicas"],
                "ready_replicas": deployment_result["ready_replicas"],
                "image": deployment_result["image"],
                "timestamp": datetime.utcnow().isoformat()
            })
    
    except Exception as e:
        logger.error(f"Error broadcasting K8s status: {e}")
