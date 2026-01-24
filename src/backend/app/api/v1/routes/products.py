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

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, select

from app.api.deps import DbSession
from app.db.models import Product
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
)

router = APIRouter()


@router.get("", response_model=ProductListResponse)
async def list_products(
    db: DbSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ProductListResponse:
    """
    List all products.

    Query parameters:
    - skip: Number of products to skip (for pagination)
    - limit: Maximum number of products to return (1-100)

    Returns:
        ProductListResponse with items and total count.
    """
    # Get total count
    count_stmt = select(func.count()).select_from(Product)
    count_result = await db.execute(count_stmt)
    total = count_result.scalar_one()

    # Get paginated products
    stmt = (
        select(Product)
        .order_by(Product.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    products = result.scalars().all()

    # Convert to response schemas
    items = [
        ProductResponse(
            id=str(product.id),
            client_id=str(product.client_id),
            name=product.name,
            description=product.description,
            template_blob_path=product.template_blob_path,
            template_version=product.template_version,
            config_schema=product.config_schema,
            created_at=product.created_at,
            updated_at=product.updated_at,
        )
        for product in products
    ]

    return ProductListResponse(items=items, total=total)


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
        HTTPException 404: Product not found.
    """
    stmt = select(Product).where(Product.id == str(product_id))
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found",
        )

    return ProductResponse(
        id=str(product.id),
        client_id=str(product.client_id),
        name=product.name,
        description=product.description,
        template_blob_path=product.template_blob_path,
        template_version=product.template_version,
        config_schema=product.config_schema,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


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
        template_blob_path=product_data.template_blob_path,
        template_version=product_data.template_version,
        config_schema=product_data.config_schema,
    )

    db.add(product)
    await db.commit()
    await db.refresh(product)

    return ProductResponse(
        id=str(product.id),
        client_id=str(product.client_id),
        name=product.name,
        description=product.description,
        template_blob_path=product.template_blob_path,
        template_version=product.template_version,
        config_schema=product.config_schema,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


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
        HTTPException 404: Product not found.
        HTTPException 422: Validation error (handled by FastAPI).
    """
    # Get existing product
    stmt = select(Product).where(Product.id == str(product_id))
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found",
        )

    # Update only fields that are provided (not None)
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    await db.commit()
    await db.refresh(product)

    return ProductResponse(
        id=str(product.id),
        client_id=str(product.client_id),
        name=product.name,
        description=product.description,
        template_blob_path=product.template_blob_path,
        template_version=product.template_version,
        config_schema=product.config_schema,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )
