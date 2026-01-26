"""
Configuration model - Saved product configuration.
"""

from typing import TYPE_CHECKING, Any

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import BaseModel

if TYPE_CHECKING:
    from app.db.models.client import Client
    from app.db.models.job import Job
    from app.db.models.product import Product
    from app.db.models.style import Style


class Configuration(BaseModel):
    """
    Saved product configuration.

    Attributes:
        id: UUID primary key
        product_id: Foreign key to Product
        client_id: Foreign key to Client
        name: Configuration name
        config_data: JSON configuration values (validated against product schema)
        product_schema_version: Schema version at time of creation
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "configurations"

    product_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    style_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("styles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    client_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("clients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    config_data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    product_schema_version: Mapped[str] = mapped_column(String(50), nullable=False)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="configurations")
    style: Mapped["Style"] = relationship("Style", back_populates="configurations")
    client: Mapped["Client"] = relationship("Client", back_populates="configurations")
    jobs: Mapped[list["Job"]] = relationship(
        "Job",
        back_populates="configuration",
        cascade="all, delete-orphan",
    )
