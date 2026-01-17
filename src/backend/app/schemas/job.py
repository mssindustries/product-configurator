"""
Pydantic schemas for Job entity.
"""

from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.db.models.job import JobStatus
from app.schemas.base import BaseSchema


class JobCreate(BaseSchema):
    """Schema for creating a new GLB generation job."""

    configuration_id: UUID = Field(
        ...,
        description="ID of the configuration to generate GLB for",
    )


class JobResponse(BaseSchema):
    """Schema for job response."""

    id: str
    configuration_id: str
    status: JobStatus
    progress: int = Field(..., ge=0, le=100)
    result_url: str | None = None
    error_code: str | None = None
    error_message: str | None = None
    retry_count: int
    max_retries: int
    worker_id: str | None = None
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None


class JobStatusResponse(BaseSchema):
    """Lightweight schema for job status polling."""

    id: str
    status: JobStatus
    progress: int = Field(..., ge=0, le=100)
    result_url: str | None = None
    error_code: str | None = None
    error_message: str | None = None


class JobListResponse(BaseSchema):
    """Schema for listing jobs."""

    items: list[JobResponse]
    total: int
