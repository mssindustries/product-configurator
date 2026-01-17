"""
Configurations API endpoints.

Provides CRUD operations for saved product configurations:
- GET /api/v1/configurations - List configurations
- GET /api/v1/configurations/{id} - Get configuration details
- POST /api/v1/configurations - Save new configuration
- DELETE /api/v1/configurations/{id} - Delete configuration

NOTE: Authentication is not yet implemented. These endpoints are currently
public. When authentication is added, endpoints will be scoped to the
authenticated client.
"""

from typing import Annotated
from uuid import UUID

import jsonschema
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from app.api.deps import DbSession
from app.db.models import Configuration, Product
from app.schemas.configuration import (
    ConfigurationCreate,
    ConfigurationListResponse,
    ConfigurationResponse,
)

router = APIRouter()


@router.get("", response_model=ConfigurationListResponse)
async def list_configurations(
    db: DbSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ConfigurationListResponse:
    """
    List all configurations.

    Query parameters:
    - skip: Number of configurations to skip (for pagination)
    - limit: Maximum number of configurations to return (1-100)

    Returns:
        ConfigurationListResponse with items and total count.
    """
    # Get total count
    count_stmt = select(func.count()).select_from(Configuration)
    count_result = await db.execute(count_stmt)
    total = count_result.scalar_one()

    # Get paginated configurations
    stmt = (
        select(Configuration)
        .order_by(Configuration.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    configurations = result.scalars().all()

    # Convert to response schemas
    items = [
        ConfigurationResponse(
            id=str(config.id),
            product_id=str(config.product_id),
            client_id=str(config.client_id),
            name=config.name,
            config_data=config.config_data,
            product_schema_version=config.product_schema_version,
            created_at=config.created_at,
            updated_at=config.updated_at,
        )
        for config in configurations
    ]

    return ConfigurationListResponse(items=items, total=total)


@router.get("/{configuration_id}", response_model=ConfigurationResponse)
async def get_configuration(
    configuration_id: UUID,
    db: DbSession,
) -> ConfigurationResponse:
    """
    Get a specific configuration by ID.

    Args:
        configuration_id: UUID of the configuration to retrieve

    Returns:
        ConfigurationResponse with full configuration details.

    Raises:
        HTTPException 404: Configuration not found.
    """
    stmt = select(Configuration).where(Configuration.id == str(configuration_id))
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration {configuration_id} not found",
        )

    return ConfigurationResponse(
        id=str(config.id),
        product_id=str(config.product_id),
        client_id=str(config.client_id),
        name=config.name,
        config_data=config.config_data,
        product_schema_version=config.product_schema_version,
        created_at=config.created_at,
        updated_at=config.updated_at,
    )


@router.post("", response_model=ConfigurationResponse, status_code=status.HTTP_201_CREATED)
async def create_configuration(
    config_data: ConfigurationCreate,
    db: DbSession,
) -> ConfigurationResponse:
    """
    Create a new configuration.

    NOTE: This endpoint currently requires client_id in the request body.
    When authentication is implemented, client_id will be inferred from
    the authenticated user.

    Args:
        config_data: Configuration creation data

    Returns:
        ConfigurationResponse with the created configuration details.

    Raises:
        HTTPException 404: Product not found.
        HTTPException 422: Config data validation error.
    """
    # Fetch the product to get its config_schema
    product_stmt = select(Product).where(Product.id == config_data.product_id)
    product_result = await db.execute(product_stmt)
    product = product_result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {config_data.product_id} not found",
        )

    # Validate config_data against product's config_schema
    try:
        jsonschema.validate(
            instance=config_data.config_data,
            schema=product.config_schema,
        )
    except jsonschema.ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid configuration data: {e.message}",
        ) from e
    except jsonschema.SchemaError as e:
        # This means the product's config_schema itself is invalid
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Product schema is invalid: {e.message}",
        ) from e

    # Create new configuration instance
    configuration = Configuration(
        product_id=config_data.product_id,
        client_id=config_data.client_id,
        name=config_data.name,
        config_data=config_data.config_data,
        product_schema_version=product.template_version,
    )

    db.add(configuration)
    await db.commit()
    await db.refresh(configuration)

    return ConfigurationResponse(
        id=str(configuration.id),
        product_id=str(configuration.product_id),
        client_id=str(configuration.client_id),
        name=configuration.name,
        config_data=configuration.config_data,
        product_schema_version=configuration.product_schema_version,
        created_at=configuration.created_at,
        updated_at=configuration.updated_at,
    )


@router.delete("/{configuration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_configuration(
    configuration_id: UUID,
    db: DbSession,
) -> None:
    """
    Delete a configuration.

    Args:
        configuration_id: UUID of the configuration to delete

    Returns:
        204 No Content on success

    Raises:
        HTTPException 404: Configuration not found.
    """
    stmt = select(Configuration).where(Configuration.id == str(configuration_id))
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration {configuration_id} not found",
        )

    await db.delete(config)
    await db.commit()
