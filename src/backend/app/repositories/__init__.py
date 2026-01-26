"""
Repository classes for database operations.

Repositories provide a clean abstraction over data access, encapsulating
query logic and providing consistent error handling through domain exceptions.

All repositories extend BaseRepository which provides:
- get_by_id(id): Returns entity or None
- ensure_exists(id): Returns entity or raises EntityNotFoundError

Example usage in a route:
    from app.repositories import ProductRepository

    @router.get("/{product_id}")
    async def get_product(product_id: UUID, db: DbSession) -> ProductResponse:
        repo = ProductRepository(db)
        product = await repo.ensure_exists(product_id)  # Auto 404 if not found
        return ProductResponse.from_orm(product)
"""

from app.repositories.base import BaseRepository
from app.repositories.client import ClientRepository
from app.repositories.configuration import ConfigurationRepository
from app.repositories.job import JobRepository
from app.repositories.product import ProductRepository
from app.repositories.style import StyleRepository

__all__ = [
    "BaseRepository",
    "ClientRepository",
    "ConfigurationRepository",
    "JobRepository",
    "ProductRepository",
    "StyleRepository",
]
