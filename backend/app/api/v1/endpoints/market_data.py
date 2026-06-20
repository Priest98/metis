"""Market data endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from datetime import datetime

from app.database import get_db
from app.models import MarketData
from app.schemas import MarketDataPoint
from app.core.auth import get_current_user

router = APIRouter()


@router.get("/{symbol}", response_model=List[MarketDataPoint])
async def get_market_data(
    symbol: str,
    start_time: datetime = Query(..., description="Start time (ISO format)"),
    end_time: datetime = Query(..., description="End time (ISO format)"),
    limit: int = Query(1000, le=10000),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get historical market data for a symbol.
    
    - **symbol**: Trading pair symbol (e.g., 'BTCUSD', 'EURUSD')
    - **start_time**: Start of time range (ISO 8601 format)
    - **end_time**: End of time range (ISO 8601 format)
    - **limit**: Maximum number of data points (max 10000)
    """
    result = await db.execute(
        select(MarketData)
        .where(
            and_(
                MarketData.symbol == symbol.upper(),
                MarketData.time >= start_time,
                MarketData.time <= end_time
            )
        )
        .order_by(MarketData.time.asc())
        .limit(limit)
    )
    data = result.scalars().all()
    
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No market data found for {symbol} in the specified time range"
        )
    
    return data


@router.get("/{symbol}/latest", response_model=MarketDataPoint)
async def get_latest_market_data(
    symbol: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get the latest market data point for a symbol."""
    result = await db.execute(
        select(MarketData)
        .where(MarketData.symbol == symbol.upper())
        .order_by(MarketData.time.desc())
        .limit(1)
    )
    data = result.scalar_one_or_none()
    
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No market data found for {symbol}"
        )
    
    return data
