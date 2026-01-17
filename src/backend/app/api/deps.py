"""
Dependency injection functions for FastAPI routes.

Provides:
- Database session dependency
"""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db

# Type alias for database session dependency injection
DbSession = Annotated[AsyncSession, Depends(get_db)]
