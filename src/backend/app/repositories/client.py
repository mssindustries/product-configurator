"""
Client repository for database operations on Client entities.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Client
from app.repositories.base import BaseRepository


class ClientRepository(BaseRepository[Client]):
    """
    Repository for Client entity database operations.

    Provides typed access to Client entities with proper error handling.

    Example:
        repo = ClientRepository(db)
        client = await repo.ensure_exists(client_id)  # Raises EntityNotFoundError if not found
        client = await repo.get_by_id(client_id)  # Returns None if not found
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Initialize the ClientRepository.

        Args:
            db: The async database session
        """
        super().__init__(Client, db)
