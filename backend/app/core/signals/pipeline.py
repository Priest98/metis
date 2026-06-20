"""Signal Generation Pipeline"""

from typing import Dict, Any, Optional
from decimal import Decimal
from datetime import datetime, timedelta
import logging

from app.database import AsyncSessionLocal
from app.models import Signal, Strategy, BacktestResult
from app.core.intelligence.gemini_client import gemini_client
from app.core.intelligence.context_builder import context_builder
from app.core.probability.bayesian import bayesian_engine
from app.core.probability.monte_carlo import monte_carlo_engine
from app.core.scoring.signal_scorer import signal_scorer
from app.config import settings

logger = logging.getLogger(__name__)


class SignalPipeline:
    """
    Orchestrates the complete signal generation pipeline.
    
    Flow:
    1. Strategy triggers potential signal
    2. Validate with backtesting metrics
    3. Calculate Bayesian probability
    4. Run Monte Carlo simulation
    5. Calculate multi-factor signal score
    6. Apply quality threshold filter
    7. Enhance with Gemini AI context
    8. Generate final signal
    9. Store and distribute
    """
    
    async def generate_signal(
        self,
        strategy_id: str,
        symbol: str,
        direction: str,
        entry_price: float,
        stop_loss: float,
        take_profit: float,
        market_data: Optional[Dict] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Generate a complete trading signal through the full pipeline.
        
        Args:
            strategy_id: UUID of the strategy
            symbol: Trading symbol
            direction: 'BUY' or 'SELL'
            entry_price: Entry price
            stop_loss: Stop loss price
            take_profit: Take profit price
            market_data: Optional current market data
        
        Returns:
            Complete signal dict if passes quality threshold, None otherwise
        """
        try:
            logger.info(f"Starting signal generation for {symbol} via strategy {strategy_id}")
            
            # Step 1: Load strategy and backtest results
            async with AsyncSessionLocal() as db:
                strategy = await self._get_strategy(db, strategy_id)
                if not strategy:
                    logger.error(f"Strategy {strategy_id} not found")
                    return None
                
                backtest = await self._get_latest_backtest(db, strategy_id)
                if not backtest:
                    logger.warning(f"No backtest found for strategy {strategy_id}")
                    return None
                
                # Step 2: Validate minimum backtest requirements
                if not self._validate_backtest(backtest):
                    logger.warning(f"Backtest for {strategy.name} doesn't meet minimum requirements")
                    return None
                
                # Step 3: Calculate probability score
                probability_score = await self._calculate_probability(
                    backtest,
                    market_data
                )
                
                # Step 4: Calculate signal score
                risk_reward_ratio = abs((take_profit - entry_price) / (entry_price - stop_loss)) if entry_price != stop_loss else 0
                
                signal_score = await self._calculate_signal_score(
                    probability_score,
                    backtest,
                    market_data,
                    risk_reward_ratio
                )
                
                # Step 5: Apply quality threshold
                if signal_score < settings.MIN_SIGNAL_SCORE:
                    logger.info(
                        f"Signal rejected: score {signal_score:.1f} < threshold {settings.MIN_SIGNAL_SCORE}"
                    )
                    return None
                
                if probability_score < settings.MIN_PROBABILITY:
                    logger.info(
                        f"Signal rejected: probability {probability_score:.1f}% < threshold {settings.MIN_PROBABILITY}%"
                    )
                    return None
                
                # Step 6: Build context for Gemini (retrieve relevant sentiment from vector store)
                from app.services.vector_store import vector_store
                sentiment_items = []
                try:
                    query_text = f"{symbol} social market sentiment"
                    query_embedding = await gemini_client.generate_embedding(query_text)
                    search_results = await vector_store.search_similar(query_embedding, limit=3)
                    sentiment_items = [item["content"] for item in search_results]
                except Exception as e:
                    logger.error(f"Error querying vector store in pipeline: {e}")

                signal_candidate = context_builder.format_signal_candidate(
                    symbol=symbol,
                    direction=direction,
                    entry=entry_price,
                    stop_loss=stop_loss,
                    take_profit=take_profit,
                    probability_score=float(probability_score),
                    signal_score=float(signal_score)
                )
                
                context = context_builder.build_signal_context(
                    strategy=strategy,
                    backtest_result=backtest,
                    market_data=market_data,
                    knowledge_items=sentiment_items
                )
                
                # Step 7: Enhance with Gemini AI
                gemini_analysis = await gemini_client.analyze_signal_context(
                    signal_candidate=signal_candidate,
                    strategy_stats=context["strategy_stats"],
                    market_conditions=context["market_conditions"],
                    relevant_knowledge=context["relevant_knowledge"]
                )
                
                # Step 7.5: Run Agent Consensus Committee
                from app.core.agents.committee import agent_committee
                import json
                debate_results = await agent_committee.hold_debate(
                    signal_candidate=signal_candidate,
                    strategy_stats=context["strategy_stats"],
                    market_conditions=context["market_conditions"]
                )
                
                if debate_results.get("final_consensus") == "REJECTED":
                    logger.info(
                        f"⚠️ Signal {symbol} {direction} rejected by AI Committee consensus: "
                        f"{debate_results.get('consensus_explanation')}"
                    )
                    return None
                
                # Step 8: Generate final signal
                signal_data = {
                    "strategy_id": strategy_id,
                    "symbol": symbol,
                    "direction": direction,
                    "entry_price": Decimal(str(entry_price)),
                    "stop_loss": Decimal(str(stop_loss)),
                    "take_profit": Decimal(str(take_profit)),
                    "probability_score": Decimal(str(probability_score)),
                    "signal_score": Decimal(str(signal_score)),
                    "confidence_level": gemini_analysis["confidence_level"],
                    "risk_rating": gemini_analysis["risk_rating"],
                    "trade_explanation": gemini_analysis["trade_explanation"],
                    "position_sizing": Decimal(str(gemini_analysis["position_sizing"])),
                    "gemini_context": gemini_analysis,
                    "debate_transcript": json.dumps(debate_results),
                    "status": "active",
                    "expires_at": datetime.utcnow() + timedelta(hours=settings.SIGNAL_EXPIRY_HOURS)
                }
                
                # Step 9: Store signal
                signal = Signal(**signal_data)
                db.add(signal)
                await db.commit()
                await db.refresh(signal)
                
                logger.info(
                    f"✅ Signal generated with Committee Approval: {symbol} {direction} @ {entry_price} "
                    f"(Score: {signal_score}, Probability: {probability_score}%)"
                )
                
                return signal_data
                
        except Exception as e:
            logger.error(f"Signal generation error: {e}", exc_info=True)
            return None
    
    async def _get_strategy(self, db, strategy_id):
        """Fetch strategy from database"""
        from sqlalchemy import select
        result = await db.execute(
            select(Strategy).where(Strategy.id == strategy_id)
        )
        return result.scalar_one_or_none()
    
    async def _get_latest_backtest(self, db, strategy_id):
        """Fetch latest backtest for strategy"""
        from sqlalchemy import select
        result = await db.execute(
            select(BacktestResult)
            .where(BacktestResult.strategy_id == strategy_id)
            .order_by(BacktestResult.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
    
    def _validate_backtest(self, backtest: BacktestResult) -> bool:
        """Validate backtest meets minimum requirements"""
        if backtest.total_trades < settings.MIN_BACKTEST_TRADES:
            return False
        if float(backtest.win_rate) < settings.MIN_WIN_RATE:
            return False
        if float(backtest.sharpe_ratio) < settings.MIN_SHARPE_RATIO:
            return False
        if float(backtest.max_drawdown) > settings.MAX_DRAWDOWN:
            return False
        
        return True
    
    async def _calculate_probability(
        self,
        backtest: BacktestResult,
        market_data: Optional[Dict]
    ) -> float:
        """Calculate probability using Bayesian + Monte Carlo"""
        
        # Bayesian probability
        prior_win_rate = float(backtest.win_rate)
        
        current_conditions = market_data or {}
        historical_performance = {
            "trending_success_rate": 0.7,  # Placeholder
            "ranging_success_rate": 0.5,
            "optimal_volatility": "normal"
        }
        
        bayesian_prob = bayesian_engine.calculate_posterior_probability(
            prior_win_rate=prior_win_rate,
            current_conditions=current_conditions,
            historical_performance=historical_performance
        )
        
        # Monte Carlo validation
        monte_carlo_result = monte_carlo_engine.simulate_strategy_performance(
            win_rate=float(backtest.win_rate),
            avg_win=5.0,  # Placeholder - should come from backtest
            avg_loss=-2.0,  # Placeholder
            n_trades=100,
            initial_capital=10000.0
        )
        
        mc_prob = monte_carlo_result["probability_of_profit"]
        
        # Weighted average (60% Bayesian, 40% Monte Carlo)
        final_probability = (bayesian_prob * 0.6) + (mc_prob * 0.4)
        
        return round(final_probability, 2)
    
    async def _calculate_signal_score(
        self,
        probability: float,
        backtest: BacktestResult,
        market_data: Optional[Dict],
        risk_reward: float
    ) -> float:
        """Calculate multi-factor signal score"""
        
        backtest_metrics = {
            "win_rate": float(backtest.win_rate),
            "sharpe_ratio": float(backtest.sharpe_ratio),
            "profit_factor": float(backtest.profit_factor)
        }
        
        market_regime = market_data.get("regime", "unknown") if market_data else "unknown"
        
        regime_performance = {
            "trending": 65.0,
            "ranging": 55.0,
            "unknown": 50.0
        }
        
        score = signal_scorer.calculate_signal_score(
            probability_score=probability,
            backtest_metrics=backtest_metrics,
            market_regime=market_regime,
            strategy_regime_performance=regime_performance,
            risk_reward_ratio=risk_reward,
            current_volatility="normal",
            optimal_volatility="normal"
        )
        
        return score


# Global pipeline instance
signal_pipeline = SignalPipeline()
