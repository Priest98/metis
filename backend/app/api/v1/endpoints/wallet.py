from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
import secrets
import asyncio
from datetime import datetime, timezone
from eth_account import Account
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, supabase_client
from app.models import User, Agent, Transaction
from app.core.auth import get_current_user
from app.services.arc_blockchain import (
    get_onchain_balance,
    send_onchain_usdc,
    deposit_to_yield_loop,
    withdraw_from_yield_loop
)

router = APIRouter()

# Pydantic Schemas for Requests
class ExternalWalletRequest(BaseModel):
    external_wallet: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$")

class PayRequest(BaseModel):
    signal_id: str
    destination: str = Field(..., pattern=r"^0x[a-fA-F0-9]{40}$")
    amount: float = Field(..., gt=0)

class CreateAgentRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    daily_budget: float = Field(default=1.0, ge=0.0)
    initial_balance: float = Field(default=5.0, ge=0.0)

class UpdateAgentRequest(BaseModel):
    daily_budget: Optional[float] = Field(default=None, ge=0.0)
    is_active: Optional[bool] = None

# Endpoints
def calculate_accrued_yield(agent: Agent) -> bool:
    """
    Calculates interest accrued by the agent in the DeFi yield loop
    based on a 5.5% APY. Updates agent attributes in-place.
    Returns True if interest was accrued, False otherwise.
    """
    if not agent.yield_loop_active or not agent.yield_loop_last_deposit:
        return False
        
    now = datetime.now(timezone.utc)
    last_deposit = agent.yield_loop_last_deposit
    if last_deposit.tzinfo is None:
        last_deposit = last_deposit.replace(tzinfo=timezone.utc)
        
    elapsed_seconds = (now - last_deposit).total_seconds()
    if elapsed_seconds <= 0:
        return False
        
    # APY = 5.5%
    apy = Decimal("0.055")
    year_seconds = Decimal("31536000") # 365 days
    
    accrued = Decimal(str(agent.yield_loop_balance)) * apy * Decimal(str(elapsed_seconds)) / year_seconds
    if accrued > Decimal("0.00000001"): # Minimum threshold to update
        agent.yield_loop_balance = Decimal(str(agent.yield_loop_balance)) + accrued
        agent.yield_loop_interest_earned = Decimal(str(agent.yield_loop_interest_earned)) + accrued
        agent.yield_loop_last_deposit = now
        return True
        
    return False

@router.get("/me", response_model=Dict[str, Any])
async def get_wallet(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the current user's wallet address, balance, and external address."""
    user_id = uuid.UUID(current_user.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    if user.wallet_address:
        onchain_bal = await asyncio.to_thread(get_onchain_balance, user.wallet_address)
        user.wallet_balance = Decimal(str(onchain_bal))
        db.add(user)
        await db.commit()
        
    return {
        "wallet_address": user.wallet_address,
        "wallet_balance": float(user.wallet_balance),
        "external_wallet": user.external_wallet
    }

@router.get("/balance", response_model=Dict[str, Any])
async def get_live_balance(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lightweight endpoint: poll Arc testnet for the live on-chain USDC balance.
    Called by the faucet page every 15 seconds to detect when funds arrive.
    """
    user_id = uuid.UUID(current_user.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    onchain_bal = await asyncio.to_thread(get_onchain_balance, user.wallet_address)
    user.wallet_balance = Decimal(str(onchain_bal))
    db.add(user)
    await db.commit()

    return {
        "wallet_address": user.wallet_address,
        "wallet_balance": float(onchain_bal),
        "network": "Arc L1 Testnet",
    }



@router.post("/me/external", response_model=Dict[str, Any])
async def update_external_wallet(
    req: ExternalWalletRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Link an optional external wallet connection to the user's account."""
    user_id = uuid.UUID(current_user.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    user.external_wallet = req.external_wallet
    await db.commit()
    
    return {
        "status": "success",
        "message": "External wallet updated successfully",
        "external_wallet": user.external_wallet
    }

@router.post("/faucet", response_model=Dict[str, Any])
async def wallet_faucet(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Faucet helper endpoint.
    Queries the real Arc testnet for the actual on-chain balance and syncs it.

    To get real testnet USDC:
      → https://faucet.circle.com  (select Arc Testnet, paste wallet_address)
      → https://faucet.testnet.arc.network  (native gas token)
    """
    user_id = uuid.UUID(current_user.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Sync real on-chain balance
    real_bal = await asyncio.to_thread(get_onchain_balance, user.wallet_address)
    user.wallet_balance = real_bal
    await db.commit()

    return {
        "status": "success",
        "wallet_address": user.wallet_address,
        "wallet_balance": float(real_bal),
        "faucet_urls": {
            "usdc": "https://faucet.circle.com",
            "gas":  "https://faucet.testnet.arc.network",
        },
        "message": (
            f"On-chain balance synchronized. "
            f"To claim testnet USDC, visit https://faucet.circle.com, "
            f"select Arc Testnet, and paste: {user.wallet_address}"
        ),
    }


@router.get("/history", response_model=List[Dict[str, Any]])
async def get_transaction_history(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all microtransactions associated with the user and their agents."""
    user_id = uuid.UUID(current_user.get("sub"))
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.created_at.desc())
    )
    txs = result.scalars().all()
    
    return [
        {
            "id": str(tx.id),
            "tx_hash": tx.tx_hash,
            "amount": float(tx.amount),
            "currency": tx.currency,
            "sender_address": tx.sender_address,
            "receiver_address": tx.receiver_address,
            "purpose": tx.purpose,
            "status": tx.status,
            "created_at": tx.created_at.isoformat() if tx.created_at else None
        }
        for tx in txs
    ]

@router.post("/pay", response_model=Dict[str, Any])
async def execute_micropayment(
    req: PayRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Builds, signs, and executes an on-chain transaction on Arc L1 for HTTP 402 signal unlocks.
    Broadcasting the transaction, registering it, and returning the real tx_hash.
    """
    user_id = uuid.UUID(current_user.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # Retrieve the signal to double-check the price
    signal = await supabase_client.get_signal_by_id(req.signal_id)
    if not signal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target signal not found"
        )
        
    signal_price = float(signal.get("price_usdc", 0.001000))
    # Safety checks
    if abs(req.amount - signal_price) > 0.000001:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount mismatch. Requested: {req.amount}, Required: {signal_price}"
        )
        
    # Query current on-chain balance
    user_balance = await asyncio.to_thread(get_onchain_balance, user.wallet_address)
    if user_balance < Decimal(str(signal_price)):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient on-chain wallet balance ({user_balance:.6f} USDC). Please request faucet funds at https://faucet.circle.com for address {user.wallet_address}."
        )
        
    # Execute actual on-chain transaction
    try:
        tx_hash = await asyncio.to_thread(
            send_onchain_usdc,
            user.wallet_private_key,
            req.destination,
            Decimal(str(signal_price))
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit on-chain transaction to Arc Testnet: {str(e)}"
        )
        
    # Deduct balance locally
    user.wallet_balance = Decimal(str(user_balance)) - Decimal(str(signal_price))
    db.add(user)
    
    payment_tx = Transaction(
        id=uuid.uuid4(),
        user_id=user_id,
        tx_hash=tx_hash,
        amount=Decimal(str(signal_price)),
        currency="USDC",
        sender_address=user.wallet_address,
        receiver_address=req.destination,
        purpose=f"Unlock Signal Details ({req.signal_id})",
        status="success"
    )
    db.add(payment_tx)
    await db.commit()
    
    return {
        "status": "success",
        "message": f"Payment of {signal_price:.6f} USDC processed successfully on-chain",
        "tx_hash": tx_hash,
        "wallet_balance": float(user.wallet_balance)
    }

@router.get("/agents", response_model=List[Dict[str, Any]])
async def list_agents(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all AI agents and their budgets registered under the current user."""
    user_id = uuid.UUID(current_user.get("sub"))
    result = await db.execute(select(Agent).where(Agent.user_id == user_id))
    agents = result.scalars().all()
    
    # Update agent balances on-chain and accrue yield
    for a in agents:
        calculate_accrued_yield(a)
        if a.wallet_address:
            onchain_bal = await asyncio.to_thread(get_onchain_balance, a.wallet_address)
            a.wallet_balance = Decimal(str(onchain_bal))
        db.add(a)
    if agents:
        await db.commit()
        
    return [
        {
            "id": str(a.id),
            "name": a.name,
            "wallet_address": a.wallet_address,
            "wallet_balance": float(a.wallet_balance),
            "daily_budget": float(a.daily_budget),
            "spent_today": float(a.spent_today),
            "is_active": a.is_active,
            "yield_loop_active": a.yield_loop_active,
            "yield_loop_balance": float(a.yield_loop_balance) if a.yield_loop_balance is not None else 0.0,
            "yield_loop_interest_earned": float(a.yield_loop_interest_earned) if a.yield_loop_interest_earned is not None else 0.0,
            "yield_loop_last_deposit": a.yield_loop_last_deposit.isoformat() if a.yield_loop_last_deposit else None,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in agents
    ]

@router.post("/agents", response_model=Dict[str, Any])
async def create_agent(
    req: CreateAgentRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Provision a new AI agent with a dedicated EVM wallet and daily spending budget."""
    user_id = uuid.UUID(current_user.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    # Query user on-chain balance
    user_balance = await asyncio.to_thread(get_onchain_balance, user.wallet_address)
    if user_balance < Decimal(str(req.initial_balance)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient user on-chain balance ({user_balance:.6f} USDC) to fund agent wallet ({req.initial_balance} USDC)."
        )
        
    # Generate agent EVM wallet
    agent_acct = Account.create()
    
    # Execute actual on-chain funding transfer
    try:
        tx_hash = await asyncio.to_thread(
            send_onchain_usdc,
            user.wallet_private_key,
            agent_acct.address,
            Decimal(str(req.initial_balance))
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fund agent wallet on-chain: {str(e)}"
        )
        
    agent = Agent(
        id=uuid.uuid4(),
        user_id=user_id,
        name=req.name,
        wallet_address=agent_acct.address,
        wallet_private_key=agent_acct.key.hex(),
        wallet_balance=Decimal(str(req.initial_balance)),
        daily_budget=Decimal(str(req.daily_budget)),
        spent_today=Decimal("0.000000"),
        is_active=True
    )
    db.add(agent)
    
    # Record transaction in ledger
    transfer_tx = Transaction(
        id=uuid.uuid4(),
        user_id=user_id,
        agent_id=agent.id,
        tx_hash=tx_hash,
        amount=Decimal(str(req.initial_balance)),
        currency="USDC",
        sender_address=user.wallet_address,
        receiver_address=agent.wallet_address,
        purpose=f"Provision AI Agent: {req.name}",
        status="success"
    )
    db.add(transfer_tx)
    
    # Update local cached balance
    user.wallet_balance = Decimal(str(user_balance)) - Decimal(str(req.initial_balance))
    db.add(user)
    
    await db.commit()
    await db.refresh(agent)
    
    return {
        "status": "success",
        "message": f"AI Agent '{req.name}' created with wallet address {agent.wallet_address} and funded on-chain",
        "agent": {
            "id": str(agent.id),
            "name": agent.name,
            "wallet_address": agent.wallet_address,
            "wallet_balance": float(agent.wallet_balance),
            "daily_budget": float(agent.daily_budget),
            "is_active": agent.is_active
        },
        "user_balance": float(user.wallet_balance)
    }

@router.post("/agents/{agent_id}/budget", response_model=Dict[str, Any])
async def update_agent_budget(
    agent_id: str,
    req: UpdateAgentRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Configure budgets or pause/activate an AI agent."""
    user_id = uuid.UUID(current_user.get("sub"))
    agent_uuid = uuid.UUID(agent_id)
    
    result = await db.execute(
        select(Agent)
        .where(Agent.id == agent_uuid)
        .where(Agent.user_id == user_id)
    )
    agent = result.scalar_one_or_none()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Agent not found or access denied"
        )
        
    if req.daily_budget is not None:
        agent.daily_budget = Decimal(str(req.daily_budget))
    if req.is_active is not None:
        agent.is_active = req.is_active
        
    await db.commit()
    
    return {
        "status": "success",
        "message": "AI Agent settings updated successfully",
        "agent": {
            "id": str(agent.id),
            "name": agent.name,
            "wallet_address": agent.wallet_address,
            "wallet_balance": float(agent.wallet_balance),
            "daily_budget": float(agent.daily_budget),
            "is_active": agent.is_active
        }
    }

class FundAgentRequest(BaseModel):
    amount: float = Field(..., gt=0)

@router.post("/agents/{agent_id}/fund", response_model=Dict[str, Any])
async def fund_agent(
    agent_id: str,
    req: FundAgentRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fund an existing AI agent's wallet from the user's wallet balance on-chain."""
    user_id = uuid.UUID(current_user.get("sub"))
    agent_uuid = uuid.UUID(agent_id)
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    agent_result = await db.execute(
        select(Agent)
        .where(Agent.id == agent_uuid)
        .where(Agent.user_id == user_id)
    )
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found or access denied"
        )
        
    # Query user on-chain balance
    user_balance = await asyncio.to_thread(get_onchain_balance, user.wallet_address)
    if user_balance < Decimal(str(req.amount)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient user on-chain balance ({user_balance:.6f} USDC) to fund agent wallet ({req.amount} USDC)."
        )
        
    # Execute actual on-chain funding transfer
    try:
        tx_hash = await asyncio.to_thread(
            send_onchain_usdc,
            user.wallet_private_key,
            agent.wallet_address,
            Decimal(str(req.amount))
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fund agent wallet on-chain: {str(e)}"
        )
        
    # Update local cached balances
    user.wallet_balance = Decimal(str(user_balance)) - Decimal(str(req.amount))
    agent.wallet_balance = agent.wallet_balance + Decimal(str(req.amount))
    db.add(user)
    db.add(agent)
    
    # Record transaction in ledger
    fund_tx = Transaction(
        id=uuid.uuid4(),
        user_id=user_id,
        agent_id=agent.id,
        tx_hash=tx_hash,
        amount=Decimal(str(req.amount)),
        currency="USDC",
        sender_address=user.wallet_address,
        receiver_address=agent.wallet_address,
        purpose=f"Fund AI Agent: {agent.name}",
        status="success"
    )
    db.add(fund_tx)
    await db.commit()
    
    return {
        "status": "success",
        "message": f"Successfully funded agent '{agent.name}' with {req.amount:.6f} USDC on-chain.",
        "tx_hash": tx_hash,
        "user_balance": float(user.wallet_balance),
        "agent_balance": float(agent.wallet_balance)
    }


class YieldToggleRequest(BaseModel):
    amount: Optional[float] = Field(default=None, description="Optional custom amount to deposit. If None, deposits maximum available balance.")


@router.post("/agents/{agent_id}/yield/toggle", response_model=Dict[str, Any])
async def toggle_agent_yield_loop(
    agent_id: str,
    req: YieldToggleRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Toggles the DeFi Yield Loop for an AI agent.
    If enabling: deposits funds from agent wallet to DeFi pool.
    If disabling: withdraws all funds + interest from DeFi pool back to agent wallet.
    """
    user_id = uuid.UUID(current_user.get("sub"))
    agent_uuid = uuid.UUID(agent_id)
    
    # Retrieve agent
    result = await db.execute(
        select(Agent)
        .where(Agent.id == agent_uuid)
        .where(Agent.user_id == user_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Agent not found or access denied"
        )
        
    # Accrue any existing interest before changing state
    calculate_accrued_yield(agent)
    
    if not agent.yield_loop_active:
        # 1. Enable Yield Loop: Deposit USDC from agent wallet to DeFi pool
        # Check current wallet balance
        current_wallet_bal = await asyncio.to_thread(get_onchain_balance, agent.wallet_address)
        agent.wallet_balance = Decimal(str(current_wallet_bal))
        
        # Determine amount to deposit (leave a tiny gas reserve of 0.1 USDC)
        deposit_reserve = Decimal("0.1")
        available = agent.wallet_balance - deposit_reserve
        
        # If user requested a custom amount
        if req.amount is not None:
            deposit_amount = Decimal(str(req.amount))
            if deposit_amount <= 0:
                raise HTTPException(status_code=400, detail="Deposit amount must be positive")
            if deposit_amount > agent.wallet_balance:
                raise HTTPException(status_code=400, detail=f"Insufficient wallet balance. Available: {agent.wallet_balance} USDC")
        else:
            deposit_amount = available
            
        if deposit_amount <= Decimal("0.0"):
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient agent wallet balance ({agent.wallet_balance} USDC) to enter yield loop. Leave at least 0.1 USDC for gas."
            )
            
        # Execute DeFi pool deposit
        try:
            tx_hash = await asyncio.to_thread(
                deposit_to_yield_loop,
                agent.wallet_private_key,
                deposit_amount
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"DeFi deposit transaction failed: {str(e)}"
            )
            
        # Update agent state
        agent.yield_loop_active = True
        agent.yield_loop_balance = Decimal(str(agent.yield_loop_balance)) + deposit_amount
        agent.wallet_balance = agent.wallet_balance - deposit_amount
        agent.yield_loop_last_deposit = datetime.now(timezone.utc)
        db.add(agent)
        
        # Record transaction in ledger
        deposit_tx = Transaction(
            id=uuid.uuid4(),
            user_id=user_id,
            agent_id=agent.id,
            tx_hash=tx_hash,
            amount=deposit_amount,
            currency="USDC",
            sender_address=agent.wallet_address,
            receiver_address="0xDeFiYieLdLoOp462600000000000000000000000",
            purpose=f"DeFi Pool Deposit (Yield Loop: {agent.name})",
            status="success"
        )
        db.add(deposit_tx)
        await db.commit()
        
        return {
            "status": "success",
            "message": f"Successfully deposited {deposit_amount:.6f} USDC into DeFi Yield Loop for agent '{agent.name}'",
            "tx_hash": tx_hash,
            "agent": {
                "id": str(agent.id),
                "name": agent.name,
                "wallet_balance": float(agent.wallet_balance),
                "yield_loop_active": agent.yield_loop_active,
                "yield_loop_balance": float(agent.yield_loop_balance),
                "yield_loop_interest_earned": float(agent.yield_loop_interest_earned)
            }
        }
    else:
        # 2. Disable Yield Loop: Withdraw all principal + interest back to agent wallet
        withdraw_amount = agent.yield_loop_balance
        if withdraw_amount <= 0:
            agent.yield_loop_active = False
            agent.yield_loop_last_deposit = None
            db.add(agent)
            await db.commit()
            return {
                "status": "success",
                "message": "Yield loop deactivated (no balance to withdraw).",
                "agent": {
                    "id": str(agent.id),
                    "name": agent.name,
                    "wallet_balance": float(agent.wallet_balance),
                    "yield_loop_active": False,
                    "yield_loop_balance": 0.0
                }
            }
            
        try:
            tx_hash = await asyncio.to_thread(
                withdraw_from_yield_loop,
                agent.wallet_private_key,
                withdraw_amount
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"DeFi withdrawal transaction failed: {str(e)}"
            )
            
        # Update balances
        agent.wallet_balance = agent.wallet_balance + withdraw_amount
        agent.yield_loop_active = False
        agent.yield_loop_balance = Decimal("0.0")
        agent.yield_loop_last_deposit = None
        db.add(agent)
        
        # Record transaction in ledger
        withdraw_tx = Transaction(
            id=uuid.uuid4(),
            user_id=user_id,
            agent_id=agent.id,
            tx_hash=tx_hash,
            amount=withdraw_amount,
            currency="USDC",
            sender_address="0xDeFiYieLdLoOp462600000000000000000000000",
            receiver_address=agent.wallet_address,
            purpose=f"DeFi Pool Withdrawal (Yield Loop: {agent.name})",
            status="success"
        )
        db.add(withdraw_tx)
        await db.commit()
        
        return {
            "status": "success",
            "message": f"Successfully withdrew {withdraw_amount:.6f} USDC from DeFi Yield Loop for agent '{agent.name}'",
            "tx_hash": tx_hash,
            "agent": {
                "id": str(agent.id),
                "name": agent.name,
                "wallet_balance": float(agent.wallet_balance),
                "yield_loop_active": agent.yield_loop_active,
                "yield_loop_balance": float(agent.yield_loop_balance),
                "yield_loop_interest_earned": float(agent.yield_loop_interest_earned)
            }
        }
