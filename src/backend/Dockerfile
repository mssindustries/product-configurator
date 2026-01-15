# MSS Industries Product Configurator - Backend Dockerfile
# Python 3.11+ with Blender headless

FROM python:3.11-slim

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

# Install Python dependencies (explicit for better layer caching)
RUN pip install --no-cache-dir \
    "fastapi>=0.109.0" \
    "uvicorn[standard]>=0.27.0" \
    "sqlalchemy[asyncio]>=2.0.25" \
    "asyncpg>=0.29.0" \
    "aiosqlite>=0.19.0" \
    "pydantic>=2.5.0" \
    "pydantic-settings>=2.1.0" \
    "alembic>=1.13.0" \
    "python-multipart>=0.0.6"

# Copy application code (changes more frequently)
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Expose API port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    BLENDER_PATH=/usr/bin/blender \
    HOST=0.0.0.0 \
    PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Run the application (no --reload for production)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
