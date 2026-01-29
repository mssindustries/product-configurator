"""
Pytest configuration and shared fixtures.

Provides:
- SQLite in-memory database for fast, isolated tests
- Async database session fixture
- Async HTTP client fixture with dependency overrides
- Shared product test fixtures
"""

import uuid

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


# Shared product test fixtures


@pytest.fixture
def client_id() -> str:
    """Generate a client ID for tests."""
    return str(uuid.uuid4())


@pytest.fixture
def sample_product_data(client_id: str) -> dict:
    """Standard product data for tests.

    NOTE: Uses a random UUID for client_id. Foreign key constraints are not
    enforced in SQLite, so this client_id does not need to exist in the database.
    """
    return {
        "client_id": client_id,
        "name": "Test Cabinet",
        "description": "A test cabinet product",
    }


@pytest.fixture
async def created_product(client: AsyncClient, sample_product_data: dict) -> dict:
    """Create a product and return its data."""
    response = await client.post("/api/v1/products", json=sample_product_data)
    assert response.status_code == 201
    return response.json()
