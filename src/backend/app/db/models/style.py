"""
Style model - Product variant with template and customization schema.
"""

from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import BaseModel

if TYPE_CHECKING:
    from app.db.models.product import Product
    from app.db.models.product_customization import ProductCustomization


class Style(BaseModel):
    """
    Style variant of a Product.

    Each style represents a distinct variant of a product with its own
    Blender template file and customization schema. Products can have
    multiple styles (e.g., "Open Style", "Closed Style" for a range hood).

    Attributes:
        id: UUID primary key
        product_id: Foreign key to Product
        name: Style name (e.g., "Open Style", "Modern", "Traditional")
        description: Style description
        template_blob_path: Azure blob path (blender-templates/{style_id}.blend)
        customization_schema: JSON Schema defining valid configuration options
        default_glb_path: Pre-generated default GLB path (optional)
        is_default: Whether this is the default style for the product
        display_order: Ordering for UI display
        created_at: Creation timestamp
        updated_at: Last update timestamp

    Constraints:
        - Unique index on (product_id, name) - no duplicate names per product
        - Partial unique index on (product_id) WHERE is_default=true - one default per product
        - FK cascade: Product deleted -> Styles deleted
    """

    __tablename__ = "styles"
    __table_args__ = (
        # Unique constraint on (product_id, name) - no duplicate style names per product
        UniqueConstraint("product_id", "name", name="uq_styles_product_id_name"),
        # Partial unique index to ensure only one default style per product
        # This prevents race conditions when multiple requests try to create default styles
        # Works on PostgreSQL and SQLite 3.8.0+ (released 2013-08-26)
        # Use text() for the WHERE clause to work across dialects
        Index(
            "ix_styles_product_default",
            "product_id",
            unique=True,
            sqlite_where=text("is_default = 1"),
            postgresql_where=text("is_default = true"),
        ),
        Index("ix_styles_product_id", "product_id"),
        Index("ix_styles_display_order", "display_order"),
    )

    product_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    template_blob_path: Mapped[str] = mapped_column(String(500), nullable=False)
    customization_schema: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    default_glb_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="styles")
    product_customizations: Mapped[list["ProductCustomization"]] = relationship(
        "ProductCustomization",
        back_populates="style",
        passive_deletes=True,  # Let DB handle deletion restriction
    )
