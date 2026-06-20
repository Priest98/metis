"""Signal endpoints with x402 payment gating"""

from fastapi import APIRouter, HTTPException, status, Query, Header, Depends
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
import logging

from app.database import supabase_client
from app.models import Signal
from app.schemas import SignalResponse
from app.config import settings
from app.core.auth import get_current_user
from app.core.lepton.x402 import x402_manager

router = APIRouter()
logger = logging.getLogger(__name__)

def mask_signal_details(signal: dict) -> dict:
    """Mask sensitive trading details for unpaid users"""
    masked = signal.copy()
    masked["entry_price"] = 0.0
    masked["stop_loss"] = 0.0
    masked["take_profit"] = 0.0
    masked["position_sizing"] = 0.0
    masked["trade_explanation"] = "GATED: Settle USDC nanopayment on Arc L1 to unlock signal analysis, entry, and stop/target prices."
    masked["gemini_context"] = None
    masked["gated"] = True
    # Include default price if not present
    if "price_usdc" not in masked or masked["price_usdc"] is None:
        masked["price_usdc"] = 0.001000
    return masked

@router.get("/", response_model=List[dict])
async def list_signals(
    symbols: Optional[List[str]] = Query(None),
    min_score: Optional[Decimal] = Query(None, ge=0, le=10),
    min_probability: Optional[Decimal] = Query(None, ge=0, le=100),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=500)
):
    """
    List signals. Sensitive trading parameters are masked until unlocked.
    """
    score_float = float(min_score) if min_score is not None else None
    prob_float = float(min_probability) if min_probability is not None else None
    
    signals = await supabase_client.get_signals(
        symbols=symbols,
        min_score=score_float,
        min_prob=prob_float,
        status=status,
        limit=limit
    )
    
    # Mask details for public view
    return [mask_signal_details(s) for s in signals]

@router.get("/history", response_model=List[dict])
async def get_history_signals(limit: int = Query(50, le=500)):
    """
    List historical signals. Added to align with frontend dashboard calls.
    """
    signals = await supabase_client.get_signals(limit=limit)
    return [mask_signal_details(s) for s in signals]

@router.get("/{signal_id}", response_model=dict)
async def get_signal(signal_id: UUID):
    """Get public masked version of a specific signal by ID."""
    signal = await supabase_client.get_signal_by_id(str(signal_id))
    
    if not signal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signal not found"
        )
    
    return mask_signal_details(signal)

@router.get("/{signal_id}/details", response_model=dict)
async def get_signal_details(
    signal_id: UUID,
    x_payment_tx: Optional[str] = Header(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Unlock the detailed parameters of a signal.
    Enforces HTTP 402 Payment Required if transaction is missing or invalid.
    """
    signal = await supabase_client.get_signal_by_id(str(signal_id))
    
    if not signal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Signal not found"
        )
        
    user_id = current_user.get("sub")
    price_usdc = float(signal.get("price_usdc", 0.001000))
    destination_wallet = "0x71C7656EC7ab88b098defB751B7401B5f6d1476B" # Host / Creator split wallet
    
    # Verify payment status
    if not x402_manager.verify_payment(user_id, str(signal_id), x_payment_tx):
        # Generate HTTP 402 headers
        payment_headers = x402_manager.get_payment_headers(
            signal_id=str(signal_id),
            price_usdc=price_usdc,
            destination_wallet=destination_wallet
        )
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Payment Required: USDC nanopayment is required to access premium trading parameters.",
            headers=payment_headers
        )
        
    # User paid, return full signal
    unlocked_signal = signal.copy()
    unlocked_signal["gated"] = False
    return unlocked_signal

@router.get("/active/high-quality", response_model=List[dict])
async def get_high_quality_signals(
    limit: int = Query(20, le=100)
):
    """
    Get active high-quality signals that meet platform thresholds.
    """
    signals = await supabase_client.get_signals(
        status="active",
        min_score=settings.MIN_SIGNAL_SCORE,
        min_prob=settings.MIN_PROBABILITY,
        limit=limit
    )
    
    return [mask_signal_details(s) for s in signals]


@router.post("/demo-trigger", response_model=dict)
async def trigger_demo_signal(
    current_user: dict = Depends(get_current_user)
):
    """
    Trigger a simulated signal, hold an AI consensus debate, persist to DB,
    and launch the autonomous agent payment/evaluation workflow.
    """
    import random
    import uuid
    import json
    from app.database.postgres import AsyncSessionLocal
    from app.models import Strategy, User
    from sqlalchemy import select
    from app.core.agents.committee import agent_committee

    symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'EURUSD']
    symbol = random.choice(symbols)
    direction = random.choice(['BUY', 'SELL'])
    price = 64250.0 if symbol == 'BTCUSDT' else 3420.0 if symbol == 'ETHUSDT' else 145.0 if symbol == 'SOLUSDT' else 1.0850
    sl = price * (0.98 if direction == 'BUY' else 1.02)
    tp = price * (1.05 if direction == 'BUY' else 0.95)
    
    # Generate debate transcript
    debate_results = await agent_committee.hold_debate(
        signal_candidate={
            "symbol": symbol,
            "direction": direction,
            "entry": price,
            "stop_loss": sl,
            "take_profit": tp,
            "signal_score": round(random.uniform(7.0, 9.8), 1)
        },
        strategy_stats={"win_rate": 65.0},
        market_conditions={"regime": "trending", "volatility": "normal", "session": "london"}
    )
    
    # Find or create a dummy strategy to link to
    strat_id = None
    async with AsyncSessionLocal() as session:
        user_res = await session.execute(select(User).order_by(User.created_at.asc()))
        user = user_res.scalars().first()
        if user:
            strat_res = await session.execute(select(Strategy).where(Strategy.user_id == user.id))
            strat = strat_res.scalars().first()
            if not strat:
                strat = Strategy(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    name="London Breakout",
                    strategy_type="json",
                    config={}
                )
                session.add(strat)
                await session.commit()
                await session.refresh(strat)
            strat_id = str(strat.id)
            
    signal_data = {
        "strategy_id": strat_id,
        "symbol": symbol,
        "direction": direction,
        "entry_price": price,
        "stop_loss": sl,
        "take_profit": tp,
        "probability_score": random.randint(65, 95),
        "signal_score": debate_results.get("risk_vote") == "APPROVE" and 8.5 or 7.2,
        "confidence_level": random.choice(["High", "Medium"]),
        "risk_rating": random.choice(["Low", "Medium", "High"]),
        "trade_explanation": f"Simulated {direction} signal generated by the Metis Agentic quant trigger.",
        "position_sizing": random.randint(1, 5),
        "debate_transcript": json.dumps(debate_results),
        "status": "active"
    }
    
    # Persist the signal to the database
    stored_id = await supabase_client.store_signal(signal_data)
    if stored_id:
        signal_data["id"] = stored_id
    else:
        signal_data["id"] = str(uuid.uuid4())
    
    # Run the agent workflow in background
    from app.core.agents.trader_agent import agent_fleet_manager
    import asyncio
    asyncio.create_task(agent_fleet_manager.process_new_signal(signal_data))
    
    return {"status": "success", "message": f"Demo signal generated for {symbol}", "signal": signal_data}
