from fastapi import APIRouter, HTTPException, status, Request, Depends
from pydantic import BaseModel, Field
import uuid
import secrets
from eth_account import Account
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import create_access_token
from app.core.rate_limiter import rate_limiter
from app.database import get_db
from app.models import User, Agent, Transaction

router = APIRouter()

class LoginRequest(BaseModel):
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    external_wallet: str | None = Field(default=None, pattern=r"^0x[a-fA-F0-9]{40}$")

@router.post("/login")
async def login(
    request: Request,
    login_req: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user (creates account and EVM wallet if first time) and returns access token.
    """
    client_ip = request.client.host if request.client else "unknown"
    if rate_limiter.is_rate_limited(f"login:{client_ip}", limit=10, period=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 10 logins per minute."
        )

    email = login_req.email.lower()
    username = email.split('@')[0]
    external_wallet = login_req.external_wallet
    
    # Check if user exists in local database
    result = await db.execute(select(User).where(User.email == email))
    db_user = result.scalar_one_or_none()
    
    is_new_user = False
    
    if not db_user:
        is_new_user = True
        # Generate new EVM-compatible wallet using eth_account
        acct = Account.create()
        wallet_address = acct.address
        wallet_private_key = acct.key.hex()
        
        # Generate a deterministic UUID based on email
        user_id = uuid.uuid5(uuid.NAMESPACE_DNS, email)
        
        db_user = User(
            id=user_id,
            email=email,
            subscription_tier="free",
            wallet_address=wallet_address,
            wallet_private_key=wallet_private_key,
            wallet_balance=0.000000,
            external_wallet=external_wallet,
        )
        db.add(db_user)
        
        # Provision default Strategy Agent (Trader)
        agent_acct = Account.create()
        default_agent = Agent(
            id=uuid.uuid4(),
            user_id=user_id,
            name="Strategy Agent (Trader)",
            wallet_address=agent_acct.address,
            wallet_private_key=agent_acct.key.hex(),
            wallet_balance=0.000000,
            daily_budget=1.000000,
            spent_today=0.000000,
            is_active=True
        )
        db.add(default_agent)
        
        await db.commit()
        await db.refresh(db_user)
    else:
        user_id = db_user.id
        wallet_address = db_user.wallet_address
        if external_wallet and not db_user.external_wallet:
            db_user.external_wallet = external_wallet
            await db.commit()
        
    # Create access token
    access_token = create_access_token(data={"sub": str(user_id), "email": email})
    
    return {
        "user": {
            "id": str(user_id),
            "email": email,
            "name": username,
            "wallet_address": wallet_address,
            "wallet_balance": float(db_user.wallet_balance),
            "is_new_user": is_new_user
        },
        "token": access_token
    }

class WalletLoginRequest(BaseModel):
    address: str
    signature: str
    timestamp: int

@router.post("/wallet")
async def login_with_wallet(
    request: Request,
    wallet_req: WalletLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user via EVM wallet signature.
    """
    client_ip = request.client.host if request.client else "unknown"
    if rate_limiter.is_rate_limited(f"login_wallet:{client_ip}", limit=10, period=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 10 logins per minute."
        )

    import time
    from eth_account.messages import encode_defunct

    address = wallet_req.address.lower()
    signature = wallet_req.signature
    timestamp = wallet_req.timestamp

    # 1. Verify timestamp is recent (within 5 minutes) to prevent replay attacks
    current_time = int(time.time())
    if abs(current_time - timestamp) > 300:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Challenge expired or clock out of sync. Please try again."
        )

    # 2. Verify signature
    msg = f"Sign this message to log into Metis. Timestamp: {timestamp}"
    try:
        message_encoded = encode_defunct(text=msg)
        recovered_address = Account.recover_message(message_encoded, signature=signature)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to recover signature address: {str(e)}"
        )

    if recovered_address.lower() != address:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature. Signer address does not match."
        )

    # 3. Check if user exists in local database by external_wallet address
    result = await db.execute(select(User).where(User.external_wallet.ilike(address)))
    db_user = result.scalar_one_or_none()

    is_new_user = False

    if not db_user:
        is_new_user = True
        # Generate placeholder email based on address
        email = f"wallet_{address}@metis.quant"
        
        # Check if email is already taken
        email_result = await db.execute(select(User).where(User.email == email))
        if email_result.scalar_one_or_none():
            email = f"wallet_{address}_{secrets.token_hex(4)}@metis.quant"

        username = f"wallet_{address[:6]}...{address[-4:]}"
        
        # Generate new EVM-compatible wallet using eth_account
        acct = Account.create()
        wallet_address = acct.address
        wallet_private_key = acct.key.hex()
        
        user_id = uuid.uuid5(uuid.NAMESPACE_DNS, email)
        
        db_user = User(
            id=user_id,
            email=email,
            subscription_tier="free",
            wallet_address=wallet_address,
            wallet_private_key=wallet_private_key,
            wallet_balance=0.000000,
            external_wallet=recovered_address, # Save exact recovered checksummed address
        )
        db.add(db_user)
        
        # Provision default Strategy Agent (Trader)
        agent_acct = Account.create()
        default_agent = Agent(
            id=uuid.uuid4(),
            user_id=user_id,
            name="Strategy Agent (Trader)",
            wallet_address=agent_acct.address,
            wallet_private_key=agent_acct.key.hex(),
            wallet_balance=0.000000,
            daily_budget=1.000000,
            spent_today=0.000000,
            is_active=True
        )
        db.add(default_agent)
        
        await db.commit()
        await db.refresh(db_user)
    else:
        user_id = db_user.id
        wallet_address = db_user.wallet_address
        username = db_user.email.split('@')[0] if '@' in db_user.email else db_user.email

    # Create access token
    access_token = create_access_token(data={"sub": str(user_id), "email": db_user.email})
    
    return {
        "user": {
            "id": str(user_id),
            "email": db_user.email,
            "name": username,
            "wallet_address": wallet_address,
            "wallet_balance": float(db_user.wallet_balance),
            "is_new_user": is_new_user
        },
        "token": access_token
    }
