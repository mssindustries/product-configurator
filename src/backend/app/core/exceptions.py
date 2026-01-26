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


class EntityAlreadyExistsError(ConfiguratorError):
    """Raised when an entity with duplicate unique field value already exists.

    This exception provides structured information about which entity
    and field value caused the conflict.

    Attributes:
        entity_name: The name of the entity type (e.g., "Product", "Client")
        field_name: The name of the field that must be unique
        field_value: The duplicate value that was attempted
    """

    def __init__(self, entity_name: str, field_name: str, field_value: str) -> None:
        self.entity_name = entity_name
        self.field_name = field_name
        self.field_value = field_value
        super().__init__(
            f"{entity_name} with {field_name} '{field_value}' already exists"
        )

    def __repr__(self) -> str:
        return f"EntityAlreadyExistsError(entity_name={self.entity_name!r}, field_name={self.field_name!r}, field_value={self.field_value!r})"


class AuthenticationError(ConfiguratorError):
    """Raised when authentication fails."""

    pass


class AuthorizationError(ConfiguratorError):
    """Raised when authorization fails."""

    pass
