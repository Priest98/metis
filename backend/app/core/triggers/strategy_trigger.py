"""
Strategy Trigger System
Monitors market data and triggers strategies when conditions are met
"""

import asyncio
import logging
from typing import Dict, List
from datetime import datetime

from app.core.market_data.websocket_client import market_data_engine
from app.database import supabase_client
from app.core.strategies.executor import strategy_executor
from app.core.distribution.websocket_distributor import signal_distributor
# from app.core.distribution.telegram_bot import telegram_bot # Pending implementation

logger = logging.getLogger(__name__)

class StrategyTriggerSystem:
    """
    Monitors market data and automatically triggers strategies
    Orchestrates the complete flow: Market Data → Strategy Evaluation → Signal Generation → Distribution
    """
    
    def __init__(self):
        self.active_strategies = []
        self.running = False
        self.signals_generated = 0
        
    def add_strategy(self, strategy: Dict):
        """
        Add strategy to monitoring system
        Args:
            strategy: Parsed strategy configuration
        """
        # Validate minimal requirements
        if strategy.get('name') and strategy.get('rules'):
            self.active_strategies.append(strategy)
            logger.info(f"✅ Strategy added to monitor: {strategy['name']}")
        else:
            logger.error(f"❌ Cannot add invalid strategy: {strategy.get('name', 'Unknown')}")
    
    async def start(self, symbols: List[str]):
        """
        Start monitoring market data and triggering strategies
        Args:
            symbols: List of symbols to monitor
        """
        # 1. Load active strategies from Database
        logger.info("🔄 Loading active strategies from Supabase...")
        db_strategies = await supabase_client.get_active_strategies()
        
        for strategy in db_strategies:
            # Parse config if needed (Supabase might return dict or string depending on column type)
            # Assuming it's already a dict thanks to Supabase-Python client
            self.add_strategy(strategy)
            
        logger.info(f"🚀 Starting Strategy Trigger System with {len(self.active_strategies)} strategies")
        
        if len(self.active_strategies) == 0:
            logger.warning("⚠️ No active strategies found in database.")
        
        self.running = True
        
        # Subscribe to market data updates
        market_data_engine.subscribe(self._on_market_data)
        
        # Start market data engine
        try:
            await market_data_engine.start(symbols, interval='1m')
        except Exception as e:
            logger.error(f"Error in strategy trigger system: {e}")
            self.running = False
    
    async def _on_market_data(self, candle_data: Dict):
        """
        Handle incoming market data and check strategies
        Args:
            candle_data: Real-time candle data from exchange
        """
        # Only process closed candles for signal generation
        if not candle_data.get('is_closed'):
            return
        
        # logger.debug(f"🔍 Checking {len(self.active_strategies)} strategies for {candle_data['symbol']}")
        
        # Check each active strategy
        for strategy in self.active_strategies:
            try:
                # Execute strategy rules using the Executor
                signal_candidate = strategy_executor.execute(strategy, candle_data)
                
                if signal_candidate:
                    logger.info(f"🎯 Strategy '{strategy['name']}' triggered on {candle_data['symbol']}!")
                    
                    # Generate full signal through pipeline
                    signal = await self._generate_signal(strategy, signal_candidate, candle_data)
                    
                    if signal:
                        # Distribute signal
                        await self._distribute_signal(signal)
                        self.signals_generated += 1
                        
            except Exception as e:
                logger.error(f"Error evaluating strategy {strategy.get('name')}: {e}")
    
    async def _generate_signal(self, strategy: Dict, candidate: Dict, market_data: Dict) -> Dict:
        """
        Generate complete signal through the pipeline
        
        Returns:
            Complete signal with probability, score, and AI analysis
        """
        try:
            from app.core.probability.market_regime import market_regime_detector
            from app.core.scoring.signal_scorer import signal_scorer
            from app.core.scoring.filter import signal_filter
            import pandas as pd
            
            # 1. Detect Market Regime
            # Ideally fetch more history, here we might need to rely on what we have or fetch snapshot
            # For efficiency in this trigger, we'll assume we can get a quick snapshot or use cached data
            # strict implementation would be:
            # history = await supabase_client.get_market_data(candidate['symbol'], start, end)
            # df = pd.DataFrame(history)
            # regime = market_regime_detector.detect_regime(df)
            
            # Placeholder for regime until history fetch is optimized for real-time
            regime = {'regime': 'trending', 'volatility': 'normal'} 
            
            # 2. Calculate Scores
            # These would ideally come from the Probability Engine and Backtest results
            # We'll use the scorer with some estimated inputs for now
            probability_score = 75.0 # Placeholder: would be calculated by Bayesian engine
            
            signal_score = signal_scorer.calculate_signal_score(
                probability_score=probability_score,
                backtest_metrics={'win_rate': 65.0, 'sharpe_ratio': 1.5}, # Placeholder
                market_regime=regime['regime'],
                strategy_regime_performance={'trending': 70.0, 'ranging': 40.0}, # Placeholder
                risk_reward_ratio=2.5, # Calculate from candidate
                current_volatility=regime['volatility'],
                optimal_volatility='normal'
            )
            
            # 3. Create Signal Object
            signal = {
                'id': f"sig_{int(datetime.utcnow().timestamp())}",
                'strategy_id': strategy.get('id', 'unknown'),
                'strategy_name': strategy['name'],
                'symbol': candidate['symbol'],
                'direction': candidate['direction'],
                'entry_price': candidate['entry_price'],
                'stop_loss': candidate['stop_loss'],
                'take_profit': candidate['take_profit'],
                'probability_score': probability_score,
                'signal_score': signal_score,
                'confidence_level': 'High' if signal_score > 8.0 else 'Medium',
                'risk_rating': 'Medium', # Could be derived from volatility
                'trade_explanation': f"Strategy {strategy['name']} triggered. Regime: {regime['regime']}. Score: {signal_score}/10.",
                'position_sizing': 2.0, # Default to 2%
                'status': 'active',
                'created_at': datetime.utcnow().isoformat()
            }
            
            # 4. Filter Signal
            if not signal_filter.validate(signal):
                logger.info(f"⚠️ Signal filtered out: Score {signal_score} below threshold")
                return None
            
            logger.info(f"✅ Signal generated: {signal['symbol']} {signal['direction']} (Score: {signal['signal_score']})")
            return signal
            
        except Exception as e:
            logger.error(f"Error generating signal: {e}")
            return None
    
    async def _distribute_signal(self, signal: Dict):
        """
        Distribute signal via all channels
        
        Args:
            signal: Complete signal to distribute
        """
        logger.info(f"📡 Distributing signal: {signal['symbol']} {signal['direction']}")
        
        # WebSocket distribution
        await signal_distributor.broadcast_signal(signal)
        
        # Trigger autonomous agent fleet workflow in background
        from app.core.agents.trader_agent import agent_fleet_manager
        import asyncio
        asyncio.create_task(agent_fleet_manager.process_new_signal(signal))
        
        # Telegram distribution
        # await telegram_bot.send_signal(signal)
        
        logger.info("✅ Signal distributed to all channels")
    
    async def stop(self):
        """Stop the trigger system"""
        self.running = False
        logger.info(f"🛑 Strategy Trigger System stopped. Signals generated: {self.signals_generated}")


# Global instance
strategy_trigger_system = StrategyTriggerSystem()


# Example usage
async def example_live_system():
    """Example: Set up live system with strategies"""
    
    # Add a sample strategy
    strategy_json = """
    {
        "name": "London Breakout",
        "rules": [
            {"type": "price_action", "condition": "liquidity_sweep"},
            {"type": "session", "condition": "london_session"}
        ],
        "risk_management": {
            "stop_loss_pips": 20,
            "take_profit_pips": 50
        }
    }
    """
    
    parsed_strategy = strategy_parser.parse_json_strategy(strategy_json)
    strategy_trigger_system.add_strategy(parsed_strategy)
    
    # Start monitoring
    await strategy_trigger_system.start(['EURUSD', 'GBPUSD', 'BTCUSDT'])


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(example_live_system())
