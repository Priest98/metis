
import pytest
from app.core.signals.pipeline import signal_pipeline
from app.models import BacktestResult

@pytest.mark.asyncio
async def test_signal_pipeline_flow(mocker):
    """Test full signal generation pipeline"""
    
    import uuid
    strat_id = uuid.uuid4()
    
    # Mock database dependencies
    mocker.patch('app.core.signals.pipeline.SignalPipeline._get_strategy', return_value=mocker.Mock(id=strat_id, name='Test Strategy'))
    
    # Mock backtest result
    mock_backtest = mocker.Mock(spec=BacktestResult)
    mock_backtest.win_rate = 65.0
    mock_backtest.sharpe_ratio = 2.0
    mock_backtest.total_trades = 100
    mock_backtest.profit_factor = 1.5
    mock_backtest.max_drawdown = 10.0
    mock_backtest.expectancy = 1.2
    
    mocker.patch('app.core.signals.pipeline.SignalPipeline._get_latest_backtest', return_value=mock_backtest)
    
    # Mock Gemini Client
    mocker.patch('app.core.intelligence.gemini_client.GeminiClient.analyze_signal_context', return_value={
        "confidence_level": "High",
        "risk_rating": "Low", 
        "trade_explanation": "Test explanation",
        "position_sizing": 2.0
    })
    
    # Mock Agent Committee hold_debate
    mocker.patch('app.core.agents.committee.AgentCommittee.hold_debate', return_value={
        "technical_vote": "APPROVE",
        "technical_reason": "Setup aligns with base indicators.",
        "macro_vote": "APPROVE",
        "macro_reason": "No major macro obstacles detected.",
        "risk_vote": "APPROVE",
        "risk_reason": "Risk-to-reward ratio is acceptable.",
        "debate_rounds": [
            {
                "speaker": "Technical Analyst",
                "message": "Dialogue contribution..."
            }
        ],
        "final_consensus": "APPROVED",
        "consensus_explanation": "Approved by committee consensus."
    })
    
    # Mock Database add/commit
    mocker.patch('app.database.AsyncSessionLocal')
    
    # Execute Pipeline
    result = await signal_pipeline.generate_signal(
        strategy_id=strat_id,
        symbol='BTCUSDT',
        direction='BUY',
        entry_price=50000.0,
        stop_loss=49000.0,
        take_profit=52000.0,
        market_data={"regime": "trending"}
    )
    
    assert result is not None
    assert result['symbol'] == 'BTCUSDT'
    assert result['confidence_level'] == 'High'
    assert result['debate_transcript'] is not None
    assert 'APPROVED' in result['debate_transcript']
