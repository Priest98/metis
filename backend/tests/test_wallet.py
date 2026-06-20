import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
import uuid
from decimal import Decimal
from unittest.mock import patch
from app.main import app

@pytest_asyncio.fixture
async def local_async_client():
    """Local async client helper using ASGITransport for newer httpx versions."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_auth_and_wallet_flow(local_async_client: AsyncClient):
    """Test login, wallet creation, faucet seeding, history, agent creation and payflow"""
    
    # Mock blockchain calls by querying the DB local cache synchronously
    from app.database.postgres import SessionLocal
    from app.models import User, Agent
    
    faucet_balance = [Decimal("0.0")]
    def mock_get_balance(address):
        with SessionLocal() as session:
            u = session.query(User).filter(User.wallet_address == address).first()
            if u:
                return u.wallet_balance if u.wallet_balance > 0 else faucet_balance[0]
            a = session.query(Agent).filter(Agent.wallet_address == address).first()
            if a:
                return a.wallet_balance
        return Decimal("0.0")
        
    import secrets
    def mock_send(priv_key, to_addr, amount):
        return "0x" + secrets.token_hex(32)
        
    with patch("app.api.v1.endpoints.wallet.get_onchain_balance", side_effect=mock_get_balance), \
         patch("app.api.v1.endpoints.wallet.send_onchain_usdc", side_effect=mock_send):
         
         # 1. Sign up/Login first time (Wallet created automatically)
         test_email = f"test_trader_{uuid.uuid4().hex[:6]}@quant101.com"
         response = await local_async_client.post("/api/v1/auth/login", json={"email": test_email})
         assert response.status_code == 200
         
         data = response.json()
         assert "user" in data
         assert "token" in data
         
         user = data["user"]
         token = data["token"]
         assert user["email"] == test_email
         assert "wallet_address" in user
         assert user["wallet_balance"] == 0.0
         assert user["is_new_user"] is True
         
         auth_headers = {"Authorization": f"Bearer {token}"}
         
         # 2. Login second time (Assert is_new_user becomes False)
         response_second = await local_async_client.post("/api/v1/auth/login", json={"email": test_email})
         assert response_second.status_code == 200
         data_second = response_second.json()
         assert data_second["user"]["is_new_user"] is False
         
         # 3. Get Wallet details
         response_wallet = await local_async_client.get("/api/v1/wallet/me", headers=auth_headers)
         assert response_wallet.status_code == 200
         wallet_data = response_wallet.json()
         assert wallet_data["wallet_address"] == user["wallet_address"]
         assert wallet_data["wallet_balance"] == 0.0
         
         # 4. Link External Wallet
         external_addr = "0x71C7656EC7ab88b098defB751B7401B5f6d1476B"
         response_ext = await local_async_client.post(
             "/api/v1/wallet/me/external",
             json={"external_wallet": external_addr},
             headers=auth_headers
         )
         assert response_ext.status_code == 200
         assert response_ext.json()["external_wallet"] == external_addr
         
         # 5. Check Default Strategy Agent exists
         response_agents = await local_async_client.get("/api/v1/wallet/agents", headers=auth_headers)
         assert response_agents.status_code == 200
         agents_list = response_agents.json()
         assert len(agents_list) == 1
         assert agents_list[0]["name"] == "Strategy Agent (Trader)"
         assert agents_list[0]["wallet_balance"] == 0.0
         
         # 6. Faucet Seed (Simulate 100 USDC received on-chain)
         faucet_balance[0] = Decimal("100.0")
         response_faucet = await local_async_client.post("/api/v1/wallet/faucet", headers=auth_headers)
         assert response_faucet.status_code == 200
         faucet_data = response_faucet.json()
         assert faucet_data["status"] == "success"
         assert faucet_data["wallet_balance"] == 100.0
         
         # 7. Create New Agent (Funds transferred from user wallet)
         response_new_agent = await local_async_client.post(
             "/api/v1/wallet/agents",
             json={
                 "name": "Validator Risk Agent",
                 "daily_budget": 2.5,
                 "initial_balance": 5.0
             },
             headers=auth_headers
         )
         assert response_new_agent.status_code == 200
         agent_data = response_new_agent.json()
         assert agent_data["status"] == "success"
         assert agent_data["agent"]["name"] == "Validator Risk Agent"
         assert agent_data["agent"]["wallet_balance"] == 5.0
         assert agent_data["agent"]["daily_budget"] == 2.5
         # User balance should be 100.0 - 5.0 = 95.0
         assert agent_data["user_balance"] == 95.0
         
         # 8. Check Agent list again
         response_agents2 = await local_async_client.get("/api/v1/wallet/agents", headers=auth_headers)
         agents_list2 = response_agents2.json()
         assert len(agents_list2) == 2
         
         # 9. Update Agent settings
         agent_id = agent_data["agent"]["id"]
         response_update = await local_async_client.post(
             f"/api/v1/wallet/agents/{agent_id}/budget",
             json={"daily_budget": 5.0, "is_active": False},
             headers=auth_headers
         )
         assert response_update.status_code == 200
         assert response_update.json()["agent"]["daily_budget"] == 5.0
         assert response_update.json()["agent"]["is_active"] is False

         # 9.5. Fund Default Agent (10.0 USDC)
         response_fund = await local_async_client.post(
             f"/api/v1/wallet/agents/{agents_list[0]['id']}/fund",
             json={"amount": 10.0},
             headers=auth_headers
         )
         assert response_fund.status_code == 200
         fund_data = response_fund.json()
         assert fund_data["status"] == "success"
         assert fund_data["user_balance"] == 85.0
         assert fund_data["agent_balance"] == 10.0
         
         # 10. Check Transaction Ledger History
         response_history = await local_async_client.get("/api/v1/wallet/history", headers=auth_headers)
         assert response_history.status_code == 200
         history = response_history.json()
         # Should have new agent seed (5.0) and agent funding (10.0)
         assert len(history) >= 2
