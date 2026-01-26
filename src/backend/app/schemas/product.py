"""
Pydantic schemas for Product entity.
"""

from datetime import datetime

from pydantic import Field

from app.schemas.base import BaseSchema


class ProductBase(BaseSchema):
    """Base product schema with shared fields."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)


class ProductCreate(ProductBase):
    """Schema for creating a new product.

    NOTE: client_id is required until authentication is implemented.
    After auth is added, client_id will be inferred from the authenticated user.
    """

    client_id: str = Field(..., description="Client ID (required until auth is implemented)")


class ProductUpdate(BaseSchema):
    """Schema for updating a product (all fields optional)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)


class ProductResponse(ProductBase):
    """Schema for product response."""

    id: str
    client_id: str
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseSchema):
    """Schema for listing products."""

    items: list[ProductResponse]
    total: int
