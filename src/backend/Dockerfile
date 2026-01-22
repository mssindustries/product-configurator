# MSS Industries Product Configurator - Backend Dockerfile
# Multi-stage build: Python 3.11+ with Blender headless

# =============================================================================
# Stage 1: Builder - Install Python dependencies
# =============================================================================
FROM python:3.11-slim AS builder

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Copy only dependency files first (for better layer caching)
COPY pyproject.toml uv.lock ./

# Install Python dependencies into .venv
# The .venv will be copied to the runtime stage
ARG DEV_MODE=false
RUN if [ "$DEV_MODE" = "true" ]; then \
      uv sync --frozen --group dev --no-install-project; \
    else \
      uv sync --frozen --no-dev --no-install-project; \
    fi

# Compile Python bytecode for faster startup
RUN python -m compileall /app/.venv

# =============================================================================
# Stage 2: Runtime - Final image
# =============================================================================
FROM python:3.11-slim AS runtime

# Install system dependencies and Blender
# Note: libgl1-mesa-glx replaced by libgl1 in newer Debian
RUN apt-get update && apt-get install -y --no-install-recommends \
    blender \
    libxrender1 \
    libxi6 \
    libgl1 \
    libglib2.0-0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Verify Blender installation
RUN blender --version

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app /app/uploads /app/temp && \
    chown -R appuser:appuser /app

WORKDIR /app

# Copy virtual environment from builder stage (no UV needed in runtime)
COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv

# Copy application code
COPY --chown=appuser:appuser ./app ./app
COPY --chown=appuser:appuser ./migrations ./migrations
COPY --chown=appuser:appuser ./alembic.ini ./alembic.ini

# Switch to non-root user
USER appuser

# Expose API port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    BLENDER_PATH=/usr/bin/blender \
    HOST=0.0.0.0 \
    PORT=8000 \
    PATH="/app/.venv/bin:$PATH"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Run the application
CMD ["fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
