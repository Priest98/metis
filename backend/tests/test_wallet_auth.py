import pytest
import pytest_asyncio
import time
import uuid
from decimal import Decimal
from httpx import AsyncClient, ASGITransport
from eth_account import Account
from eth_account.messages import encode_defunct
from app.main import app

@pytest_asyncio.fixture
async def local_async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_wallet_signup_and_login_flow(local_async_client: AsyncClient):
    from unittest.mock import patch
    from app.database.postgres import SessionLocal
    from app.models import User, Agent
    import secrets

    def mock_get_balance(address):
        with SessionLocal() as session:
            u = session.query(User).filter(User.wallet_address == address).first()
            if u:
                return u.wallet_balance
            a = session.query(Agent).filter(Agent.wallet_address == address).first()
            if a:
                return a.wallet_balance
        return Decimal("0.0")

    def mock_send(priv_key, to_addr, amount):
        return "0x" + secrets.token_hex(32)

    with patch("app.api.v1.endpoints.wallet.get_onchain_balance", side_effect=mock_get_balance), \
         patch("app.api.v1.endpoints.wallet.send_onchain_usdc", side_effect=mock_send):

        # Create a fresh random EVM account for testing
        acct = Account.create()
        address = acct.address
        
        timestamp = int(time.time())
        message = f"Sign this message to log into Metis. Timestamp: {timestamp}"
        message_encoded = encode_defunct(text=message)
        signature = acct.sign_message(message_encoded).signature.hex()
        
        # 1. Test direct wallet signup/login
        response = await local_async_client.post("/api/v1/auth/wallet", json={
            "address": address,
            "signature": signature,
            "timestamp": timestamp
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert "token" in data
        
        user = data["user"]
        assert user["email"] == f"wallet_{address.lower()}@metis.quant"
        assert user["is_new_user"] is True
        
        token = data["token"]
        auth_headers = {"Authorization": f"Bearer {token}"}
        
        # Verify wallet was created and has 0.0 starting balance
        response_wallet = await local_async_client.get("/api/v1/wallet/me", headers=auth_headers)
        assert response_wallet.status_code == 200
        wallet_data = response_wallet.json()
        assert wallet_data["external_wallet"] == address
        assert wallet_data["wallet_balance"] == 0.0
        
        # 2. Test wallet login (second time)
        new_timestamp = int(time.time())
        new_message = f"Sign this message to log into Metis. Timestamp: {new_timestamp}"
        new_signature = acct.sign_message(encode_defunct(text=new_message)).signature.hex()
        
        response_second = await local_async_client.post("/api/v1/auth/wallet", json={
            "address": address,
            "signature": new_signature,
            "timestamp": new_timestamp
        })
        assert response_second.status_code == 200
        data_second = response_second.json()
        assert data_second["user"]["is_new_user"] is False
        
        # 3. Test expired timestamp signature (outside 5 min window)
        expired_timestamp = int(time.time()) - 400
        expired_message = f"Sign this message to log into Metis. Timestamp: {expired_timestamp}"
        expired_signature = acct.sign_message(encode_defunct(text=expired_message)).signature.hex()
        
        response_expired = await local_async_client.post("/api/v1/auth/wallet", json={
            "address": address,
            "signature": expired_signature,
            "timestamp": expired_timestamp
        })
        assert response_expired.status_code == 400
        assert "expired" in response_expired.json()["detail"].lower()
        
        # 4. Test invalid signature address match
        wrong_account = Account.create()
        wrong_signature = wrong_account.sign_message(encode_defunct(text=new_message)).signature.hex()
        
        response_invalid = await local_async_client.post("/api/v1/auth/wallet", json={
            "address": address,
            "signature": wrong_signature,
            "timestamp": new_timestamp
        })
        assert response_invalid.status_code == 401
        assert "invalid signature" in response_invalid.json()["detail"].lower()
