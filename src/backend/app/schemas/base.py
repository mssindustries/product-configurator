"""
Base Pydantic schemas and shared utilities.

Provides:
- Base schema with ORM compatibility
- Pagination response schema
- Standard error response schema
"""

from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

# Type variable for generic pagination
T = TypeVar("T")


class BaseSchema(BaseModel):
    """Base schema with ORM compatibility."""

    model_config = ConfigDict(
        from_attributes=True,  # Allow creating from ORM models
        populate_by_name=True,  # Allow using field names or aliases
    )


class TimestampSchema(BaseSchema):
    """Schema with timestamp fields."""

    created_at: datetime
    updated_at: datetime


class ListResponse(BaseModel, Generic[T]):
    """Simple list response with items and total."""

    items: list[T]
    total: int

    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response schema."""

    items: list[T]
    total: int
    page: int
    page_size: int
    pages: int

    model_config = ConfigDict(from_attributes=True)


class ErrorDetail(BaseModel):
    """Detailed error information."""

    loc: list[str] | None = None
    msg: str
    type: str | None = None


class ErrorResponse(BaseModel):
    """Standard error response schema."""

    detail: str | list[ErrorDetail]
    code: str | None = None


class MessageResponse(BaseModel):
    """Simple message response."""

    message: str
