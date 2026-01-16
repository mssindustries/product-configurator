"""
Products API endpoints.

Provides CRUD operations for product templates:
- GET /api/v1/products - List products for current client
- GET /api/v1/products/{id} - Get product details
- POST /api/v1/products - Create new product
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentClient
from app.db import get_db
from app.db.models import Product
from app.schemas.product import ProductCreate, ProductListResponse, ProductResponse

router = APIRouter()


@router.get("", response_model=ProductListResponse)
async def list_products(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_client: CurrentClient,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ProductListResponse:
    """
    List all products for the authenticated client.

    Query parameters:
    - skip: Number of products to skip (for pagination)
    - limit: Maximum number of products to return (1-100)

    Returns:
        ProductListResponse with items and total count.
    """
    # Get total count
    count_stmt = select(func.count()).select_from(Product).where(
        Product.client_id == current_client.id
    )
    count_result = await db.execute(count_stmt)
    total = count_result.scalar_one()

    # Get paginated products
    stmt = (
        select(Product)
        .where(Product.client_id == current_client.id)
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
    db: Annotated[AsyncSession, Depends(get_db)],
    current_client: CurrentClient,
) -> ProductResponse:
    """
    Get a specific product by ID.

    Only returns products belonging to the authenticated client.

    Args:
        product_id: UUID of the product to retrieve

    Returns:
        ProductResponse with full product details including config_schema.

    Raises:
        HTTPException 404: Product not found or belongs to another client.
    """
    stmt = select(Product).where(
        Product.id == str(product_id),
        Product.client_id == current_client.id,
    )
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
    db: Annotated[AsyncSession, Depends(get_db)],
    current_client: CurrentClient,
) -> ProductResponse:
    """
    Create a new product for the authenticated client.

    The product will automatically be associated with the current client.

    Args:
        product_data: Product creation data (name, description, template_blob_path, etc.)

    Returns:
        ProductResponse with the created product details.

    Raises:
        HTTPException 422: Validation error (handled by FastAPI).
    """
    # Create new product instance
    product = Product(
        client_id=current_client.id,
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
