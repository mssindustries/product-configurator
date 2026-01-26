"""
Pydantic schemas for Job entity.
"""

from collections.abc import Sequence
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from pydantic import Field

from app.db.models.job import JobStatus
from app.schemas.base import BaseSchema

if TYPE_CHECKING:
    from app.db.models import Job


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

    @classmethod
    def from_model(cls, job: "Job") -> "JobResponse":
        """Create response from ORM model."""
        return cls(
            id=str(job.id),
            configuration_id=str(job.configuration_id),
            status=job.status,
            progress=job.progress,
            result_url=job.result_url,
            error_code=job.error_code,
            error_message=job.error_message,
            retry_count=job.retry_count,
            max_retries=job.max_retries,
            worker_id=job.worker_id,
            created_at=job.created_at,
            started_at=job.started_at,
            completed_at=job.completed_at,
        )

    @classmethod
    def from_models(cls, jobs: Sequence["Job"]) -> list["JobResponse"]:
        """Create responses from sequence of ORM models."""
        return [cls.from_model(j) for j in jobs]


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
