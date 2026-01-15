"""
Database session configuration for async SQLAlchemy.

Provides:
- Async engine with connection pooling (PostgreSQL)
- AsyncSession factory
- FastAPI dependency for database sessions
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Determine if we're using SQLite (for local dev) or PostgreSQL
is_sqlite = "sqlite" in str(settings.database_url)

# Create async engine with appropriate configuration
if is_sqlite:
    # SQLite: No connection pooling, use NullPool
    engine = create_async_engine(
        str(settings.database_url),
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=NullPool,
    )
else:
    # PostgreSQL: Use connection pooling
    engine = create_async_engine(
        str(settings.database_url),
        echo=False,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=3600,  # Recycle connections after 1 hour
    )

# Create async session maker
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session.

    Usage:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...

    The session is automatically closed after the request completes.
    Commits must be done explicitly in the route handler.
    """
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
