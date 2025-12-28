"""
Kubernetes Routes
Provides real-time Kubernetes cluster information
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import logging

from services.kubernetes import get_kubernetes_client

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/pods")
async def get_pods(
    deployment: Optional[str] = Query(None, description="Filter by deployment name"),
    namespace: str = Query("default", description="Kubernetes namespace")
):
    """
    Get list of pods
    Real kubectl get pods execution
    """
    try:
        k8s_client = get_kubernetes_client(namespace)
        result = await k8s_client.get_pods(deployment)
        
        if result["success"]:
            return {
                "success": True,
                "pods": result["pods"],
                "namespace": result["namespace"],
                "count": len(result["pods"]),
                "timestamp": result["timestamp"]
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )
    
    except Exception as e:
        logger.error(f"Error getting pods: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/deployment")
async def get_deployment(
    name: str = Query("autodeployx-app", description="Deployment name"),
    namespace: str = Query("default", description="Kubernetes namespace")
):
    """
    Get deployment status
    Real kubectl get deployment execution
    """
    try:
        k8s_client = get_kubernetes_client(namespace)
        result = await k8s_client.get_deployment_status(name)
        
        if result["success"]:
            return {
                "success": True,
                "deployment": {
                    "name": result["deployment_name"],
                    "desired_replicas": result["desired_replicas"],
                    "ready_replicas": result["ready_replicas"],
                    "updated_replicas": result["updated_replicas"],
                    "image": result["image"],
                    "conditions": result["status_conditions"]
                },
                "timestamp": result["timestamp"]
            }
        else:
            raise HTTPException(
                status_code=404,
                detail=result["error"]
            )
    
    except Exception as e:
        logger.error(f"Error getting deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/deployment/history")
async def get_deployment_history(
    name: str = Query("autodeployx-app", description="Deployment name"),
    namespace: str = Query("default", description="Kubernetes namespace")
):
    """
    Get deployment rollout history
    Real kubectl history execution
    """
    try:
        k8s_client = get_kubernetes_client(namespace)
        result = await k8s_client.get_deployment_history(name)
        
        if result["success"]:
            return {
                "success": True,
                "history": result["history"],
                "timestamp": result["timestamp"]
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )
    
    except Exception as e:
        logger.error(f"Error getting deployment history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/deployment/rollback")
async def rollback_deployment(
    name: str = Query("autodeployx-app", description="Deployment name"),
    namespace: str = Query("default", description="Kubernetes namespace")
):
    """
    Rollback deployment to previous version
    Real kubectl rollout undo execution
    """
    try:
        k8s_client = get_kubernetes_client(namespace)
        result = await k8s_client.rollback(name)
        
        if result["success"]:
            return {
                "success": True,
                "message": result["message"],
                "deployment": result["deployment"],
                "timestamp": result["timestamp"]
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=result["error"]
            )
    
    except Exception as e:
        logger.error(f"Error rolling back deployment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pods/{pod_name}/logs")
async def get_pod_logs(
    pod_name: str,
    namespace: str = Query("default", description="Kubernetes namespace"),
    tail: int = Query(50, ge=1, le=1000, description="Number of lines to tail")
):
    """
    Get pod logs
    Real kubectl logs execution
    """
    try:
        k8s_client = get_kubernetes_client(namespace)
        result = await k8s_client.get_logs(pod_name, tail)
        
        if result["success"]:
            return {
                "success": True,
                "pod_name": result["pod_name"],
                "logs": result["logs"],
                "timestamp": result["timestamp"]
            }
        else:
            raise HTTPException(
                status_code=404,
                detail=result["error"]
            )
    
    except Exception as e:
        logger.error(f"Error getting pod logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
