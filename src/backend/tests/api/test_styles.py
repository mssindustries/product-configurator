"""
Tests for Styles API endpoints.

Tests the style management endpoints nested under products:
- POST   /api/v1/products/{product_id}/styles
- GET    /api/v1/products/{product_id}/styles
- GET    /api/v1/products/{product_id}/styles/{style_id}
- PATCH  /api/v1/products/{product_id}/styles/{style_id}
- DELETE /api/v1/products/{product_id}/styles/{style_id}
- POST   /api/v1/products/{product_id}/styles/{style_id}/set-default

NOTE: File upload tests use mock file data since we're testing against
an in-memory database and mock blob storage.
"""

import io
import json
import uuid
from unittest.mock import patch

import pytest
from httpx import AsyncClient


@pytest.fixture
def sample_product_data():
    """Sample product data for creating test products."""
    return {
        "client_id": str(uuid.uuid4()),
        "name": "Test Range Hood",
        "description": "A test range hood product",
    }


@pytest.fixture
def sample_style_schema():
    """Sample customization schema for styles."""
    return {
        "type": "object",
        "properties": {
            "width": {"type": "number", "minimum": 24, "maximum": 60},
            "height": {"type": "number", "minimum": 18, "maximum": 36},
            "finish": {"type": "string", "enum": ["brushed_steel", "copper", "black"]},
        },
        "required": ["width", "height", "finish"],
    }


@pytest.fixture
def mock_blend_file():
    """Create a mock .blend file for upload tests."""
    # Blender files start with "BLENDER" magic bytes
    content = b"BLENDER-v300" + b"\x00" * 100
    return io.BytesIO(content)


@pytest.fixture
async def product(client: AsyncClient, sample_product_data: dict) -> dict:
    """Create a product for testing styles."""
    response = await client.post("/api/v1/products", json=sample_product_data)
    assert response.status_code == 201
    return response.json()


# ============================================================================
# POST /api/v1/products/{product_id}/styles - Create Style
# ============================================================================


@pytest.mark.anyio
async def test_create_style_success(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Creates style with valid data and file."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        files = {"file": ("template.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data = {
            "name": "Open Style",
            "description": "An open range hood style",
            "customization_schema": json.dumps(sample_style_schema),
        }

        response = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files,
            data=data,
        )
        assert response.status_code == 201
        result = response.json()
        assert result["name"] == "Open Style"
        assert result["description"] == "An open range hood style"
        assert result["product_id"] == product["id"]
        assert result["customization_schema"] == sample_style_schema
        assert "id" in result
        assert "created_at" in result
        assert "updated_at" in result
        assert result["is_default"] is True  # First style should be default


@pytest.mark.anyio
async def test_create_style_first_is_default(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """First style created for a product is automatically set as default."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        files = {"file": ("template.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data = {
            "name": "First Style",
            "customization_schema": json.dumps(sample_style_schema),
        }

        response = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files,
            data=data,
        )
        assert response.status_code == 201
        assert response.json()["is_default"] is True


@pytest.mark.anyio
async def test_create_style_second_not_default(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Second style created is not default unless explicitly requested."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        # Create first style
        files1 = {"file": ("template1.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data1 = {
            "name": "First Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        response1 = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files1,
            data=data1,
        )
        assert response1.status_code == 201
        assert response1.json()["is_default"] is True

        # Create second style
        files2 = {"file": ("template2.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data2 = {
            "name": "Second Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        response2 = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files2,
            data=data2,
        )
        assert response2.status_code == 201
        assert response2.json()["is_default"] is False


@pytest.mark.anyio
async def test_create_style_explicit_default_unsets_other(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Creating style with is_default=true unsets other default styles."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        # Create first style (will be default)
        files1 = {"file": ("template1.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data1 = {
            "name": "First Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        response1 = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files1,
            data=data1,
        )
        first_style_id = response1.json()["id"]

        # Create second style with is_default=true
        files2 = {"file": ("template2.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data2 = {
            "name": "Second Style",
            "customization_schema": json.dumps(sample_style_schema),
            "is_default": "true",
        }
        response2 = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files2,
            data=data2,
        )
        assert response2.status_code == 201
        assert response2.json()["is_default"] is True

        # Verify first style is no longer default
        response = await client.get(
            f"/api/v1/products/{product['id']}/styles/{first_style_id}"
        )
        assert response.json()["is_default"] is False


@pytest.mark.anyio
async def test_create_style_missing_file(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Returns 422 when file is missing."""
    data = {
        "name": "No File Style",
        "customization_schema": json.dumps(sample_style_schema),
    }

    response = await client.post(
        f"/api/v1/products/{product['id']}/styles",
        data=data,
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_create_style_invalid_file_extension(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Returns 422 when file extension is not .blend."""
    files = {"file": ("template.obj", b"OBJ file content", "application/octet-stream")}
    data = {
        "name": "Wrong Extension Style",
        "customization_schema": json.dumps(sample_style_schema),
    }

    response = await client.post(
        f"/api/v1/products/{product['id']}/styles",
        files=files,
        data=data,
    )
    assert response.status_code == 422
    assert "blend" in response.json()["detail"].lower()


@pytest.mark.anyio
async def test_create_style_invalid_json_schema(
    client: AsyncClient,
    product: dict,
):
    """Returns 422 when customization_schema is not valid JSON Schema."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        files = {"file": ("template.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data = {
            "name": "Invalid Schema Style",
            "customization_schema": json.dumps({"type": "invalid_type"}),
        }

        response = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files,
            data=data,
        )
        assert response.status_code == 422
        assert "Invalid JSON Schema" in str(response.json())


@pytest.mark.anyio
async def test_create_style_invalid_json_string(
    client: AsyncClient,
    product: dict,
):
    """Returns 422 when customization_schema is not valid JSON."""
    files = {"file": ("template.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
    data = {
        "name": "Invalid JSON Style",
        "customization_schema": "not valid json {",
    }

    response = await client.post(
        f"/api/v1/products/{product['id']}/styles",
        files=files,
        data=data,
    )
    assert response.status_code == 422


@pytest.mark.anyio
async def test_create_style_duplicate_name(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Returns 409 when style name already exists for product."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        files1 = {"file": ("template1.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data1 = {
            "name": "Duplicate Name",
            "customization_schema": json.dumps(sample_style_schema),
        }
        response1 = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files1,
            data=data1,
        )
        assert response1.status_code == 201

        # Try to create another style with the same name
        files2 = {"file": ("template2.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data2 = {
            "name": "Duplicate Name",
            "customization_schema": json.dumps(sample_style_schema),
        }
        response2 = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files2,
            data=data2,
        )
        assert response2.status_code == 409
        assert "already exists" in response2.json()["detail"].lower()


@pytest.mark.anyio
async def test_create_style_product_not_found(
    client: AsyncClient,
    sample_style_schema: dict,
):
    """Returns 404 when product does not exist."""
    fake_product_id = str(uuid.uuid4())
    files = {"file": ("template.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
    data = {
        "name": "Orphan Style",
        "customization_schema": json.dumps(sample_style_schema),
    }

    response = await client.post(
        f"/api/v1/products/{fake_product_id}/styles",
        files=files,
        data=data,
    )
    assert response.status_code == 404


# ============================================================================
# GET /api/v1/products/{product_id}/styles - List Styles
# ============================================================================


@pytest.mark.anyio
async def test_list_styles_empty(client: AsyncClient, product: dict):
    """Returns empty list when product has no styles."""
    response = await client.get(f"/api/v1/products/{product['id']}/styles")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.anyio
async def test_list_styles_with_data(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Returns styles after creation."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        # Create two styles
        for i in range(2):
            files = {"file": (f"template{i}.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
            data = {
                "name": f"Style {i}",
                "customization_schema": json.dumps(sample_style_schema),
            }
            await client.post(
                f"/api/v1/products/{product['id']}/styles",
                files=files,
                data=data,
            )

    response = await client.get(f"/api/v1/products/{product['id']}/styles")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


@pytest.mark.anyio
async def test_list_styles_pagination(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Pagination works correctly."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        # Create 5 styles
        for i in range(5):
            files = {"file": (f"template{i}.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
            data = {
                "name": f"Style {i}",
                "customization_schema": json.dumps(sample_style_schema),
            }
            await client.post(
                f"/api/v1/products/{product['id']}/styles",
                files=files,
                data=data,
            )

    # Test limit
    response = await client.get(f"/api/v1/products/{product['id']}/styles?limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5

    # Test skip
    response = await client.get(f"/api/v1/products/{product['id']}/styles?skip=3")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5


@pytest.mark.anyio
async def test_list_styles_product_not_found(client: AsyncClient):
    """Returns 404 when product does not exist."""
    fake_product_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/products/{fake_product_id}/styles")
    assert response.status_code == 404


# ============================================================================
# GET /api/v1/products/{product_id}/styles/{style_id} - Get Style
# ============================================================================


@pytest.mark.anyio
async def test_get_style_success(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Returns style by ID."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        files = {"file": ("template.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data = {
            "name": "Test Style",
            "description": "A test style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        create_response = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files,
            data=data,
        )
        style_id = create_response.json()["id"]

    response = await client.get(f"/api/v1/products/{product['id']}/styles/{style_id}")
    assert response.status_code == 200
    result = response.json()
    assert result["id"] == style_id
    assert result["name"] == "Test Style"
    assert result["description"] == "A test style"
    assert result["customization_schema"] == sample_style_schema


@pytest.mark.anyio
async def test_get_style_not_found(client: AsyncClient, product: dict):
    """Returns 404 for missing style."""
    fake_style_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/products/{product['id']}/styles/{fake_style_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.anyio
async def test_get_style_wrong_product(
    client: AsyncClient,
    product: dict,
    sample_product_data: dict,
    sample_style_schema: dict,
):
    """Returns 404 when style belongs to different product."""
    # Create another product
    sample_product_data["name"] = "Another Product"
    response = await client.post("/api/v1/products", json=sample_product_data)
    other_product = response.json()

    # Create style on first product
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        files = {"file": ("template.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data = {
            "name": "Test Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        create_response = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files,
            data=data,
        )
        style_id = create_response.json()["id"]

    # Try to get style using other product's ID
    response = await client.get(f"/api/v1/products/{other_product['id']}/styles/{style_id}")
    assert response.status_code == 404


# ============================================================================
# PATCH /api/v1/products/{product_id}/styles/{style_id} - Update Style
# ============================================================================


@pytest.mark.anyio
async def test_update_style_success(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Updates style fields successfully."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        files = {"file": ("template.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data = {
            "name": "Original Name",
            "description": "Original description",
            "customization_schema": json.dumps(sample_style_schema),
        }
        create_response = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files,
            data=data,
        )
        style_id = create_response.json()["id"]

    # Update style
    update_data = {
        "name": "Updated Name",
        "description": "Updated description",
    }
    response = await client.patch(
        f"/api/v1/products/{product['id']}/styles/{style_id}",
        data=update_data,
    )
    assert response.status_code == 200
    result = response.json()
    assert result["name"] == "Updated Name"
    assert result["description"] == "Updated description"


@pytest.mark.anyio
async def test_update_style_with_new_file(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Updates style with new .blend file."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        files = {"file": ("template.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data = {
            "name": "Test Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        create_response = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files,
            data=data,
        )
        style_id = create_response.json()["id"]

    # Update with new file
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload, \
         patch("app.services.blob_storage.BlobStorageService.delete_file") as mock_delete:
        mock_upload.return_value = "blender-templates/new-file.blend"

        new_files = {"file": ("new_template.blend", b"BLENDER-v300NEW" + b"\x00" * 100, "application/octet-stream")}
        response = await client.patch(
            f"/api/v1/products/{product['id']}/styles/{style_id}",
            files=new_files,
        )
        assert response.status_code == 200
        # Verify old file was deleted and new file uploaded
        mock_delete.assert_called_once()
        mock_upload.assert_called_once()


@pytest.mark.anyio
async def test_update_style_partial(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Partial update only changes specified fields."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        files = {"file": ("template.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data = {
            "name": "Original Name",
            "description": "Original description",
            "customization_schema": json.dumps(sample_style_schema),
        }
        create_response = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files,
            data=data,
        )
        style = create_response.json()

    # Update only name
    update_data = {"name": "New Name"}
    response = await client.patch(
        f"/api/v1/products/{product['id']}/styles/{style['id']}",
        data=update_data,
    )
    assert response.status_code == 200
    result = response.json()
    assert result["name"] == "New Name"
    assert result["description"] == "Original description"  # Unchanged


@pytest.mark.anyio
async def test_update_style_set_default(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Setting is_default=true unsets other defaults."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        # Create two styles
        files1 = {"file": ("template1.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data1 = {
            "name": "First Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        response1 = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files1,
            data=data1,
        )
        first_style = response1.json()

        files2 = {"file": ("template2.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data2 = {
            "name": "Second Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        response2 = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files2,
            data=data2,
        )
        second_style = response2.json()

    # Set second style as default
    response = await client.patch(
        f"/api/v1/products/{product['id']}/styles/{second_style['id']}",
        data={"is_default": "true"},
    )
    assert response.status_code == 200
    assert response.json()["is_default"] is True

    # Verify first style is no longer default
    response = await client.get(
        f"/api/v1/products/{product['id']}/styles/{first_style['id']}"
    )
    assert response.json()["is_default"] is False


@pytest.mark.anyio
async def test_update_style_not_found(client: AsyncClient, product: dict):
    """Returns 404 for missing style."""
    fake_style_id = str(uuid.uuid4())
    response = await client.patch(
        f"/api/v1/products/{product['id']}/styles/{fake_style_id}",
        data={"name": "Does Not Exist"},
    )
    assert response.status_code == 404


@pytest.mark.anyio
async def test_update_style_duplicate_name(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Returns 409 when updating to a name that already exists."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        # Create two styles
        files1 = {"file": ("template1.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data1 = {
            "name": "First Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files1,
            data=data1,
        )

        files2 = {"file": ("template2.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data2 = {
            "name": "Second Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        response2 = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files2,
            data=data2,
        )
        second_style = response2.json()

    # Try to update second style to have the same name as first
    response = await client.patch(
        f"/api/v1/products/{product['id']}/styles/{second_style['id']}",
        data={"name": "First Style"},
    )
    assert response.status_code == 409


# ============================================================================
# DELETE /api/v1/products/{product_id}/styles/{style_id} - Delete Style
# ============================================================================


@pytest.mark.anyio
async def test_delete_style_success(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Deletes non-default style successfully."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        # Create two styles (first will be default)
        files1 = {"file": ("template1.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data1 = {
            "name": "First Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files1,
            data=data1,
        )

        files2 = {"file": ("template2.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data2 = {
            "name": "Second Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        response2 = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files2,
            data=data2,
        )
        second_style = response2.json()

    # Delete second (non-default) style
    with patch("app.services.blob_storage.BlobStorageService.delete_file") as mock_delete:
        response = await client.delete(
            f"/api/v1/products/{product['id']}/styles/{second_style['id']}"
        )
        assert response.status_code == 204
        mock_delete.assert_called_once()

    # Verify style is deleted
    response = await client.get(
        f"/api/v1/products/{product['id']}/styles/{second_style['id']}"
    )
    assert response.status_code == 404


@pytest.mark.anyio
async def test_delete_style_default_fails(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Returns 400 when trying to delete default style."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        files = {"file": ("template.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data = {
            "name": "Default Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        create_response = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files,
            data=data,
        )
        style = create_response.json()

    response = await client.delete(
        f"/api/v1/products/{product['id']}/styles/{style['id']}"
    )
    assert response.status_code == 400
    assert "default" in response.json()["detail"].lower()


@pytest.mark.anyio
async def test_delete_style_not_found(client: AsyncClient, product: dict):
    """Returns 404 for missing style."""
    fake_style_id = str(uuid.uuid4())
    response = await client.delete(
        f"/api/v1/products/{product['id']}/styles/{fake_style_id}"
    )
    assert response.status_code == 404


# ============================================================================
# POST /api/v1/products/{product_id}/styles/{style_id}/set-default - Set Default
# ============================================================================


@pytest.mark.anyio
async def test_set_default_style_success(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Sets style as default and unsets previous default."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        # Create two styles
        files1 = {"file": ("template1.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data1 = {
            "name": "First Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        response1 = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files1,
            data=data1,
        )
        first_style = response1.json()

        files2 = {"file": ("template2.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data2 = {
            "name": "Second Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        response2 = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files2,
            data=data2,
        )
        second_style = response2.json()

    # Set second style as default
    response = await client.post(
        f"/api/v1/products/{product['id']}/styles/{second_style['id']}/set-default"
    )
    assert response.status_code == 200
    assert response.json()["is_default"] is True

    # Verify first style is no longer default
    response = await client.get(
        f"/api/v1/products/{product['id']}/styles/{first_style['id']}"
    )
    assert response.json()["is_default"] is False


@pytest.mark.anyio
async def test_set_default_already_default(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Setting default on already-default style succeeds (idempotent)."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        files = {"file": ("template.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data = {
            "name": "Default Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        create_response = await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files,
            data=data,
        )
        style = create_response.json()

    # Set as default when already default
    response = await client.post(
        f"/api/v1/products/{product['id']}/styles/{style['id']}/set-default"
    )
    assert response.status_code == 200
    assert response.json()["is_default"] is True


@pytest.mark.anyio
async def test_set_default_style_not_found(client: AsyncClient, product: dict):
    """Returns 404 for missing style."""
    fake_style_id = str(uuid.uuid4())
    response = await client.post(
        f"/api/v1/products/{product['id']}/styles/{fake_style_id}/set-default"
    )
    assert response.status_code == 404


# ============================================================================
# File Size Validation Tests
# ============================================================================


@pytest.mark.anyio
async def test_create_style_file_too_large(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Returns 422 when file exceeds max size (100MB)."""
    # This test would need actual file size validation in the endpoint
    # For now we simulate with a header indicating large file
    # The actual implementation should check file size during upload
    pass  # TODO: Implement when file size validation is added


# ============================================================================
# Cascade Delete Tests
# ============================================================================


@pytest.mark.anyio
async def test_product_delete_cascades_to_styles(
    client: AsyncClient,
    product: dict,
    sample_style_schema: dict,
):
    """Deleting product also deletes its styles."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        files = {"file": ("template.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data = {
            "name": "Test Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        await client.post(
            f"/api/v1/products/{product['id']}/styles",
            files=files,
            data=data,
        )

    # Delete product (should cascade to styles)
    # Note: Product delete endpoint may need to clean up blob files
    # This test verifies the database cascade
    pass  # TODO: Implement when product delete handles style blob cleanup
