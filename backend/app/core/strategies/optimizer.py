"""
Self-Optimizing Strategy Optimizer
Scans database strategies, runs parameter sweeps, evaluates backtests,
and automatically updates strategy configs with higher performing parameters.
"""

import logging
from typing import Dict, Any, List, Optional
from decimal import Decimal
from datetime import datetime, timedelta
import uuid

from app.database import AsyncSessionLocal
from app.models import Strategy, BacktestResult, MarketData
from app.core.backtesting.vectorbt_adapter import vectorbt_adapter

logger = logging.getLogger(__name__)

class StrategyOptimizer:
    """
    Automated optimization worker that tunes strategy parameters.
    """

    async def optimize_active_strategies(self) -> Dict[str, Any]:
        """
        Scans all active strategies and attempts to optimize their parameters.
        Returns a summary of optimizations performed.
        """
        logger.info("🔄 Running Strategy Optimizer sweep...")
        results = {
            "strategies_checked": 0,
            "optimized": 0,
            "failed": 0,
            "details": []
        }

        try:
            async with AsyncSessionLocal() as session:
                from sqlalchemy import select
                # 1. Fetch all active strategies
                strat_res = await session.execute(
                    select(Strategy).where(Strategy.is_active == True)
                )
                strategies = strat_res.scalars().all()
                results["strategies_checked"] = len(strategies)

                for strategy in strategies:
                    # 2. Fetch latest backtest result as baseline
                    backtest_res = await session.execute(
                        select(BacktestResult)
                        .where(BacktestResult.strategy_id == strategy.id)
                        .order_by(BacktestResult.created_at.desc())
                        .limit(1)
                    )
                    baseline = backtest_res.scalar_one_or_none()
                    if not baseline:
                        logger.info(f"ℹ️ Skipping strategy {strategy.name} - no baseline backtest found.")
                        continue

                    # 3. Retrieve historical price data for backtesting
                    price_data = await self._get_historical_prices(session, strategy.config.get("symbol", "BTCUSDT"))
                    if not price_data:
                        logger.warning(f"⚠️ No price data found for {strategy.name} optimization. Skipping.")
                        continue

                    # 4. Generate parameter variations
                    variations = self._generate_parameter_variations(strategy.config)
                    best_config = strategy.config
                    best_sharpe = float(baseline.sharpe_ratio)
                    best_metrics = None

                    logger.info(f"🔍 Tuning {strategy.name}. Baseline Sharpe: {best_sharpe:.4f}")

                    # 5. Run sweep
                    for var_config in variations:
                        try:
                            bt_result = vectorbt_adapter.run_backtest(var_config, price_data)
                            sharpe = float(bt_result.get("sharpe_ratio", 0.0))
                            
                            if sharpe > best_sharpe:
                                best_sharpe = sharpe
                                best_config = var_config
                                best_metrics = bt_result
                        except Exception as e:
                            logger.error(f"Error backtesting variation: {e}")

                    # 6. Apply optimization if improvements were found
                    if best_config != strategy.config and best_metrics:
                        logger.info(f"📈 Optimized strategy '{strategy.name}'! New Sharpe: {best_sharpe:.4f}")
                        
                        # Save updated config
                        strategy.config = best_config
                        session.add(strategy)
                        
                        # Save new backtest result
                        new_backtest = BacktestResult(
                            id=uuid.uuid4(),
                            strategy_id=strategy.id,
                            total_trades=best_metrics.get("total_trades", 0),
                            win_rate=Decimal(str(best_metrics.get("win_rate", 0.0))),
                            profit_factor=Decimal(str(best_metrics.get("profit_factor", 1.0))),
                            sharpe_ratio=Decimal(str(best_sharpe)),
                            max_drawdown=Decimal(str(best_metrics.get("max_drawdown", 0.0))),
                            initial_capital=Decimal("10000.00"),
                            final_capital=Decimal(str(10000.0 + best_metrics.get("total_return", 0.0) * 100)),
                            metrics=best_metrics
                        )
                        session.add(new_backtest)
                        await session.commit()
                        
                        results["optimized"] += 1
                        results["details"].append({
                            "strategy_id": str(strategy.id),
                            "strategy_name": strategy.name,
                            "improved": True,
                            "old_sharpe": float(baseline.sharpe_ratio),
                            "new_sharpe": best_sharpe,
                            "new_config": best_config
                        })
                    else:
                        logger.info(f"⚖️ No improvements found for '{strategy.name}'. Kept baseline.")
                        results["details"].append({
                            "strategy_id": str(strategy.id),
                            "strategy_name": strategy.name,
                            "improved": False
                        })
                        
        except Exception as e:
            logger.error(f"Error in Strategy Optimizer sweep: {e}", exc_info=True)
            results["failed"] += 1
            
        return results

    async def _get_historical_prices(self, session, symbol: str) -> List[Dict[str, Any]]:
        """
        Retrieves historical price records from the database.
        Falls back to generating a mock price history dataset if database is empty.
        """
        from sqlalchemy import select
        try:
            res = await session.execute(
                select(MarketData)
                .where(MarketData.symbol == symbol)
                .order_by(MarketData.time.asc())
                .limit(500)
            )
            records = res.scalars().all()
            if records:
                return [
                    {
                        "time": r.time.isoformat(),
                        "open": float(r.open),
                        "high": float(r.high),
                        "low": float(r.low),
                        "close": float(r.close),
                        "volume": float(r.volume)
                    }
                    for r in records
                ]
        except Exception as e:
            logger.error(f"Error querying market data from DB: {e}")

        # Fallback: Generate mock price data (sine wave with noise)
        logger.info(f"Generating fallback mock price history for {symbol} optimization...")
        import math
        start_time = datetime.utcnow() - timedelta(days=5)
        mock_data = []
        base_price = 62000.0 if "BTC" in symbol else 3300.0 if "ETH" in symbol else 145.0 if "SOL" in symbol else 1.0850
        
        for i in range(200):
            time_val = start_time + timedelta(minutes=15 * i)
            # Add a slow wave cycle plus noise
            wave = base_price * 0.05 * math.sin(i / 15.0)
            noise = base_price * 0.01 * (random_val := ((i * 7 + 13) % 100) / 50.0 - 1.0)
            close = base_price + wave + noise
            mock_data.append({
                "time": time_val.isoformat(),
                "open": close * 0.998,
                "high": close * 1.002,
                "low": close * 0.997,
                "close": close,
                "volume": 10.0 + (i % 5) * 2.5
            })
        return mock_data

    def _generate_parameter_variations(self, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generates parameter variants (EMA window sizes, indicators, triggers).
        """
        variations = []
        
        # Determine candidate parameter to tune (e.g. EMA period, lookbacks, window)
        rules = config.get("rules", [])
        
        # If rules exist, find indicators to tune
        tuned = False
        for idx, rule in enumerate(rules):
            params = rule.get("parameters", {})
            for key in ["lookback", "period", "length", "window"]:
                if key in params:
                    base_val = params[key]
                    # Generate sweeps: base - 5, base - 2, base + 2, base + 5, base + 10
                    for delta in [-5, -2, 2, 5, 10]:
                        new_val = base_val + delta
                        if new_val > 2:  # Valid indicator length
                            # Deep copy and adjust
                            import copy
                            new_config = copy.deepcopy(config)
                            new_config["rules"][idx]["parameters"][key] = new_val
                            variations.append(new_config)
                    tuned = True
                    break
            if tuned:
                break

        # Fallback: Tune risk management percentages if no indicators found
        if not tuned:
            risk = config.get("risk_management", {})
            for key in ["stop_loss_pct", "take_profit_pct", "stop_loss_pips", "take_profit_pips"]:
                if key in risk:
                    base_val = risk[key]
                    for multiplier in [0.8, 0.9, 1.1, 1.2]:
                        import copy
                        new_config = copy.deepcopy(config)
                        new_config["risk_management"][key] = round(base_val * multiplier, 2)
                        variations.append(new_config)
                    tuned = True

        # Default fallback variations
        if not variations:
            import copy
            var = copy.deepcopy(config)
            var["tuned_timestamp"] = datetime.utcnow().isoformat()
            variations.append(var)

        return variations

# Global instance
strategy_optimizer = StrategyOptimizer()
