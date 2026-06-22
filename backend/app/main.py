"""FastAPI Application Entry Point"""

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import sys
import asyncio
from datetime import datetime

from app.config import settings
from app.api.v1.api import api_router
from app.core.triggers.strategy_trigger import strategy_trigger_system
from app.core.distribution.websocket_distributor import websocket_distributor
from app.database import supabase_client

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
    ]
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    
    try:
        # Check database connection
        if supabase_client.connected:
            logger.info("✅ Database connection verified")
        else:
            logger.warning("⚠️ Database not connected - functionalities limited")
            
        # Initialize SQL database tables
        from app.database import init_db
        try:
            await init_db()
            logger.info("✅ Relational database initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize database: {e}")
        
        # Start WebSocket Distributor
        await websocket_distributor.start()
        logger.info("✅ WebSocket Distributor started")
        
        # Start Strategy Trigger System (in background)
        # We start it with some default symbols but it can be updated dynamically
        asyncio.create_task(strategy_trigger_system.start(["BTCUSDT", "ETHUSDT", "EURUSD"]))
        logger.info("✅ Strategy Trigger System started")

        # Start Signal Lifecycle Manager
        from app.core.signals.lifecycle import signal_lifecycle
        asyncio.create_task(signal_lifecycle.start())
        logger.info("✅ Signal Lifecycle Manager started")
        
        # Ingest Initial Sentiment Data (in background)
        from app.core.market_data.sentiment import sentiment_ingestor
        asyncio.create_task(sentiment_ingestor.seed_all_sentiment())
        logger.info("✅ Ingested initial sentiment data")
        
        yield
        
    finally:
        # Shutdown
        logger.info("Shutting down application...")
        await websocket_distributor.stop()
        await strategy_trigger_system.stop()
        logger.info("Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Institutional-grade quantitative trading signal platform",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# CORS middleware
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error" if settings.ENVIRONMENT == "production" else str(exc),
            "timestamp": datetime.utcnow().isoformat(),
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "database": "connected" if supabase_client.connected else "disconnected",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "docs": "/docs" if settings.DEBUG else "disabled",
        "status": "operational",
    }


# Include API router
app.include_router(api_router, prefix="/api/v1")

# WebSocket endpoint for signals
@app.websocket("/ws/signals/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket_distributor.connect(websocket, client_id)
    if websocket not in websocket_distributor.active_connections:
        return
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_distributor.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
