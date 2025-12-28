"""
AutoDeployX - Main Application Entry Point
FastAPI application with health checks and deployment endpoints
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.health import router as health_router
from routes.pipelines import router as pipelines_router
from routes.deploy import router as deploy_router
from routes.jenkins import router as jenkins_router
from routes.deployments import router as deployments_router
from routes.kubernetes import router as kubernetes_router
from services.worker import BackgroundWorker
from services.jenkins import close_jenkins_client
import uvicorn
import os
import logging

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AutoDeployX",
    description="Automated DevOps Deployment Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix for Kubernetes ingress
app.include_router(health_router, prefix="/api/health", tags=["Health"])
app.include_router(pipelines_router, prefix="/api/pipelines", tags=["Pipelines"])
app.include_router(deploy_router, prefix="/api/deploy", tags=["Deployment"])
app.include_router(jenkins_router, prefix="/api/jenkins", tags=["Jenkins Callbacks"])
app.include_router(deployments_router, prefix="/api/deployments", tags=["Deployment Events"])
app.include_router(kubernetes_router, prefix="/api/kubernetes", tags=["Kubernetes"])

# Initialize background worker
worker = BackgroundWorker()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    await worker.start()
    logger.info("🚀 AutoDeployX started successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await worker.stop()
    await close_jenkins_client()
    logger.info("👋 AutoDeployX shutting down...")

@app.get("/")
async def root():
    return {
        "name": "AutoDeployX",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/api")
async def api_root():
    return {
        "name": "AutoDeployX API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
