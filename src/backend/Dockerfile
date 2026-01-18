# MSS Industries Product Configurator - Backend Dockerfile
# Python 3.11+ with Blender headless

FROM python:3.11-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

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

# Copy all application code
COPY --chown=appuser:appuser . .

# Install Python dependencies from lockfile
# Set DEV_MODE=true to include dev dependencies (debugpy, pytest, etc.)
ARG DEV_MODE=false
RUN if [ "$DEV_MODE" = "true" ]; then \
      uv sync --frozen --group dev --no-install-project; \
    else \
      uv sync --frozen --no-dev --no-install-project; \
    fi

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
