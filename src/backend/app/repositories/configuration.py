"""
Configuration repository for database operations on Configuration entities.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Configuration
from app.repositories.base import BaseRepository


class ConfigurationRepository(BaseRepository[Configuration]):
    """
    Repository for Configuration entity database operations.

    Provides typed access to Configuration entities with proper error handling.

    Example:
        repo = ConfigurationRepository(db)
        config = await repo.ensure_exists(config_id)  # Raises EntityNotFoundError if not found
        config = await repo.get_by_id(config_id)  # Returns None if not found
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Initialize the ConfigurationRepository.

        Args:
            db: The async database session
        """
        super().__init__(Configuration, db)
