"""
Base repository class with common database operations.

The repository pattern provides a clean abstraction over data access,
making it easier to test and maintain domain logic.
"""

from typing import Generic, TypeVar
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EntityNotFoundError
from app.db.models.base import Base

# Type variable for SQLAlchemy models
ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """
    Generic base repository for common database operations.

    Provides a consistent interface for entity lookup operations
    with proper error handling using domain exceptions.

    Type Parameters:
        ModelT: The SQLAlchemy model type this repository manages

    Attributes:
        model: The SQLAlchemy model class
        db: The async database session

    Example:
        class ProductRepository(BaseRepository[Product]):
            def __init__(self, db: AsyncSession) -> None:
                super().__init__(Product, db)

        # Usage in a route:
        repo = ProductRepository(db)
        product = await repo.ensure_exists(product_id)  # Raises if not found
    """

    def __init__(self, model: type[ModelT], db: AsyncSession) -> None:
        """
        Initialize the repository.

        Args:
            model: The SQLAlchemy model class this repository manages
            db: The async database session
        """
        self.model = model
        self.db = db

    @property
    def _entity_name(self) -> str:
        """Get the entity name for error messages."""
        return self.model.__name__

    async def get_by_id(self, id: UUID | str) -> ModelT | None:
        """
        Get an entity by its ID.

        Args:
            id: The UUID or string ID of the entity

        Returns:
            The entity if found, None otherwise
        """
        id_str = str(id)
        stmt = select(self.model).where(self.model.id == id_str)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def ensure_exists(self, id: UUID | str) -> ModelT:
        """
        Get an entity by ID, raising EntityNotFoundError if not found.

        This method should be used when the entity is expected to exist
        and its absence represents an error condition.

        Args:
            id: The UUID or string ID of the entity

        Returns:
            The entity

        Raises:
            EntityNotFoundError: If no entity with the given ID exists
        """
        entity = await self.get_by_id(id)
        if entity is None:
            raise EntityNotFoundError(self._entity_name, str(id))
        return entity
