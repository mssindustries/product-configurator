"""
Pydantic schemas for Style entity.
"""

from datetime import datetime
from typing import Any

from jsonschema import Draft7Validator, SchemaError
from pydantic import Field, field_validator

from app.schemas.base import BaseSchema


class StyleBase(BaseSchema):
    """Base style schema with shared fields."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)


class StyleCreate(StyleBase):
    """Schema for creating a new style.

    Note: The file and customization_schema are handled via multipart/form-data,
    not JSON body. This schema is used for validation after form parsing.
    """

    customization_schema: dict[str, Any] = Field(
        ...,
        description="JSON Schema defining valid configuration options",
    )
    is_default: bool = Field(
        default=False,
        description="Set as default style for the product",
    )

    @field_validator("customization_schema")
    @classmethod
    def validate_json_schema(cls, v: dict[str, Any]) -> dict[str, Any]:
        """Validate that customization_schema is a valid JSON Schema."""
        try:
            Draft7Validator.check_schema(v)
        except SchemaError as e:
            msg = f"Invalid JSON Schema: {e.message}"
            raise ValueError(msg)
        return v


class StyleUpdate(BaseSchema):
    """Schema for updating a style (all fields optional).

    Note: The file is handled via multipart/form-data.
    """

    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    customization_schema: dict[str, Any] | None = Field(default=None)
    is_default: bool | None = Field(default=None)
    display_order: int | None = Field(default=None, ge=0)

    @field_validator("customization_schema")
    @classmethod
    def validate_json_schema(cls, v: dict[str, Any] | None) -> dict[str, Any] | None:
        """Validate that customization_schema is a valid JSON Schema (if provided)."""
        if v is None:
            return v
        try:
            Draft7Validator.check_schema(v)
        except SchemaError as e:
            msg = f"Invalid JSON Schema: {e.message}"
            raise ValueError(msg)
        return v


class StyleResponse(StyleBase):
    """Schema for style response."""

    id: str
    product_id: str
    template_blob_path: str
    customization_schema: dict[str, Any]
    default_glb_path: str | None
    is_default: bool
    display_order: int
    created_at: datetime
    updated_at: datetime


class StyleListResponse(BaseSchema):
    """Schema for listing styles."""

    items: list[StyleResponse]
    total: int
