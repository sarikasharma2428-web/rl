"""
Kubernetes Integration Service
Handles kubectl commands and deployment monitoring
"""

import asyncio
import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
import subprocess

logger = logging.getLogger(__name__)

class KubernetesClient:
    """Client for Kubernetes operations via kubectl"""
    
    def __init__(self, namespace: str = "default"):
        self.namespace = namespace
    
    async def _run_command(self, command: List[str]) -> tuple[bool, str]:
        """
        Run a kubectl command asynchronously
        Returns (success, output)
        """
        try:
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                return True, stdout.decode('utf-8', errors='ignore')
            else:
                error = stderr.decode('utf-8', errors='ignore')
                logger.error(f"kubectl error: {error}")
                return False, error
                
        except Exception as e:
            logger.error(f"Error running kubectl command: {e}")
            return False, str(e)
    
    async def deploy(
        self,
        image: str,
        deployment_name: str = "autodeployx-app",
        replicas: int = 3,
        tag: str = "latest"
    ) -> Dict[str, Any]:
        """Deploy image to Kubernetes"""
        try:
            full_image = f"{image}:{tag}"
            
            # Check if deployment exists
            exists_cmd = [
                "kubectl", "get", "deployment",
                deployment_name,
                "-n", self.namespace
            ]
            
            exists, _ = await self._run_command(exists_cmd)
            
            if exists:
                # Update existing deployment
                update_cmd = [
                    "kubectl", "set", "image",
                    f"deployment/{deployment_name}",
                    f"{deployment_name}={full_image}",
                    "-n", self.namespace
                ]
                success, output = await self._run_command(update_cmd)
            else:
                # Create new deployment
                create_cmd = [
                    "kubectl", "create", "deployment",
                    deployment_name,
                    f"--image={full_image}",
                    f"--replicas={replicas}",
                    "-n", self.namespace
                ]
                success, output = await self._run_command(create_cmd)
            
            if success:
                # Wait for rollout
                await asyncio.sleep(2)
                return {
                    "success": True,
                    "deployment": deployment_name,
                    "image": full_image,
                    "replicas": replicas,
                    "timestamp": datetime.utcnow().isoformat(),
                    "message": "Deployment updated successfully"
                }
            else:
                return {
                    "success": False,
                    "error": output,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error deploying to Kubernetes: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def get_pods(
        self,
        deployment_name: str = None
    ) -> Dict[str, Any]:
        """Get pods information"""
        try:
            cmd = ["kubectl", "get", "pods", "-n", self.namespace, "-o", "json"]
            
            success, output = await self._run_command(cmd)
            
            if success:
                pods_data = json.loads(output)
                pods = []
                
                for pod in pods_data.get("items", []):
                    if deployment_name:
                        # Filter by deployment name in labels
                        labels = pod.get("metadata", {}).get("labels", {})
                        if labels.get("app") != deployment_name:
                            continue
                    
                    status = pod["status"]["phase"]
                    containers = pod["status"].get("containerStatuses", [])
                    
                    restarts = 0
                    if containers:
                        restarts = containers[0].get("restartCount", 0)
                    
                    pods.append({
                        "name": pod["metadata"]["name"],
                        "status": status.lower(),
                        "restarts": restarts,
                        "age": pod["metadata"].get("creationTimestamp", ""),
                        "image": containers[0].get("image", "") if containers else ""
                    })
                
                return {
                    "success": True,
                    "pods": pods,
                    "namespace": self.namespace,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "success": False,
                    "error": output,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error getting pods: {e}")
            return {
                "success": False,
                "error": str(e),
                "pods": [],
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def get_deployment_status(
        self,
        deployment_name: str = "autodeployx-app"
    ) -> Dict[str, Any]:
        """Get deployment status"""
        try:
            cmd = [
                "kubectl", "get", "deployment",
                deployment_name,
                "-n", self.namespace,
                "-o", "json"
            ]
            
            success, output = await self._run_command(cmd)
            
            if success:
                deployment = json.loads(output)
                spec = deployment.get("spec", {})
                status = deployment.get("status", {})
                
                return {
                    "success": True,
                    "deployment_name": deployment_name,
                    "desired_replicas": spec.get("replicas", 0),
                    "ready_replicas": status.get("readyReplicas", 0),
                    "updated_replicas": status.get("updatedReplicas", 0),
                    "image": spec.get("template", {}).get("spec", {}).get("containers", [{}])[0].get("image", ""),
                    "status_conditions": status.get("conditions", []),
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "success": False,
                    "error": output,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error getting deployment status: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def get_deployment_history(
        self,
        deployment_name: str = "autodeployx-app"
    ) -> Dict[str, Any]:
        """Get deployment rollout history"""
        try:
            # Get replicasets to build history
            cmd = [
                "kubectl", "get", "replicaset",
                "-n", self.namespace,
                "-o", "json"
            ]
            
            success, output = await self._run_command(cmd)
            
            if success:
                replicasets = json.loads(output)
                history = []
                
                for rs in replicasets.get("items", []):
                    owner_refs = rs.get("metadata", {}).get("ownerReferences", [])
                    
                    # Filter by deployment owner
                    if any(ref.get("name") == deployment_name for ref in owner_refs):
                        image = rs.get("spec", {}).get("template", {}).get("spec", {}).get("containers", [{}])[0].get("image", "")
                        
                        history.append({
                            "revision": rs["metadata"].get("generation", 0),
                            "image": image,
                            "timestamp": rs["metadata"].get("creationTimestamp", ""),
                            "replicas": rs["status"].get("replicas", 0),
                            "ready_replicas": rs["status"].get("readyReplicas", 0),
                            "status": "success" if rs["status"].get("readyReplicas", 0) > 0 else "failed"
                        })
                
                # Sort by timestamp descending
                history.sort(key=lambda x: x["timestamp"], reverse=True)
                
                return {
                    "success": True,
                    "history": history[:10],  # Last 10 deployments
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "success": False,
                    "error": output,
                    "history": [],
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error getting deployment history: {e}")
            return {
                "success": False,
                "error": str(e),
                "history": [],
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def get_logs(
        self,
        pod_name: str,
        tail: int = 50
    ) -> Dict[str, Any]:
        """Get pod logs"""
        try:
            cmd = [
                "kubectl", "logs",
                pod_name,
                "-n", self.namespace,
                f"--tail={tail}",
                "--timestamps=true"
            ]
            
            success, output = await self._run_command(cmd)
            
            if success:
                return {
                    "success": True,
                    "pod_name": pod_name,
                    "logs": output,
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "success": False,
                    "error": output,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error getting logs: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def rollback(
        self,
        deployment_name: str = "autodeployx-app"
    ) -> Dict[str, Any]:
        """Rollback deployment to previous version"""
        try:
            cmd = [
                "kubectl", "rollout", "undo",
                f"deployment/{deployment_name}",
                "-n", self.namespace
            ]
            
            success, output = await self._run_command(cmd)
            
            if success:
                return {
                    "success": True,
                    "deployment": deployment_name,
                    "message": "Rollback completed successfully",
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                return {
                    "success": False,
                    "error": output,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error rolling back deployment: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }


# Global Kubernetes client instance
_k8s_client: Optional[KubernetesClient] = None

def get_kubernetes_client(namespace: str = "default") -> KubernetesClient:
    """Get or create Kubernetes client"""
    global _k8s_client
    if _k8s_client is None:
        _k8s_client = KubernetesClient(namespace=namespace)
    return _k8s_client
