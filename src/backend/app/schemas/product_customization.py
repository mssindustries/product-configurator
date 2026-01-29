"""
Pydantic schemas for ProductCustomization entity.
"""

from collections.abc import Sequence
from datetime import datetime
from typing import TYPE_CHECKING, Any

from pydantic import Field

from app.schemas.base import BaseSchema

if TYPE_CHECKING:
    from app.db.models import ProductCustomization


class ProductCustomizationBase(BaseSchema):
    """Base product customization schema with shared fields."""

    name: str = Field(..., min_length=1, max_length=255)
    config_data: dict[str, Any] = Field(
        ...,
        description="Customization values (validated against product schema)",
    )


class ProductCustomizationCreate(ProductCustomizationBase):
    """Schema for creating a new product customization.

    NOTE: client_id is required until authentication is implemented.
    After auth is added, client_id will be inferred from the authenticated user.
    """

    product_id: str = Field(..., description="ID of the product to customize")
    style_id: str = Field(..., description="ID of the style to customize")
    client_id: str = Field(..., description="Client ID (required until auth is implemented)")


class ProductCustomizationUpdate(BaseSchema):
    """Schema for updating a product customization (all fields optional)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    config_data: dict[str, Any] | None = Field(default=None)


class ProductCustomizationResponse(ProductCustomizationBase):
    """Schema for product customization response."""

    id: str
    product_id: str
    style_id: str
    client_id: str
    product_schema_version: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, product_customization: "ProductCustomization") -> "ProductCustomizationResponse":
        """Create response from ORM model."""
        return cls(
            id=str(product_customization.id),
            product_id=str(product_customization.product_id),
            style_id=str(product_customization.style_id),
            client_id=str(product_customization.client_id),
            name=product_customization.name,
            config_data=product_customization.config_data,
            product_schema_version=product_customization.product_schema_version,
            created_at=product_customization.created_at,
            updated_at=product_customization.updated_at,
        )

    @classmethod
    def from_models(cls, product_customizations: Sequence["ProductCustomization"]) -> list["ProductCustomizationResponse"]:
        """Create responses from sequence of ORM models."""
        return [cls.from_model(pc) for pc in product_customizations]
