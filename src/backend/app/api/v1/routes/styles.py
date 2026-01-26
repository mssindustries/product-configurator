"""
Styles API endpoints.

Provides CRUD operations for product styles (nested under products):
- POST   /api/v1/products/{product_id}/styles - Create style with file upload
- GET    /api/v1/products/{product_id}/styles - List styles
- GET    /api/v1/products/{product_id}/styles/{style_id} - Get style
- PATCH  /api/v1/products/{product_id}/styles/{style_id} - Update style
- DELETE /api/v1/products/{product_id}/styles/{style_id} - Delete style
- POST   /api/v1/products/{product_id}/styles/{style_id}/set-default - Set as default

NOTE: Authentication is not yet implemented. These endpoints are currently
public. When authentication is added, endpoints will be scoped to the
authenticated client.
"""

import io
import json
import logging
from typing import Annotated, Any, cast
from uuid import UUID

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from jsonschema import Draft7Validator, SchemaError
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError

from app.api.deps import DbSession
from app.db.models import Configuration, Product, Style
from app.schemas.style import StyleListResponse, StyleResponse
from app.services.blob_storage import BlobStorageService

logger = logging.getLogger(__name__)

router = APIRouter()

# Constants
MAX_FILE_SIZE_MB = 100
ALLOWED_EXTENSIONS = {".blend"}


def _validate_blend_file(file: UploadFile) -> None:
    """Validate that the uploaded file is a valid .blend file."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File must have a filename",
        )

    # Check extension
    filename_lower = file.filename.lower()
    if not any(filename_lower.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid file type. Must be .blend file. Got: {file.filename}",
        )

    # Check file size
    if file.size and file.size > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB",
        )


def _parse_json_schema(schema_str: str) -> dict[str, Any]:
    """Parse and validate JSON Schema from form string."""
    try:
        schema = cast(dict[str, Any], json.loads(schema_str))
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid JSON in customization_schema: {e.msg}",
        )

    try:
        Draft7Validator.check_schema(schema)
    except SchemaError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid JSON Schema: {e.message}",
        )

    return schema


def _style_to_response(style: Style) -> StyleResponse:
    """Convert Style model to StyleResponse schema."""
    return StyleResponse(
        id=str(style.id),
        product_id=str(style.product_id),
        name=style.name,
        description=style.description,
        template_blob_path=style.template_blob_path,
        customization_schema=style.customization_schema,
        default_glb_path=style.default_glb_path,
        is_default=style.is_default,
        display_order=style.display_order,
        created_at=style.created_at,
        updated_at=style.updated_at,
    )


async def _get_product_or_404(db: DbSession, product_id: UUID) -> Product:
    """Get product by ID or raise 404."""
    stmt = select(Product).where(Product.id == str(product_id))
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product {product_id} not found",
        )
    return product


async def _get_style_or_404(
    db: DbSession, product_id: UUID, style_id: UUID
) -> Style:
    """Get style by ID (scoped to product) or raise 404."""
    stmt = select(Style).where(
        Style.id == str(style_id),
        Style.product_id == str(product_id),
    )
    result = await db.execute(stmt)
    style = result.scalar_one_or_none()

    if not style:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Style {style_id} not found for product {product_id}",
        )
    return style


async def _check_duplicate_name(
    db: DbSession, product_id: UUID, name: str, exclude_style_id: str | None = None
) -> None:
    """Check if a style with the given name already exists for the product."""
    stmt = select(Style).where(
        Style.product_id == str(product_id),
        Style.name == name,
    )
    if exclude_style_id:
        stmt = stmt.where(Style.id != exclude_style_id)

    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Style with name '{name}' already exists for this product",
        )


async def _unset_other_defaults(
    db: DbSession, product_id: UUID, exclude_style_id: str | None = None
) -> None:
    """Set is_default=False on all other styles for this product."""
    stmt = (
        update(Style)
        .where(Style.product_id == str(product_id))
        .where(Style.is_default.is_(True))
        .values(is_default=False)
    )
    if exclude_style_id:
        stmt = stmt.where(Style.id != exclude_style_id)
    await db.execute(stmt)


async def _has_styles(db: DbSession, product_id: UUID) -> bool:
    """Check if product has any styles."""
    stmt = select(func.count()).select_from(Style).where(
        Style.product_id == str(product_id)
    )
    result = await db.execute(stmt)
    count = result.scalar_one()
    return count > 0


async def _is_only_default_style(
    db: DbSession, product_id: UUID, style_id: str
) -> bool:
    """Check if the given style is the only default style for the product."""
    # Count total default styles for this product
    stmt = select(func.count()).select_from(Style).where(
        Style.product_id == str(product_id),
        Style.is_default.is_(True),
    )
    result = await db.execute(stmt)
    default_count = result.scalar_one()

    # If there's only one default and it's this style, return True
    if default_count == 1:
        check_stmt = select(Style).where(
            Style.id == style_id,
            Style.is_default.is_(True),
        )
        check_result = await db.execute(check_stmt)
        return check_result.scalar_one_or_none() is not None

    return False


# ============================================================================
# POST /api/v1/products/{product_id}/styles - Create Style
# ============================================================================


@router.post("", response_model=StyleResponse, status_code=status.HTTP_201_CREATED)
async def create_style(
    product_id: UUID,
    db: DbSession,
    file: Annotated[UploadFile, File(description="Blender template file (.blend)")],
    name: Annotated[str, Form(min_length=1, max_length=255)],
    customization_schema: Annotated[str, Form(description="JSON Schema as string")],
    description: Annotated[str | None, Form(max_length=5000)] = None,
    is_default: Annotated[str, Form()] = "false",
) -> StyleResponse:
    """
    Create a new style for a product.

    Accepts multipart/form-data with:
    - file: .blend template file (required)
    - name: Style name (required)
    - description: Style description (optional)
    - customization_schema: JSON Schema as string (required)
    - is_default: "true" or "false" (optional, default false)

    Business Rules:
    - First style for a product is automatically set as default
    - If is_default=true, other styles are unset as default
    - Style names must be unique within a product
    """
    # Verify product exists
    await _get_product_or_404(db, product_id)

    # Validate file
    _validate_blend_file(file)

    # Parse and validate JSON Schema
    schema = _parse_json_schema(customization_schema)

    # Check for duplicate name
    await _check_duplicate_name(db, product_id, name)

    # Parse is_default
    should_be_default = is_default.lower() == "true"

    # Check if this is the first style (auto-default)
    has_existing_styles = await _has_styles(db, product_id)
    if not has_existing_styles:
        should_be_default = True

    # If setting as default, unset others first
    if should_be_default:
        await _unset_other_defaults(db, product_id)

    # Create style record first to get the ID
    style = Style(
        product_id=str(product_id),
        name=name,
        description=description,
        template_blob_path="",  # Will be updated after upload
        customization_schema=schema,
        is_default=should_be_default,
        display_order=0,
    )
    db.add(style)
    await db.flush()  # Get the ID

    # Upload file to blob storage
    try:
        blob_service = BlobStorageService()
        blob_name = f"{style.id}.blend"
        blob_path = await blob_service.upload_file(
            file=file.file,
            blob_name=blob_name,
            content_type="application/octet-stream",
        )
        style.template_blob_path = blob_path
    except Exception as e:
        # Rollback on upload failure
        await db.rollback()
        logger.error(f"Failed to upload blob for style {style.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload template file",
        )

    await db.commit()
    await db.refresh(style)

    return _style_to_response(style)


# ============================================================================
# GET /api/v1/products/{product_id}/styles - List Styles
# ============================================================================


@router.get("", response_model=StyleListResponse)
async def list_styles(
    product_id: UUID,
    db: DbSession,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> StyleListResponse:
    """
    List all styles for a product.

    Query parameters:
    - skip: Number of styles to skip (for pagination)
    - limit: Maximum number of styles to return (1-100)

    Returns:
        StyleListResponse with items and total count.
    """
    # Verify product exists
    await _get_product_or_404(db, product_id)

    # Get total count
    count_stmt = select(func.count()).select_from(Style).where(
        Style.product_id == str(product_id)
    )
    count_result = await db.execute(count_stmt)
    total = count_result.scalar_one()

    # Get paginated styles
    stmt = (
        select(Style)
        .where(Style.product_id == str(product_id))
        .order_by(Style.display_order, Style.created_at)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    styles = result.scalars().all()

    items = [_style_to_response(style) for style in styles]

    return StyleListResponse(items=items, total=total)


# ============================================================================
# GET /api/v1/products/{product_id}/styles/{style_id} - Get Style
# ============================================================================


@router.get("/{style_id}", response_model=StyleResponse)
async def get_style(
    product_id: UUID,
    style_id: UUID,
    db: DbSession,
) -> StyleResponse:
    """
    Get a specific style by ID.

    Args:
        product_id: UUID of the parent product
        style_id: UUID of the style to retrieve

    Returns:
        StyleResponse with full style details.

    Raises:
        HTTPException 404: Style or product not found.
    """
    # Verify product exists
    await _get_product_or_404(db, product_id)

    # Get style (scoped to product)
    style = await _get_style_or_404(db, product_id, style_id)

    return _style_to_response(style)


# ============================================================================
# PATCH /api/v1/products/{product_id}/styles/{style_id} - Update Style
# ============================================================================


@router.patch("/{style_id}", response_model=StyleResponse)
async def update_style(
    product_id: UUID,
    style_id: UUID,
    db: DbSession,
    file: Annotated[UploadFile | None, File(description="New .blend file")] = None,
    name: Annotated[str | None, Form(min_length=1, max_length=255)] = None,
    description: Annotated[str | None, Form(max_length=5000)] = None,
    customization_schema: Annotated[str | None, Form()] = None,
    is_default: Annotated[str | None, Form()] = None,
    display_order: Annotated[int | None, Form(ge=0)] = None,
) -> StyleResponse:
    """
    Update an existing style.

    Accepts multipart/form-data with optional fields:
    - file: New .blend template file
    - name: New style name
    - description: New description
    - customization_schema: New JSON Schema as string
    - is_default: "true" or "false"
    - display_order: Display order integer

    Notes:
    - Only provided fields are updated
    - If new file uploaded, old file is deleted from blob storage
    - If is_default=true, other styles are unset as default
    """
    # Verify product exists
    await _get_product_or_404(db, product_id)

    # Get style
    style = await _get_style_or_404(db, product_id, style_id)

    # Update fields
    if name is not None:
        # Check for duplicate name
        await _check_duplicate_name(db, product_id, name, exclude_style_id=str(style_id))
        style.name = name

    if description is not None:
        style.description = description

    if customization_schema is not None:
        schema = _parse_json_schema(customization_schema)
        style.customization_schema = schema

    if display_order is not None:
        style.display_order = display_order

    if is_default is not None:
        should_be_default = is_default.lower() == "true"
        if should_be_default and not style.is_default:
            # Unset other defaults
            await _unset_other_defaults(db, product_id, exclude_style_id=str(style_id))
        elif not should_be_default and style.is_default:
            # Prevent removing the last default style
            if await _is_only_default_style(db, product_id, str(style_id)):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove default status. This is the only default style for the product. Set another style as default first.",
                )
        style.is_default = should_be_default

    # Handle file upload - validate and read content before committing DB changes
    new_file_content: bytes | None = None
    old_blob_path: str | None = None
    if file is not None:
        _validate_blend_file(file)
        # Read file content now (before commit) so we have it ready
        new_file_content = await file.read()
        old_blob_path = style.template_blob_path
        # We'll update the blob path after successful commit

    # Commit database changes first
    await db.commit()
    await db.refresh(style)

    # Now handle blob operations after successful DB commit
    # If blob operations fail, the DB state is already committed,
    # but we can log and handle gracefully (style data is consistent)
    if new_file_content is not None:
        try:
            blob_service = BlobStorageService()

            # Upload new file using BytesIO since we already read the content
            blob_name = f"{style.id}.blend"
            blob_path = await blob_service.upload_file(
                file=io.BytesIO(new_file_content),
                blob_name=blob_name,
                content_type="application/octet-stream",
            )

            # Update blob path in database
            style.template_blob_path = blob_path
            await db.commit()
            await db.refresh(style)

            # Delete old file (if different path) - non-critical operation
            if old_blob_path and old_blob_path != blob_path:
                try:
                    old_blob_name = old_blob_path.split("/")[-1]
                    await blob_service.delete_file(old_blob_name)
                except Exception as e:
                    # Log but don't fail - old file cleanup is non-critical
                    logger.warning(f"Failed to delete old blob {old_blob_path}: {e}")

        except Exception as e:
            logger.error(f"Failed to update blob for style {style.id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload template file. Database changes were saved but file upload failed.",
            )

    return _style_to_response(style)


# ============================================================================
# DELETE /api/v1/products/{product_id}/styles/{style_id} - Delete Style
# ============================================================================


@router.delete("/{style_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_style(
    product_id: UUID,
    style_id: UUID,
    db: DbSession,
) -> None:
    """
    Delete a style.

    Validation:
    - Cannot delete if is_default=true (HTTP 400)
    - Cannot delete if configurations exist (HTTP 409)

    On success:
    - Deletes style record from database
    - Deletes blob file from storage
    """
    # Verify product exists
    await _get_product_or_404(db, product_id)

    # Get style
    style = await _get_style_or_404(db, product_id, style_id)

    # Cannot delete default style
    if style.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete default style. Set another style as default first.",
        )

    # Check for existing configurations (using explicit query to avoid sync lazy-load)
    config_count_stmt = select(func.count()).select_from(Configuration).where(
        Configuration.style_id == str(style_id)
    )
    config_count_result = await db.execute(config_count_stmt)
    if config_count_result.scalar_one() > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Style has existing configurations. Delete them first.",
        )

    # Get blob path before deletion
    blob_path = style.template_blob_path

    # Delete from database
    try:
        await db.delete(style)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete style due to existing references.",
        )

    # Delete blob file
    if blob_path:
        try:
            blob_service = BlobStorageService()
            blob_name = blob_path.split("/")[-1]
            await blob_service.delete_file(blob_name)
        except Exception as e:
            # Log but don't fail - style is already deleted
            logger.warning(f"Failed to delete blob {blob_path}: {e}")


# ============================================================================
# POST /api/v1/products/{product_id}/styles/{style_id}/set-default - Set Default
# ============================================================================


@router.post("/{style_id}/set-default", response_model=StyleResponse)
async def set_default_style(
    product_id: UUID,
    style_id: UUID,
    db: DbSession,
) -> StyleResponse:
    """
    Set a style as the default for its product.

    This operation:
    - Sets is_default=true on the specified style
    - Sets is_default=false on all other styles for the product

    This operation is idempotent - setting default on an already-default
    style succeeds without error.
    """
    # Verify product exists
    await _get_product_or_404(db, product_id)

    # Get style
    style = await _get_style_or_404(db, product_id, style_id)

    # Unset other defaults and set this one
    await _unset_other_defaults(db, product_id, exclude_style_id=str(style_id))
    style.is_default = True

    await db.commit()
    await db.refresh(style)

    return _style_to_response(style)
