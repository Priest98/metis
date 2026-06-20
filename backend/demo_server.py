"""
Simplified FastAPI application for demo purposes (no database required)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import random

# App
app = FastAPI(
    title="Metis API",
    description="Quant Signal Intelligence System",
    version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Signal(BaseModel):
    id: str
    symbol: str
    direction: str
    entry_price: float
    stop_loss: float
    take_profit: float
    probability_score: float
    signal_score: float
    confidence_level: str
    risk_rating: str
    trade_explanation: str
    position_sizing: float
    status: str
    created_at: str
    expires_at: str

# Sample data
SAMPLE_SIGNALS = [
    Signal(
        id="sig_001",
        symbol="EURUSD",
        direction="BUY",
        entry_price=1.08520,
        stop_loss=1.08380,
        take_profit=1.08890,
        probability_score=72.5,
        signal_score=8.6,
        confidence_level="High",
        risk_rating="Medium",
        trade_explanation="Strong confluence of liquidity sweep at support level with fair value gap. Historical data shows 75% win rate in similar London session setups. Current trending regime favors breakout entries.",
        position_sizing=2.5,
        status="active",
        created_at=(datetime.now() - timedelta(minutes=2)).isoformat(),
        expires_at=(datetime.now() + timedelta(hours=22)).isoformat()
    ),
    Signal(
        id="sig_002",
        symbol="BTCUSD",
        direction="SELL",
        entry_price=42850.00,
        stop_loss=43150.00,
        take_profit=41950.00,
        probability_score=68.0,
        signal_score=7.8,
        confidence_level="Medium",
        risk_rating="Low",
        trade_explanation="Resistance level rejection with bearish order block formation. Monte Carlo simulation shows 68% probability of profit. Strategy performs well in current volatility conditions.",
        position_sizing=2.0,
        status="active",
        created_at=(datetime.now() - timedelta(minutes=15)).isoformat(),
        expires_at=(datetime.now() + timedelta(hours=21)).isoformat()
    ),
    Signal(
        id="sig_003",
        symbol="GBPJPY",
        direction="BUY",
        entry_price=189.350,
        stop_loss=189.120,
        take_profit=189.890,
        probability_score=75.2,
        signal_score=8.9,
        confidence_level="High",
        risk_rating="Low",
        trade_explanation="Perfect London killzone setup with institutional order flow confirmation. Risk-reward ratio 1:2.3 with strong support zone. High probability based on 200+ historical backtests.",
        position_sizing=3.0,
        status="active",
        created_at=(datetime.now() - timedelta(minutes=5)).isoformat(),
        expires_at=(datetime.now() + timedelta(hours=23)).isoformat()
    )
]

# Routes
@app.get("/")
def read_root():
    return {
        "message": "Metis API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/api/v1/signals", response_model=List[Signal])
def get_signals(
    symbols: Optional[str] = None,
    min_score: Optional[float] = None,
    min_probability: Optional[float] = None,
    status: Optional[str] = "active",
    limit: int = 10
):
    """Get all signals with optional filters"""
    signals = SAMPLE_SIGNALS.copy()
    
    # Filter by status
    if status:
        signals = [s for s in signals if s.status == status]
    
    # Filter by min score
    if min_score:
        signals = [s for s in signals if s.signal_score >= min_score]
    
    # Filter by min probability
    if min_probability:
        signals = [s for s in signals if s.probability_score >= min_probability]
    
    # Filter by symbols
    if symbols:
        symbol_list = [s.strip() for s in symbols.split(',')]
        signals = [s for s in signals if s.symbol in symbol_list]
    
    return signals[:limit]

@app.get("/api/v1/signals/active/high-quality", response_model=List[Signal])
def get_high_quality_signals(limit: int = 20):
    """Get active high-quality signals (score >= 7.0)"""
    signals = [s for s in SAMPLE_SIGNALS if s.status == "active" and s.signal_score >= 7.0]
    # Sort by score descending
    signals.sort(key=lambda x: x.signal_score, reverse=True)
    return signals[:limit]

@app.get("/api/v1/signals/{signal_id}", response_model=Signal)
def get_signal(signal_id: str):
    """Get specific signal by ID"""
    for signal in SAMPLE_SIGNALS:
        if signal.id == signal_id:
            return signal
    return {"error": "Signal not found"}

@app.get("/api/v1/stats")
def get_stats():
    """Get system statistics"""
    active_signals = [s for s in SAMPLE_SIGNALS if s.status == "active"]
    
    if not active_signals:
        return {
            "active_signals": 0,
            "avg_score": 0.0,
            "avg_probability": 0.0,
            "win_rate": 0.0
        }
    
    avg_score = sum(s.signal_score for s in active_signals) / len(active_signals)
    avg_prob = sum(s.probability_score for s in active_signals) / len(active_signals)
    
    return {
        "active_signals": len(active_signals),
        "avg_score": round(avg_score, 1),
        "avg_probability": round(avg_prob, 1),
        "win_rate": 68.0  # Mock data
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
