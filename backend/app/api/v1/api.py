from fastapi import APIRouter
from app.api.v1.endpoints import (
    strategies,
    backtests,
    signals,
    market_data,
    knowledge,
    auth,
    wallet,
    stats,
    mcp,
)

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["auth"]
)

api_router.include_router(
    strategies.router,
    prefix="/strategies",
    tags=["strategies"]
)

api_router.include_router(
    backtests.router,
    prefix="/backtests",
    tags=["backtests"]
)

api_router.include_router(
    signals.router,
    prefix="/signals",
    tags=["signals"]
)

api_router.include_router(
    market_data.router,
    prefix="/market-data",
    tags=["market-data"]
)

api_router.include_router(
    knowledge.router,
    prefix="/knowledge",
    tags=["knowledge"]
)

api_router.include_router(
    wallet.router,
    prefix="/wallet",
    tags=["wallet"]
)

api_router.include_router(
    stats.router,
    prefix="/stats",
    tags=["stats"]
)

api_router.include_router(
    mcp.router,
    prefix="/mcp",
    tags=["mcp"]
)
