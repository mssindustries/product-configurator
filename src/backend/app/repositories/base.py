"""
Base repository class with common database operations.

The repository pattern provides a clean abstraction over data access,
making it easier to test and maintain domain logic.
"""

from dataclasses import dataclass
from typing import Any, Generic, TypeVar
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EntityNotFoundError
from app.db.models.base import Base

# Type variable for SQLAlchemy models
ModelT = TypeVar("ModelT", bound=Base)


@dataclass
class PaginatedResult(Generic[ModelT]):
    """
    Container for paginated query results.

    Attributes:
        items: List of model instances for the current page
        total: Total count of items across all pages
    """

    items: list[ModelT]
    total: int


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
        # Type ignore for model.id access - pyright can't infer column attributes on generic model types
        stmt = select(self.model).where(self.model.id == id_str)  # type: ignore[attr-defined]
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

    async def list_paginated(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        order_by: Any = None,
        filters: list[Any] | None = None,
    ) -> PaginatedResult[ModelT]:
        """
        Get paginated list with total count.

        This method consolidates the common pagination pattern used across
        multiple endpoints, eliminating duplication of count + offset/limit queries.

        Args:
            skip: Number of items to skip (for pagination)
            limit: Maximum number of items to return
            order_by: SQLAlchemy order_by expression or tuple of expressions
                     (e.g., Model.created_at.desc() or (Model.order, Model.created_at))
            filters: Optional list of SQLAlchemy filter expressions

        Returns:
            PaginatedResult containing items and total count

        Example:
            # Simple pagination with default ordering
            result = await repo.list_paginated(skip=0, limit=20)

            # With custom ordering
            result = await repo.list_paginated(
                skip=0,
                limit=20,
                order_by=Product.created_at.desc()
            )

            # With filters
            result = await repo.list_paginated(
                skip=0,
                limit=20,
                filters=[Product.is_active == True]
            )
        """
        # Build count query
        count_stmt = select(func.count()).select_from(self.model)
        if filters:
            for filter_expr in filters:
                count_stmt = count_stmt.where(filter_expr)

        # Execute count query
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar_one()

        # Build paginated query
        stmt = select(self.model)
        if filters:
            for filter_expr in filters:
                stmt = stmt.where(filter_expr)

        if order_by is not None:
            # Support both single expression and tuple of expressions
            if isinstance(order_by, tuple):
                stmt = stmt.order_by(*order_by)
            else:
                stmt = stmt.order_by(order_by)

        stmt = stmt.offset(skip).limit(limit)

        # Execute paginated query
        result = await self.db.execute(stmt)
        items = list(result.scalars().all())

        return PaginatedResult(items=items, total=total)
