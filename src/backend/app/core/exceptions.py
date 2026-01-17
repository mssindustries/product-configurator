"""
Base exception classes for the application.
"""


class ConfiguratorError(Exception):
    """Base exception for all configurator errors."""

    pass


class ValidationError(ConfiguratorError):
    """Raised when data validation fails."""

    pass


class NotFoundError(ConfiguratorError):
    """Raised when a requested resource is not found."""

    pass


class AuthenticationError(ConfiguratorError):
    """Raised when authentication fails."""

    pass


class AuthorizationError(ConfiguratorError):
    """Raised when authorization fails."""

    pass
