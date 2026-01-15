"""
Product model - Configurable product template.
"""

from typing import TYPE_CHECKING, Any

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import BaseModel

if TYPE_CHECKING:
    from app.db.models.client import Client
    from app.db.models.configuration import Configuration


class Product(BaseModel):
    """
    Configurable product template.

    Attributes:
        id: UUID primary key
        client_id: Foreign key to Client
        name: Product name
        description: Product description
        template_blob_path: Reference to Blender template in Blob Storage
        template_version: Version string for cache invalidation
        config_schema: JSON Schema defining valid configuration options
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "products"

    client_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    template_blob_path: Mapped[str] = mapped_column(String(500), nullable=False)
    template_version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.0.0")
    config_schema: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    # Relationships
    client: Mapped["Client"] = relationship("Client", back_populates="products")
    configurations: Mapped[list["Configuration"]] = relationship(
        "Configuration",
        back_populates="product",
        cascade="all, delete-orphan",
    )
