"""Pydantic schemas for request/response validation"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal


# Strategy Schemas
class StrategyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    strategy_type: str = Field(..., pattern="^(json|pine|python)$")
    config: Dict[str, Any]
    executable_code: Optional[str] = None


class StrategyCreate(StrategyBase):
    pass


class StrategyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None


class StrategyResponse(StrategyBase):
    id: UUID
    user_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Backtest Schemas
class BacktestRequest(BaseModel):
    strategy_id: UUID
    start_date: datetime
    end_date: datetime
    initial_capital: Decimal = Field(default=Decimal("10000.00"), gt=0)
    symbols: Optional[List[str]] = None


class BacktestMetrics(BaseModel):
    total_trades: int
    win_rate: Decimal
    sharpe_ratio: Decimal
    max_drawdown: Decimal
    profit_factor: Decimal
    expectancy: Decimal
    risk_of_ruin: Decimal


class BacktestResponse(BaseModel):
    id: UUID
    strategy_id: UUID
    start_date: datetime
    end_date: datetime
    initial_capital: Decimal
    final_capital: Decimal
    metrics: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Signal Schemas
class SignalBase(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    direction: str = Field(..., pattern="^(BUY|SELL)$")
    entry_price: Decimal
    stop_loss: Decimal
    take_profit: Decimal
    probability_score: Decimal = Field(..., ge=0, le=100)
    signal_score: Decimal = Field(..., ge=0, le=10)
    confidence_level: str
    risk_rating: str
    trade_explanation: str
    position_sizing: Decimal
    gemini_context: Optional[Dict[str, Any]] = None


class SignalCreate(SignalBase):
    strategy_id: UUID


class SignalResponse(SignalBase):
    id: UUID
    strategy_id: UUID
    status: str
    created_at: datetime
    expires_at: datetime
    
    class Config:
        from_attributes = True


class SignalFilter(BaseModel):
    """Filter for listing signals"""
    symbols: Optional[List[str]] = None
    min_score: Optional[Decimal] = None
    min_probability: Optional[Decimal] = None
    status: Optional[str] = None
    limit: int = Field(default=50, le=500)


# Market Data Schemas
class MarketDataPoint(BaseModel):
    time: datetime
    symbol: str
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: Decimal
    exchange: str
    
    class Config:
        from_attributes = True


# Knowledge Base Schemas
class KnowledgeCreate(BaseModel):
    content: str
    metadata: Optional[Dict[str, Any]] = None


class KnowledgeSearch(BaseModel):
    query: str
    limit: int = Field(default=5, le=20)
    min_similarity: float = Field(default=0.7, ge=0, le=1)


class KnowledgeResponse(BaseModel):
    id: UUID
    content: str
    metadata: Optional[Dict[str, Any]]
    similarity: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# User Schemas
class UserCreate(BaseModel):
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")


class UserResponse(BaseModel):
    id: UUID
    email: str
    subscription_tier: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Health Check Schema
class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    redis: str
    timestamp: datetime
