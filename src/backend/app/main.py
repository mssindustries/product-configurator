"""
FastAPI application entry point.
Test backend PR workflow quality gates.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any, cast

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    ConfiguratorError,
    EntityAlreadyExistsError,
    EntityNotFoundError,
    NotFoundError,
    ValidationError,
)
from app.db.models import Base
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan: create tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


# Create FastAPI application
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    description=settings.api_description,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(v1_router)


# Exception Handlers
@app.exception_handler(EntityNotFoundError)
async def entity_not_found_error_handler(
    request: Request, exc: EntityNotFoundError
) -> JSONResponse:
    """
    Handle EntityNotFoundError exceptions.

    Provides structured error response with entity name and ID.

    Args:
        request: The incoming request
        exc: The EntityNotFoundError exception

    Returns:
        JSONResponse with 404 status and error details including entity info
    """
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "detail": str(exc),  # For compatibility with HTTPException format
            "error": "entity_not_found",
            "message": str(exc),
            "entity": exc.entity_name,
            "id": exc.entity_id,
        },
    )


@app.exception_handler(EntityAlreadyExistsError)
async def entity_already_exists_error_handler(
    request: Request, exc: EntityAlreadyExistsError
) -> JSONResponse:
    """
    Handle EntityAlreadyExistsError exceptions.

    Provides structured error response with entity name, field, and value.

    Args:
        request: The incoming request
        exc: The EntityAlreadyExistsError exception

    Returns:
        JSONResponse with 409 status and error details including entity and field info
    """
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "detail": str(exc),  # For compatibility with HTTPException format
            "error": "entity_already_exists",
            "message": str(exc),
            "entity": exc.entity_name,
            "field": exc.field_name,
            "value": exc.field_value,
        },
    )


@app.exception_handler(NotFoundError)
async def not_found_error_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    """
    Handle NotFoundError exceptions.

    Args:
        request: The incoming request
        exc: The NotFoundError exception

    Returns:
        JSONResponse with 404 status and error details
    """
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": "not_found",
            "message": str(exc),
        },
    )


@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """
    Handle ValidationError exceptions.

    Args:
        request: The incoming request
        exc: The ValidationError exception

    Returns:
        JSONResponse with 422 status and error details
    """
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "validation_error",
            "message": str(exc),
        },
    )


@app.exception_handler(AuthenticationError)
async def authentication_error_handler(
    request: Request, exc: AuthenticationError
) -> JSONResponse:
    """
    Handle AuthenticationError exceptions.

    Args:
        request: The incoming request
        exc: The AuthenticationError exception

    Returns:
        JSONResponse with 401 status and error details
    """
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "error": "authentication_error",
            "message": str(exc),
        },
    )


@app.exception_handler(AuthorizationError)
async def authorization_error_handler(
    request: Request, exc: AuthorizationError
) -> JSONResponse:
    """
    Handle AuthorizationError exceptions.

    Args:
        request: The incoming request
        exc: The AuthorizationError exception

    Returns:
        JSONResponse with 403 status and error details
    """
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={
            "error": "authorization_error",
            "message": str(exc),
        },
    )


@app.exception_handler(ConfiguratorError)
async def customizer_error_handler(
    request: Request, exc: ConfiguratorError
) -> JSONResponse:
    """
    Handle generic ConfiguratorError exceptions.

    Args:
        request: The incoming request
        exc: The ConfiguratorError exception

    Returns:
        JSONResponse with 500 status and error details
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_error",
            "message": str(exc),
        },
    )


def _sanitize_error_details(errors: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Sanitize Pydantic validation errors for JSON serialization.

    Pydantic may include non-serializable objects (like ValueError instances)
    in the 'ctx' field. This function converts them to strings.
    """
    sanitized = []
    for error in errors:
        sanitized_error = error.copy()
        if "ctx" in sanitized_error:
            # Convert any non-serializable objects in ctx to strings
            sanitized_error["ctx"] = {
                k: str(v) if not isinstance(v, (str, int, float, bool, type(None))) else v
                for k, v in error["ctx"].items()
            }
        sanitized.append(sanitized_error)
    return sanitized


@app.exception_handler(RequestValidationError)
async def request_validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Handle FastAPI RequestValidationError exceptions (Pydantic validation).

    Args:
        request: The incoming request
        exc: The RequestValidationError exception

    Returns:
        JSONResponse with 422 status and detailed validation errors
    """
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "validation_error",
            "message": "Request validation failed",
            "details": _sanitize_error_details(cast(list[dict[str, Any]], exc.errors())),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle all unhandled exceptions.

    Args:
        request: The incoming request
        exc: The exception

    Returns:
        JSONResponse with 500 status and generic error message
    """
    # Log the exception here in production
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_error",
            "message": "An unexpected error occurred",
        },
    )


@app.get("/health")
async def health_check() -> dict[str, str]:
    """
    Health check endpoint for liveness probes.

    Returns:
        dict: Health status
    """
    return {"status": "healthy"}


@app.get("/")
async def root() -> dict[str, str]:
    """
    Root endpoint with API information.

    Returns:
        dict: API information
    """
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "description": settings.api_description,
    }
