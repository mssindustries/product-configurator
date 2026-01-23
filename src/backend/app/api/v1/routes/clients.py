"""
Clients API endpoints.

Provides operations for managing clients:
- GET /api/v1/clients - List all clients
- POST /api/v1/clients - Create new client
- PATCH /api/v1/clients/{client_id}/toggle-status - Toggle client enabled status
"""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.api.deps import DbSession
from app.db.models import Client
from app.schemas.client import ClientCreate, ClientListResponse, ClientResponse

router = APIRouter()


@router.get("", response_model=ClientListResponse)
async def list_clients(
    db: DbSession,
) -> ClientListResponse:
    """
    List all clients.

    Returns:
        ClientListResponse with items and total count.
    """
    # Get total count
    count_stmt = select(func.count()).select_from(Client)
    count_result = await db.execute(count_stmt)
    total = count_result.scalar_one()

    # Get all clients
    stmt = select(Client).order_by(Client.name)
    result = await db.execute(stmt)
    clients = result.scalars().all()

    # Convert to response schemas
    items = [
        ClientResponse(
            id=str(client.id),
            name=client.name,
            enabled=client.enabled,
            created_at=client.created_at,
            updated_at=client.updated_at,
        )
        for client in clients
    ]

    return ClientListResponse(items=items, total=total)


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
        HTTPException 409: Client with this name already exists.
        HTTPException 422: Validation error (handled by FastAPI).
    """
    # Check for duplicate name
    stmt = select(Client).where(Client.name == client_data.name)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Client with name '{client_data.name}' already exists",
        )

    # Create new client instance
    client = Client(name=client_data.name)

    db.add(client)
    await db.commit()
    await db.refresh(client)

    return ClientResponse(
        id=str(client.id),
        name=client.name,
        enabled=client.enabled,
        created_at=client.created_at,
        updated_at=client.updated_at,
    )


@router.patch("/{client_id}/toggle-status", response_model=ClientResponse)
async def toggle_client_status(
    client_id: str,
    db: DbSession,
) -> ClientResponse:
    """
    Toggle client enabled status.

    Args:
        client_id: The UUID of the client to toggle

    Returns:
        ClientResponse with the updated client details.

    Raises:
        HTTPException 404: Client not found.
    """
    # Fetch the client
    stmt = select(Client).where(Client.id == client_id)
    result = await db.execute(stmt)
    client = result.scalar_one_or_none()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client with id '{client_id}' not found",
        )

    # Toggle the enabled status
    client.enabled = not client.enabled

    await db.commit()
    await db.refresh(client)

    return ClientResponse(
        id=str(client.id),
        name=client.name,
        enabled=client.enabled,
        created_at=client.created_at,
        updated_at=client.updated_at,
    )
