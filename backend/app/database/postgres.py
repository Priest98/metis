"""Database connection and session management"""

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Create async engine
# Fall back to a local SQLite file when DATABASE_URL is not configured so the
# app always boots (e.g. local dev, tests, preview deploys). Production must
# still set DATABASE_URL to a Postgres instance.
if not settings.DATABASE_URL:
    logger.warning(
        "DATABASE_URL is not set; falling back to local SQLite (./metis.db). "
        "This is not suitable for production."
    )
    db_url = "sqlite:///./metis.db"
else:
    db_url = settings.DATABASE_URL
async_engine_kwargs = {
    "echo": settings.DB_ECHO,
}
sync_engine_kwargs = {
    "echo": settings.DB_ECHO,
}

if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
    async_engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 20,
        "max_overflow": 40,
    })
    sync_engine_kwargs.update({
        "pool_pre_ping": True,
    })
elif db_url.startswith("sqlite://"):
    db_url = db_url.replace("sqlite://", "sqlite+aiosqlite://")
    from sqlalchemy.pool import StaticPool
    async_engine_kwargs.update({
        "poolclass": StaticPool,
        "connect_args": {"check_same_thread": False}
    })
    sync_engine_kwargs.update({
        "connect_args": {"check_same_thread": False}
    })

engine = create_async_engine(
    db_url,
    **async_engine_kwargs
)

# Create sync engine (for migrations and initial setup).
# Derive a sync URL from the resolved db_url (strip async driver suffixes).
_sync_url = db_url
for _async, _sync in (
    ("postgresql+asyncpg://", "postgresql://"),
    ("sqlite+aiosqlite://", "sqlite://"),
    ("mysql+aiomysql://", "mysql+pymysql://"),
):
    if _sync_url.startswith(_async):
        _sync_url = _sync_url.replace(_async, _sync)
        break

sync_engine = create_engine(
    _sync_url,
    **sync_engine_kwargs
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Create sync session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine,
)

# Base class for models
from app.database import Base


async def get_db() -> AsyncSession:
    """
    Dependency for getting async database sessions.
    
    Usage:
        @app.get("/endpoint")
        async def endpoint(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database - create all tables.

    NOTE: We import app.models here (not at module top-level) so that every
    model is registered against Base.metadata before create_all runs. Importing
    app.models triggers its `from app.database import Base` reference, which is
    already defined by the time this function executes, so this avoids the
    circular-import problem while guaranteeing tables exist.
    """
    import app.models  # noqa: F401  — registers all models with Base.metadata
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully")


async def close_db():
    """Close database connections"""
    await engine.dispose()
    logger.info("Database connections closed")
