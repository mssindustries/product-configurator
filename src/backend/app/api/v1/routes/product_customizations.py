"""
Product Customizations API endpoints.

Provides CRUD operations for saved product customizations:
- GET /api/v1/product-customizations - List product customizations
- GET /api/v1/product-customizations/{id} - Get product customization details
- POST /api/v1/product-customizations - Save new product customization
- DELETE /api/v1/product-customizations/{id} - Delete product customization

NOTE: Authentication is not yet implemented. These endpoints are currently
public. When authentication is added, endpoints will be scoped to the
authenticated client.
"""

from typing import Annotated
from uuid import UUID

import jsonschema
from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import DbSession
from app.core.exceptions import EntityNotFoundError
from app.db.models import ProductCustomization
from app.repositories import ProductCustomizationRepository, ProductRepository, StyleRepository
from app.schemas import ListResponse
from app.schemas.product_customization import (
    ProductCustomizationCreate,
    ProductCustomizationResponse,
)

router = APIRouter()


@router.get("", response_model=ListResponse[ProductCustomizationResponse])
async def list_product_customizations(
    db: DbSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ListResponse[ProductCustomizationResponse]:
    """
    List all product customizations.

    Query parameters:
    - skip: Number of product customizations to skip (for pagination)
    - limit: Maximum number of product customizations to return (1-100)

    Returns:
        ListResponse with items and total count.
    """
    repo = ProductCustomizationRepository(db)
    result = await repo.list_paginated(
        skip=skip,
        limit=limit,
        order_by=ProductCustomization.created_at.desc(),
    )

    items = ProductCustomizationResponse.from_models(result.items)

    return ListResponse(items=items, total=result.total)


@router.get("/{product_customization_id}", response_model=ProductCustomizationResponse)
async def get_product_customization(
    product_customization_id: UUID,
    db: DbSession,
) -> ProductCustomizationResponse:
    """
    Get a specific product customization by ID.

    Args:
        product_customization_id: UUID of the product customization to retrieve

    Returns:
        ProductCustomizationResponse with full product customization details.

    Raises:
        HTTPException 404: Product customization not found.
    """
    repo = ProductCustomizationRepository(db)
    product_customization = await repo.ensure_exists(product_customization_id)

    return ProductCustomizationResponse.from_model(product_customization)


@router.post("", response_model=ProductCustomizationResponse, status_code=status.HTTP_201_CREATED)
async def create_product_customization(
    product_customization_data: ProductCustomizationCreate,
    db: DbSession,
) -> ProductCustomizationResponse:
    """
    Create a new product customization.

    NOTE: This endpoint currently requires client_id in the request body.
    When authentication is implemented, client_id will be inferred from
    the authenticated user.

    Args:
        product_customization_data: Product customization creation data

    Returns:
        ProductCustomizationResponse with the created product customization details.

    Raises:
        HTTPException 404: Product or Style not found.
        HTTPException 422: Config data validation error.
    """
    # Verify product exists
    product_repo = ProductRepository(db)
    await product_repo.ensure_exists(product_customization_data.product_id)

    # Fetch the style to get its customization_schema (scoped to product)
    style_repo = StyleRepository(db)
    style = await style_repo.ensure_exists_for_product(
        product_customization_data.product_id,
        product_customization_data.style_id,
    )

    # Validate config_data against style's customization_schema
    try:
        jsonschema.validate(
            instance=product_customization_data.config_data,
            schema=style.customization_schema,
        )
    except jsonschema.ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid customization data: {e.message}",
        ) from e
    except jsonschema.SchemaError as e:
        # This means the style's customization_schema itself is invalid
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Style schema is invalid: {e.message}",
        ) from e

    # Create new product customization instance
    # Use style.id as a simple version identifier since styles don't have a version field
    product_customization = ProductCustomization(
        product_id=product_customization_data.product_id,
        style_id=product_customization_data.style_id,
        client_id=product_customization_data.client_id,
        name=product_customization_data.name,
        config_data=product_customization_data.config_data,
        product_schema_version="1.0.0",  # TODO: Add version field to Style if needed
    )

    db.add(product_customization)
    await db.commit()
    await db.refresh(product_customization)

    return ProductCustomizationResponse.from_model(product_customization)


@router.delete("/{product_customization_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_customization(
    product_customization_id: UUID,
    db: DbSession,
) -> None:
    """
    Delete a product customization.

    Args:
        product_customization_id: UUID of the product customization to delete

    Returns:
        204 No Content on success

    Raises:
        HTTPException 404: Product customization not found.
    """
    repo = ProductCustomizationRepository(db)
    product_customization = await repo.ensure_exists(product_customization_id)

    await db.delete(product_customization)
    await db.commit()
