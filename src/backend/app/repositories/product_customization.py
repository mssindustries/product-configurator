"""
ProductCustomization repository for database operations on ProductCustomization entities.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import ProductCustomization
from app.repositories.base import BaseRepository


class ProductCustomizationRepository(BaseRepository[ProductCustomization]):
    """
    Repository for ProductCustomization entity database operations.

    Provides typed access to ProductCustomization entities with proper error handling.

    Example:
        repo = ProductCustomizationRepository(db)
        product_customization = await repo.ensure_exists(product_customization_id)  # Raises EntityNotFoundError if not found
        product_customization = await repo.get_by_id(product_customization_id)  # Returns None if not found
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Initialize the ProductCustomizationRepository.

        Args:
            db: The async database session
        """
        super().__init__(ProductCustomization, db)
