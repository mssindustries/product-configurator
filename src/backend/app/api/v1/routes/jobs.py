"""
Jobs API endpoints.

Provides job management operations for GLB generation:
- POST /api/v1/jobs - Submit new GLB generation job
- GET /api/v1/jobs/{id} - Get job status and result
- POST /api/v1/jobs/{id}/cancel - Cancel pending/queued job

NOTE: Authentication is not yet implemented. These endpoints are currently
public. When authentication is added, endpoints will be scoped to the
authenticated client.
"""

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.api.deps import DbSession
from app.db.models import Job
from app.db.models.job import JobStatus
from app.repositories import ConfigurationRepository, JobRepository
from app.schemas.job import JobCreate, JobResponse

router = APIRouter()


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    db: DbSession,
) -> JobResponse:
    """
    Submit a new GLB generation job.

    NOTE: This endpoint currently accepts any valid configuration_id.
    When authentication is implemented, it will verify that the configuration
    belongs to the authenticated client.

    Args:
        job_data: Job creation data (configuration_id)

    Returns:
        JobResponse with the created job details (status: PENDING, progress: 0).

    Raises:
        HTTPException 404: Configuration not found.
        HTTPException 422: Validation error (handled by FastAPI).
    """
    # Validate configuration exists and has a client
    config_repo = ConfigurationRepository(db)
    configuration = await config_repo.ensure_exists(job_data.configuration_id)

    # Verify configuration belongs to a client (structural validation)
    if not configuration.client_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Configuration must belong to a client",
        )

    # Create new job instance
    job = Job(
        configuration_id=str(job_data.configuration_id),
        status=JobStatus.PENDING,
        progress=0,
        max_retries=3,  # Default from requirements
        retry_count=0,
    )

    db.add(job)
    await db.commit()
    await db.refresh(job)

    return JobResponse.from_model(job)


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: UUID,
    db: DbSession,
) -> JobResponse:
    """
    Get job status and result.

    Returns the current status, progress, and result (if completed) for a job.

    Args:
        job_id: UUID of the job to retrieve

    Returns:
        JobResponse with current job status, including:
        - result_url if status is COMPLETED
        - error_code and error_message if status is FAILED
        - progress percentage (0-100)
        - timestamps (created_at, started_at, completed_at)

    Raises:
        HTTPException 404: Job not found.
    """
    repo = JobRepository(db)
    job = await repo.ensure_exists(job_id)

    return JobResponse.from_model(job)


@router.post("/{job_id}/cancel", response_model=JobResponse)
async def cancel_job(
    job_id: UUID,
    db: DbSession,
) -> JobResponse:
    """
    Cancel a pending or queued job.

    Only jobs in PENDING or QUEUED status can be cancelled.
    Jobs that are already processing, completed, failed, or cancelled cannot be cancelled.

    Args:
        job_id: UUID of the job to cancel

    Returns:
        JobResponse with updated status (CANCELLED).

    Raises:
        HTTPException 404: Job not found.
        HTTPException 400: Job cannot be cancelled (already processing/completed).
    """
    repo = JobRepository(db)
    job = await repo.ensure_exists(job_id)

    # Check if job can be cancelled
    if job.status not in (JobStatus.PENDING, JobStatus.QUEUED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel job with status {job.status.value}. "
            f"Only PENDING or QUEUED jobs can be cancelled.",
        )

    # Update job status to CANCELLED
    job.status = JobStatus.CANCELLED
    await db.commit()
    await db.refresh(job)

    return JobResponse.from_model(job)
