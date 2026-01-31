"""
Product model - Customizable product template.
"""

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import BaseModel

if TYPE_CHECKING:
    from app.db.models.client import Client
    from app.db.models.product_customization import ProductCustomization
    from app.db.models.style import Style


class Product(BaseModel):
    """
    Customizable product template.

    Products are containers for Styles. Each Style has its own Blender template
    and customization schema. ProductCustomizations are created against specific Styles.

    Attributes:
        id: UUID primary key
        client_id: Foreign key to Client
        name: Product name
        description: Product description
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

    # Relationships
    client: Mapped["Client"] = relationship("Client", back_populates="products")
    product_customizations: Mapped[list["ProductCustomization"]] = relationship(
        "ProductCustomization",
        back_populates="product",
        cascade="all, delete-orphan",
    )
    styles: Mapped[list["Style"]] = relationship(
        "Style",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="Style.display_order",
    )

    @property
    def default_style(self) -> "Style | None":
        """Return the default style for this product, if any."""
        return next((s for s in self.styles if s.is_default), None)
