"""
Base exception classes for the application.
"""


class ConfiguratorException(Exception):
    """Base exception for all configurator errors."""

    pass


class ValidationError(ConfiguratorException):
    """Raised when data validation fails."""

    pass


class NotFoundError(ConfiguratorException):
    """Raised when a requested resource is not found."""

    pass


class AuthenticationError(ConfiguratorException):
    """Raised when authentication fails."""

    pass


class AuthorizationError(ConfiguratorException):
    """Raised when authorization fails."""

    pass
