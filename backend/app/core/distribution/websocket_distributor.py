"""
Live Signal Distribution via WebSocket
Pushes signals to connected clients in real-time
"""

import asyncio
import json
import logging
from typing import Set
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class SignalDistributor:
    """
    Manages WebSocket connections and distributes signals to subscribers
    """
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.connection_count = 0
        self.heartbeat_task = None
        
    async def start(self):
        """Start the distributor background tasks"""
        if not self.heartbeat_task:
            self.heartbeat_task = asyncio.create_task(self.send_heartbeat())
            logger.info("✅ WebSocket Distributor started")

    async def stop(self):
        """Stop distributor and close connections"""
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
            try:
                await self.heartbeat_task
            except asyncio.CancelledError:
                pass
            self.heartbeat_task = None
            
        # Close all active connections
        for connection in list(self.active_connections):
            await connection.close()
        self.active_connections.clear()
        logger.info("🛑 WebSocket Distributor stopped")
        
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept new WebSocket connection with optional JWT authentication"""
        token = websocket.query_params.get("token")
        if token:
            try:
                from jose import jwt
                from app.config import settings
                payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
                user_id = payload.get("sub")
                if not user_id:
                    await websocket.accept()
                    await websocket.close(code=1008)
                    logger.warning(f"WebSocket auth failed: Missing subject claim for client {client_id}")
                    return
            except Exception as e:
                await websocket.accept()
                await websocket.close(code=1008)
                logger.warning(f"WebSocket auth failed for client {client_id}: {e}")
                return
        else:
            from app.config import settings
            if settings.ENVIRONMENT == "production":
                await websocket.accept()
                await websocket.close(code=1008)
                logger.warning(f"WebSocket connection rejected: Missing token query parameter for client {client_id}")
                return

        await websocket.accept()
        self.active_connections.add(websocket)
        self.connection_count += 1
        logger.info(f"✅ New WebSocket client connected: {client_id} (Total: {len(self.active_connections)})")
        
        # Send welcome message
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "message": "Metis Signal Feed",
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def disconnect(self, websocket: WebSocket):
        """Remove disconnected client"""
        self.active_connections.discard(websocket)
        logger.info(f"❌ Client disconnected (Remaining: {len(self.active_connections)})")
    
    async def broadcast_signal(self, signal: dict):
        """
        Broadcast signal to all connected clients (masked to protect the paywall)
        
        Args:
            signal: Signal dictionary to broadcast
        """
        if not self.active_connections:
            logger.warning("No clients connected to receive signal")
            return
        
        # Mask signal details to prevent bypass of the nanopayment paywall
        try:
            from app.api.v1.endpoints.signals import mask_signal_details
            masked_signal = mask_signal_details(signal)
        except Exception as e:
            logger.error(f"Failed to mask signal for broadcast: {e}")
            masked_signal = signal
            
        message = {
            "type": "signal",
            "data": masked_signal,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to all connected clients
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
                logger.info(f"📤 Signal sent to client: {signal['symbol']} {signal['direction']}")
            except Exception as e:
                logger.error(f"Error sending to client: {e}")
                disconnected.add(connection)
        
        # Remove failed connections
        for conn in disconnected:
            self.disconnect(conn)
    
    async def broadcast_update(self, update_type: str, data: dict):
        """
        Broadcast general update to clients
        
        Args:
            update_type: Type of update (stats, alert, etc.)
            data: Update data
        """
        message = {
            "type": update_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass
    
    async def send_heartbeat(self):
        """Send periodic heartbeat to keep connections alive"""
        while True:
            await asyncio.sleep(30)  # Every 30 seconds
            
            if self.active_connections:
                message = {
                    "type": "heartbeat",
                    "timestamp": datetime.utcnow().isoformat(),
                    "active_signals": 0  # Would fetch from DB
                }
                
                for connection in list(self.active_connections):
                    try:
                        await connection.send_json(message)
                    except:
                        self.disconnect(connection)


# Global distributor instance
websocket_distributor = SignalDistributor()
signal_distributor = websocket_distributor  # Alias for compatibility
