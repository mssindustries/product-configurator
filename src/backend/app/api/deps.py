"""
Dependency injection functions for FastAPI routes.

Provides:
- Database session dependency
- API key authentication dependency
"""

from datetime import datetime
from typing import Annotated

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import is_key_expired, is_key_revoked, verify_api_key
from app.db import get_db
from app.db.models import ApiKey, Client

# API key header scheme
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def get_current_client(
    db: Annotated[AsyncSession, Depends(get_db)],
    api_key: Annotated[str | None, Security(api_key_header)],
) -> Client:
    """
    Validate API key and return the associated client.

    This dependency:
    1. Extracts the API key from the X-API-Key header
    2. Looks up the key hash in the database
    3. Verifies the key hasn't expired or been revoked
    4. Updates last_used_at timestamp
    5. Returns the associated Client

    Args:
        db: Database session (injected)
        api_key: API key from X-API-Key header (injected)

    Returns:
        The Client associated with the API key.

    Raises:
        HTTPException: 401 if authentication fails.
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # Find all API keys for verification (we need to check hashes)
    # This query loads the client relationship eagerly
    stmt = select(ApiKey).options(selectinload(ApiKey.client))
    result = await db.execute(stmt)
    api_keys = result.scalars().all()

    # Find matching key by verifying hash
    matched_key: ApiKey | None = None
    for key in api_keys:
        if verify_api_key(api_key, key.key_hash):
            matched_key = key
            break

    if not matched_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # Check if key is expired
    if is_key_expired(matched_key.expires_at):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key has expired",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # Check if key is revoked
    if is_key_revoked(matched_key.revoked_at):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key has been revoked",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # Update last_used_at
    matched_key.last_used_at = datetime.utcnow()
    await db.commit()

    return matched_key.client


# Type alias for dependency injection
CurrentClient = Annotated[Client, Depends(get_current_client)]
