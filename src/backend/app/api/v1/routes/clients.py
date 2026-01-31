"""
Clients API endpoints.

Provides operations for managing clients:
- GET /api/v1/clients - List all clients
- POST /api/v1/clients - Create new client
"""

from uuid import UUID

from fastapi import APIRouter, status
from sqlalchemy import func, select

from app.api.deps import DbSession
from app.db.models import Client
from app.repositories.client import ClientRepository
from app.schemas import ListResponse
from app.schemas.client import ClientCreate, ClientResponse, ClientUpdate

router = APIRouter()


@router.get("", response_model=ListResponse[ClientResponse])
async def list_clients(
    db: DbSession,
) -> ListResponse[ClientResponse]:
    """
    List all clients.

    Returns:
        ListResponse with items and total count.
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
    items = ClientResponse.from_models(clients)

    return ListResponse(items=items, total=total)


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
        EntityAlreadyExistsError: Client with this name already exists (handled as 409).
        HTTPException 422: Validation error (handled by FastAPI).
    """
    # Check for duplicate name
    repo = ClientRepository(db)
    await repo.ensure_unique("name", client_data.name)

    # Create new client instance
    client = Client(name=client_data.name)

    db.add(client)
    await db.commit()
    await db.refresh(client)

    return ClientResponse.from_model(client)


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: UUID,
    client_data: ClientUpdate,
    db: DbSession,
) -> ClientResponse:
    """
    Update an existing client.

    Only fields provided in the request body will be updated.
    Fields not included (or set to null) remain unchanged.

    Args:
        client_id: UUID of the client to update
        client_data: Partial client data to update

    Returns:
        ClientResponse with the updated client details.

    Raises:
        EntityNotFoundError: Client not found (returns 404).
        EntityAlreadyExistsError: Client with this name already exists (returns 409).
        HTTPException 422: Validation error (handled by FastAPI).
    """
    repo = ClientRepository(db)
    client = await repo.ensure_exists(client_id)

    # Get update data, excluding unset fields
    update_data = client_data.model_dump(exclude_unset=True)

    # Check for duplicate name if name is being updated
    if "name" in update_data and update_data["name"] != client.name:
        await repo.ensure_unique("name", update_data["name"], exclude_id=client_id)

    # Update only fields that are provided
    for field, value in update_data.items():
        setattr(client, field, value)

    await db.commit()
    await db.refresh(client)

    return ClientResponse.from_model(client)
