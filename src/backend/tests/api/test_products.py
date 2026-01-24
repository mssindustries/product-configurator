"""
Tests for Products API endpoints.

NOTE: These tests use random UUIDs for client_id. This works because:
1. SQLite (used in tests) does not enforce foreign key constraints by default.
2. The Product model does not have an explicit FK constraint to Client.

On PostgreSQL (production), if FK constraints were enforced, using random UUIDs
would fail. For production-like tests, create a valid Client first and use its ID.

Future improvement: Update fixtures to create valid clients before products.
"""

import uuid

import pytest
from httpx import AsyncClient


@pytest.fixture
def sample_product_data():
    """Sample product data for tests.

    NOTE: Uses a random UUID for client_id. See module docstring for FK note.
    """
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


# ============================================================================
# PATCH /api/v1/products/{product_id} - Update Product
# ============================================================================


async def test_update_product_success(client: AsyncClient, sample_product_data: dict):
    """Updates all product fields successfully."""
    # Create a product first
    create_response = await client.post("/api/v1/products", json=sample_product_data)
    assert create_response.status_code == 201
    product_id = create_response.json()["id"]

    # Update all fields
    update_data = {
        "name": "Updated Cabinet",
        "description": "An updated description",
        "template_blob_path": "/templates/updated-cabinet.glb",
        "template_version": "2.0.0",
        "config_schema": {
            "type": "object",
            "properties": {
                "height": {"type": "number", "minimum": 20, "maximum": 200},
            },
            "required": ["height"],
        },
    }

    response = await client.patch(f"/api/v1/products/{product_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == product_id
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]
    assert data["template_blob_path"] == update_data["template_blob_path"]
    assert data["template_version"] == update_data["template_version"]
    assert data["config_schema"] == update_data["config_schema"]
    # client_id should remain unchanged
    assert data["client_id"] == sample_product_data["client_id"]


async def test_update_product_partial(client: AsyncClient, sample_product_data: dict):
    """Updates only the name field, leaving others unchanged."""
    # Create a product first
    create_response = await client.post("/api/v1/products", json=sample_product_data)
    assert create_response.status_code == 201
    original = create_response.json()

    # Update only name
    update_data = {"name": "Partially Updated Name"}

    response = await client.patch(f"/api/v1/products/{original['id']}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]
    # Other fields should remain unchanged
    assert data["description"] == original["description"]
    assert data["template_blob_path"] == original["template_blob_path"]
    assert data["template_version"] == original["template_version"]
    assert data["config_schema"] == original["config_schema"]


async def test_update_product_not_found(client: AsyncClient):
    """Returns 404 for non-existent product ID."""
    fake_id = str(uuid.uuid4())
    update_data = {"name": "Does Not Exist"}

    response = await client.patch(f"/api/v1/products/{fake_id}", json=update_data)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


async def test_update_product_invalid_json_schema(client: AsyncClient, sample_product_data: dict):
    """Returns 422 when config_schema is not a valid JSON Schema."""
    # Create a product first
    create_response = await client.post("/api/v1/products", json=sample_product_data)
    assert create_response.status_code == 201
    product_id = create_response.json()["id"]

    # Invalid JSON Schema - uses unknown type
    update_data = {"config_schema": {"type": "invalid_type"}}

    response = await client.patch(f"/api/v1/products/{product_id}", json=update_data)
    assert response.status_code == 422
    response_data = response.json()
    assert "Invalid JSON Schema" in str(response_data)


async def test_update_product_empty_body(client: AsyncClient, sample_product_data: dict):
    """Accepts empty update (no changes made)."""
    # Create a product first
    create_response = await client.post("/api/v1/products", json=sample_product_data)
    assert create_response.status_code == 201
    original = create_response.json()

    # Send empty update
    response = await client.patch(f"/api/v1/products/{original['id']}", json={})
    assert response.status_code == 200
    data = response.json()
    # All fields should remain unchanged
    assert data["name"] == original["name"]
    assert data["description"] == original["description"]
    assert data["template_blob_path"] == original["template_blob_path"]
    assert data["template_version"] == original["template_version"]
    assert data["config_schema"] == original["config_schema"]
