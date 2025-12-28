"""
Jenkins Integration Service
Handles communication with Jenkins for pipeline triggering and monitoring
"""

import httpx
import logging
from typing import Optional, Dict, Any
from datetime import datetime
import os
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class JenkinsConfig:
    """Jenkins configuration from environment variables"""
    URL = os.getenv("JENKINS_URL", "http://localhost:8080")
    USERNAME = os.getenv("JENKINS_USERNAME", "admin")
    TOKEN = os.getenv("JENKINS_TOKEN", "")
    PIPELINE_NAME = os.getenv("JENKINS_PIPELINE", "AutoDeployX")

class JenkinsBuildParams(BaseModel):
    """Parameters for Jenkins build"""
    PIPELINE_ID: str = ""
    ENVIRONMENT: str = "dev"
    SKIP_TESTS: bool = False
    SKIP_SECURITY_SCAN: bool = False
    DEPLOY_TAG: str = ""
    BACKEND_URL: str = ""

class JenkinsClient:
    """Client for interacting with Jenkins API"""
    
    def __init__(self):
        self.base_url = JenkinsConfig.URL
        self.username = JenkinsConfig.USERNAME
        self.token = JenkinsConfig.TOKEN
        self.pipeline_name = JenkinsConfig.PIPELINE_NAME
        self.client = httpx.AsyncClient(
            auth=(self.username, self.token) if self.token else None,
            timeout=30.0
        )
    
    async def trigger_pipeline(
        self,
        params: JenkinsBuildParams = None
    ) -> Dict[str, Any]:
        """
        Trigger Jenkins pipeline build
        Returns build number and queue ID
        """
        try:
            if not params:
                params = JenkinsBuildParams()
            
            # Build parameters for Jenkins
            build_params = {
                "PIPELINE_ID": params.PIPELINE_ID,
                "ENVIRONMENT": params.ENVIRONMENT,
                "SKIP_TESTS": "true" if params.SKIP_TESTS else "false",
                "SKIP_SECURITY_SCAN": "true" if params.SKIP_SECURITY_SCAN else "false",
                "DEPLOY_TAG": params.DEPLOY_TAG,
                "BACKEND_URL": params.BACKEND_URL,
            }
            
            # Jenkins API endpoint to trigger build with parameters
            url = f"{self.base_url}/job/{self.pipeline_name}/buildWithParameters"
            
            response = await self.client.post(
                url,
                params=build_params,
                headers={"Accept": "application/json"}
            )
            
            logger.info(f"Jenkins trigger response: {response.status_code}")
            
            if response.status_code in [200, 201]:
                # Extract queue item ID from Location header
                queue_id = response.headers.get("Location", "").split("/")[-2]
                
                return {
                    "success": True,
                    "queue_id": queue_id,
                    "pipeline_name": self.pipeline_name,
                    "timestamp": datetime.utcnow().isoformat(),
                    "message": f"Pipeline {self.pipeline_name} triggered successfully"
                }
            else:
                logger.error(f"Jenkins error: {response.text}")
                return {
                    "success": False,
                    "error": f"Jenkins returned status {response.status_code}",
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error triggering Jenkins pipeline: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def get_build_info(self, build_number: int) -> Dict[str, Any]:
        """Get build information from Jenkins"""
        try:
            url = f"{self.base_url}/job/{self.pipeline_name}/{build_number}/api/json"
            
            response = await self.client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "build_number": build_number,
                    "status": data.get("result", "IN_PROGRESS"),
                    "duration": data.get("duration", 0),
                    "timestamp": data.get("timestamp", 0),
                    "full_data": data
                }
            else:
                return {
                    "success": False,
                    "error": f"Build not found: {build_number}"
                }
                
        except Exception as e:
            logger.error(f"Error getting build info: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_last_build(self) -> Dict[str, Any]:
        """Get last build of the pipeline"""
        try:
            url = f"{self.base_url}/job/{self.pipeline_name}/lastBuild/api/json"
            
            response = await self.client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "data": data
                }
            else:
                return {
                    "success": False,
                    "error": "No builds found"
                }
                
        except Exception as e:
            logger.error(f"Error getting last build: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_queue_item(self, queue_id: str) -> Dict[str, Any]:
        """Get queue item information"""
        try:
            url = f"{self.base_url}/queue/item/{queue_id}/api/json"
            
            response = await self.client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "queue_id": queue_id,
                    "executable": data.get("executable"),
                    "data": data
                }
            else:
                return {
                    "success": False,
                    "error": "Queue item not found"
                }
                
        except Exception as e:
            logger.error(f"Error getting queue item: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Global Jenkins client instance
_jenkins_client: Optional[JenkinsClient] = None

async def get_jenkins_client() -> JenkinsClient:
    """Get or create Jenkins client"""
    global _jenkins_client
    if _jenkins_client is None:
        _jenkins_client = JenkinsClient()
    return _jenkins_client

async def close_jenkins_client():
    """Close Jenkins client"""
    global _jenkins_client
    if _jenkins_client:
        await _jenkins_client.close()
        _jenkins_client = None
