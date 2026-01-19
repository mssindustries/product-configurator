# Core Client Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement CRUD operations for managing client accounts (create, read, update, disable).

**Architecture:** Add `is_disabled` field to existing Client model. Create Pydantic schemas for request/response validation. Implement RESTful API endpoints following existing patterns in products.py. Full test coverage using pytest-asyncio.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 (async), Pydantic V2, pytest-asyncio

**Related Issues:** #75 (Feature), #76 (Create), #77 (Edit), #78 (Disable)

---

## Task 1: Update Client Model

**Files:**
- Modify: `src/backend/app/db/models/client.py`

**Step 1: Add is_disabled field to Client model**

```python
"""
Client model - Business customer account.
"""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import BaseModel

if TYPE_CHECKING:
    from app.db.models.configuration import Configuration
    from app.db.models.product import Product


class Client(BaseModel):
    """
    Business customer account.

    Attributes:
        id: UUID primary key
        name: Business name
        is_disabled: Whether client login is disabled
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "clients"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_disabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    products: Mapped[list["Product"]] = relationship(
        "Product",
        back_populates="client",
        cascade="all, delete-orphan",
    )
    configurations: Mapped[list["Configuration"]] = relationship(
        "Configuration",
        back_populates="client",
        cascade="all, delete-orphan",
    )
```

**Step 2: Verify the model compiles**

Run: `cd src/backend && python -c "from app.db.models import Client; print('OK')"`
Expected: `OK`

**Step 3: Commit**

```bash
git add src/backend/app/db/models/client.py
git commit -m "feat(client): add is_disabled field to Client model"
```

---

## Task 2: Create Client Schemas

**Files:**
- Create: `src/backend/app/schemas/client.py`
- Modify: `src/backend/app/schemas/__init__.py`

**Step 1: Create client schemas file**

```python
"""
Pydantic schemas for Client entity.
"""

from datetime import datetime

from pydantic import Field

from app.schemas.base import BaseSchema


class ClientBase(BaseSchema):
    """Base client schema with shared fields."""

    name: str = Field(..., min_length=1, max_length=255)


class ClientCreate(ClientBase):
    """Schema for creating a new client."""

    pass


class ClientUpdate(BaseSchema):
    """Schema for updating a client (all fields optional)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    is_disabled: bool | None = Field(default=None)


class ClientResponse(ClientBase):
    """Schema for client response."""

    id: str
    is_disabled: bool
    created_at: datetime
    updated_at: datetime


class ClientListResponse(BaseSchema):
    """Schema for listing clients."""

    items: list[ClientResponse]
    total: int
```

**Step 2: Export schemas from __init__.py**

Add to `src/backend/app/schemas/__init__.py`:

```python
from app.schemas.client import (
    ClientCreate,
    ClientListResponse,
    ClientResponse,
    ClientUpdate,
)
```

**Step 3: Verify schemas compile**

Run: `cd src/backend && python -c "from app.schemas.client import ClientCreate, ClientResponse; print('OK')"`
Expected: `OK`

**Step 4: Commit**

```bash
git add src/backend/app/schemas/client.py src/backend/app/schemas/__init__.py
git commit -m "feat(client): add Client Pydantic schemas"
```

---

## Task 3: Write Client API Tests (RED)

**Files:**
- Create: `src/backend/tests/api/test_clients.py`

**Step 1: Create test file with all test cases**

```python
"""
Tests for Clients API endpoints.
"""

import uuid

import pytest
from httpx import AsyncClient


@pytest.fixture
def sample_client_data():
    """Sample client data for tests."""
    return {
        "name": "Test Company",
    }


async def test_list_clients_empty(client: AsyncClient):
    """Returns empty list when no clients exist."""
    response = await client.get("/api/v1/clients")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


async def test_list_clients_with_data(client: AsyncClient, sample_client_data: dict):
    """Returns clients after creation."""
    await client.post("/api/v1/clients", json=sample_client_data)

    response = await client.get("/api/v1/clients")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == sample_client_data["name"]
    assert data["items"][0]["is_disabled"] is False


async def test_get_client_not_found(client: AsyncClient):
    """Returns 404 for missing client."""
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/clients/{fake_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


async def test_get_client_success(client: AsyncClient, sample_client_data: dict):
    """Returns client by ID."""
    create_response = await client.post("/api/v1/clients", json=sample_client_data)
    client_id = create_response.json()["id"]

    response = await client.get(f"/api/v1/clients/{client_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == client_id
    assert data["name"] == sample_client_data["name"]
    assert data["is_disabled"] is False


async def test_create_client_success(client: AsyncClient, sample_client_data: dict):
    """Creates and returns client."""
    response = await client.post("/api/v1/clients", json=sample_client_data)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == sample_client_data["name"]
    assert data["is_disabled"] is False
    assert "created_at" in data
    assert "updated_at" in data


async def test_create_client_validation_error(client: AsyncClient):
    """Returns 422 for invalid data."""
    invalid_data = {
        "name": "",  # Empty name should fail min_length=1
    }
    response = await client.post("/api/v1/clients", json=invalid_data)
    assert response.status_code == 422


async def test_update_client_success(client: AsyncClient, sample_client_data: dict):
    """Updates client name."""
    create_response = await client.post("/api/v1/clients", json=sample_client_data)
    client_id = create_response.json()["id"]

    update_data = {"name": "Updated Company"}
    response = await client.put(f"/api/v1/clients/{client_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Company"


async def test_update_client_not_found(client: AsyncClient):
    """Returns 404 when updating non-existent client."""
    fake_id = str(uuid.uuid4())
    update_data = {"name": "Updated Company"}
    response = await client.put(f"/api/v1/clients/{fake_id}", json=update_data)
    assert response.status_code == 404


async def test_disable_client(client: AsyncClient, sample_client_data: dict):
    """Disables a client."""
    create_response = await client.post("/api/v1/clients", json=sample_client_data)
    client_id = create_response.json()["id"]

    update_data = {"is_disabled": True}
    response = await client.put(f"/api/v1/clients/{client_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["is_disabled"] is True


async def test_enable_client(client: AsyncClient, sample_client_data: dict):
    """Re-enables a disabled client."""
    # Create and disable
    create_response = await client.post("/api/v1/clients", json=sample_client_data)
    client_id = create_response.json()["id"]
    await client.put(f"/api/v1/clients/{client_id}", json={"is_disabled": True})

    # Re-enable
    response = await client.put(f"/api/v1/clients/{client_id}", json={"is_disabled": False})
    assert response.status_code == 200
    data = response.json()
    assert data["is_disabled"] is False


async def test_delete_client_success(client: AsyncClient, sample_client_data: dict):
    """Deletes a client."""
    create_response = await client.post("/api/v1/clients", json=sample_client_data)
    client_id = create_response.json()["id"]

    response = await client.delete(f"/api/v1/clients/{client_id}")
    assert response.status_code == 204

    # Verify deleted
    get_response = await client.get(f"/api/v1/clients/{client_id}")
    assert get_response.status_code == 404


async def test_delete_client_not_found(client: AsyncClient):
    """Returns 404 when deleting non-existent client."""
    fake_id = str(uuid.uuid4())
    response = await client.delete(f"/api/v1/clients/{fake_id}")
    assert response.status_code == 404


async def test_list_clients_pagination(client: AsyncClient, sample_client_data: dict):
    """Pagination works correctly."""
    # Create 3 clients
    for i in range(3):
        data = sample_client_data.copy()
        data["name"] = f"Company {i}"
        await client.post("/api/v1/clients", json=data)

    # Test limit
    response = await client.get("/api/v1/clients?limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 3

    # Test skip
    response = await client.get("/api/v1/clients?skip=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["total"] == 3
```

**Step 2: Run tests to verify they fail (RED)**

Run: `cd src/backend && make test`
Expected: FAIL - tests fail because `/api/v1/clients` endpoint doesn't exist yet

**Step 3: Commit**

```bash
git add src/backend/tests/api/test_clients.py
git commit -m "test(client): add Client API tests (RED)"
```

---

## Task 4: Implement Client API Endpoints (GREEN)

**Files:**
- Create: `src/backend/app/api/v1/routes/clients.py`
- Modify: `src/backend/app/api/v1/router.py`

**Step 1: Create clients route file**

```python
"""
Clients API endpoints.

Provides CRUD operations for client accounts:
- GET /api/v1/clients - List all clients
- GET /api/v1/clients/{id} - Get client details
- POST /api/v1/clients - Create new client
- PUT /api/v1/clients/{id} - Update client
- DELETE /api/v1/clients/{id} - Delete client

NOTE: Authentication is not yet implemented. These endpoints are currently
public. When authentication is added, these will be admin-only endpoints.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Response, status
from sqlalchemy import func, select

from app.api.deps import DbSession
from app.db.models import Client
from app.schemas.client import (
    ClientCreate,
    ClientListResponse,
    ClientResponse,
    ClientUpdate,
)

router = APIRouter()


@router.get("", response_model=ClientListResponse)
async def list_clients(
    db: DbSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ClientListResponse:
    """
    List all clients.

    Query parameters:
    - skip: Number of clients to skip (for pagination)
    - limit: Maximum number of clients to return (1-100)

    Returns:
        ClientListResponse with items and total count.
    """
    # Get total count
    count_stmt = select(func.count()).select_from(Client)
    count_result = await db.execute(count_stmt)
    total = count_result.scalar_one()

    # Get paginated clients
    stmt = (
        select(Client)
        .order_by(Client.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    clients = result.scalars().all()

    # Convert to response schemas
    items = [
        ClientResponse(
            id=str(c.id),
            name=c.name,
            is_disabled=c.is_disabled,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for c in clients
    ]

    return ClientListResponse(items=items, total=total)


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: UUID,
    db: DbSession,
) -> ClientResponse:
    """
    Get a specific client by ID.

    Args:
        client_id: UUID of the client to retrieve

    Returns:
        ClientResponse with client details.

    Raises:
        HTTPException 404: Client not found.
    """
    stmt = select(Client).where(Client.id == str(client_id))
    result = await db.execute(stmt)
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client {client_id} not found",
        )

    return ClientResponse(
        id=str(client.id),
        name=client.name,
        is_disabled=client.is_disabled,
        created_at=client.created_at,
        updated_at=client.updated_at,
    )


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_data: ClientCreate,
    db: DbSession,
) -> ClientResponse:
    """
    Create a new client.

    Args:
        client_data: Client creation data (name)

    Returns:
        ClientResponse with the created client details.

    Raises:
        HTTPException 422: Validation error (handled by FastAPI).
    """
    client = Client(
        name=client_data.name,
    )

    db.add(client)
    await db.commit()
    await db.refresh(client)

    return ClientResponse(
        id=str(client.id),
        name=client.name,
        is_disabled=client.is_disabled,
        created_at=client.created_at,
        updated_at=client.updated_at,
    )


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: UUID,
    client_data: ClientUpdate,
    db: DbSession,
) -> ClientResponse:
    """
    Update a client.

    Args:
        client_id: UUID of the client to update
        client_data: Fields to update (all optional)

    Returns:
        ClientResponse with updated client details.

    Raises:
        HTTPException 404: Client not found.
    """
    stmt = select(Client).where(Client.id == str(client_id))
    result = await db.execute(stmt)
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client {client_id} not found",
        )

    # Update only provided fields
    update_data = client_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)

    await db.commit()
    await db.refresh(client)

    return ClientResponse(
        id=str(client.id),
        name=client.name,
        is_disabled=client.is_disabled,
        created_at=client.created_at,
        updated_at=client.updated_at,
    )


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: UUID,
    db: DbSession,
) -> Response:
    """
    Delete a client.

    Args:
        client_id: UUID of the client to delete

    Raises:
        HTTPException 404: Client not found.
    """
    stmt = select(Client).where(Client.id == str(client_id))
    result = await db.execute(stmt)
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client {client_id} not found",
        )

    await db.delete(client)
    await db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

**Step 2: Register routes in router.py**

Update `src/backend/app/api/v1/router.py`:

```python
"""
API v1 router aggregation.
"""

from fastapi import APIRouter

from app.api.v1.routes import clients, configurations, jobs, products

# Create v1 router
router = APIRouter(prefix="/api/v1")

# Include route modules
router.include_router(clients.router, prefix="/clients", tags=["clients"])
router.include_router(products.router, prefix="/products", tags=["products"])
router.include_router(
    configurations.router, prefix="/configurations", tags=["configurations"]
)
router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
```

**Step 3: Run tests to verify they pass (GREEN)**

Run: `cd src/backend && make test`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/backend/app/api/v1/routes/clients.py src/backend/app/api/v1/router.py
git commit -m "feat(client): implement Client API endpoints (GREEN)"
```

---

## Task 5: Final Verification

**Step 1: Run full test suite**

Run: `cd src/backend && make check`
Expected: All linting and tests pass

**Step 2: Run the server and test manually (optional)**

Run: `docker compose up -d && curl http://localhost:8000/api/v1/clients`
Expected: `{"items":[],"total":0}`

**Step 3: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: cleanup after Client API implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add is_disabled to Client model | `models/client.py` |
| 2 | Create Client schemas | `schemas/client.py`, `schemas/__init__.py` |
| 3 | Write tests (RED) | `tests/api/test_clients.py` |
| 4 | Implement endpoints (GREEN) | `routes/clients.py`, `router.py` |
| 5 | Final verification | - |

**Test commands:**
- `cd src/backend && make test` - Run tests
- `cd src/backend && make check` - Run lint + tests
