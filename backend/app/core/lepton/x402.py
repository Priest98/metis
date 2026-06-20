import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

class X402PaymentManager:
    """
    Manages HTTP 402 Payment Required headers and validations.
    Integrates with Circle/Arc L1 nanopayments.
    """
    def __init__(self):
        # In-memory record of unlocked signals for this session
        # Format: "user_id:signal_id" -> tx_hash
        self.unlocked_records = {}

    def get_payment_headers(self, signal_id: str, price_usdc: float, destination_wallet: str) -> Dict[str, str]:
        """Generate headers for HTTP 402 Response"""
        return {
            "WWW-Authenticate": f"Pay-To-Access price={price_usdc:.6f}, currency=USDC, destination={destination_wallet}, signal_id={signal_id}",
            "X-Payment-Instructions": f"Submit USDC nanopayment to {destination_wallet} on Arc L1.",
        }

    def verify_payment(self, user_id: str, signal_id: str, tx_hash: Optional[str]) -> bool:
        """
        Verify if a user has unlocked a signal with a valid Arc L1 tx_hash.
        Checks transaction presence, status, receiver, and amount in the database.
        """
        record_key = f"{user_id}:{signal_id}"
        
        # If already unlocked, return True
        if record_key in self.unlocked_records:
            return True
            
        if not tx_hash:
            return False
            
        # Validate hex format (0x + 64 hex characters)
        if not tx_hash.startswith("0x") or len(tx_hash) != 66:
            logger.warning(f"⚠️ Invalid transaction hash format: {tx_hash}")
            return False

        # Prevent double-spending (reusing a transaction hash across different signals/users)
        if tx_hash in self.unlocked_records.values():
            logger.warning(f"⚠️ Transaction double-spend attempt blocked: tx {tx_hash}")
            return False

        # Query database synchronously to verify user and signal details
        from app.database.postgres import SessionLocal
        from app.models import User, Signal, Transaction
        from app.services.arc_blockchain import verify_onchain_tx
        from decimal import Decimal
        import uuid
        
        with SessionLocal() as session:
            # 1. Fetch user's wallet address
            user = session.query(User).filter(User.id == uuid.UUID(user_id)).first()
            if not user or not user.wallet_address:
                logger.warning(f"⚠️ User {user_id} has no wallet address")
                return False
                
            # 2. Fetch signal price
            sig = session.query(Signal).filter(Signal.id == uuid.UUID(signal_id)).first()
            required_price = 0.001000
            if sig and sig.price_usdc is not None:
                required_price = float(sig.price_usdc)
                
            # 3. Platform destination wallet
            destination_wallet = "0x71C7656EC7ab88b098defB751B7401B5f6d1476B"
            
            # 4. Perform on-chain verification
            onchain_valid = verify_onchain_tx(
                tx_hash=tx_hash,
                expected_sender=user.wallet_address,
                expected_receiver=destination_wallet,
                expected_amount_usdc=Decimal(str(required_price))
            )
            
            if not onchain_valid:
                logger.warning(f"⚠️ On-chain verification failed for tx {tx_hash}")
                return False
                
            # 5. Insert transaction into local ledger if not present (auto-sync)
            db_tx = session.query(Transaction).filter(Transaction.tx_hash == tx_hash).first()
            if not db_tx:
                logger.info(f"💾 Syncing on-chain transaction {tx_hash} to local DB ledger")
                new_tx = Transaction(
                    id=uuid.uuid4(),
                    user_id=uuid.UUID(user_id),
                    tx_hash=tx_hash,
                    amount=Decimal(str(required_price)),
                    currency="USDC",
                    sender_address=user.wallet_address,
                    receiver_address=destination_wallet,
                    purpose=f"Unlock Signal Details ({signal_id})",
                    status="success"
                )
                session.add(new_tx)
                session.commit()
                
            logger.info(f"✅ USDC payment verified ON-CHAIN: tx {tx_hash} for signal {signal_id}")
            self.unlocked_records[record_key] = tx_hash
            return True

x402_manager = X402PaymentManager()
