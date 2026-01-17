"""
Tests for Jobs API endpoints.
"""

import uuid

import pytest
from httpx import AsyncClient

from app.db.models.job import JobStatus


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


@pytest.fixture
async def created_configuration(client: AsyncClient, created_product: dict) -> dict:
    """Create a configuration and return its data."""
    config_data = {
        "product_id": created_product["id"],
        "client_id": created_product["client_id"],
        "name": "Test Configuration",
        "config_data": {"width": 50, "color": "oak"},
    }
    response = await client.post("/api/v1/configurations", json=config_data)
    return response.json()


# POST /api/v1/jobs - Create Job Tests


async def test_create_job_success(client: AsyncClient, created_configuration: dict):
    """Creates and returns job with PENDING status."""
    job_data = {
        "configuration_id": created_configuration["id"],
    }

    response = await client.post("/api/v1/jobs", json=job_data)
    assert response.status_code == 201
    data = response.json()

    # Verify response structure
    assert "id" in data
    assert data["configuration_id"] == created_configuration["id"]
    assert data["status"] == JobStatus.PENDING.value
    assert data["progress"] == 0
    assert data["result_url"] is None
    assert data["error_code"] is None
    assert data["error_message"] is None
    assert data["retry_count"] == 0
    assert data["max_retries"] == 3
    assert data["worker_id"] is None
    assert "created_at" in data
    assert data["started_at"] is None
    assert data["completed_at"] is None


async def test_create_job_configuration_not_found(client: AsyncClient):
    """Returns 404 when configuration does not exist."""
    fake_config_id = str(uuid.uuid4())
    job_data = {
        "configuration_id": fake_config_id,
    }

    response = await client.post("/api/v1/jobs", json=job_data)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
    assert fake_config_id in response.json()["detail"]


async def test_create_job_missing_configuration_id(client: AsyncClient):
    """Returns 422 when configuration_id is missing."""
    job_data = {}

    response = await client.post("/api/v1/jobs", json=job_data)
    assert response.status_code == 422


async def test_create_job_invalid_configuration_id_format(client: AsyncClient):
    """Returns 422 when configuration_id is not a valid UUID."""
    job_data = {
        "configuration_id": "not-a-uuid",
    }

    response = await client.post("/api/v1/jobs", json=job_data)
    assert response.status_code == 422


async def test_create_job_configuration_without_client(
    client: AsyncClient, created_product: dict, db_session
):
    """Returns 400 when configuration has no client_id."""
    from app.db.models import Configuration

    # Create configuration without client_id directly in database
    config = Configuration(
        product_id=created_product["id"],
        client_id=None,  # No client
        name="Orphan Config",
        config_data={"width": 50, "color": "oak"},
        product_schema_version=created_product["template_version"],
    )
    db_session.add(config)
    await db_session.commit()
    await db_session.refresh(config)

    job_data = {
        "configuration_id": str(config.id),
    }

    response = await client.post("/api/v1/jobs", json=job_data)
    assert response.status_code == 400
    assert "must belong to a client" in response.json()["detail"].lower()


# GET /api/v1/jobs/{id} - Get Job Tests


async def test_get_job_success(client: AsyncClient, created_configuration: dict):
    """Returns job by ID."""
    # Create a job first
    job_data = {"configuration_id": created_configuration["id"]}
    create_response = await client.post("/api/v1/jobs", json=job_data)
    job_id = create_response.json()["id"]

    response = await client.get(f"/api/v1/jobs/{job_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == job_id
    assert data["configuration_id"] == created_configuration["id"]
    assert data["status"] == JobStatus.PENDING.value
    assert data["progress"] == 0


async def test_get_job_not_found(client: AsyncClient):
    """Returns 404 for missing job."""
    fake_id = str(uuid.uuid4())
    response = await client.get(f"/api/v1/jobs/{fake_id}")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
    assert fake_id in response.json()["detail"]


async def test_get_job_invalid_uuid_format(client: AsyncClient):
    """Returns 422 for invalid UUID format."""
    response = await client.get("/api/v1/jobs/not-a-uuid")
    assert response.status_code == 422


async def test_get_job_with_result(
    client: AsyncClient, created_configuration: dict, db_session
):
    """Returns job with result_url when completed."""
    from app.db.models import Job

    # Create job directly in database with completed status
    job = Job(
        configuration_id=created_configuration["id"],
        status=JobStatus.COMPLETED,
        progress=100,
        result_url="https://storage.example.com/result.glb",
        max_retries=3,
        retry_count=0,
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)

    response = await client.get(f"/api/v1/jobs/{job.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == JobStatus.COMPLETED.value
    assert data["progress"] == 100
    assert data["result_url"] == "https://storage.example.com/result.glb"


async def test_get_job_with_error(
    client: AsyncClient, created_configuration: dict, db_session
):
    """Returns job with error details when failed."""
    from app.db.models import Job

    # Create job directly in database with failed status
    job = Job(
        configuration_id=created_configuration["id"],
        status=JobStatus.FAILED,
        progress=50,
        error_code="BLENDER_TIMEOUT",
        error_message="Blender process timed out after 300 seconds",
        max_retries=3,
        retry_count=2,
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)

    response = await client.get(f"/api/v1/jobs/{job.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == JobStatus.FAILED.value
    assert data["error_code"] == "BLENDER_TIMEOUT"
    assert data["error_message"] == "Blender process timed out after 300 seconds"
    assert data["retry_count"] == 2


# POST /api/v1/jobs/{id}/cancel - Cancel Job Tests


async def test_cancel_job_pending_success(
    client: AsyncClient, created_configuration: dict
):
    """Cancels a PENDING job successfully."""
    # Create a job first
    job_data = {"configuration_id": created_configuration["id"]}
    create_response = await client.post("/api/v1/jobs", json=job_data)
    job_id = create_response.json()["id"]

    # Cancel it
    response = await client.post(f"/api/v1/jobs/{job_id}/cancel")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == job_id
    assert data["status"] == JobStatus.CANCELLED.value

    # Verify it's cancelled when retrieved
    get_response = await client.get(f"/api/v1/jobs/{job_id}")
    assert get_response.json()["status"] == JobStatus.CANCELLED.value


async def test_cancel_job_queued_success(
    client: AsyncClient, created_configuration: dict, db_session
):
    """Cancels a QUEUED job successfully."""
    from app.db.models import Job

    # Create job directly in database with queued status
    job = Job(
        configuration_id=created_configuration["id"],
        status=JobStatus.QUEUED,
        progress=0,
        max_retries=3,
        retry_count=0,
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)

    # Cancel it
    response = await client.post(f"/api/v1/jobs/{job.id}/cancel")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == JobStatus.CANCELLED.value


async def test_cancel_job_not_found(client: AsyncClient):
    """Returns 404 when job does not exist."""
    fake_id = str(uuid.uuid4())
    response = await client.post(f"/api/v1/jobs/{fake_id}/cancel")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


async def test_cancel_job_invalid_uuid_format(client: AsyncClient):
    """Returns 422 for invalid UUID format."""
    response = await client.post("/api/v1/jobs/not-a-uuid/cancel")
    assert response.status_code == 422


async def test_cancel_job_processing_fails(
    client: AsyncClient, created_configuration: dict, db_session
):
    """Returns 400 when trying to cancel a PROCESSING job."""
    from app.db.models import Job

    # Create job directly in database with processing status
    job = Job(
        configuration_id=created_configuration["id"],
        status=JobStatus.PROCESSING,
        progress=50,
        max_retries=3,
        retry_count=0,
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)

    response = await client.post(f"/api/v1/jobs/{job.id}/cancel")
    assert response.status_code == 400
    assert "cannot cancel" in response.json()["detail"].lower()
    assert JobStatus.PROCESSING.value in response.json()["detail"]


async def test_cancel_job_completed_fails(
    client: AsyncClient, created_configuration: dict, db_session
):
    """Returns 400 when trying to cancel a COMPLETED job."""
    from app.db.models import Job

    # Create job directly in database with completed status
    job = Job(
        configuration_id=created_configuration["id"],
        status=JobStatus.COMPLETED,
        progress=100,
        result_url="https://storage.example.com/result.glb",
        max_retries=3,
        retry_count=0,
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)

    response = await client.post(f"/api/v1/jobs/{job.id}/cancel")
    assert response.status_code == 400
    assert "cannot cancel" in response.json()["detail"].lower()


async def test_cancel_job_failed_fails(
    client: AsyncClient, created_configuration: dict, db_session
):
    """Returns 400 when trying to cancel a FAILED job."""
    from app.db.models import Job

    # Create job directly in database with failed status
    job = Job(
        configuration_id=created_configuration["id"],
        status=JobStatus.FAILED,
        progress=30,
        error_code="BLENDER_ERROR",
        error_message="Blender process failed",
        max_retries=3,
        retry_count=1,
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)

    response = await client.post(f"/api/v1/jobs/{job.id}/cancel")
    assert response.status_code == 400
    assert "cannot cancel" in response.json()["detail"].lower()


async def test_cancel_job_already_cancelled_fails(
    client: AsyncClient, created_configuration: dict, db_session
):
    """Returns 400 when trying to cancel an already CANCELLED job."""
    from app.db.models import Job

    # Create job directly in database with cancelled status
    job = Job(
        configuration_id=created_configuration["id"],
        status=JobStatus.CANCELLED,
        progress=0,
        max_retries=3,
        retry_count=0,
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)

    response = await client.post(f"/api/v1/jobs/{job.id}/cancel")
    assert response.status_code == 400
    assert "cannot cancel" in response.json()["detail"].lower()


# Edge Cases and Multiple Jobs


async def test_create_multiple_jobs_for_same_configuration(
    client: AsyncClient, created_configuration: dict
):
    """Multiple jobs can be created for the same configuration."""
    job_data = {"configuration_id": created_configuration["id"]}

    # Create first job
    response1 = await client.post("/api/v1/jobs", json=job_data)
    assert response1.status_code == 201
    job1_id = response1.json()["id"]

    # Create second job
    response2 = await client.post("/api/v1/jobs", json=job_data)
    assert response2.status_code == 201
    job2_id = response2.json()["id"]

    # Verify they are different jobs
    assert job1_id != job2_id


async def test_job_cascade_delete_on_configuration_delete(
    client: AsyncClient, created_configuration: dict
):
    """Jobs are deleted when their configuration is deleted."""
    # Create a job
    job_data = {"configuration_id": created_configuration["id"]}
    create_response = await client.post("/api/v1/jobs", json=job_data)
    job_id = create_response.json()["id"]

    # Verify job exists
    get_response = await client.get(f"/api/v1/jobs/{job_id}")
    assert get_response.status_code == 200

    # Delete configuration
    await client.delete(f"/api/v1/configurations/{created_configuration['id']}")

    # Verify job is gone (cascade delete)
    get_response = await client.get(f"/api/v1/jobs/{job_id}")
    assert get_response.status_code == 404
