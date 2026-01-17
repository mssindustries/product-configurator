"""
Pytest configuration and shared fixtures.

Provides:
- SQLite in-memory database for fast, isolated tests
- Async database session fixture
- Async HTTP client fixture with dependency overrides
"""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.db import get_db
from app.db.models import Base
from app.main import app

# SQLite in-memory for fast tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
def anyio_backend():
    """Configure anyio backend for pytest-asyncio."""
    return "asyncio"


@pytest.fixture
async def db_engine():
    """Create a test database engine with all tables."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def db_session(db_engine):
    """Create a database session for a test."""
    session_maker = async_sessionmaker(db_engine, expire_on_commit=False)
    async with session_maker() as session:
        yield session


@pytest.fixture
async def client(db_session):
    """Create an async HTTP client with database dependency override."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
    app.dependency_overrides.clear()
