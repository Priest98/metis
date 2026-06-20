
import pytest
from app.core.probability.bayesian import bayesian_engine
from app.core.probability.monte_carlo import monte_carlo_engine

@pytest.mark.asyncio
async def test_bayesian_probability_calculation():
    """Test Bayesian probability updates"""
    prior = 60.0
    conditions = {"regime": "trending", "volatility": "normal"}
    historical = {
        "trending_success_rate": 0.7,
        "ranging_success_rate": 0.4, 
        "optimal_volatility": "normal"
    }
    
    posterior = bayesian_engine.calculate_posterior_probability(
        prior_win_rate=prior,
        current_conditions=conditions,
        historical_performance=historical
    )
    
    # Logic: Trending (0.7) > Prior (0.6), so posterior should increase
    assert posterior > prior
    assert 0 <= posterior <= 100

def test_monte_carlo_simulation():
    """Test Monte Carlo simulation bounds"""
    result = monte_carlo_engine.simulate_strategy_performance(
        win_rate=60.0,
        avg_win=2.0,
        avg_loss=-1.0,
        n_trades=100,
        initial_capital=10000
    )
    
    assert "probability_of_profit" in result
    assert "expected_final_capital" in result
    assert "percentile_95" in result
    assert 0 <= result["probability_of_profit"] <= 100.0
