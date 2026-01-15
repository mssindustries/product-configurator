"""
Pytest configuration and shared fixtures.
"""

import pytest


@pytest.fixture
def anyio_backend():
    """Configure anyio backend for pytest-asyncio."""
    return "asyncio"
