"""
Pydantic schemas for Client entity.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import Field

from app.schemas.base import BaseSchema

if TYPE_CHECKING:
    from app.db.models import Client


class ClientBase(BaseSchema):
    """Base client schema with shared fields."""

    name: str = Field(..., min_length=1, max_length=255)


class ClientCreate(ClientBase):
    """Schema for creating a new client."""

    pass


class ClientResponse(ClientBase):
    """Schema for client response."""

    id: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, client: "Client") -> "ClientResponse":
        """Create response from ORM model."""
        return cls(
            id=str(client.id),
            name=client.name,
            created_at=client.created_at,
            updated_at=client.updated_at,
        )

    @classmethod
    def from_models(cls, clients: list["Client"]) -> list["ClientResponse"]:
        """Create responses from list of ORM models."""
        return [cls.from_model(c) for c in clients]


class ClientListResponse(BaseSchema):
    """Schema for listing clients."""

    items: list[ClientResponse]
    total: int
