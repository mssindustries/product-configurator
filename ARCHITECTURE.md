# Architecture

This document describes the target architecture for the MSS Industries Product Configurator.

## Overview

The platform is a B2B 3D product configurator that allows manufacturers to offer real-time 3D visualizations of customizable products (cabinets, fireplace covers, range hoods, etc.). Customers can configure products with various options, and the system dynamically generates accurate 3D models using Blender headless.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Azure Cloud                                     │
│                                                                              │
│  ┌──────────────────────┐      ┌──────────────────────────────────────────┐ │
│  │  Azure Static Web    │      │       Azure Container Instances          │ │
│  │       Apps           │      │                                          │ │
│  │                      │      │  ┌────────────────────────────────────┐  │ │
│  │  ┌────────────────┐  │      │  │     Docker Container               │  │ │
│  │  │   Vite React   │  │ API  │  │                                    │  │ │
│  │  │      App       │──┼──────┼──│  FastAPI + Blender Headless        │  │ │
│  │  │                │  │      │  │                                    │  │ │
│  │  │  React Three   │  │      │  └────────────────────────────────────┘  │ │
│  │  │    Fiber       │  │      │                 │                        │ │
│  │  └────────────────┘  │      └─────────────────┼────────────────────────┘ │
│  └──────────────────────┘                        │                          │
│             │                                    │                          │
│             │ GLB files                          │                          │
│             ▼                                    ▼                          │
│  ┌──────────────────────┐      ┌──────────────────────────────────────────┐ │
│  │  Azure Blob Storage  │      │    Azure Database for PostgreSQL        │ │
│  │                      │      │                                          │ │
│  │  - Generated GLB     │      │  - Clients      - Jobs                   │ │
│  │    models            │      │  - Products     - Users                  │ │
│  │  - Textures/Assets   │      │  - Configurations                        │ │
│  └──────────────────────┘      └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Vite | Build tool and dev server |
| React | UI framework |
| TypeScript | Type safety |
| React Three Fiber | 3D rendering (Three.js React bindings) |
| drei | R3F helpers (controls, loaders, etc.) |
| React Router | Client-side routing |

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.11+ | Runtime |
| FastAPI | API framework |
| Blender (headless) | 3D model generation |
| SQLAlchemy 2.0+ | ORM (async support) |
| Pydantic V2 | Data validation |
| Alembic | Database migrations |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Azure Static Web Apps | Frontend hosting |
| Azure Container Instances | Backend hosting |
| Azure Database for PostgreSQL | Primary database |
| Azure Blob Storage | Generated GLB files and assets |

## Frontend Architecture

### Directory Structure
```
src/frontend/
├── public/
│   └── assets/              # Static assets
├── src/
│   ├── components/
│   │   ├── controls/        # Configuration UI controls
│   │   ├── scene/           # React Three Fiber components
│   │   └── layout/          # Page layout components
│   ├── context/             # React Context providers
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and helpers
│   ├── pages/               # Route page components
│   ├── services/            # API client functions
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx              # Root component with routing
│   └── main.tsx             # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Routes
| Route | Description |
|-------|-------------|
| `/` | Home/landing page |
| `/configure/:productId` | Product configurator |
| `/saved` | Saved configurations list |

### State Management
- React Context for configuration state
- API client for server communication
- Local state for UI interactions

## Backend Architecture

### Directory Structure
```
src/backend/
├── app/
│   ├── api/
│   │   ├── v1/                    # Versioned API routes
│   │   │   ├── routes/            # Route handlers
│   │   │   │   ├── products.py
│   │   │   │   ├── configurations.py
│   │   │   │   ├── jobs.py
│   │   │   │   └── health.py
│   │   │   └── router.py          # Aggregate v1 routes
│   │   └── deps.py                # Dependency injection
│   ├── blender/
│   │   ├── scripts/               # Blender Python scripts
│   │   │   └── generate_glb.py    # GLB generation script
│   │   ├── runner.py              # Blender subprocess runner
│   │   └── exceptions.py          # Blender-specific exceptions
│   ├── core/
│   │   ├── config.py              # App configuration (Pydantic Settings)
│   │   └── exceptions.py          # Base exception classes
│   ├── db/
│   │   ├── models/                # SQLAlchemy models
│   │   │   ├── base.py            # Base model with common fields
│   │   │   ├── client.py
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── configuration.py
│   │   │   └── job.py
│   │   ├── repositories/          # Data access layer
│   │   └── session.py             # Database session (async)
│   ├── schemas/                   # Pydantic schemas
│   │   ├── base.py                # Shared schema patterns
│   │   ├── product.py
│   │   ├── configuration.py
│   │   └── job.py
│   ├── services/                  # Business logic
│   ├── workers/                   # Background job processing
│   │   └── glb_generator.py       # GLB generation worker
│   └── main.py                    # FastAPI app entry
├── migrations/                    # Alembic migrations
├── tests/                         # Test suite
│   ├── conftest.py                # Pytest fixtures
│   ├── api/                       # API endpoint tests
│   ├── services/                  # Service layer tests
│   └── blender/                   # Blender integration tests
│       └── fixtures/              # Sample .blend files
├── Dockerfile
└── pyproject.toml
```

### Architecture Notes

**Single Container for MVP**: The API and Blender worker run in the same container for simplicity. The worker interface is designed to allow future extraction to separate worker containers with a message queue if scaling requires it.

### API Endpoints

#### Authentication
> **TODO**: Authentication not yet implemented. See [Future Considerations](#future-considerations) for planned approach.

#### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness probe |

#### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List available products |
| GET | `/api/v1/products/{id}` | Get product details with config schema |
| POST | `/api/v1/products` | Create product (admin) |

#### Configurations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/configurations` | List saved configurations |
| GET | `/api/v1/configurations/{id}` | Get configuration details |
| POST | `/api/v1/configurations` | Save a configuration |
| DELETE | `/api/v1/configurations/{id}` | Delete configuration |

#### Jobs (GLB Generation)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/jobs` | Submit GLB generation job |
| GET | `/api/v1/jobs/{id}` | Get job status and result |
| POST | `/api/v1/jobs/{id}/cancel` | Cancel a pending/queued job |

### Input Validation

All configuration data is validated against the product's JSON Schema before being passed to Blender. Each product defines a `config_schema` that specifies valid parameters, types, and constraints.

```python
# Example: Validate config_data against product schema
from jsonschema import validate

def validate_configuration(config_data: dict, product: Product):
    validate(instance=config_data, schema=product.config_schema)
```

## Data Model

```
┌─────────────┐                         ┌─────────────────┐
│   Client    │                         │                 │
└─────────────┘                         │                 │
      │                                  │                 │
      │             ┌─────────────┐     │  Configuration  │
      └────────────>│   Product   │────<│                 │
                    └─────────────┘     └─────────────────┘
                                                 │
┌─────────────┐                                  │
│    User     │                                  ▼
└─────────────┘                         ┌─────────────────┐
      │                                 │      Job        │
      └────────────────────────────────>└─────────────────┘
```

### Entities

**Client** - Business customer account
- `id` - Primary key
- `name` - Business name
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**User** - Individual user within a client
- `id` - Primary key
- `client_id` - Foreign key to Client
- `email` - User email
- `name` - Display name
- `role` - User role
- `created_at` - Creation timestamp

**Product** - Configurable product template
- `id` - Primary key
- `client_id` - Foreign key to Client
- `name` - Product name
- `description` - Product description
- `template_blob_path` - Reference to Blender template in Blob Storage
- `template_version` - Version string for cache invalidation
- `config_schema` - JSON Schema defining valid configuration options
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Configuration** - Saved product configuration
- `id` - Primary key
- `product_id` - Foreign key to Product
- `user_id` - Foreign key to User
- `name` - Configuration name
- `config_data` - JSON configuration values (validated against product schema)
- `product_schema_version` - Schema version at time of creation
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

**Job** - GLB generation job
- `id` - Primary key
- `configuration_id` - Foreign key to Configuration
- `status` - Job status (see below)
- `progress` - Progress percentage (0-100)
- `result_url` - URL to generated GLB in Blob Storage
- `error_code` - Machine-readable error code
- `error_message` - Human-readable error message
- `retry_count` - Number of retry attempts
- `max_retries` - Maximum retry attempts allowed
- `worker_id` - Identifier of worker processing this job
- `created_at` - Creation timestamp
- `started_at` - Processing start timestamp
- `completed_at` - Completion timestamp

### Job Status Flow

```
                    ┌────────────┐
                    │ CANCELLED  │
                    └────────────┘
                          ▲
                          │
┌─────────┐    ┌─────────┐│    ┌────────────┐    ┌───────────┐
│ PENDING │───>│ QUEUED  │├───>│ PROCESSING │───>│ COMPLETED │
└─────────┘    └─────────┘│    └────────────┘    └───────────┘
                          │           │
                          │           ▼ (on failure)
                          │    ┌────────────┐
                          └───>│   FAILED   │
                               └────────────┘
                                     │
                                     ▼ (if retries remain)
                               ┌─────────┐
                               │ PENDING │ (re-queued)
                               └─────────┘
```

**Status Definitions:**
- `PENDING` - Job created, awaiting queue pickup
- `QUEUED` - Job picked up by worker, preparing to process
- `PROCESSING` - Blender actively generating GLB
- `COMPLETED` - GLB generated and uploaded successfully
- `FAILED` - Job failed (check error_code/error_message)
- `CANCELLED` - Job cancelled by user or system

### Retry Logic

Failed jobs are automatically retried with exponential backoff:
- Base delay: 1 second
- Multiplier: 2x per retry
- Max retries: 3 (configurable)
- Delays: 1s → 2s → 4s

Only recoverable errors trigger retry (e.g., temporary Blender failures). Validation errors fail immediately without retry.

## GLB Generation Flow

```
┌──────────┐    POST /api/v1/jobs    ┌──────────┐
│ Frontend │───────────────────────>│   API    │
└──────────┘                        └────┬─────┘
     │                                   │
     │                                   ▼
     │                         ┌─────────────────┐
     │                         │  Validate       │
     │                         │  config_data    │
     │                         │  against schema │
     │                         └────────┬────────┘
     │                                  │
     │                                  ▼
     │                         ┌─────────────────┐
     │                         │  Create Job     │
     │                         │  (PENDING)      │
     │                         └────────┬────────┘
     │                                  │
     │    GET /api/v1/jobs/{id}         ▼
     │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  ┌─────────────────┐
     │   (poll status)        │  Background     │
     │                        │  Worker         │
     │                        │                 │
     │                        │  1. Load        │
     │                        │     template    │
     │                        │  2. Apply       │
     │                        │     config      │
     │                        │  3. Generate    │
     │                        │     geometry    │
     │                        │  4. Apply       │
     │                        │     materials   │
     │                        │  5. Export GLB  │
     │                        │  6. Upload to   │
     │                        │     Blob Storage│
     │                        └────────┬────────┘
     │                                 │
     │    GET /api/v1/jobs/{id}        ▼
     │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  ┌─────────────────┐
     │   (COMPLETED)          │  Update Job     │
     │                        │  (result_url)   │
     │                        └─────────────────┘
     │
     ▼
┌──────────┐    Fetch GLB      ┌─────────────┐
│ R3F      │<──────────────────│ Blob Storage│
│ Viewer   │                   └─────────────┘
└──────────┘
```

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.11+ (optional, for IDE support)

### Docker Compose Services
```yaml
services:
  db:        # PostgreSQL database
  api:       # FastAPI + Blender container
  azurite:   # Azure Storage emulator
```

The frontend runs on the host machine (`npm run dev`) for optimal hot reload performance.

### Getting Started
```bash
# Start infrastructure
docker compose up -d

# Install frontend dependencies
cd src/frontend && npm install

# Start frontend dev server
npm run dev

# API available at: http://localhost:8000
# Frontend available at: http://localhost:5173
# Azurite Blob Storage: http://localhost:10000
```

### Environment Variables

**Frontend** (`.env`)
```
VITE_API_URL=http://localhost:8000
```

**Backend** (`.env` or Docker Compose)
```
DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/configurator
AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true
BLENDER_PATH=/usr/bin/blender
BLENDER_MAX_CONCURRENT=2
BLENDER_TIMEOUT_SECONDS=300
```

## Testing

### Test Structure
```
tests/
├── conftest.py           # Shared fixtures, test database setup
├── factories/            # Test data factories
│   ├── client.py
│   ├── product.py
│   └── job.py
├── api/                  # API endpoint tests
│   ├── test_products.py
│   ├── test_configurations.py
│   └── test_jobs.py
├── services/             # Service layer tests
└── blender/              # Blender integration tests
    ├── test_runner.py
    └── fixtures/         # Sample .blend files for testing
```

### Testing Approach
- **Unit tests**: pytest with pytest-asyncio for async code
- **API tests**: httpx AsyncClient with test database
- **Blender tests**: Mock subprocess for unit tests, real Blender for integration tests
- **Test database**: Separate PostgreSQL instance via Docker Compose

## Deployment

### Frontend (Azure Static Web Apps)
- Build: `npm run build`
- Output: `dist/` directory
- Deploy via GitHub Actions or Azure CLI

### Backend (Azure Container Instances)
- Build Docker image with Blender
- Push to Azure Container Registry
- Deploy to Azure Container Instances
- Configure environment variables for production database and storage

### Infrastructure Requirements
- Azure Database for PostgreSQL (Flexible Server)
- Azure Blob Storage account
- Azure Container Registry (for Docker images)
- Azure Static Web Apps resource

## Security

### Authentication
> **TODO**: User authentication not yet implemented.
>
> **Planned approach:**
> - User login with email/password
> - JWT tokens stored in httpOnly cookies
> - Session-based access control
> - User belongs to a Client (multi-tenancy)

### Data Isolation
> **TODO**: Data isolation will be enforced after authentication is implemented.
>
> **Planned approach:**
> - All queries scoped to client via authenticated user's client_id
> - Users can only access their client's data
> - Job results stored with client-prefixed paths in Blob Storage

### Input Validation
- All configuration data validated against JSON Schema before Blender processing
- Prevents injection attacks via malformed configuration

## Observability

Structured logging should be implemented throughout the application. Consider Azure Application Insights integration for production monitoring and alerting.

## Future Considerations

### High Priority
- **User Authentication** - Email/password login, JWT sessions, password reset
- **Access Control** - Ability to disable client access when contracts end

### Medium Priority
- **WebSocket support** for real-time job progress updates
- **Separate worker containers** with message queue for horizontal scaling
- **Redis** for job queue if scaling requires it

### Low Priority
- **CDN** for GLB file delivery
- **Azure AD integration** for enterprise SSO
- **Kubernetes** deployment for auto-scaling
