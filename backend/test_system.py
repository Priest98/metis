"""
Complete System Test
Tests market data, backtesting, and signal generation pipeline
"""

import asyncio
import logging
import pytest
pytestmark = pytest.mark.skip(reason="standalone system test script")
from app.core.market_data.websocket_client import MarketDataEngine
from app.core.backtesting.engine import backtest_engine
from app.core.strategies.parser import strategy_parser
from app.core.signals.pipeline import signal_pipeline

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def test_market_data():
    """Test real-time market data streaming"""
    logger.info("=" * 60)
    logger.info("TEST 1: Market Data WebSocket")
    logger.info("=" * 60)
    
    engine = MarketDataEngine()
    
    # Subscribe to data updates
    async def handle_candle(data):
        if data['is_closed']:
            logger.info(f"✅ Received completed candle for {data['symbol']}")
    
    engine.subscribe(handle_candle)
    
    # Start streaming (will run for 60 seconds then stop)
    try:
        # Run for 60 seconds
        await asyncio.wait_for(
            engine.start(['BTCUSDT', 'ETHUSDT'], interval='1m'),
            timeout=60
        )
    except asyncio.TimeoutError:
        logger.info("Market data test complete (60s timeout)")
        await engine.stop()


def test_backtesting():
    """Test backtesting engine"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 2: Backtesting Engine")
    logger.info("=" * 60)
    
    # Generate sample signals
    sample_signals = [
        {
            'entry_price': 1.08520,
            'stop_loss': 1.08380,
            'take_profit': 1.08890,
            'direction': 'BUY'
        },
        {
            'entry_price': 42850.00,
            'stop_loss': 43150.00,
            'take_profit': 41950.00,
            'direction': 'SELL'
        },
        {
            'entry_price': 189.350,
            'stop_loss': 189.120,
            'take_profit': 189.890,
            'direction': 'BUY'
        }
    ] * 40  # Simulate 120 trades
    
    # Run backtest
    result = backtest_engine.run_backtest(
        strategy_name="Test Strategy",
        signals=sample_signals,
        price_data=None,  # Simplified for demo
        initial_capital=10000.0
    )
    
    # Display results
    logger.info("\n📊 BACKTEST RESULTS:")
    logger.info(f"Total Trades: {result['total_trades']}")
    logger.info(f"Win Rate: {result['win_rate']:.1f}%")
    logger.info(f"Profit Factor: {result['profit_factor']:.2f}")
    logger.info(f"Sharpe Ratio: {result['sharpe_ratio']:.2f}")
    logger.info(f"Max Drawdown: {result['max_drawdown']:.1f}%")
    logger.info(f"Total Return: {result['total_return']:.1f}%")
    logger.info(f"Expectancy: ${result['expectancy']:.2f}")
    logger.info(f"Risk of Ruin: {result['risk_of_ruin']:.1f}%")
    

def test_strategy_parser():
    """Test strategy parsing"""
    logger.info("\n" + "=" * 60)
    logger.info("TEST 3: Strategy Parser")
    logger.info("=" * 60)
    
    # Sample strategy JSON
    strategy_json = """
    {
        "name": "London Killzone Liquidity Sweep",
        "rules": [
            {
                "type": "price_action",
                "condition": "liquidity_sweep",
                "parameters": {"lookback": 20}
            },
            {
                "type": "technical",
                "condition": "fair_value_gap",
                "parameters": {"min_size": 0.0010}
            },
            {
                "type": "session",
                "condition": "london_session"
            }
        ],
        "entry": {
            "type": "limit",
            "offset_pips": 5
        },
        "risk_management": {
            "stop_loss_pips": 15,
            "take_profit_pips": 40,
            "risk_reward_ratio": 2.67
        }
    }
    """
    
    # Parse strategy
    parsed = strategy_parser.parse_json_strategy(strategy_json)
    logger.info(f"\n✅ Parsed Strategy: {parsed['name']}")
    logger.info(f"Rules: {len(parsed['rules'])}")
    
    # Test execution
    market_data = {
        'symbol': 'EURUSD',
        'close': 1.08520,
        'session': 'london'
    }
    
    signal = strategy_parser.execute_strategy(parsed, market_data)
    if signal:
        logger.info(f"\n🎯 SIGNAL GENERATED:")
        logger.info(f"Symbol: {signal['symbol']}")
        logger.info(f"Direction: {signal['direction']}")
        logger.info(f"Entry: {signal['entry_price']:.5f}")
        logger.info(f"Stop Loss: {signal['stop_loss']:.5f}")
        logger.info(f"Take Profit: {signal['take_profit']:.5f}")


def test_all_sync():
    """Run all synchronous tests"""
    test_backtesting()
    test_strategy_parser()
    
    logger.info("\n" + "=" * 60)
    logger.info("✅ ALL TESTS COMPLETE")
    logger.info("=" * 60)
    logger.info("\nNext Step: Integrate with database and run live system")


async def test_all_async():
    """Run all async tests"""
    await test_market_data()


if __name__ == "__main__":
    logger.info("\n" + "=" * 60)
    logger.info("🚀 TRADERCOPILOT SYSTEM TEST")
    logger.info("=" * 60)
    
    # Run sync tests first
    test_all_sync()
    
    # Optionally run async market data test
    # Uncomment to test live WebSocket connection:
    # asyncio.run(test_all_async())
