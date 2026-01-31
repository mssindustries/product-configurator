"""
Tests for Product Customizations API endpoints.
"""

import json
import uuid
from unittest.mock import patch

import pytest
from httpx import AsyncClient


@pytest.fixture
def sample_style_schema():
    """Sample customization schema for styles."""
    return {
        "type": "object",
        "properties": {
            "width": {"type": "number", "minimum": 10, "maximum": 100},
            "color": {"type": "string", "enum": ["white", "black", "oak"]},
        },
        "required": ["width", "color"],
    }


@pytest.fixture
async def created_product(client: AsyncClient, sample_product_data: dict) -> dict:
    """Create a product and return its data."""
    response = await client.post("/api/v1/products", json=sample_product_data)
    return response.json()


@pytest.fixture
async def created_style(
    client: AsyncClient,
    created_product: dict,
    sample_style_schema: dict,
) -> dict:
    """Create a style for the product and return its data."""
    with patch("app.services.blob_storage.BlobStorageService.upload_file") as mock_upload:
        mock_upload.return_value = "blender-templates/test-style-id.blend"

        files = {"file": ("template.blend", b"BLENDER-v300" + b"\x00" * 100, "application/octet-stream")}
        data = {
            "name": "Default Style",
            "customization_schema": json.dumps(sample_style_schema),
        }
        response = await client.post(
            f"/api/v1/products/{created_product['id']}/styles",
            files=files,
            data=data,
        )
        return response.json()


async def test_list_product_customizations_empty(client: AsyncClient):
    """Returns empty list when no product customizations exist."""
    response = await client.get("/api/v1/product-customizations")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


async def test_create_product_customization_success(
    client: AsyncClient,
    created_product: dict,
    created_style: dict,
):
    """Creates and returns product customization."""
    config_data = {
        "product_id": created_product["id"],
        "style_id": created_style["id"],
        "client_id": created_product["client_id"],
        "name": "My Custom Cabinet",
        "config_data": {"width": 50, "color": "oak"},
    }

    response = await client.post("/api/v1/product-customizations", json=config_data)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == config_data["name"]
    assert data["product_id"] == created_product["id"]
    assert data["style_id"] == created_style["id"]
    assert data["config_data"] == config_data["config_data"]


async def test_create_product_customization_invalid_product(client: AsyncClient):
    """Returns 404 when product does not exist."""
    fake_product_id = str(uuid.uuid4())
    fake_style_id = str(uuid.uuid4())
    config_data = {
        "product_id": fake_product_id,
        "style_id": fake_style_id,
        "client_id": str(uuid.uuid4()),
        "name": "My Config",
        "config_data": {"width": 50, "color": "oak"},
    }

    response = await client.post("/api/v1/product-customizations", json=config_data)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


async def test_create_product_customization_invalid_style(
    client: AsyncClient,
    created_product: dict,
):
    """Returns 404 when style does not exist."""
    fake_style_id = str(uuid.uuid4())
    config_data = {
        "product_id": created_product["id"],
        "style_id": fake_style_id,
        "client_id": created_product["client_id"],
        "name": "My Config",
        "config_data": {"width": 50, "color": "oak"},
    }

    response = await client.post("/api/v1/product-customizations", json=config_data)
    assert response.status_code == 404
    assert "style" in response.json()["detail"].lower()


async def test_create_product_customization_invalid_config_data(
    client: AsyncClient,
    created_product: dict,
    created_style: dict,
):
    """Returns 422 when config_data fails schema validation."""
    config_data = {
        "product_id": created_product["id"],
        "style_id": created_style["id"],
        "client_id": created_product["client_id"],
        "name": "Invalid Config",
        "config_data": {
            "width": 500,  # exceeds maximum of 100
            "color": "red",  # not in enum
        },
    }

    response = await client.post("/api/v1/product-customizations", json=config_data)
    assert response.status_code == 422


async def test_get_product_customization_not_found(client: AsyncClient):
    """Returns 404 for missing product customization."""
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/product-customizations/{fake_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


async def test_get_product_customization_success(
    client: AsyncClient,
    created_product: dict,
    created_style: dict,
):
    """Returns product customization by ID."""
    # Create a product customization first
    config_data = {
        "product_id": created_product["id"],
        "style_id": created_style["id"],
        "client_id": created_product["client_id"],
        "name": "My Config",
        "config_data": {"width": 30, "color": "white"},
    }
    create_response = await client.post("/api/v1/product-customizations", json=config_data)
    product_customization_id = create_response.json()["id"]

    response = await client.get(f"/api/v1/product-customizations/{product_customization_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == product_customization_id
    assert data["name"] == config_data["name"]
    assert data["config_data"] == config_data["config_data"]
    assert data["style_id"] == created_style["id"]


async def test_delete_product_customization_success(
    client: AsyncClient,
    created_product: dict,
    created_style: dict,
):
    """Deletes product customization and returns 204."""
    # Create a product customization first
    config_data = {
        "product_id": created_product["id"],
        "style_id": created_style["id"],
        "client_id": created_product["client_id"],
        "name": "Config to Delete",
        "config_data": {"width": 25, "color": "black"},
    }
    create_response = await client.post("/api/v1/product-customizations", json=config_data)
    product_customization_id = create_response.json()["id"]

    # Delete it
    delete_response = await client.delete(f"/api/v1/product-customizations/{product_customization_id}")
    assert delete_response.status_code == 204

    # Verify it's gone
    get_response = await client.get(f"/api/v1/product-customizations/{product_customization_id}")
    assert get_response.status_code == 404


async def test_delete_product_customization_not_found(client: AsyncClient):
    """Returns 404 when trying to delete non-existent product customization."""
    fake_id = str(uuid.uuid4())
    response = await client.delete(f"/api/v1/product-customizations/{fake_id}")
    assert response.status_code == 404


async def test_list_product_customizations_with_data(
    client: AsyncClient,
    created_product: dict,
    created_style: dict,
):
    """Returns product customizations after creation."""
    # Create a product customization
    config_data = {
        "product_id": created_product["id"],
        "style_id": created_style["id"],
        "client_id": created_product["client_id"],
        "name": "Listed Config",
        "config_data": {"width": 40, "color": "oak"},
    }
    await client.post("/api/v1/product-customizations", json=config_data)

    response = await client.get("/api/v1/product-customizations")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == config_data["name"]
    assert data["items"][0]["style_id"] == created_style["id"]
