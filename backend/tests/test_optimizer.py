import pytest
from decimal import Decimal
import uuid

from app.database import AsyncSessionLocal
from app.models import Strategy, BacktestResult, User
from app.core.strategies.optimizer import strategy_optimizer

@pytest.mark.asyncio
async def test_optimize_strategies_no_active(mocker):
    """Test optimizer sweep when no active strategies are present in DB"""
    
    # Mock database to return empty list
    mock_session = mocker.Mock()
    mock_res_strat = mocker.Mock()
    mock_res_strat.scalars.return_value.all.return_value = []
    mock_session.execute = mocker.AsyncMock(return_value=mock_res_strat)
    
    mock_session_maker = mocker.Mock()
    mock_session_maker.return_value.__aenter__ = mocker.AsyncMock(return_value=mock_session)
    mock_session_maker.return_value.__aexit__ = mocker.AsyncMock()
    
    mocker.patch('app.core.strategies.optimizer.AsyncSessionLocal', mock_session_maker)
    mocker.patch('app.core.strategies.optimizer.StrategyOptimizer._get_historical_prices', return_value=[])
    
    results = await strategy_optimizer.optimize_active_strategies()
    
    assert results is not None
    assert results["strategies_checked"] == 0

@pytest.mark.asyncio
async def test_optimize_strategies_success(mocker):
    """Test successful optimization sweep of active strategy in DB"""
    
    # 1. Mock Strategy & Baseline BacktestResult
    mock_strategy = mocker.Mock(spec=Strategy)
    mock_strategy.id = uuid.uuid4()
    mock_strategy.name = "RSI Scalper"
    mock_strategy.config = {
        "symbol": "BTCUSDT",
        "rules": [
            {
                "type": "technical",
                "condition": "rsi",
                "parameters": {"period": 14}
            }
        ]
    }
    mock_strategy.is_active = True
    
    mock_baseline = mocker.Mock(spec=BacktestResult)
    mock_baseline.sharpe_ratio = Decimal("1.2000")
    mock_baseline.created_at = mocker.Mock()
    
    # 2. Setup Mock Session & returns
    mock_session = mocker.Mock()
    mock_res_strat = mocker.Mock()
    mock_res_strat.scalars.return_value.all.return_value = [mock_strategy]
    
    mock_res_bt = mocker.Mock()
    mock_res_bt.scalar_one_or_none.return_value = mock_baseline
    
    mock_session.execute = mocker.AsyncMock()
    mock_session.execute.side_effect = [mock_res_strat, mock_res_bt]
    
    # Mock context manager
    mock_session_maker = mocker.Mock()
    mock_session_maker.return_value.__aenter__ = mocker.AsyncMock(return_value=mock_session)
    mock_session_maker.return_value.__aexit__ = mocker.AsyncMock()
    
    mocker.patch('app.core.strategies.optimizer.AsyncSessionLocal', mock_session_maker)
    
    # Mock historical prices
    mocker.patch(
        'app.core.strategies.optimizer.StrategyOptimizer._get_historical_prices',
        return_value=[{"time": "2026-06-20T00:00:00", "close": 50000.0, "open": 50000.0, "high": 50000.0, "low": 50000.0, "volume": 10.0}]
    )
    
    # Mock VectorBT Adapter to return improved Sharpe ratio on backtest run
    mocker.patch(
        'app.core.backtesting.vectorbt_adapter.VectorBTAdapter.run_backtest',
        return_value={
            "sharpe_ratio": 2.1,
            "win_rate": 70.0,
            "total_trades": 50,
            "winning_trades": 35,
            "losing_trades": 15,
            "profit_factor": 1.9,
            "max_drawdown": 8.5,
            "total_return": 15.0
        }
    )
    
    # Mock DB commit / add
    mock_session.commit = mocker.AsyncMock()
    mock_session.add = mocker.Mock()
    
    # Execute Optimizer sweep
    results = await strategy_optimizer.optimize_active_strategies()
    
    # Assertions
    assert results["strategies_checked"] == 1
    assert results["optimized"] == 1
    assert results["details"][0]["improved"] is True
    assert results["details"][0]["new_sharpe"] == 2.1
