"""
SQLAlchemy models for the MSS Industries Product Configurator.

All models are exported from this module for convenient imports:
    from app.db.models import Client, Product, Configuration, Job
"""

from app.db.models.base import Base, BaseModel, TimestampMixin, UUIDMixin
from app.db.models.client import Client
from app.db.models.configuration import Configuration
from app.db.models.job import Job, JobStatus
from app.db.models.product import Product
from app.db.models.user import User

__all__ = [
    # Base classes
    "Base",
    "BaseModel",
    "TimestampMixin",
    "UUIDMixin",
    # Models
    "Client",
    "Configuration",
    "Job",
    "Product",
    "User",
    # Enums
    "JobStatus",
]
