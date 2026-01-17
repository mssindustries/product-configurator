"""
Pydantic schemas for Configuration entity.
"""

from datetime import datetime
from typing import Any

from pydantic import Field

from app.schemas.base import BaseSchema


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
    client_id: str = Field(..., description="Client ID (required until auth is implemented)")


class ConfigurationUpdate(BaseSchema):
    """Schema for updating a configuration (all fields optional)."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    config_data: dict[str, Any] | None = Field(default=None)


class ConfigurationResponse(ConfigurationBase):
    """Schema for configuration response."""

    id: str
    product_id: str
    client_id: str
    product_schema_version: str
    created_at: datetime
    updated_at: datetime


class ConfigurationListResponse(BaseSchema):
    """Schema for listing configurations."""

    items: list[ConfigurationResponse]
    total: int
