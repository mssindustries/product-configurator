# MSS Industries Product Configurator - Backend

FastAPI backend for the MSS Industries Product Configurator platform.

## Setup

### Prerequisites

- Python 3.11 or higher
- PostgreSQL database
- Blender (for GLB generation)

### Installation

```bash
# Install dependencies
pip install -e ".[dev]"
```

### Configuration

Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/configurator
AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true
BLENDER_PATH=/usr/bin/blender
BLENDER_MAX_CONCURRENT=2
BLENDER_TIMEOUT_SECONDS=300
```

## Running the Application

### Development Mode

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "healthy"}
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html
```

## Project Structure

See `ARCHITECTURE.md` in the root directory for detailed information about the project structure and architecture.
