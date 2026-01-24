"""
Tests for Products API endpoints.
"""

import uuid

import pytest
from httpx import AsyncClient


@pytest.fixture
def sample_product_data():
    """Sample product data for tests."""
    return {
        "client_id": str(uuid.uuid4()),
        "name": "Test Cabinet",
        "description": "A test cabinet product",
        "template_blob_path": "/templates/cabinet.glb",
        "template_version": "1.0.0",
        "config_schema": {
            "type": "object",
            "properties": {
                "width": {"type": "number", "minimum": 10, "maximum": 100},
                "color": {"type": "string", "enum": ["white", "black", "oak"]},
            },
            "required": ["width", "color"],
        },
    }


async def test_list_products_empty(client: AsyncClient):
    """Returns empty list when no products exist."""
    response = await client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


async def test_list_products_with_data(client: AsyncClient, sample_product_data: dict):
    """Returns products after creation."""
    # Create a product first
    await client.post("/api/v1/products", json=sample_product_data)

    response = await client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == sample_product_data["name"]


async def test_get_product_not_found(client: AsyncClient):
    """Returns 404 for missing product."""
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/products/{fake_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


async def test_get_product_success(client: AsyncClient, sample_product_data: dict):
    """Returns product by ID."""
    # Create a product first
    create_response = await client.post("/api/v1/products", json=sample_product_data)
    product_id = create_response.json()["id"]

    response = await client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == product_id
    assert data["name"] == sample_product_data["name"]
    assert data["config_schema"] == sample_product_data["config_schema"]


async def test_create_product_success(client: AsyncClient, sample_product_data: dict):
    """Creates and returns product."""
    response = await client.post("/api/v1/products", json=sample_product_data)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == sample_product_data["name"]
    assert data["description"] == sample_product_data["description"]
    assert data["template_blob_path"] == sample_product_data["template_blob_path"]
    assert data["config_schema"] == sample_product_data["config_schema"]
    assert data["template_version"] == "1.0.0"
    assert "created_at" in data
    assert "updated_at" in data


async def test_create_product_validation_error(client: AsyncClient):
    """Returns 422 for invalid data."""
    # Missing required fields
    invalid_data = {
        "name": "Test Product",
        # missing client_id, template_blob_path, config_schema
    }
    response = await client.post("/api/v1/products", json=invalid_data)
    assert response.status_code == 422


async def test_create_product_defaults_template_version(client: AsyncClient, sample_product_data: dict):
    """template_version defaults to 1.0.0 when not provided."""
    # Remove template_version from request data
    data = sample_product_data.copy()
    del data["template_version"]

    response = await client.post("/api/v1/products", json=data)
    assert response.status_code == 201
    response_data = response.json()
    assert response_data["template_version"] == "1.0.0"


async def test_create_product_invalid_json_schema(client: AsyncClient, sample_product_data: dict):
    """Returns 422 when config_schema is not a valid JSON Schema."""
    data = sample_product_data.copy()
    # Invalid JSON Schema - uses unknown type
    data["config_schema"] = {"type": "invalid_type"}

    response = await client.post("/api/v1/products", json=data)
    assert response.status_code == 422
    response_data = response.json()
    # Verify error message mentions JSON Schema validation
    assert "Invalid JSON Schema" in str(response_data)


async def test_create_product_valid_empty_object_schema(client: AsyncClient, sample_product_data: dict):
    """Empty object is a valid JSON Schema (matches any value)."""
    data = sample_product_data.copy()
    # Empty object is valid - it's the most permissive schema
    data["config_schema"] = {}

    response = await client.post("/api/v1/products", json=data)
    assert response.status_code == 201


async def test_list_products_pagination(client: AsyncClient, sample_product_data: dict):
    """Pagination works correctly."""
    # Create 3 products
    for i in range(3):
        data = sample_product_data.copy()
        data["name"] = f"Product {i}"
        await client.post("/api/v1/products", json=data)

    # Test limit
    response = await client.get("/api/v1/products?limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 3

    # Test skip
    response = await client.get("/api/v1/products?skip=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["total"] == 3
