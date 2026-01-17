"""
Pydantic schemas for Product entity.
"""

from datetime import datetime
from typing import Any

from pydantic import Field

from app.schemas.base import BaseSchema


class ProductBase(BaseSchema):
    """Base product schema with shared fields."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    template_blob_path: str = Field(..., max_length=500)
    template_version: str = Field(default="1.0.0", max_length=50)
    config_schema: dict[str, Any] = Field(
        ...,
        description="JSON Schema defining valid configuration options",
    )


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
    template_blob_path: str | None = Field(default=None, max_length=500)
    template_version: str | None = Field(default=None, max_length=50)
    config_schema: dict[str, Any] | None = Field(default=None)


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
