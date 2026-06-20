import pytest
from app.core.agents.committee import agent_committee

@pytest.mark.asyncio
async def test_committee_debate_success(mocker):
    """Test successful committee debate with mocked Gemini response"""
    
    mock_response = mocker.Mock()
    mock_response.text = """
    {
        "technical_vote": "APPROVE",
        "technical_reason": "Moving average support is strong.",
        "macro_vote": "APPROVE",
        "macro_reason": "Funding rate is neutral.",
        "risk_vote": "APPROVE",
        "risk_reason": "Stop loss is well placed.",
        "debate_rounds": [
            {
                "speaker": "Technical Analyst",
                "message": "Let's buy BTC."
            }
        ],
        "final_consensus": "APPROVED",
        "consensus_explanation": "Approved by consensus."
    }
    """
    
    mocker.patch('google.generativeai.GenerativeModel.generate_content', return_value=mock_response)
    
    result = await agent_committee.hold_debate(
        signal_candidate={'symbol': 'BTCUSDT', 'direction': 'BUY', 'entry': 50000.0, 'stop_loss': 49000.0, 'take_profit': 52000.0, 'signal_score': 8.0},
        strategy_stats={'win_rate': 65.0},
        market_conditions={'regime': 'trending', 'volatility': 'normal', 'session': 'london'}
    )
    
    assert result is not None
    assert result['final_consensus'] == 'APPROVED'
    assert result['technical_vote'] == 'APPROVE'
    assert len(result['debate_rounds']) == 1

@pytest.mark.asyncio
async def test_committee_debate_fallback(mocker):
    """Test fallback debate execution when Gemini API fails"""
    
    # Force generate_content to raise an exception
    mocker.patch('google.generativeai.GenerativeModel.generate_content', side_effect=Exception("API connection failed"))
    
    result = await agent_committee.hold_debate(
        signal_candidate={'symbol': 'BTCUSDT', 'direction': 'BUY', 'entry': 50000.0, 'stop_loss': 49000.0, 'take_profit': 52000.0, 'signal_score': 8.0},
        strategy_stats={'win_rate': 65.0},
        market_conditions={'regime': 'trending', 'volatility': 'normal', 'session': 'london'}
    )
    
    assert result is not None
    assert result['final_consensus'] == 'APPROVED'
    assert "Debate bypassed" in result['consensus_explanation']
    assert len(result['debate_rounds']) > 0
