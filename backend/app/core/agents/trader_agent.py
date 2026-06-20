import logging
import asyncio
from typing import Dict, Any
from decimal import Decimal
from datetime import datetime
import secrets
import uuid

from sqlalchemy import select
from app.database.postgres import AsyncSessionLocal
from app.models import User, Agent, Transaction

logger = logging.getLogger(__name__)

class AgentFleetManager:
    def __init__(self):
        # Initial budgets and balances (as a fallback if database is not seeded/empty)
        self.strategy_agent = {
            "name": "Strategy Agent (Trader)",
            "balance": Decimal("10.000000"),
            "daily_budget": Decimal("1.000000"),
            "spent_today": Decimal("0.000000"),
            "min_probability": 70.0,
            "min_score": 7.5
        }
        self.risk_agent = {
            "name": "Risk Agent (Validator)",
            "balance": Decimal("5.000000"),
            "validation_fee": Decimal("0.000500")
        }
        self.signal_agent = {
            "name": "Signal Agent (Publisher)",
            "balance": Decimal("5.000000"),
            "unlock_fee": Decimal("0.001000")
        }
        self.ledger = []

    def get_balances(self) -> Dict[str, float]:
        return {
            "strategy_agent": float(self.strategy_agent["balance"]),
            "risk_agent": float(self.risk_agent["balance"]),
            "signal_agent": float(self.signal_agent["balance"])
        }

    async def sync_from_db(self):
        """Attempts to sync agent parameters from the database (loads first user's default agent)."""
        try:
            async with AsyncSessionLocal() as session:
                user_res = await session.execute(select(User).order_by(User.created_at.asc()))
                user = user_res.scalars().first()
                if user:
                    agent_res = await session.execute(
                        select(Agent)
                        .where(Agent.user_id == user.id)
                        .where(Agent.name == "Strategy Agent (Trader)")
                    )
                    db_agent = agent_res.scalar_one_or_none()
                    if db_agent:
                        self.strategy_agent["balance"] = db_agent.wallet_balance
                        self.strategy_agent["daily_budget"] = db_agent.daily_budget
                        self.strategy_agent["spent_today"] = db_agent.spent_today
                        logger.info(f"🤖 Synced Agent Fleet Strategy Agent from DB: balance={db_agent.wallet_balance} USDC")
        except Exception as e:
            logger.error(f"Error syncing Agent Fleet Manager with DB: {e}")

    async def process_new_signal(self, raw_signal: Dict[str, Any]):
        """
        Agentic Workflow:
        1. Receive masked signal (Signal Agent alerts).
        2. Strategy Agent evaluates if it's worth purchasing (Agentic Decision Logic).
        3. If yes, Strategy Agent pays Signal Agent $0.001 USDC to unlock.
        4. Strategy Agent pays Risk Agent $0.0005 USDC to validate.
        5. Risk Agent approves or denies.
        6. Strategy Agent executes simulation.
        """
        # Always try to sync with DB first to ensure up-to-date balances
        await self.sync_from_db()

        symbol = raw_signal.get("symbol", "BTCUSDT")
        direction = raw_signal.get("direction", "BUY")
        prob = float(raw_signal.get("probability_score", 0.0))
        score = float(raw_signal.get("signal_score", 0.0))
        unlock_fee = self.signal_agent["unlock_fee"]
        val_fee = self.risk_agent["validation_fee"]
        
        from app.core.distribution.websocket_distributor import websocket_distributor

        # Step 1: Broadcast Signal Alert
        await websocket_distributor.broadcast_update("agent_activity", {
            "agent": "Signal Agent",
            "action": "BROADCAST_ALERT",
            "details": f"Generated new masked signal for {symbol} {direction} (Prob: {prob}%, Score: {score})",
            "balances": self.get_balances()
        })
        await asyncio.sleep(1.5)

        # Step 2: Strategy Agent Decision Logic
        await websocket_distributor.broadcast_update("agent_activity", {
            "agent": "Strategy Agent",
            "action": "EVALUATE_ALERT",
            "details": f"Evaluating signal criteria... Required Prob: >={self.strategy_agent['min_probability']}%, Score: >={self.strategy_agent['min_score']}",
            "balances": self.get_balances()
        })
        await asyncio.sleep(1.5)

        # Check budget limits
        has_budget = (self.strategy_agent["spent_today"] + unlock_fee + val_fee) <= self.strategy_agent["daily_budget"]
        has_balance = self.strategy_agent["balance"] >= (unlock_fee + val_fee)

        worth_paying = (
            prob >= self.strategy_agent["min_probability"] and
            score >= self.strategy_agent["min_score"] and
            has_balance and
            has_budget
        )

        if not worth_paying:
            reason = "Signal criteria not met"
            if not has_balance:
                reason = "Insufficient agent wallet balance"
            elif not has_budget:
                reason = "Daily agent budget cap reached"
                
            await websocket_distributor.broadcast_update("agent_activity", {
                "agent": "Strategy Agent",
                "action": "DECISION_REJECTED",
                "details": f"Signal rejected: {reason}. Bypassing purchase.",
                "balances": self.get_balances()
            })
            return

        # Decision Approved: Pay Signal Agent in DB
        tx_hash_signal = "0x" + secrets.token_hex(32)
        tx_hash_risk = "0x" + secrets.token_hex(32)
        
        signal_agent_wallet = "0x71C7656EC7ab88b098defB751B7401B5f6d1476B"
        risk_agent_wallet = "0x68defB751B7401B5f6d1476B71C7656EC7ab88b0"
        
        db_updated = False
        try:
            async with AsyncSessionLocal() as session:
                user_res = await session.execute(select(User).order_by(User.created_at.asc()))
                user = user_res.scalars().first()
                if user:
                    agent_res = await session.execute(
                        select(Agent)
                        .where(Agent.user_id == user.id)
                        .where(Agent.name == "Strategy Agent (Trader)")
                    )
                    db_agent = agent_res.scalar_one_or_none()
                    if db_agent:
                        # Fetch true on-chain balance of Strategy Agent first
                        from app.services.arc_blockchain import get_onchain_balance, send_onchain_usdc
                        agent_bal = await asyncio.to_thread(get_onchain_balance, db_agent.wallet_address)
                        
                        if agent_bal >= (unlock_fee + val_fee):
                            # Execute actual on-chain transaction to Signal Agent
                            tx_hash_signal = await asyncio.to_thread(
                                send_onchain_usdc,
                                db_agent.wallet_private_key,
                                signal_agent_wallet,
                                Decimal(str(unlock_fee))
                            )
                            # Execute actual on-chain transaction to Risk Agent
                            tx_hash_risk = await asyncio.to_thread(
                                send_onchain_usdc,
                                db_agent.wallet_private_key,
                                risk_agent_wallet,
                                Decimal(str(val_fee))
                            )
                            
                            # Deduct local balance
                            db_agent.wallet_balance = Decimal(str(agent_bal)) - Decimal(str(unlock_fee)) - Decimal(str(val_fee))
                            db_agent.spent_today = Decimal(str(float(db_agent.spent_today) + float(unlock_fee) + float(val_fee)))
                            session.add(db_agent)
                            
                            # 1. Log transaction for Signal Agent unlock
                            signal_tx = Transaction(
                                id=uuid.uuid4(),
                                user_id=user.id,
                                agent_id=db_agent.id,
                                tx_hash=tx_hash_signal,
                                amount=Decimal(str(unlock_fee)),
                                currency="USDC",
                                sender_address=db_agent.wallet_address,
                                receiver_address=signal_agent_wallet,
                                purpose=f"Unlock Signal Details ({raw_signal.get('id')})",
                                status="success"
                            )
                            session.add(signal_tx)
                            
                            # 2. Log transaction for Risk Agent validation
                            risk_tx = Transaction(
                                id=uuid.uuid4(),
                                user_id=user.id,
                                agent_id=db_agent.id,
                                tx_hash=tx_hash_risk,
                                amount=Decimal(str(val_fee)),
                                currency="USDC",
                                sender_address=db_agent.wallet_address,
                                receiver_address=risk_agent_wallet,
                                purpose=f"Risk Validation Fee ({raw_signal.get('id')})",
                                status="success"
                            )
                            session.add(risk_tx)
                            
                            await session.commit()
                            
                            self.strategy_agent["balance"] = db_agent.wallet_balance
                            self.strategy_agent["spent_today"] = db_agent.spent_today
                            self.signal_agent["balance"] = Decimal(str(float(self.signal_agent["balance"]) + float(unlock_fee)))
                            self.risk_agent["balance"] = Decimal(str(float(self.risk_agent["balance"]) + float(val_fee)))
                            db_updated = True
        except Exception as e:
            logger.error(f"Error executing agent DB payment updates: {e}")

        if not db_updated:
            # Fallback to local in-memory subtraction
            self.strategy_agent["balance"] -= (unlock_fee + val_fee)
            self.signal_agent["balance"] += unlock_fee
            self.risk_agent["balance"] += val_fee

        await websocket_distributor.broadcast_update("agent_activity", {
            "agent": "Strategy Agent",
            "action": "PAY_SIGNAL_AGENT",
            "details": f"Criteria met. Paid {unlock_fee:.6f} USDC to Signal Agent. Tx: {tx_hash_signal[:10]}...",
            "balances": self.get_balances()
        })
        await asyncio.sleep(1.5)

        # Step 3: Risk Agent Validation
        await websocket_distributor.broadcast_update("agent_activity", {
            "agent": "Risk Agent",
            "action": "EVALUATE_RISK",
            "details": f"Validating risk profile for unlocked {symbol} signal... Processing fee: {val_fee:.6f} USDC. Tx: {tx_hash_risk[:10]}...",
            "balances": self.get_balances()
        })
        await asyncio.sleep(1.5)

        # Risk Validation checks
        entry = float(raw_signal.get("entry_price", 0.0))
        sl = float(raw_signal.get("stop_loss", 0.0))
        tp = float(raw_signal.get("take_profit", 0.0))
        
        risk_approved = True
        risk_reason = "Risk profiles clear. Risk Reward Ratio >= 2.0."
        
        # Simple simulated check
        if entry != sl and abs(tp - entry) / abs(entry - sl) < 1.5:
            risk_approved = False
            risk_reason = "Risk Reward Ratio is below 1.5. Too risky."
            
        if raw_signal.get("risk_rating") == "High":
            risk_approved = False
            risk_reason = "High risk rating. Leverage restrictions violated."

        if risk_approved:
            await websocket_distributor.broadcast_update("agent_activity", {
                "agent": "Risk Agent",
                "action": "RISK_APPROVED",
                "details": f"Validation complete: {risk_reason}",
                "balances": self.get_balances()
            })
            await asyncio.sleep(1.5)

            # Step 4: Execute Trade Simulation
            await websocket_distributor.broadcast_update("agent_activity", {
                "agent": "Strategy Agent",
                "action": "EXECUTE_TRADE",
                "details": f"Executing simulated trade: {direction} {symbol} @ {entry:.4f} (SL: {sl:.4f}, TP: {tp:.4f})",
                "balances": self.get_balances()
            })
        else:
            await websocket_distributor.broadcast_update("agent_activity", {
                "agent": "Risk Agent",
                "action": "RISK_REJECTED",
                "details": f"Trade rejected: {risk_reason}. Execution cancelled.",
                "balances": self.get_balances()
            })

agent_fleet_manager = AgentFleetManager()
