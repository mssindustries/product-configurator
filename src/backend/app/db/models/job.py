"""
Job model - GLB generation job.
"""

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.models.base import Base, UUIDMixin

if TYPE_CHECKING:
    from app.db.models.product_customization import ProductCustomization


class JobStatus(str, enum.Enum):
    """Job status enumeration."""

    PENDING = "PENDING"  # Job created, awaiting queue pickup
    QUEUED = "QUEUED"  # Job picked up by worker, preparing to process
    PROCESSING = "PROCESSING"  # Blender actively generating GLB
    COMPLETED = "COMPLETED"  # GLB generated and uploaded successfully
    FAILED = "FAILED"  # Job failed (check error_code/error_message)
    CANCELLED = "CANCELLED"  # Job cancelled by user or system


class Job(UUIDMixin, Base):
    """
    GLB generation job.

    Attributes:
        id: UUID primary key
        product_customization_id: Foreign key to ProductCustomization
        status: Job status (PENDING, QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED)
        progress: Progress percentage (0-100)
        result_url: URL to generated GLB in Blob Storage
        error_code: Machine-readable error code
        error_message: Human-readable error message
        retry_count: Number of retry attempts
        max_retries: Maximum retry attempts allowed
        worker_id: Identifier of worker processing this job
        created_at: Creation timestamp
        started_at: Processing start timestamp
        completed_at: Completion timestamp
    """

    __tablename__ = "jobs"

    product_customization_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("product_customizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus, name="job_status"),
        nullable=False,
        default=JobStatus.PENDING,
        index=True,
    )
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    result_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_retries: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    worker_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.now(),
        server_default=func.now(),
        nullable=False,
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    product_customization: Mapped["ProductCustomization"] = relationship(
        "ProductCustomization",
        back_populates="jobs",
    )

    @property
    def is_terminal(self) -> bool:
        """Check if the job is in a terminal state (completed, failed, or cancelled)."""
        return self.status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED)

    @property
    def can_retry(self) -> bool:
        """Check if the job can be retried."""
        return self.status == JobStatus.FAILED and self.retry_count < self.max_retries
