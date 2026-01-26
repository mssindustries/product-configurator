"""
Style repository for database operations on Style entities.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EntityNotFoundError
from app.db.models import Style
from app.repositories.base import BaseRepository


class StyleRepository(BaseRepository[Style]):
    """
    Repository for Style entity database operations.

    Provides typed access to Style entities with proper error handling.
    Styles are scoped to products, so most lookups require both product_id and style_id.

    Example:
        repo = StyleRepository(db)
        style = await repo.ensure_exists(style_id)  # Raises EntityNotFoundError if not found
        style = await repo.get_by_id(style_id)  # Returns None if not found
        style = await repo.ensure_exists_for_product(product_id, style_id)  # Scoped lookup
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Initialize the StyleRepository.

        Args:
            db: The async database session
        """
        super().__init__(Style, db)

    async def get_by_id_for_product(
        self, product_id: UUID | str, style_id: UUID | str
    ) -> Style | None:
        """
        Get a style by ID, scoped to a specific product.

        Args:
            product_id: The UUID or string ID of the parent product
            style_id: The UUID or string ID of the style

        Returns:
            The style if found, None otherwise
        """
        stmt = select(Style).where(
            Style.id == str(style_id),
            Style.product_id == str(product_id),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def ensure_exists_for_product(
        self, product_id: UUID | str, style_id: UUID | str
    ) -> Style:
        """
        Get a style by ID (scoped to product), raising EntityNotFoundError if not found.

        This method should be used when the style is expected to exist
        and its absence represents an error condition.

        Args:
            product_id: The UUID or string ID of the parent product
            style_id: The UUID or string ID of the style

        Returns:
            The style

        Raises:
            EntityNotFoundError: If no style with the given ID exists for the product
        """
        style = await self.get_by_id_for_product(product_id, style_id)
        if style is None:
            raise EntityNotFoundError(
                "Style",
                f"{style_id} for product {product_id}",
            )
        return style
