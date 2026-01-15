"""
Client model - Business customer account.
"""

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import BaseModel

if TYPE_CHECKING:
    from app.db.models.api_key import ApiKey
    from app.db.models.product import Product
    from app.db.models.user import User


class Client(BaseModel):
    """
    Business customer account.

    Attributes:
        id: UUID primary key
        name: Business name
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "clients"

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    api_keys: Mapped[list["ApiKey"]] = relationship(
        "ApiKey",
        back_populates="client",
        cascade="all, delete-orphan",
    )
    users: Mapped[list["User"]] = relationship(
        "User",
        back_populates="client",
        cascade="all, delete-orphan",
    )
    products: Mapped[list["Product"]] = relationship(
        "Product",
        back_populates="client",
        cascade="all, delete-orphan",
    )
