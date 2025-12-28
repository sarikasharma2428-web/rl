"""
WebSocket Manager
Handles real-time connections and broadcasting updates
"""

import json
import logging
from typing import Set, Dict, Any
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect
import asyncio

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections and broadcasting"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.client_states: Dict[str, Any] = {}  # Store client-specific state
    
    async def connect(self, websocket: WebSocket, client_id: str = None):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        
        if client_id:
            self.client_states[client_id] = {
                "websocket": websocket,
                "connected_at": datetime.utcnow().isoformat(),
                "messages_received": 0,
                "messages_sent": 0
            }
        
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")
        
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "timestamp": datetime.utcnow().isoformat(),
            "message": "Connected to AutoDeployX WebSocket server",
            "active_connections": len(self.active_connections)
        })
    
    def disconnect(self, websocket: WebSocket):
        """Remove a disconnected WebSocket"""
        if websocket in self.active_connections:
            self.active_connections.discard(websocket)
            logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            logger.debug("No active connections to broadcast to")
            return
        
        disconnected = set()
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            self.disconnect(connection)
    
    async def broadcast_pipeline_status(self, pipeline_data: Dict[str, Any]):
        """Broadcast pipeline status update"""
        await self.broadcast({
            "type": "state_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "pipeline": pipeline_data
            }
        })
    
    async def broadcast_stage_update(self, stage_data: Dict[str, Any]):
        """Broadcast stage status update"""
        await self.broadcast({
            "type": "stage_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "stage": stage_data
            }
        })
    
    async def broadcast_log(self, log_entry: Dict[str, Any]):
        """Broadcast a new log entry"""
        await self.broadcast({
            "type": "log_entry",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "log": log_entry
            }
        })
    
    async def broadcast_kubernetes_update(self, k8s_data: Dict[str, Any]):
        """Broadcast Kubernetes status update"""
        await self.broadcast({
            "type": "kubernetes_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "kubernetes": k8s_data
            }
        })
    
    async def broadcast_docker_update(self, docker_data: Dict[str, Any]):
        """Broadcast Docker image update"""
        await self.broadcast({
            "type": "docker_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "docker": docker_data
            }
        })
    
    async def broadcast_deployment_update(self, deployment_data: Dict[str, Any]):
        """Broadcast deployment status update"""
        await self.broadcast({
            "type": "deployment_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "deployment": deployment_data
            }
        })
    
    async def send_error(self, websocket: WebSocket, error_message: str):
        """Send error message to specific client"""
        try:
            await websocket.send_json({
                "type": "error",
                "timestamp": datetime.utcnow().isoformat(),
                "message": error_message
            })
        except Exception as e:
            logger.error(f"Error sending error message: {e}")
    
    def get_status(self) -> Dict[str, Any]:
        """Get connection manager status"""
        return {
            "active_connections": len(self.active_connections),
            "clients": len(self.client_states),
            "timestamp": datetime.utcnow().isoformat()
        }


# Global connection manager instance
manager = ConnectionManager()

async def handle_websocket_client(websocket: WebSocket, client_id: str = None):
    """Handle individual WebSocket client connection"""
    try:
        await manager.connect(websocket, client_id)
        
        while True:
            # Receive and handle messages from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                message_type = message.get("type", "unknown")
                
                logger.debug(f"Received message type: {message_type}")
                
                # Handle ping/pong for keep-alive
                if message_type == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                # Handle refresh request
                elif message_type == "refresh":
                    await websocket.send_json({
                        "type": "refresh_response",
                        "timestamp": datetime.utcnow().isoformat(),
                        "message": "Refresh data requested"
                    })
                
            except json.JSONDecodeError:
                logger.warning("Invalid JSON received from client")
                await manager.send_error(websocket, "Invalid JSON format")
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"Client {client_id} disconnected")
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
