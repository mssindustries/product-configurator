"""
Pydantic schemas for API request/response serialization.

All schemas are exported from this module for convenient imports:
    from app.schemas import ProductCreate, ProductResponse
"""

from app.schemas.base import (
    BaseSchema,
    ErrorDetail,
    ErrorResponse,
    ListResponse,
    MessageResponse,
    PaginatedResponse,
    TimestampSchema,
)
from app.schemas.client import (
    ClientCreate,
    ClientResponse,
)
from app.schemas.configuration import (
    ConfigurationCreate,
    ConfigurationResponse,
    ConfigurationUpdate,
)
from app.schemas.job import (
    JobCreate,
    JobResponse,
    JobStatusResponse,
)
from app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)

__all__ = [
    # Base
    "BaseSchema",
    "ErrorDetail",
    "ErrorResponse",
    "ListResponse",
    "MessageResponse",
    "PaginatedResponse",
    "TimestampSchema",
    # Client
    "ClientCreate",
    "ClientResponse",
    # Product
    "ProductCreate",
    "ProductResponse",
    "ProductUpdate",
    # Configuration
    "ConfigurationCreate",
    "ConfigurationResponse",
    "ConfigurationUpdate",
    # Job
    "JobCreate",
    "JobResponse",
    "JobStatusResponse",
]
