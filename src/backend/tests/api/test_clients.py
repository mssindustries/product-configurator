"""
Tests for Clients API endpoints.
"""

import pytest
from httpx import AsyncClient


@pytest.fixture
def sample_client_data():
    """Sample client data for tests."""
    return {"name": "Acme Manufacturing"}


async def test_list_clients_empty(client: AsyncClient):
    """Returns empty list when no clients exist."""
    response = await client.get("/api/v1/clients")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


async def test_list_clients_with_data(client: AsyncClient, sample_client_data: dict):
    """Returns clients after creation."""
    await client.post("/api/v1/clients", json=sample_client_data)

    response = await client.get("/api/v1/clients")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == sample_client_data["name"]


async def test_create_client_success(client: AsyncClient, sample_client_data: dict):
    """Creates and returns client."""
    response = await client.post("/api/v1/clients", json=sample_client_data)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == sample_client_data["name"]
    assert "created_at" in data
    assert "updated_at" in data


async def test_create_client_duplicate_name(client: AsyncClient, sample_client_data: dict):
    """Returns 409 when client name already exists."""
    # Create first client
    response = await client.post("/api/v1/clients", json=sample_client_data)
    assert response.status_code == 201

    # Try to create duplicate
    response = await client.post("/api/v1/clients", json=sample_client_data)
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()


async def test_create_client_validation_error(client: AsyncClient):
    """Returns 422 for invalid data."""
    # Missing name
    invalid_data = {}
    response = await client.post("/api/v1/clients", json=invalid_data)
    assert response.status_code == 422


async def test_create_client_empty_name(client: AsyncClient):
    """Returns 422 for empty name."""
    response = await client.post("/api/v1/clients", json={"name": ""})
    assert response.status_code == 422


async def test_client_has_enabled_field_default_true(client: AsyncClient, sample_client_data: dict):
    """New clients are enabled by default."""
    response = await client.post("/api/v1/clients", json=sample_client_data)
    assert response.status_code == 201
    data = response.json()
    assert data["enabled"] is True


async def test_toggle_client_status_enabled_to_disabled(client: AsyncClient, sample_client_data: dict):
    """Toggles client from enabled to disabled."""
    # Create a client (enabled by default)
    create_response = await client.post("/api/v1/clients", json=sample_client_data)
    assert create_response.status_code == 201
    client_id = create_response.json()["id"]
    assert create_response.json()["enabled"] is True

    # Toggle status to disabled
    toggle_response = await client.patch(f"/api/v1/clients/{client_id}/toggle-status")
    assert toggle_response.status_code == 200
    data = toggle_response.json()
    assert data["enabled"] is False
    assert data["id"] == client_id


async def test_toggle_client_status_disabled_to_enabled(client: AsyncClient, sample_client_data: dict):
    """Toggles client from disabled to enabled."""
    # Create a client
    create_response = await client.post("/api/v1/clients", json=sample_client_data)
    client_id = create_response.json()["id"]

    # Toggle to disabled
    await client.patch(f"/api/v1/clients/{client_id}/toggle-status")

    # Toggle back to enabled
    toggle_response = await client.patch(f"/api/v1/clients/{client_id}/toggle-status")
    assert toggle_response.status_code == 200
    data = toggle_response.json()
    assert data["enabled"] is True


async def test_toggle_client_status_not_found(client: AsyncClient):
    """Returns 404 when client not found."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.patch(f"/api/v1/clients/{fake_id}/toggle-status")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
