"""
Client model - Business customer account.
"""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import BaseModel

if TYPE_CHECKING:
    from app.db.models.configuration import Configuration
    from app.db.models.product import Product


class Client(BaseModel):
    """
    Business customer account.

    Attributes:
        id: UUID primary key
        name: Business name
        enabled: Whether the client is enabled
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "clients"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")

    # Relationships
    products: Mapped[list["Product"]] = relationship(
        "Product",
        back_populates="client",
        cascade="all, delete-orphan",
    )
    configurations: Mapped[list["Configuration"]] = relationship(
        "Configuration",
        back_populates="client",
        cascade="all, delete-orphan",
    )
