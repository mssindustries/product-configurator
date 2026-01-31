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


async def test_update_client_success(client: AsyncClient, sample_client_data: dict):
    """Updates client name successfully."""
    # Create a client first
    create_response = await client.post("/api/v1/clients", json=sample_client_data)
    assert create_response.status_code == 201
    client_id = create_response.json()["id"]

    # Update the client
    update_data = {"name": "Updated Name"}
    response = await client.patch(f"/api/v1/clients/{client_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["id"] == client_id


async def test_update_client_not_found(client: AsyncClient):
    """Returns 404 when client doesn't exist."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.patch(f"/api/v1/clients/{fake_id}", json={"name": "New Name"})
    assert response.status_code == 404


async def test_update_client_duplicate_name(client: AsyncClient, sample_client_data: dict):
    """Returns 409 when updating to an existing name."""
    # Create two clients
    response1 = await client.post("/api/v1/clients", json={"name": "Client A"})
    assert response1.status_code == 201

    response2 = await client.post("/api/v1/clients", json={"name": "Client B"})
    assert response2.status_code == 201
    client_b_id = response2.json()["id"]

    # Try to update Client B to have Client A's name
    response = await client.patch(f"/api/v1/clients/{client_b_id}", json={"name": "Client A"})
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()


async def test_update_client_same_name_allowed(client: AsyncClient, sample_client_data: dict):
    """Allows updating with the same name (no conflict with self)."""
    # Create a client
    create_response = await client.post("/api/v1/clients", json=sample_client_data)
    assert create_response.status_code == 201
    client_id = create_response.json()["id"]

    # Update with same name should succeed
    response = await client.patch(
        f"/api/v1/clients/{client_id}",
        json={"name": sample_client_data["name"]}
    )
    assert response.status_code == 200
