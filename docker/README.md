# Docker Configuration

Docker-related files for the MSS Industries Product Configurator.

## Quick Start

### Prerequisites
- Docker Desktop or Docker Engine (20.10+)
- Docker Compose (v2.0+)

### Setup

1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Start all services**:
   ```bash
   docker compose up -d
   ```

3. **Verify services are running**:
   ```bash
   docker compose ps
   ```

4. **Check logs**:
   ```bash
   # All services
   docker compose logs -f

   # Specific service
   docker compose logs -f api
   docker compose logs -f db
   docker compose logs -f azurite
   ```

### Service Endpoints

Once running, you can access:

- **API**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs
- **API Documentation (ReDoc)**: http://localhost:8000/redoc
- **PostgreSQL**: localhost:5432
- **Azurite Blob Storage**: http://localhost:10000
- **Azurite Queue Storage**: http://localhost:10001
- **Azurite Table Storage**: http://localhost:10002

### Development Workflow

The backend service is configured with hot reload enabled. Any changes to Python files in `src/backend/` will automatically restart the API server.

### Stopping Services

```bash
# Stop all services (keeps data)
docker compose stop

# Stop and remove containers (keeps data volumes)
docker compose down

# Stop, remove containers, and delete volumes (clean slate)
docker compose down -v
```

### Troubleshooting

**Services won't start**:
```bash
# Check if ports are already in use
lsof -i :5432  # PostgreSQL
lsof -i :8000  # API
lsof -i :10000 # Azurite

# Rebuild containers
docker compose build --no-cache
docker compose up -d
```

**Database connection issues**:
```bash
# Check database is healthy
docker compose exec db pg_isready -U configurator

# Connect to database directly
docker compose exec db psql -U configurator -d configurator
```

**Reset database**:
```bash
docker compose down -v
docker compose up -d
```

**View Blender version in container**:
```bash
docker compose exec api blender --version
```

## Architecture

See the main [ARCHITECTURE.md](../ARCHITECTURE.md) for detailed information about the system architecture and data models.
