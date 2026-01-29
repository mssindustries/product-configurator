"""
SQLAlchemy models for the MSS Industries Product Customizer.

All models are exported from this module for convenient imports:
    from app.db.models import Client, Product, Style, ProductCustomization, Job
"""

from app.db.models.base import Base, BaseModel, TimestampMixin, UUIDMixin
from app.db.models.client import Client
from app.db.models.job import Job, JobStatus
from app.db.models.product import Product
from app.db.models.product_customization import ProductCustomization
from app.db.models.style import Style

__all__ = [
    # Base classes
    "Base",
    "BaseModel",
    "TimestampMixin",
    "UUIDMixin",
    # Models
    "Client",
    "Job",
    "Product",
    "ProductCustomization",
    "Style",
    # Enums
    "JobStatus",
]
