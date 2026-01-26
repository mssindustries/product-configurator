"""
Products API endpoints.

Provides CRUD operations for product templates:
- GET /api/v1/products - List all products
- GET /api/v1/products/{id} - Get product details
- POST /api/v1/products - Create new product
- PATCH /api/v1/products/{id} - Update product

NOTE: Authentication is not yet implemented. These endpoints are currently
public. When authentication is added, endpoints will be scoped to the
authenticated client.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, status

from app.api.deps import DbSession
from app.db.models import Product
from app.repositories import ProductRepository
from app.schemas import ListResponse
from app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)

router = APIRouter()


@router.get("", response_model=ListResponse[ProductResponse])
async def list_products(
    db: DbSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ListResponse[ProductResponse]:
    """
    List all products.

    Query parameters:
    - skip: Number of products to skip (for pagination)
    - limit: Maximum number of products to return (1-100)

    Returns:
        ListResponse with items and total count.
    """
    repo = ProductRepository(db)
    result = await repo.list_paginated(
        skip=skip,
        limit=limit,
        order_by=Product.created_at.desc(),
    )

    items = ProductResponse.from_models(result.items)

    return ListResponse(items=items, total=result.total)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    db: DbSession,
) -> ProductResponse:
    """
    Get a specific product by ID.

    Args:
        product_id: UUID of the product to retrieve

    Returns:
        ProductResponse with full product details including config_schema.

    Raises:
        EntityNotFoundError: Product not found (returns 404).
    """
    repo = ProductRepository(db)
    product = await repo.ensure_exists(product_id)

    return ProductResponse.from_model(product)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: DbSession,
) -> ProductResponse:
    """
    Create a new product.

    NOTE: This endpoint currently requires client_id in the request body.
    When authentication is implemented, client_id will be inferred from
    the authenticated user.

    Args:
        product_data: Product creation data (name, description, template_blob_path, etc.)

    Returns:
        ProductResponse with the created product details.

    Raises:
        HTTPException 422: Validation error (handled by FastAPI).
    """
    # Create new product instance
    product = Product(
        client_id=product_data.client_id,
        name=product_data.name,
        description=product_data.description,
    )

    db.add(product)
    await db.commit()
    await db.refresh(product)

    return ProductResponse.from_model(product)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    product_data: ProductUpdate,
    db: DbSession,
) -> ProductResponse:
    """
    Update an existing product.

    Only fields provided in the request body will be updated.
    Fields not included (or set to null) remain unchanged.

    Args:
        product_id: UUID of the product to update
        product_data: Partial product data to update

    Returns:
        ProductResponse with the updated product details.

    Raises:
        EntityNotFoundError: Product not found (returns 404).
        HTTPException 422: Validation error (handled by FastAPI).
    """
    repo = ProductRepository(db)
    product = await repo.ensure_exists(product_id)

    # Update only fields that are provided (not None)
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product)

    return ProductResponse.from_model(product)
