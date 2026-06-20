"""
Supabase Database Client
Handles all database operations using Supabase with local SQLite/SQLAlchemy fallback.
"""

import os
import logging
from typing import Dict, List, Optional
from datetime import datetime
import uuid
from supabase import create_client, Client

logger = logging.getLogger(__name__)


class SupabaseClient:
    """
    Supabase database client for Metis
    Provides methods for signal storage, retrieval, and analytics
    with a seamless local SQLAlchemy/SQLite fallback.
    """
    
    def __init__(self):
        """Initialize Supabase client"""
        self.url = os.getenv('SUPABASE_URL')
        self.key = os.getenv('SUPABASE_KEY')
        self.client: Optional[Client] = None
        self.connected = False
        
        # Don't try to connect if credentials are placeholders or empty
        is_placeholder = (
            not self.url or not self.key or 
            "your-project" in self.url or 
            "your-anon-key-here" in self.key
        )
        
        if not is_placeholder:
            try:
                self.client = create_client(self.url, self.key)
                self.connected = True
                logger.info("✅ Connected to Supabase database")
            except Exception as e:
                logger.error(f"❌ Supabase connection failed: {e}")
                self.connected = False
        else:
            logger.warning("⚠️ Supabase credentials are placeholder or missing. Falling back to local relational database.")
            self.connected = False
    
    
    # MARKET DATA
    async def get_market_data(self, symbol: str, start_date: datetime, end_date: datetime, interval: str = '1m') -> List[Dict]:
        """
        Fetch historical market data for backtesting
        """
        if not self.connected:
            try:
                from app.database.postgres import AsyncSessionLocal
                from app.models import MarketData
                from sqlalchemy import select, and_
                async with AsyncSessionLocal() as session:
                    result = await session.execute(
                        select(MarketData)
                        .where(
                            and_(
                                MarketData.symbol == symbol.upper(),
                                MarketData.time >= start_date,
                                MarketData.time <= end_date
                            )
                        )
                        .order_by(MarketData.time.asc())
                    )
                    data = result.scalars().all()
                    return [
                        {
                            "time": d.time.isoformat() if d.time else None,
                            "symbol": d.symbol,
                            "open": float(d.open) if d.open is not None else 0.0,
                            "high": float(d.high) if d.high is not None else 0.0,
                            "low": float(d.low) if d.low is not None else 0.0,
                            "close": float(d.close) if d.close is not None else 0.0,
                            "volume": float(d.volume) if d.volume is not None else 0.0,
                            "exchange": d.exchange
                        }
                        for d in data
                    ]
            except Exception as e:
                logger.error(f"Error fetching market data from local DB: {e}")
                return []
            
        try:
            # Query the market_data table
            result = self.client.table('market_data')\
                .select('*')\
                .eq('symbol', symbol)\
                .gte('time', start_date.isoformat())\
                .lte('time', end_date.isoformat())\
                .order('time', desc=False)\
                .execute()
                
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error fetching market data: {e}")
            return []

    # SIGNALS
    async def store_signal(self, signal: Dict) -> Optional[str]:
        """
        Store signal in database
        
        Args:
            signal: Signal dictionary
            
        Returns:
            Signal ID if successful
        """
        if not self.connected:
            try:
                from app.database.postgres import AsyncSessionLocal
                from app.models import Signal
                import uuid
                async with AsyncSessionLocal() as session:
                    # Resolve strategy_id UUID
                    strat_id = None
                    if signal.get('strategy_id'):
                        try:
                            strat_id = uuid.UUID(str(signal.get('strategy_id')))
                        except ValueError:
                            pass
                    
                    # Resolve created_at
                    created_at_dt = datetime.utcnow()
                    if signal.get('created_at'):
                        try:
                            created_at_dt = datetime.fromisoformat(signal.get('created_at').replace("Z", "+00:00"))
                        except ValueError:
                            pass

                    new_signal = Signal(
                        id=uuid.uuid4(),
                        strategy_id=strat_id,
                        symbol=signal['symbol'],
                        direction=signal['direction'],
                        entry_price=float(signal['entry_price']),
                        stop_loss=float(signal['stop_loss']),
                        take_profit=float(signal['take_profit']),
                        probability_score=float(signal['probability_score']),
                        signal_score=float(signal['signal_score']),
                        confidence_level=signal['confidence_level'],
                        risk_rating=signal['risk_rating'],
                        trade_explanation=signal['trade_explanation'],
                        position_sizing=float(signal['position_sizing']),
                        status=signal.get('status', 'active'),
                        price_usdc=float(signal.get('price_usdc', 0.001000)),
                        debate_transcript=signal.get('debate_transcript'),
                        created_at=created_at_dt
                    )
                    session.add(new_signal)
                    await session.commit()
                    logger.info(f"✅ Signal stored in local database: {signal['symbol']}")
                    return str(new_signal.id)
            except Exception as e:
                logger.error(f"Error storing signal in local database: {e}")
                return None
        
        try:
            result = self.client.table('signals').insert({
                'strategy_id': signal.get('strategy_id'),
                'symbol': signal['symbol'],
                'direction': signal['direction'],
                'entry_price': float(signal['entry_price']),
                'stop_loss': float(signal['stop_loss']),
                'take_profit': float(signal['take_profit']),
                'probability_score': float(signal['probability_score']),
                'signal_score': float(signal['signal_score']),
                'confidence_level': signal['confidence_level'],
                'risk_rating': signal['risk_rating'],
                'trade_explanation': signal['trade_explanation'],
                'position_sizing': float(signal['position_sizing']),
                'status': signal.get('status', 'active'),
                'debate_transcript': signal.get('debate_transcript'),
                'created_at': signal.get('created_at', datetime.utcnow().isoformat())
            }).execute()
            
            logger.info(f"✅ Signal stored in database: {signal['symbol']}")
            return result.data[0]['id'] if result.data else None
            
        except Exception as e:
            logger.error(f"Error storing signal: {e}")
            return None
    
    async def get_signals(self, symbols: List[str] = None, min_score: float = None, 
                          min_prob: float = None, status: str = None, limit: int = 50) -> List[Dict]:
        """Get signals with filtering"""
        if not self.connected:
            try:
                from app.database.postgres import AsyncSessionLocal
                from app.models import Signal
                from sqlalchemy import select, and_
                async with AsyncSessionLocal() as session:
                    query = select(Signal)
                    filters = []
                    if symbols:
                        filters.append(Signal.symbol.in_(symbols))
                    if min_score is not None:
                        filters.append(Signal.signal_score >= min_score)
                    if min_prob is not None:
                        filters.append(Signal.probability_score >= min_prob)
                    if status:
                        filters.append(Signal.status == status)
                    if filters:
                        query = query.where(and_(*filters))
                    query = query.order_by(Signal.created_at.desc()).limit(limit)
                    result = await session.execute(query)
                    signals = result.scalars().all()
                    return [
                        {
                            "id": str(s.id),
                            "strategy_id": str(s.strategy_id) if s.strategy_id else None,
                            "symbol": s.symbol,
                            "direction": s.direction,
                            "entry_price": float(s.entry_price) if s.entry_price is not None else 0.0,
                            "stop_loss": float(s.stop_loss) if s.stop_loss is not None else 0.0,
                            "take_profit": float(s.take_profit) if s.take_profit is not None else 0.0,
                            "probability_score": float(s.probability_score) if s.probability_score is not None else 0.0,
                            "signal_score": float(s.signal_score) if s.signal_score is not None else 0.0,
                            "confidence_level": s.confidence_level,
                            "risk_rating": s.risk_rating,
                            "trade_explanation": s.trade_explanation,
                            "position_sizing": float(s.position_sizing) if s.position_sizing is not None else 0.0,
                            "status": s.status,
                            "price_usdc": float(s.price_usdc) if s.price_usdc is not None else 0.001000,
                            "debate_transcript": s.debate_transcript,
                            "created_at": s.created_at.isoformat() if s.created_at else None
                        }
                        for s in signals
                    ]
            except Exception as e:
                logger.error(f"Error fetching signals from local database: {e}")
                return []
        
        try:
            query = self.client.table('signals').select('*')
            
            if symbols:
                query = query.in_('symbol', symbols)
            
            if min_score is not None:
                query = query.gte('signal_score', min_score)
            
            if min_prob is not None:
                query = query.gte('probability_score', min_prob)
            
            if status:
                query = query.eq('status', status)
            
            result = query.order('created_at', desc=True).limit(limit).execute()
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error fetching signals with filters: {e}")
            return []

    async def get_active_signals(self, limit: int = 20) -> List[Dict]:
        """Get all active signals"""
        return await self.get_signals(status='active', limit=limit)
    
    async def get_signal_by_id(self, signal_id: str) -> Optional[Dict]:
        """Get specific signal by ID"""
        if not self.connected:
            try:
                from app.database.postgres import AsyncSessionLocal
                from app.models import Signal
                from sqlalchemy import select
                async with AsyncSessionLocal() as session:
                    result = await session.execute(
                        select(Signal).where(Signal.id == uuid.UUID(signal_id))
                    )
                    s = result.scalar_one_or_none()
                    if not s:
                        return None
                    return {
                        "id": str(s.id),
                        "strategy_id": str(s.strategy_id) if s.strategy_id else None,
                        "symbol": s.symbol,
                        "direction": s.direction,
                        "entry_price": float(s.entry_price) if s.entry_price is not None else 0.0,
                        "stop_loss": float(s.stop_loss) if s.stop_loss is not None else 0.0,
                        "take_profit": float(s.take_profit) if s.take_profit is not None else 0.0,
                        "probability_score": float(s.probability_score) if s.probability_score is not None else 0.0,
                        "signal_score": float(s.signal_score) if s.signal_score is not None else 0.0,
                        "confidence_level": s.confidence_level,
                        "risk_rating": s.risk_rating,
                        "trade_explanation": s.trade_explanation,
                        "position_sizing": float(s.position_sizing) if s.position_sizing is not None else 0.0,
                        "status": s.status,
                        "price_usdc": float(s.price_usdc) if s.price_usdc is not None else 0.001000,
                        "debate_transcript": s.debate_transcript,
                        "created_at": s.created_at.isoformat() if s.created_at else None
                    }
            except Exception as e:
                logger.error(f"Error fetching signal {signal_id} from local database: {e}")
                return None
        
        try:
            result = self.client.table('signals')\
                .select('*')\
                .eq('id', signal_id)\
                .single()\
                .execute()
            
            return result.data
        except Exception as e:
            logger.error(f"Error fetching signal: {e}")
            return None
    
    async def update_signal_status(self, signal_id: str, status: str, **kwargs):
        """Update signal status (e.g., close, expire)"""
        if not self.connected:
            try:
                from app.database.postgres import AsyncSessionLocal
                from app.models import Signal
                from sqlalchemy import select
                async with AsyncSessionLocal() as session:
                    result = await session.execute(
                        select(Signal).where(Signal.id == uuid.UUID(signal_id))
                    )
                    s = result.scalar_one_or_none()
                    if s:
                        s.status = status
                        for k, v in kwargs.items():
                            setattr(s, k, v)
                        await session.commit()
                        logger.info(f"Signal {signal_id} updated locally to {status}")
            except Exception as e:
                logger.error(f"Error updating signal {signal_id} locally: {e}")
            return
        
        try:
            update_data = {'status': status}
            update_data.update(kwargs)
            
            self.client.table('signals')\
                .update(update_data)\
                .eq('id', signal_id)\
                .execute()
            
            logger.info(f"Signal {signal_id} updated to {status}")
        except Exception as e:
            logger.error(f"Error updating signal: {e}")
    
    # STRATEGIES
    async def store_strategy(self, strategy: Dict) -> Optional[str]:
        """Store strategy configuration"""
        if not self.connected:
            try:
                from app.database.postgres import AsyncSessionLocal
                from app.models import Strategy, User
                from sqlalchemy import select
                async with AsyncSessionLocal() as session:
                    # Verify/Create the user so foreign key constraint passes
                    user_uuid = None
                    if strategy.get('user_id'):
                        user_uuid = uuid.UUID(str(strategy.get('user_id')))
                        # Check if user exists
                        user_res = await session.execute(select(User).where(User.id == user_uuid))
                        user_obj = user_res.scalar_one_or_none()
                        if not user_obj:
                            user_obj = User(id=user_uuid, email=f"user_{user_uuid.hex[:8]}@example.com")
                            session.add(user_obj)
                            await session.commit()

                    new_strat = Strategy(
                        id=uuid.uuid4(),
                        user_id=user_uuid,
                        name=strategy['name'],
                        description=strategy.get('description'),
                        strategy_type=strategy.get('type', 'json'),
                        config=strategy.get('rules', {}),
                        executable_code=strategy.get('executable_code'),
                        is_active=True
                    )
                    session.add(new_strat)
                    await session.commit()
                    logger.info(f"✅ Strategy stored in local database: {strategy['name']}")
                    return str(new_strat.id)
            except Exception as e:
                logger.error(f"Error storing strategy in local database: {e}")
                return None
        
        try:
            result = self.client.table('strategies').insert({
                'name': strategy['name'],
                'strategy_type': strategy.get('type', 'json'),
                'config': strategy.get('rules', {}),
                'risk_management': strategy.get('risk_management', {}),
                'created_at': datetime.utcnow().isoformat()
            }).execute()
            
            return result.data[0]['id'] if result.data else None
        except Exception as e:
            logger.error(f"Error storing strategy: {e}")
            return None
    
    async def get_strategies(self, user_id: Optional[str] = None) -> List[Dict]:
        """Get all strategies, optionally filtered by user_id"""
        if not self.connected:
            try:
                from app.database.postgres import AsyncSessionLocal
                from app.models import Strategy
                from sqlalchemy import select
                async with AsyncSessionLocal() as session:
                    query = select(Strategy)
                    if user_id:
                        query = query.where(Strategy.user_id == uuid.UUID(user_id))
                    result = await session.execute(query)
                    strategies = result.scalars().all()
                    return [
                        {
                            "id": str(s.id),
                            "user_id": str(s.user_id),
                            "name": s.name,
                            "description": s.description,
                            "type": s.strategy_type,
                            "rules": s.config,
                            "risk_management": s.config.get('risk_management', {}) if s.config else {},
                            "is_active": s.is_active,
                            "created_at": s.created_at.isoformat() if s.created_at else None
                        }
                        for s in strategies
                    ]
            except Exception as e:
                logger.error(f"Error fetching strategies from local database: {e}")
                return []
        
        try:
            query = self.client.table('strategies').select('*')
            if user_id:
                query = query.eq('user_id', user_id)
            result = query.execute()
            
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error fetching strategies: {e}")
            return []

    async def get_active_strategies(self) -> List[Dict]:
        """Get only active strategies for execution"""
        if not self.connected:
            try:
                from app.database.postgres import AsyncSessionLocal
                from app.models import Strategy
                from sqlalchemy import select
                async with AsyncSessionLocal() as session:
                    result = await session.execute(select(Strategy).where(Strategy.is_active == True))
                    strategies = result.scalars().all()
                    return [
                        {
                            "id": str(s.id),
                            "user_id": str(s.user_id),
                            "name": s.name,
                            "description": s.description,
                            "type": s.strategy_type,
                            "rules": s.config,
                            "risk_management": s.config.get('risk_management', {}) if s.config else {},
                            "is_active": s.is_active,
                            "created_at": s.created_at.isoformat() if s.created_at else None
                        }
                        for s in strategies
                    ]
            except Exception as e:
                logger.error(f"Error fetching active strategies from local database: {e}")
                return []
        
        try:
            result = self.client.table('strategies')\
                .select('*')\
                .eq('is_active', True)\
                .execute()
            
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Error fetching active strategies: {e}")
            return []
    
    # BACKTESTS
    async def store_backtest_result(self, result: Dict) -> Optional[str]:
        """Store backtest results"""
        if not self.connected:
            try:
                from app.database.postgres import AsyncSessionLocal
                from app.models import BacktestResult
                import uuid
                async with AsyncSessionLocal() as session:
                    new_bt = BacktestResult(
                        id=uuid.uuid4(),
                        strategy_id=uuid.UUID(str(result['strategy_id'])) if result.get('strategy_id') else None,
                        start_date=result.get('start_date'),
                        end_date=result.get('end_date'),
                        initial_capital=result.get('initial_capital', 10000.0),
                        final_capital=result.get('final_capital', 10000.0),
                        total_trades=result.get('total_trades', 0),
                        win_rate=result.get('win_rate', 0.0),
                        sharpe_ratio=result.get('sharpe_ratio', 0.0),
                        max_drawdown=result.get('max_drawdown', 0.0),
                        profit_factor=result.get('profit_factor', 0.0),
                        expectancy=result.get('expectancy', 0.0),
                        risk_of_ruin=result.get('risk_of_ruin', 0.0),
                        metrics=result.get('metrics', {})
                    )
                    session.add(new_bt)
                    await session.commit()
                    logger.info(f"✅ Backtest results stored in local database: {new_bt.id}")
                    return str(new_bt.id)
            except Exception as e:
                logger.error(f"Error storing backtest in local database: {e}")
                return None
        
        try:
            data = self.client.table('backtest_results').insert({
                'strategy_id': result.get('strategy_id'),
                'total_trades': result['total_trades'],
                'winning_trades': result.get('winning_trades', 0),
                'losing_trades': result.get('losing_trades', 0),
                'win_rate': float(result['win_rate']),
                'profit_factor': float(result['profit_factor']),
                'sharpe_ratio': float(result['sharpe_ratio']),
                'max_drawdown': float(result['max_drawdown']),
                'total_return': float(result.get('total_return', 0)),
                'created_at': datetime.utcnow().isoformat()
            }).execute()
            
            return data.data[0]['id'] if data.data else None
        except Exception as e:
            logger.error(f"Error storing backtest: {e}")
            return None
    
    # ANALYTICS
    async def get_statistics(self) -> Dict:
        """Get system-wide statistics"""
        active = await self.get_active_signals(limit=1000)
        
        if not active:
            return {
                'active_signals': 0,
                'total_signals': 0,
                'avg_score': 0.0,
                'avg_probability': 0.0
            }
        
        try:
            avg_score = sum(float(s['signal_score']) for s in active) / len(active)
            avg_prob = sum(float(s['probability_score']) for s in active) / len(active)
            
            return {
                'active_signals': len(active),
                'avg_score': round(avg_score, 1),
                'avg_probability': round(avg_prob, 1),
                'win_rate': 68.0  # Would calculate from closed signals
            }
        except Exception as e:
            logger.error(f"Error fetching statistics: {e}")
            return {
                'active_signals': len(active),
                'avg_score': 0.0,
                'avg_probability': 0.0
            }


# Global instance
supabase_client = SupabaseClient()
