"""
Product repository for database operations on Product entities.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Product
from app.repositories.base import BaseRepository


class ProductRepository(BaseRepository[Product]):
    """
    Repository for Product entity database operations.

    Provides typed access to Product entities with proper error handling.

    Example:
        repo = ProductRepository(db)
        product = await repo.ensure_exists(product_id)  # Raises EntityNotFoundError if not found
        product = await repo.get_by_id(product_id)  # Returns None if not found
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Initialize the ProductRepository.

        Args:
            db: The async database session
        """
        super().__init__(Product, db)
