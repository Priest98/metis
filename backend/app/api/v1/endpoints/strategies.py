"""Strategy endpoints"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Optional
from uuid import UUID
from datetime import datetime

from app.database import supabase_client
from app.models import Strategy
from app.schemas import StrategyCreate, StrategyUpdate, StrategyResponse
from app.core.strategies.parser import strategy_parser
from app.core.triggers.strategy_trigger import strategy_trigger_system
from app.core.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=Dict, status_code=status.HTTP_201_CREATED)
async def create_strategy(
    strategy: StrategyCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new trading strategy.
    Supports JSON, Pine Script, and Python strategy formats.
    """
    # 1. Validate Strategy Config
    if strategy.strategy_type == 'json':
        validation = strategy_parser.parse_json_strategy(
            str(strategy.config).replace("'", '"')
        )
        if not validation.get('valid'):
             raise HTTPException(
                 status_code=status.HTTP_400_BAD_REQUEST,
                 detail=f"Invalid strategy configuration: {validation.get('error')}"
             )

    # 2. Store in Supabase
    strategy_data = {
        'name': strategy.name,
        'description': strategy.description,
        'type': strategy.strategy_type,
        'rules': strategy.config,  
        'risk_management': strategy.config.get('risk_management', {}),
        'user_id': current_user.get("sub")
    }
    
    strategy_id = await supabase_client.store_strategy(strategy_data)
    
    if not strategy_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create strategy"
        )
    
    # Add to running system
    full_strategy = {**strategy_data, "id": strategy_id}
    strategy_trigger_system.add_strategy(full_strategy)
        
    return {**full_strategy, "created_at": datetime.utcnow().isoformat()}


@router.get("/", response_model=List[Dict])
async def list_strategies(current_user: dict = Depends(get_current_user)):
    """List all strategies belonging to the current user."""
    user_id = current_user.get("sub")
    strategies = await supabase_client.get_strategies(user_id=user_id)
    return strategies


@router.get("/{strategy_id}", response_model=Dict)
async def get_strategy(
    strategy_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific strategy by ID."""
    user_id = current_user.get("sub")
    strategies = await supabase_client.get_strategies(user_id=user_id)
    for s in strategies:
        if s['id'] == strategy_id:
            return s
            
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Strategy not found"
    )


@router.post("/optimize", response_model=Dict)
async def optimize_strategies(
    current_user: dict = Depends(get_current_user)
):
    """
    Run an optimization sweep across all active strategies.
    Tunes parameters using programmatic historical backtesting.
    """
    from app.core.strategies.optimizer import strategy_optimizer
    results = await strategy_optimizer.optimize_active_strategies()
    return results

