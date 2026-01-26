"""
Job repository for database operations on Job entities.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Job
from app.repositories.base import BaseRepository


class JobRepository(BaseRepository[Job]):
    """
    Repository for Job entity database operations.

    Provides typed access to Job entities with proper error handling.

    Example:
        repo = JobRepository(db)
        job = await repo.ensure_exists(job_id)  # Raises EntityNotFoundError if not found
        job = await repo.get_by_id(job_id)  # Returns None if not found
    """

    def __init__(self, db: AsyncSession) -> None:
        """
        Initialize the JobRepository.

        Args:
            db: The async database session
        """
        super().__init__(Job, db)
