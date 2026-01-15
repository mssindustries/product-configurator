# MSS Industries Product Configurator - Backend Dockerfile
# Python 3.11+ with Blender headless

FROM python:3.11-slim

# Install system dependencies and Blender
RUN apt-get update && apt-get install -y \
    # Blender dependencies
    blender \
    libxrender1 \
    libxi6 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    # Build tools for Python packages
    build-essential \
    # Cleanup
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Verify Blender installation
RUN blender --version

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app /app/uploads /app/temp && \
    chown -R appuser:appuser /app

# Set working directory
WORKDIR /app

# Copy dependency files
COPY --chown=appuser:appuser pyproject.toml ./

# Install Python dependencies
RUN pip install --no-cache-dir -e ".[dev]"

# Copy application code
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

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
