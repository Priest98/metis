import pytest
import pytest_asyncio
from decimal import Decimal
from datetime import datetime, timedelta, timezone
import uuid
from httpx import AsyncClient, ASGITransport

from app.models import Agent, User
from app.api.v1.endpoints.wallet import calculate_accrued_yield
from app.main import app

@pytest_asyncio.fixture
async def local_async_client():
    """Local async client helper using ASGITransport for newer httpx versions."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_calculate_accrued_yield():
    """Test yield loop interest accrual math"""
    agent = Agent(
        id=uuid.uuid4(),
        name="Yield Tester",
        yield_loop_active=True,
        yield_loop_balance=Decimal("1000.00"),
        yield_loop_interest_earned=Decimal("0.0"),
        # Set last deposit to exactly 1 day ago (86400 seconds)
        yield_loop_last_deposit=datetime.now(timezone.utc) - timedelta(days=1)
    )
    
    # Run accrual calculator
    updated = calculate_accrued_yield(agent)
    
    assert updated is True
    assert agent.yield_loop_interest_earned > 0
    # Expected daily interest: 1000 * 0.055 / 365 = ~0.1506849 USDC
    expected_interest = Decimal("1000") * Decimal("0.055") / Decimal("365")
    assert abs(agent.yield_loop_interest_earned - expected_interest) < Decimal("0.001")
    assert agent.yield_loop_balance == Decimal("1000.0") + agent.yield_loop_interest_earned


@pytest.mark.asyncio
async def test_calculate_accrued_yield_inactive():
    """Test that inactive yield loop does not accrue interest"""
    agent = Agent(
        id=uuid.uuid4(),
        name="Inactive Tester",
        yield_loop_active=False,
        yield_loop_balance=Decimal("1000.00"),
        yield_loop_interest_earned=Decimal("0.0"),
        yield_loop_last_deposit=datetime.now(timezone.utc) - timedelta(days=1)
    )
    
    updated = calculate_accrued_yield(agent)
    
    assert updated is False
    assert agent.yield_loop_interest_earned == Decimal("0.0")
    assert agent.yield_loop_balance == Decimal("1000.00")


@pytest.mark.asyncio
async def test_toggle_yield_loop_deposit(local_async_client: AsyncClient, mocker):
    """Test POST /wallet/agents/{id}/yield/toggle to activate yield loop"""
    # 1. Setup mock Agent & User
    mock_agent_id = uuid.uuid4()
    mock_agent = Agent(
        id=mock_agent_id,
        name="Trading Agent",
        wallet_address="0x1111111111111111111111111111111111111111",
        wallet_private_key="0xabc123",
        wallet_balance=Decimal("5.0"),
        yield_loop_active=False,
        yield_loop_balance=Decimal("0.0"),
        yield_loop_interest_earned=Decimal("0.0")
    )
    
    # Mock database session to execute and return mock_agent
    mock_session = mocker.Mock()
    mock_result = mocker.Mock()
    mock_result.scalar_one_or_none.return_value = mock_agent
    mock_session.execute = mocker.AsyncMock(return_value=mock_result)
    
    # Mock dependency injection using app.dependency_overrides
    from app.database import get_db
    from app.core.auth import get_current_user
    
    app.dependency_overrides[get_db] = lambda: mock_session
    app.dependency_overrides[get_current_user] = lambda: {"sub": str(uuid.uuid4())}
    
    # Mock on-chain balance and tx sending
    mocker.patch('app.api.v1.endpoints.wallet.get_onchain_balance', return_value=Decimal("5.0"))
    mocker.patch('app.api.v1.endpoints.wallet.deposit_to_yield_loop', return_value="0xmocktxhash123")
    
    # Mock session methods
    mock_session.commit = mocker.AsyncMock()
    mock_session.add = mocker.Mock()
    
    try:
        # Toggle (Post request)
        response = await local_async_client.post(
            f"/api/v1/wallet/agents/{mock_agent_id}/yield/toggle",
            json={}
        )
        
        # Assertions
        assert response.status_code == 200
        res_data = response.json()
        assert res_data["status"] == "success"
        assert res_data["agent"]["yield_loop_active"] is True
        # Initial balance: 5.0. Deposit reserve: 0.1. Deposited: 4.9.
        assert res_data["agent"]["yield_loop_balance"] == 4.9
        assert res_data["agent"]["wallet_balance"] == 0.1
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_toggle_yield_loop_withdraw(local_async_client: AsyncClient, mocker):
    """Test POST /wallet/agents/{id}/yield/toggle to deactivate yield loop (withdraw)"""
    mock_agent_id = uuid.uuid4()
    mock_agent = Agent(
        id=mock_agent_id,
        name="Trading Agent",
        wallet_address="0x1111111111111111111111111111111111111111",
        wallet_private_key="0xabc123",
        wallet_balance=Decimal("0.1"),
        yield_loop_active=True,
        yield_loop_balance=Decimal("4.9"),
        yield_loop_interest_earned=Decimal("0.0"),
        yield_loop_last_deposit=datetime.now(timezone.utc) - timedelta(days=1)
    )
    
    # Mock database session to execute and return mock_agent
    mock_session = mocker.Mock()
    mock_result = mocker.Mock()
    mock_result.scalar_one_or_none.return_value = mock_agent
    mock_session.execute = mocker.AsyncMock(return_value=mock_result)
    
    # Mock dependency injection using app.dependency_overrides
    from app.database import get_db
    from app.core.auth import get_current_user
    
    app.dependency_overrides[get_db] = lambda: mock_session
    app.dependency_overrides[get_current_user] = lambda: {"sub": str(uuid.uuid4())}
    
    # Mock withdrawal tx sending
    mocker.patch('app.api.v1.endpoints.wallet.withdraw_from_yield_loop', return_value="0xmockwithdrawtxhash123")
    
    # Mock session methods
    mock_session.commit = mocker.AsyncMock()
    mock_session.add = mocker.Mock()
    
    try:
        # Toggle (Post request)
        response = await local_async_client.post(
            f"/api/v1/wallet/agents/{mock_agent_id}/yield/toggle",
            json={}
        )
        
        # Assertions
        assert response.status_code == 200
        res_data = response.json()
        assert res_data["status"] == "success"
        # Expected daily interest: 4.9 * 0.055 / 365 = ~0.000738 USDC
        expected_interest = Decimal("4.9") * Decimal("0.055") / Decimal("365")
        
        assert res_data["agent"]["yield_loop_active"] is False
        assert res_data["agent"]["yield_loop_balance"] == 0.0
        # Wallet balance should be initial (0.1) + principal (4.9) + interest
        assert abs(Decimal(str(res_data["agent"]["wallet_balance"])) - (Decimal("5.0") + expected_interest)) < Decimal("0.001")
    finally:
        app.dependency_overrides.clear()
