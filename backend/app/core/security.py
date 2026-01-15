"""
Security utilities for API key validation.
"""

from typing import Optional

from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

from app.core.exceptions import AuthenticationError

# API Key header security scheme
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def validate_api_key(api_key: Optional[str] = Security(api_key_header)) -> str:
    """
    Validate API key from request header.

    Args:
        api_key: API key from X-API-Key header

    Returns:
        str: Validated API key

    Raises:
        HTTPException: If API key is missing or invalid
    """
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    # TODO: Implement actual API key validation against database
    # For now, this is a placeholder that accepts any non-empty key
    # In production, this should:
    # 1. Hash the incoming key
    # 2. Look up the key in the database
    # 3. Check if it's expired or revoked
    # 4. Update last_used_at timestamp
    # 5. Return the associated client_id

    return api_key
