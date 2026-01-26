"""
Pydantic schemas for Product entity.
"""

from collections.abc import Sequence
from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import Field

from app.schemas.base import BaseSchema

if TYPE_CHECKING:
    from app.db.models import Product


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

    @classmethod
    def from_model(cls, product: "Product") -> "ProductResponse":
        """Create response from ORM model."""
        return cls(
            id=str(product.id),
            client_id=str(product.client_id),
            name=product.name,
            description=product.description,
            created_at=product.created_at,
            updated_at=product.updated_at,
        )

    @classmethod
    def from_models(cls, products: Sequence["Product"]) -> list["ProductResponse"]:
        """Create responses from sequence of ORM models."""
        return [cls.from_model(p) for p in products]


class ProductListResponse(BaseSchema):
    """Schema for listing products."""

    items: list[ProductResponse]
    total: int
