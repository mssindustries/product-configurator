"""
Tests for Configurations API endpoints.
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


@pytest.fixture
async def created_product(client: AsyncClient, sample_product_data: dict) -> dict:
    """Create a product and return its data."""
    response = await client.post("/api/v1/products", json=sample_product_data)
    return response.json()


async def test_list_configurations_empty(client: AsyncClient):
    """Returns empty list when no configurations exist."""
    response = await client.get("/api/v1/configurations")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


async def test_create_configuration_success(client: AsyncClient, created_product: dict):
    """Creates and returns configuration."""
    config_data = {
        "product_id": created_product["id"],
        "client_id": created_product["client_id"],
        "name": "My Custom Cabinet",
        "config_data": {"width": 50, "color": "oak"},
    }

    response = await client.post("/api/v1/configurations", json=config_data)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == config_data["name"]
    assert data["product_id"] == created_product["id"]
    assert data["config_data"] == config_data["config_data"]
    assert data["product_schema_version"] == created_product["template_version"]


async def test_create_configuration_invalid_product(client: AsyncClient):
    """Returns 404 when product does not exist."""
    fake_product_id = str(uuid.uuid4())
    config_data = {
        "product_id": fake_product_id,
        "client_id": str(uuid.uuid4()),
        "name": "My Config",
        "config_data": {"width": 50, "color": "oak"},
    }

    response = await client.post("/api/v1/configurations", json=config_data)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


async def test_create_configuration_invalid_config_data(
    client: AsyncClient, created_product: dict
):
    """Returns 422 when config_data fails schema validation."""
    config_data = {
        "product_id": created_product["id"],
        "client_id": created_product["client_id"],
        "name": "Invalid Config",
        "config_data": {
            "width": 500,  # exceeds maximum of 100
            "color": "red",  # not in enum
        },
    }

    response = await client.post("/api/v1/configurations", json=config_data)
    assert response.status_code == 422


async def test_get_configuration_not_found(client: AsyncClient):
    """Returns 404 for missing configuration."""
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/configurations/{fake_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


async def test_get_configuration_success(client: AsyncClient, created_product: dict):
    """Returns configuration by ID."""
    # Create a configuration first
    config_data = {
        "product_id": created_product["id"],
        "client_id": created_product["client_id"],
        "name": "My Config",
        "config_data": {"width": 30, "color": "white"},
    }
    create_response = await client.post("/api/v1/configurations", json=config_data)
    config_id = create_response.json()["id"]

    response = await client.get(f"/api/v1/configurations/{config_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == config_id
    assert data["name"] == config_data["name"]
    assert data["config_data"] == config_data["config_data"]


async def test_delete_configuration_success(client: AsyncClient, created_product: dict):
    """Deletes configuration and returns 204."""
    # Create a configuration first
    config_data = {
        "product_id": created_product["id"],
        "client_id": created_product["client_id"],
        "name": "Config to Delete",
        "config_data": {"width": 25, "color": "black"},
    }
    create_response = await client.post("/api/v1/configurations", json=config_data)
    config_id = create_response.json()["id"]

    # Delete it
    delete_response = await client.delete(f"/api/v1/configurations/{config_id}")
    assert delete_response.status_code == 204

    # Verify it's gone
    get_response = await client.get(f"/api/v1/configurations/{config_id}")
    assert get_response.status_code == 404


async def test_delete_configuration_not_found(client: AsyncClient):
    """Returns 404 when trying to delete non-existent configuration."""
    fake_id = str(uuid.uuid4())
    response = await client.delete(f"/api/v1/configurations/{fake_id}")
    assert response.status_code == 404


async def test_list_configurations_with_data(client: AsyncClient, created_product: dict):
    """Returns configurations after creation."""
    # Create a configuration
    config_data = {
        "product_id": created_product["id"],
        "client_id": created_product["client_id"],
        "name": "Listed Config",
        "config_data": {"width": 40, "color": "oak"},
    }
    await client.post("/api/v1/configurations", json=config_data)

    response = await client.get("/api/v1/configurations")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == config_data["name"]
