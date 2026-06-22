"""Database models"""

from sqlalchemy import Column, String, Boolean, Integer, Float, DateTime, Text, ForeignKey, Index, DECIMAL, JSON, Uuid
JSONB = JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

# Cross-compatible UUID type (works with both SQLite and PostgreSQL)
UUID = lambda **kw: Uuid(native_uuid=False)


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    subscription_tier = Column(String(50), default="free")
    wallet_address = Column(String(255), unique=True, nullable=True, index=True)
    wallet_private_key = Column(String(255), nullable=True)
    wallet_balance = Column(DECIMAL(20, 8), default=0.0)
    external_wallet = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    strategies = relationship("Strategy", back_populates="user", cascade="all, delete-orphan")
    agents = relationship("Agent", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")


class MarketData(Base):
    """Market data model - TimescaleDB hypertable"""
    __tablename__ = "market_data"
    
    time = Column(DateTime(timezone=True), primary_key=True, nullable=False)
    symbol = Column(String(20), primary_key=True, nullable=False)
    open = Column(DECIMAL(20, 8))
    high = Column(DECIMAL(20, 8))
    low = Column(DECIMAL(20, 8))
    close = Column(DECIMAL(20, 8))
    volume = Column(DECIMAL(20, 8))
    exchange = Column(String(20))
    
    __table_args__ = (
        Index('idx_market_data_symbol_time', 'symbol', 'time'),
    )


class Strategy(Base):
    """Strategy model"""
    __tablename__ = "strategies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    strategy_type = Column(String(50), nullable=False)  # 'json', 'pine', 'python'
    config = Column(JSONB, nullable=False)
    executable_code = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="strategies")
    backtest_results = relationship("BacktestResult", back_populates="strategy", cascade="all, delete-orphan")
    signals = relationship("Signal", back_populates="strategy", cascade="all, delete-orphan")


class BacktestResult(Base):
    """Backtest results model"""
    __tablename__ = "backtest_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    strategy_id = Column(UUID(as_uuid=True), ForeignKey("strategies.id"), nullable=False)
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    initial_capital = Column(DECIMAL(20, 2))
    final_capital = Column(DECIMAL(20, 2))
    total_trades = Column(Integer)
    win_rate = Column(DECIMAL(5, 2))
    sharpe_ratio = Column(DECIMAL(10, 4))
    max_drawdown = Column(DECIMAL(5, 2))
    profit_factor = Column(DECIMAL(10, 4))
    expectancy = Column(DECIMAL(20, 8))
    risk_of_ruin = Column(DECIMAL(5, 2))
    metrics = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    strategy = relationship("Strategy", back_populates="backtest_results")


class Signal(Base):
    """Signal model"""
    __tablename__ = "signals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    strategy_id = Column(UUID(as_uuid=True), ForeignKey("strategies.id"), nullable=False)
    symbol = Column(String(20), nullable=False)
    direction = Column(String(10), nullable=False)  # 'BUY', 'SELL'
    entry_price = Column(DECIMAL(20, 8))
    stop_loss = Column(DECIMAL(20, 8))
    take_profit = Column(DECIMAL(20, 8))
    probability_score = Column(DECIMAL(5, 2))  # 0-100%
    signal_score = Column(DECIMAL(3, 1))  # 0-10
    confidence_level = Column(String(20))  # 'High', 'Medium', 'Low'
    risk_rating = Column(String(20))
    trade_explanation = Column(Text)
    position_sizing = Column(DECIMAL(5, 2))
    gemini_context = Column(JSONB)
    status = Column(String(20), default='active')  # 'active', 'closed', 'expired'
    price_usdc = Column(DECIMAL(20, 6), default=0.001000)
    debate_transcript = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    
    # Relationships
    strategy = relationship("Strategy", back_populates="signals")
    
    __table_args__ = (
        Index('idx_signals_created_at', 'created_at'),
        Index('idx_signals_status', 'status'),
        Index('idx_signals_symbol', 'symbol'),
    )


class KnowledgeBase(Base):
    """Knowledge base for vector search"""
    __tablename__ = "knowledge_base"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    meta_data = Column(JSONB)
    embedding = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Agent(Base):
    """AI Agent model with programmatically controlled wallets"""
    __tablename__ = "agents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    wallet_address = Column(String(255), unique=True, nullable=False, index=True)
    wallet_private_key = Column(String(255), nullable=False)
    wallet_balance = Column(DECIMAL(20, 8), default=0.0)
    daily_budget = Column(DECIMAL(20, 8), default=1.0)
    spent_today = Column(DECIMAL(20, 8), default=0.0)
    is_active = Column(Boolean, default=True)
    yield_loop_active = Column(Boolean, default=False)
    yield_loop_balance = Column(DECIMAL(20, 8), default=0.0)
    yield_loop_last_deposit = Column(DateTime(timezone=True), nullable=True)
    yield_loop_interest_earned = Column(DECIMAL(20, 8), default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="agents")
    transactions = relationship("Transaction", back_populates="agent", cascade="all, delete-orphan")


class Transaction(Base):
    """Microtransaction ledger for payments settled on Arc L1"""
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    tx_hash = Column(String(255), unique=True, nullable=False, index=True)
    amount = Column(DECIMAL(20, 8), nullable=False)
    currency = Column(String(50), default="USDC")
    sender_address = Column(String(255), nullable=False)
    receiver_address = Column(String(255), nullable=False)
    purpose = Column(String(255), nullable=True)
    status = Column(String(50), default="success")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    agent = relationship("Agent", back_populates="transactions")
