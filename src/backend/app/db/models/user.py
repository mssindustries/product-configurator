"""
User model - Individual user within a client.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import Base, UUIDMixin

if TYPE_CHECKING:
    from app.db.models.client import Client
    from app.db.models.configuration import Configuration


class User(UUIDMixin, Base):
    """
    Individual user within a client organization.

    Attributes:
        id: UUID primary key
        client_id: Foreign key to Client
        email: User email
        name: Display name
        role: User role (e.g., "admin", "user")
        created_at: Creation timestamp
    """

    __tablename__ = "users"

    client_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="user")
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.now(),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    client: Mapped["Client"] = relationship("Client", back_populates="users")
    configurations: Mapped[list["Configuration"]] = relationship(
        "Configuration",
        back_populates="user",
        cascade="all, delete-orphan",
    )
