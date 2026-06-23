"""Application Configuration"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "Metis"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Database
    DATABASE_URL: Optional[str] = None
    DB_ECHO: bool = False
    
    # CORS Origins
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Google Gemini
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.0-flash"
    
    # Supabase (Vector DB)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    # Exchange APIs
    BINANCE_API_KEY: Optional[str] = None
    BINANCE_API_SECRET: Optional[str] = None
    ALPACA_API_KEY: Optional[str] = None
    ALPACA_API_SECRET: Optional[str] = None
    ALPACA_BASE_URL: str = "https://paper-api.alpaca.markets"  # Paper trading by default
    POLYGON_API_KEY: Optional[str] = None
    
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None
    
    # Signal Configuration
    MIN_SIGNAL_SCORE: float = 7.0
    MIN_PROBABILITY: float = 60.0
    SIGNAL_EXPIRY_HOURS: int = 24
    
    # Backtesting Configuration
    MIN_BACKTEST_TRADES: int = 100
    MIN_WIN_RATE: float = 55.0
    MIN_SHARPE_RATIO: float = 1.5
    MAX_DRAWDOWN: float = 20.0
    MIN_PROFIT_FACTOR: float = 1.8
    
    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Arc L1 Blockchain
    ARC_RPC_URL: str = "https://rpc.testnet.arc.network"
    ARC_CHAIN_ID: int = 5042002
    
    # API Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30
    WS_MESSAGE_QUEUE_SIZE: int = 1000
    
    # Market Data
    MARKET_DATA_BUFFER_SIZE: int = 10000
    MARKET_DATA_RETENTION_DAYS: int = 90
    
    # Probability Engine
    MONTE_CARLO_SIMULATIONS: int = 10000
    CONFIDENCE_LEVELS: list = [0.50, 0.75, 0.95]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


# Global settings instance
settings = Settings()
