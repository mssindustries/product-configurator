"""
Database session configuration for async SQLAlchemy.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# Create async engine
# For SQLite, we use simpler configuration without connection pooling
engine = create_async_engine(
    str(settings.database_url),
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in str(settings.database_url) else {},
)

# Create async session maker
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)
