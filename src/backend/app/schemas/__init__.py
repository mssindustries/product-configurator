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
from app.schemas.product_customization import (
    ProductCustomizationCreate,
    ProductCustomizationResponse,
    ProductCustomizationUpdate,
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
    # Job
    "JobCreate",
    "JobResponse",
    "JobStatusResponse",
    # Product
    "ProductCreate",
    "ProductResponse",
    "ProductUpdate",
    # ProductCustomization
    "ProductCustomizationCreate",
    "ProductCustomizationResponse",
    "ProductCustomizationUpdate",
]
