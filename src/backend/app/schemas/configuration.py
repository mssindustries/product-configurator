"""
Pydantic schemas for Configuration entity.
"""

from collections.abc import Sequence
from datetime import datetime
from typing import TYPE_CHECKING, Any

from pydantic import Field

from app.schemas.base import BaseSchema

if TYPE_CHECKING:
    from app.db.models import Configuration


class ConfigurationBase(BaseSchema):
    """Base configuration schema with shared fields."""

    name: str = Field(..., min_length=1, max_length=255)
    config_data: dict[str, Any] = Field(
        ...,
        description="Configuration values (validated against product schema)",
    )


class ConfigurationCreate(ConfigurationBase):
    """Schema for creating a new configuration.

    NOTE: client_id is required until authentication is implemented.
    After auth is added, client_id will be inferred from the authenticated user.
    """

    product_id: str = Field(..., description="ID of the product to configure")
    style_id: str = Field(..., description="ID of the style to configure")
    client_id: str = Field(..., description="Client ID (required until auth is implemented)")


class ConfigurationUpdate(BaseSchema):
    """Schema for updating a configuration (all fields optional)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    config_data: dict[str, Any] | None = Field(default=None)


class ConfigurationResponse(ConfigurationBase):
    """Schema for configuration response."""

    id: str
    product_id: str
    style_id: str
    client_id: str
    product_schema_version: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, config: "Configuration") -> "ConfigurationResponse":
        """Create response from ORM model."""
        return cls(
            id=str(config.id),
            product_id=str(config.product_id),
            style_id=str(config.style_id),
            client_id=str(config.client_id),
            name=config.name,
            config_data=config.config_data,
            product_schema_version=config.product_schema_version,
            created_at=config.created_at,
            updated_at=config.updated_at,
        )

    @classmethod
    def from_models(cls, configs: Sequence["Configuration"]) -> list["ConfigurationResponse"]:
        """Create responses from sequence of ORM models."""
        return [cls.from_model(c) for c in configs]
