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


class EntityNotFoundError(NotFoundError):
    """Raised when a specific entity is not found by ID.

    This exception provides structured information about which entity
    was not found, making error messages more consistent and informative.

    Attributes:
        entity_name: The name of the entity type (e.g., "Product", "Client")
        entity_id: The ID that was searched for
    """

    def __init__(self, entity_name: str, entity_id: str | int) -> None:
        self.entity_name = entity_name
        self.entity_id = str(entity_id)
        super().__init__(f"{entity_name} with id '{self.entity_id}' not found")

    def __repr__(self) -> str:
        return f"EntityNotFoundError(entity_name={self.entity_name!r}, entity_id={self.entity_id!r})"


class AuthenticationError(ConfiguratorError):
    """Raised when authentication fails."""

    pass


class AuthorizationError(ConfiguratorError):
    """Raised when authorization fails."""

    pass
