"""
Pydantic schemas for API request/response serialization.

All schemas are exported from this module for convenient imports:
    from app.schemas import ProductCreate, ProductResponse
"""

from app.schemas.base import (
    BaseSchema,
    ErrorDetail,
    ErrorResponse,
    MessageResponse,
    PaginatedResponse,
    TimestampSchema,
)
from app.schemas.configuration import (
    ConfigurationCreate,
    ConfigurationListResponse,
    ConfigurationResponse,
    ConfigurationUpdate,
)
from app.schemas.job import (
    JobCreate,
    JobListResponse,
    JobResponse,
    JobStatusResponse,
)
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
)

__all__ = [
    # Base
    "BaseSchema",
    "ErrorDetail",
    "ErrorResponse",
    "MessageResponse",
    "PaginatedResponse",
    "TimestampSchema",
    # Product
    "ProductCreate",
    "ProductListResponse",
    "ProductResponse",
    "ProductUpdate",
    # Configuration
    "ConfigurationCreate",
    "ConfigurationListResponse",
    "ConfigurationResponse",
    "ConfigurationUpdate",
    # Job
    "JobCreate",
    "JobListResponse",
    "JobResponse",
    "JobStatusResponse",
]
