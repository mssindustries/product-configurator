"""
Security utilities for API key authentication.

Provides:
- Argon2 password hashing for API keys
- API key generation utilities
- Key validation functions
"""

import secrets
from datetime import datetime

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Configure argon2 hasher with recommended settings
_hasher = PasswordHasher(
    time_cost=2,  # Number of iterations
    memory_cost=65536,  # Memory usage in KiB (64 MiB)
    parallelism=1,  # Number of parallel threads
    hash_len=32,  # Length of the hash
    salt_len=16,  # Length of the salt
)


def generate_api_key() -> str:
    """
    Generate a secure random API key.

    Returns:
        A 32-character URL-safe base64 string (256 bits of entropy).
    """
    return secrets.token_urlsafe(32)


def hash_api_key(api_key: str) -> str:
    """
    Hash an API key using argon2.

    Args:
        api_key: The plaintext API key to hash.

    Returns:
        The argon2 hash string (includes salt and parameters).
    """
    return _hasher.hash(api_key)


def verify_api_key(api_key: str, key_hash: str) -> bool:
    """
    Verify an API key against its stored hash.

    Args:
        api_key: The plaintext API key to verify.
        key_hash: The stored argon2 hash.

    Returns:
        True if the key matches, False otherwise.
    """
    try:
        _hasher.verify(key_hash, api_key)
        return True
    except VerifyMismatchError:
        return False


def is_key_expired(expires_at: datetime | None) -> bool:
    """
    Check if an API key has expired.

    Args:
        expires_at: The expiration timestamp, or None if no expiration.

    Returns:
        True if expired, False otherwise.
    """
    if expires_at is None:
        return False
    return datetime.utcnow() > expires_at


def is_key_revoked(revoked_at: datetime | None) -> bool:
    """
    Check if an API key has been revoked.

    Args:
        revoked_at: The revocation timestamp, or None if not revoked.

    Returns:
        True if revoked, False otherwise.
    """
    return revoked_at is not None
