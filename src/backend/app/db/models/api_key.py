"""
ApiKey model - API authentication keys.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import Base, UUIDMixin

if TYPE_CHECKING:
    from app.db.models.client import Client


class ApiKey(UUIDMixin, Base):
    """
    API authentication key for a client.

    Supports key rotation with multiple active keys, expiration, and revocation.

    Attributes:
        id: UUID primary key
        client_id: Foreign key to Client
        key_hash: Hashed API key (argon2)
        name: Key identifier (e.g., "Production", "Development")
        expires_at: Optional expiration timestamp
        revoked_at: Revocation timestamp (null if active)
        last_used_at: Last usage timestamp
        created_at: Creation timestamp
    """

    __tablename__ = "api_keys"

    client_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    key_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    client: Mapped["Client"] = relationship("Client", back_populates="api_keys")

    @property
    def is_active(self) -> bool:
        """Check if the API key is currently active."""
        if self.revoked_at is not None:
            return False
        if self.expires_at is not None and self.expires_at < datetime.utcnow():
            return False
        return True
