"""
Pydantic schemas for Client entity.
"""

from datetime import datetime

from pydantic import Field

from app.schemas.base import BaseSchema


class ClientBase(BaseSchema):
    """Base client schema with shared fields."""

    name: str = Field(..., min_length=1, max_length=255)
    enabled: bool = True


class ClientCreate(ClientBase):
    """Schema for creating a new client."""

    pass


class ClientResponse(ClientBase):
    """Schema for client response."""

    id: str
    created_at: datetime
    updated_at: datetime


class ClientListResponse(BaseSchema):
    """Schema for listing clients."""

    items: list[ClientResponse]
    total: int
