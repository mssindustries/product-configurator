# Migration Plan: Next.js to Vite + FastAPI Architecture

This document outlines the tasks required to migrate from the current Next.js implementation to the new Vite React + FastAPI + Blender architecture.

## How to Use This Plan

Each task below is designed to be a single GitHub issue. Tasks are grouped into phases that should be completed in order. Within each phase, tasks can often be parallelized.

**Issue Format:**
- Title is the task name
- Description includes context, requirements, and acceptance criteria
- Labels suggested for categorization

---

## Phase 1: Project Restructure & Infrastructure Setup

These tasks set up the new project structure and local development environment.

---

### Task 1.1: Create new directory structure and move existing code

**Labels:** `infrastructure`, `migration`

**Context:**
The current codebase has a Next.js app in `src/webapp/`. We need to restructure to have separate `frontend/` and `backend/` directories.

**Requirements:**
1. Create new top-level directories:
   ```
   /frontend/    # Will contain Vite React app
   /backend/     # Will contain FastAPI app
   /docker/      # Docker-related files
   ```
2. Move existing Next.js code to a temporary location or archive it (we'll extract reusable components later)
3. Update `.gitignore` for new structure
4. Remove Next.js-specific files from root

**Acceptance Criteria:**
- [ ] New directory structure exists
- [ ] Old Next.js code is preserved (archived or in separate branch)
- [ ] `.gitignore` updated for Python, Vite, and Docker artifacts
- [ ] Root `package.json` removed (will be in frontend/)

---

### Task 1.2: Initialize Vite React frontend project

**Labels:** `frontend`, `infrastructure`

**Context:**
We're replacing Next.js with a Vite-powered React SPA. The frontend will be deployed to Azure Static Web Apps.

**Requirements:**
1. Initialize Vite project in `frontend/` with React and TypeScript template:
   ```bash
   npm create vite@latest frontend -- --template react-ts
   ```
2. Install core dependencies:
   - `react-router-dom` - client-side routing
   - `@react-three/fiber` - 3D rendering
   - `@react-three/drei` - R3F helpers
   - `three` - Three.js
   - `@types/three` - TypeScript types
3. Configure `vite.config.ts` with appropriate settings
4. Set up path aliases (`@/` → `src/`)
5. Configure TypeScript (`tsconfig.json`)
6. Add Tailwind CSS (v4)

**Acceptance Criteria:**
- [ ] `npm run dev` starts Vite dev server on port 5173
- [ ] `npm run build` produces production build in `dist/`
- [ ] TypeScript configured with strict mode
- [ ] Path aliases working (`@/components/...`)
- [ ] Tailwind CSS working

---

### Task 1.3: Initialize FastAPI backend project

**Labels:** `backend`, `infrastructure`

**Context:**
We need a Python FastAPI backend that will handle API requests and run Blender for GLB generation.

**Requirements:**
1. Create `backend/` directory structure per ARCHITECTURE.md:
   ```
   backend/
   ├── app/
   │   ├── api/
   │   │   ├── v1/
   │   │   │   ├── routes/
   │   │   │   └── router.py
   │   │   └── deps.py
   │   ├── blender/
   │   ├── core/
   │   │   ├── config.py
   │   │   ├── security.py
   │   │   └── exceptions.py
   │   ├── db/
   │   │   ├── models/
   │   │   ├── repositories/
   │   │   └── session.py
   │   ├── schemas/
   │   ├── services/
   │   ├── workers/
   │   └── main.py
   ├── migrations/
   ├── tests/
   └── pyproject.toml
   ```
2. Create `pyproject.toml` with dependencies:
   - `fastapi`
   - `uvicorn[standard]`
   - `sqlalchemy[asyncio]`
   - `asyncpg`
   - `pydantic`
   - `pydantic-settings`
   - `alembic`
   - `python-multipart`
   - `httpx` (for testing)
   - `pytest`, `pytest-asyncio`
3. Create minimal `main.py` with health endpoint
4. Create `core/config.py` with Pydantic Settings

**Acceptance Criteria:**
- [ ] `uvicorn app.main:app --reload` starts server on port 8000
- [ ] `GET /health` returns `{"status": "healthy"}`
- [ ] Configuration loads from environment variables
- [ ] Directory structure matches ARCHITECTURE.md

---

### Task 1.4: Create Docker Compose local development environment

**Labels:** `infrastructure`, `docker`

**Context:**
Local development uses Docker Compose to run PostgreSQL, Azurite (Azure Storage emulator), and the FastAPI backend. The frontend runs on the host.

**Requirements:**
1. Create `docker-compose.yml` in project root with services:
   - `db`: PostgreSQL 15+
   - `api`: FastAPI + Blender (build from Dockerfile)
   - `azurite`: Azure Storage emulator
2. Create `backend/Dockerfile`:
   - Base image with Python 3.11+
   - Install Blender (headless)
   - Install Python dependencies
   - Set up proper user permissions
3. Create `.env.example` with all required environment variables
4. Create `docker/` directory for any additional Docker configs
5. Add volume mounts for:
   - PostgreSQL data persistence
   - Azurite data persistence
   - Backend code (for hot reload)

**Acceptance Criteria:**
- [ ] `docker compose up -d` starts all services
- [ ] PostgreSQL accessible on localhost:5432
- [ ] API accessible on localhost:8000
- [ ] Azurite accessible on localhost:10000 (blob), 10001 (queue), 10002 (table)
- [ ] Backend hot-reloads on code changes
- [ ] `docker compose down` cleanly stops all services

---

### Task 1.5: Create backend Dockerfile with Blender

**Labels:** `backend`, `docker`

**Context:**
The backend container needs both Python/FastAPI and Blender installed for GLB generation.

**Requirements:**
1. Create `backend/Dockerfile` that:
   - Uses Python 3.11 slim base image
   - Installs Blender via apt or downloads official release
   - Installs Python dependencies from `pyproject.toml`
   - Sets `BLENDER_PATH` environment variable
   - Runs as non-root user
   - Exposes port 8000
2. Optimize for layer caching (dependencies before code)
3. Keep image size reasonable (document final size)

**Acceptance Criteria:**
- [ ] Docker image builds successfully
- [ ] `blender --version` works inside container
- [ ] FastAPI starts and responds to requests
- [ ] Image size documented in PR description
- [ ] Non-root user configured

---

## Phase 2: Database & Core Backend

Set up the database models, migrations, and core backend infrastructure.

---

### Task 2.1: Create SQLAlchemy models for all entities

**Labels:** `backend`, `database`

**Context:**
We need SQLAlchemy 2.0+ async models for all entities defined in ARCHITECTURE.md.

**Requirements:**
1. Create `app/db/models/base.py` with:
   - Base declarative class
   - Common mixin for `id`, `created_at`, `updated_at`
   - Naming convention for constraints
2. Create model files:
   - `client.py` - Client entity
   - `api_key.py` - ApiKey entity (with relationship to Client)
   - `user.py` - User entity (with relationship to Client)
   - `product.py` - Product entity (with relationship to Client)
   - `configuration.py` - Configuration entity (relationships to Product, User)
   - `job.py` - Job entity (with relationship to Configuration, JobStatus enum)
3. Define all fields per ARCHITECTURE.md data model
4. Create `__init__.py` that exports all models

**Acceptance Criteria:**
- [ ] All 6 entities created with correct fields
- [ ] Relationships properly defined with foreign keys
- [ ] JobStatus enum created with all states (PENDING, QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED)
- [ ] Base mixin provides id, created_at, updated_at
- [ ] Models use async-compatible patterns

**Reference:** See ARCHITECTURE.md "Data Model" section for entity definitions.

---

### Task 2.2: Set up Alembic migrations

**Labels:** `backend`, `database`

**Context:**
We need Alembic configured for database migrations with async support.

**Requirements:**
1. Initialize Alembic in `backend/`:
   ```bash
   alembic init migrations
   ```
2. Configure `alembic.ini` and `migrations/env.py` for:
   - Async SQLAlchemy engine
   - Load database URL from app config
   - Auto-generate migrations from models
3. Create initial migration with all tables
4. Add migration commands to development workflow docs

**Acceptance Criteria:**
- [ ] `alembic revision --autogenerate -m "initial"` creates migration
- [ ] `alembic upgrade head` creates all tables in PostgreSQL
- [ ] `alembic downgrade -1` rolls back successfully
- [ ] Migration works with Docker Compose PostgreSQL

---

### Task 2.3: Create async database session management

**Labels:** `backend`, `database`

**Context:**
FastAPI needs async database session handling with proper connection pooling.

**Requirements:**
1. Create `app/db/session.py` with:
   - Async engine creation with connection pooling
   - AsyncSession factory
   - Dependency for FastAPI routes (`get_db`)
2. Configure connection pool settings:
   - `pool_size`: 20
   - `max_overflow`: 10
   - `pool_pre_ping`: True
3. Handle session lifecycle properly (commit/rollback)

**Acceptance Criteria:**
- [ ] Database sessions work in FastAPI routes
- [ ] Connection pooling configured
- [ ] Sessions properly closed after requests
- [ ] Works with both Docker PostgreSQL and test database

---

### Task 2.4: Implement API key authentication

**Labels:** `backend`, `security`

**Context:**
All API endpoints (except /health) require authentication via `X-API-Key` header.

**Requirements:**
1. Create `app/core/security.py` with:
   - API key validation function
   - Password hashing utilities (argon2)
   - `get_current_client` dependency for FastAPI
2. Create `app/api/deps.py` with:
   - `get_db` dependency
   - `get_current_client` dependency (validates API key, returns Client)
3. API key validation should:
   - Look up key hash in ApiKey table
   - Check not expired (`expires_at`)
   - Check not revoked (`revoked_at` is null)
   - Update `last_used_at`
   - Return associated Client

**Acceptance Criteria:**
- [ ] Requests without `X-API-Key` header return 401
- [ ] Invalid API keys return 401
- [ ] Expired keys return 401
- [ ] Revoked keys return 401
- [ ] Valid keys allow request to proceed
- [ ] `last_used_at` updated on successful auth

---

### Task 2.5: Create base Pydantic schemas

**Labels:** `backend`, `api`

**Context:**
We need Pydantic V2 schemas for API request/response serialization.

**Requirements:**
1. Create `app/schemas/base.py` with:
   - Base schema config (`model_config = ConfigDict(from_attributes=True)`)
   - Pagination response schema
   - Standard error response schema
2. Create schemas for each entity:
   - `product.py`: ProductCreate, ProductResponse, ProductList
   - `configuration.py`: ConfigurationCreate, ConfigurationResponse, ConfigurationList
   - `job.py`: JobCreate, JobResponse, JobStatus enum
3. Use Pydantic V2 patterns (ConfigDict, field_validator, computed_field)

**Acceptance Criteria:**
- [ ] All schemas created with proper validation
- [ ] Schemas use `from_attributes=True` for ORM compatibility
- [ ] Request schemas validate input properly
- [ ] Response schemas exclude sensitive fields (e.g., key_hash)

---

## Phase 3: API Endpoints

Implement all REST API endpoints.

---

### Task 3.1: Implement Products API endpoints

**Labels:** `backend`, `api`

**Context:**
Products are configurable product templates that belong to a client.

**Requirements:**
1. Create `app/api/v1/routes/products.py` with:
   - `GET /api/v1/products` - List products for current client
   - `GET /api/v1/products/{id}` - Get product details with config_schema
   - `POST /api/v1/products` - Create new product
2. All endpoints require authentication (use `get_current_client` dependency)
3. Scope all queries to the authenticated client
4. Return proper error responses (404, 422, etc.)

**Acceptance Criteria:**
- [ ] List endpoint returns only client's products
- [ ] Get endpoint returns 404 for other client's products
- [ ] Create endpoint associates product with client
- [ ] Proper pagination for list endpoint
- [ ] OpenAPI docs generated correctly

---

### Task 3.2: Implement Configurations API endpoints

**Labels:** `backend`, `api`

**Context:**
Configurations are saved product configurations created by users.

**Requirements:**
1. Create `app/api/v1/routes/configurations.py` with:
   - `GET /api/v1/configurations` - List configurations
   - `GET /api/v1/configurations/{id}` - Get configuration details
   - `POST /api/v1/configurations` - Save new configuration
   - `DELETE /api/v1/configurations/{id}` - Delete configuration
2. Validate `config_data` against product's `config_schema` using jsonschema
3. Store `product_schema_version` at creation time
4. Scope all queries to authenticated client

**Acceptance Criteria:**
- [ ] CRUD operations work correctly
- [ ] Config data validated against product schema
- [ ] Invalid config data returns 422 with clear error message
- [ ] Cannot access other client's configurations
- [ ] Delete returns 204 on success

---

### Task 3.3: Implement Jobs API endpoints

**Labels:** `backend`, `api`

**Context:**
Jobs represent GLB generation tasks. They're created, polled for status, and can be cancelled.

**Requirements:**
1. Create `app/api/v1/routes/jobs.py` with:
   - `POST /api/v1/jobs` - Submit new GLB generation job
   - `GET /api/v1/jobs/{id}` - Get job status and result
   - `POST /api/v1/jobs/{id}/cancel` - Cancel pending/queued job
2. Job creation should:
   - Validate configuration exists and belongs to client
   - Set initial status to PENDING
   - Set `max_retries` from config (default 3)
3. Job response should include `result_url` when COMPLETED
4. Cancel should only work for PENDING/QUEUED jobs

**Acceptance Criteria:**
- [ ] Job creation returns job ID and PENDING status
- [ ] Get endpoint returns current status and progress
- [ ] Completed jobs include `result_url`
- [ ] Failed jobs include `error_code` and `error_message`
- [ ] Cancel returns 400 if job already processing/completed

---

### Task 3.4: Create API router aggregation

**Labels:** `backend`, `api`

**Context:**
All v1 routes need to be aggregated and mounted on the FastAPI app.

**Requirements:**
1. Create `app/api/v1/router.py` that:
   - Imports all route modules
   - Creates v1 router with `/api/v1` prefix
   - Includes all routes with appropriate tags
2. Update `app/main.py` to:
   - Mount v1 router
   - Add health endpoint at root level
   - Configure CORS for frontend origin
   - Add exception handlers

**Acceptance Criteria:**
- [ ] All endpoints accessible under `/api/v1/`
- [ ] `/health` accessible at root (no auth required)
- [ ] CORS configured for `http://localhost:5173`
- [ ] OpenAPI docs at `/docs` show all endpoints
- [ ] Global exception handlers return consistent error format

---

## Phase 4: Blender Integration

Implement the Blender subprocess runner and GLB generation worker.

---

### Task 4.1: Create Blender subprocess runner

**Labels:** `backend`, `blender`

**Context:**
We need to run Blender as a subprocess to generate GLB files from templates.

**Requirements:**
1. Create `app/blender/runner.py` with:
   - `BlenderRunner` class
   - Async subprocess execution using `asyncio.create_subprocess_exec`
   - Semaphore for concurrency limiting (`BLENDER_MAX_CONCURRENT`)
   - Timeout handling (`BLENDER_TIMEOUT_SECONDS`)
   - Proper cleanup of temp files
2. Create `app/blender/exceptions.py` with:
   - `BlenderError` base exception
   - `BlenderTimeoutError`
   - `BlenderExecutionError`
3. Runner should:
   - Write config data to temp JSON file
   - Invoke Blender with script and args
   - Return path to generated GLB
   - Clean up temp files on success or failure

**Acceptance Criteria:**
- [ ] Blender executes without blocking event loop
- [ ] Concurrent jobs limited by semaphore
- [ ] Timeout kills Blender process
- [ ] Temp files cleaned up
- [ ] Proper exceptions raised on failure

---

### Task 4.2: Create Blender GLB generation script

**Labels:** `backend`, `blender`

**Context:**
Blender runs a Python script that loads a template, applies configuration, and exports GLB.

**Requirements:**
1. Create `app/blender/scripts/generate_glb.py` that:
   - Reads config JSON path and output path from command line args (after `--`)
   - Loads the Blender template file
   - Applies configuration parameters to the model
   - Exports as GLB with Draco compression
2. Script runs in Blender's Python environment (not FastAPI's)
3. Handle common operations:
   - Modify dimensions/scale
   - Change materials/colors
   - Show/hide components

**Acceptance Criteria:**
- [ ] Script can be invoked via `blender --background template.blend --python script.py -- config.json output.glb`
- [ ] Produces valid GLB file
- [ ] Applies configuration parameters correctly
- [ ] Exits with non-zero code on error

---

### Task 4.3: Implement background job worker

**Labels:** `backend`, `worker`

**Context:**
A background worker polls for pending jobs and processes them using Blender.

**Requirements:**
1. Create `app/workers/glb_generator.py` with:
   - `GLBGeneratorWorker` class
   - Poll database for PENDING jobs
   - Update job status through lifecycle
   - Use BlenderRunner for GLB generation
   - Upload result to blob storage
   - Implement retry logic with exponential backoff
2. Worker lifecycle:
   - Pick up PENDING job → set QUEUED
   - Start processing → set PROCESSING, set `started_at`
   - Success → set COMPLETED, set `result_url`, set `completed_at`
   - Failure → set FAILED or retry based on `retry_count`
3. Integrate with FastAPI lifespan for startup/shutdown

**Acceptance Criteria:**
- [ ] Worker starts with FastAPI app
- [ ] Jobs progress through status states correctly
- [ ] Failed jobs retry with exponential backoff
- [ ] Max retries respected
- [ ] Worker stops gracefully on shutdown

---

### Task 4.4: Implement Azure Blob Storage integration

**Labels:** `backend`, `storage`

**Context:**
Generated GLB files are uploaded to Azure Blob Storage (or Azurite locally).

**Requirements:**
1. Add `azure-storage-blob` to dependencies
2. Create `app/services/storage_service.py` with:
   - `StorageService` class
   - Upload GLB file to blob storage
   - Generate blob URL for result
   - Support both production (Azure) and local (Azurite)
3. Blob path pattern: `clients/{client_id}/jobs/{job_id}.glb`
4. Handle connection string from environment

**Acceptance Criteria:**
- [ ] GLB files upload to Azurite locally
- [ ] Blob URLs accessible from frontend
- [ ] Connection string configurable via environment
- [ ] Proper error handling for upload failures

---

## Phase 5: Frontend Migration

Migrate React components from Next.js to Vite and connect to backend.

---

### Task 5.1: Set up React Router with basic routes

**Labels:** `frontend`, `routing`

**Context:**
The frontend needs client-side routing for home, configurator, and saved configurations pages.

**Requirements:**
1. Install and configure `react-router-dom`
2. Create route structure in `App.tsx`:
   - `/` - Home page
   - `/configure/:productId` - Configurator
   - `/saved` - Saved configurations
3. Create placeholder page components:
   - `pages/HomePage.tsx`
   - `pages/ConfiguratorPage.tsx`
   - `pages/SavedPage.tsx`
4. Set up layout component with navigation

**Acceptance Criteria:**
- [ ] Navigation between routes works
- [ ] URL reflects current route
- [ ] Browser back/forward works
- [ ] 404 handling for unknown routes

---

### Task 5.2: Create API client service

**Labels:** `frontend`, `api`

**Context:**
The frontend needs an API client to communicate with the FastAPI backend.

**Requirements:**
1. Create `src/services/api.ts` with:
   - Base fetch wrapper with error handling
   - API key header injection (from config/context)
   - Type-safe methods for all endpoints:
     - `getProducts()`, `getProduct(id)`
     - `getConfigurations()`, `getConfiguration(id)`, `saveConfiguration()`, `deleteConfiguration()`
     - `createJob()`, `getJob(id)`, `cancelJob(id)`
2. Create `src/types/api.ts` with TypeScript types matching backend schemas
3. Handle API errors with user-friendly messages
4. Support polling for job status

**Acceptance Criteria:**
- [ ] All API endpoints have typed methods
- [ ] Errors handled gracefully
- [ ] API URL configurable via `VITE_API_URL`
- [ ] Request/response types match backend

---

### Task 5.3: Migrate React Three Fiber components

**Labels:** `frontend`, `3d`

**Context:**
The existing R3F components (Scene3D, CabinetModel, Lights) need to be migrated from Next.js.

**Requirements:**
1. Copy and adapt from `src/webapp/components/scene/`:
   - `Scene3D.tsx` - Canvas and camera setup
   - `Lights.tsx` - Lighting setup
2. Create new `ModelViewer.tsx` that:
   - Loads GLB from URL (not static file)
   - Handles loading states
   - Shows error state if load fails
3. Update imports for Vite (remove Next.js specific)
4. Ensure components work without `'use client'` directive

**Acceptance Criteria:**
- [ ] 3D scene renders correctly
- [ ] GLB models load from URL
- [ ] OrbitControls work
- [ ] Loading spinner while model loads
- [ ] Error display if model fails to load

---

### Task 5.4: Migrate control panel components

**Labels:** `frontend`, `ui`

**Context:**
The configuration UI controls need to be migrated and connected to the API.

**Requirements:**
1. Copy and adapt from `src/webapp/components/controls/`:
   - `ControlPanel.tsx`
   - `ColorPicker.tsx`
   - `MaterialSelector.tsx`
   - `DimensionSlider.tsx`
2. Update to work with dynamic config schemas:
   - Render controls based on product's `config_schema`
   - Support different field types (color, select, range)
3. Connect to configuration state (not global context)

**Acceptance Criteria:**
- [ ] Controls render based on product schema
- [ ] Value changes update local state
- [ ] Controls styled consistently with Tailwind

---

### Task 5.5: Implement ConfiguratorPage with full flow

**Labels:** `frontend`, `feature`

**Context:**
The main configurator page ties everything together: load product, configure, generate GLB, view result.

**Requirements:**
1. Implement `pages/ConfiguratorPage.tsx`:
   - Load product details on mount (from route param)
   - Render config controls from product schema
   - Show 3D viewer (initially empty or placeholder)
   - "Generate" button creates job
   - Poll job status until complete
   - Load generated GLB into viewer
2. Handle states:
   - Loading product
   - Configuring (no GLB yet)
   - Generating (job in progress with progress bar)
   - Viewing (GLB loaded)
   - Error states
3. "Save Configuration" button to persist

**Acceptance Criteria:**
- [ ] Full flow works: configure → generate → view
- [ ] Progress shown during generation
- [ ] Error states handled gracefully
- [ ] Can save configuration
- [ ] Generated GLB displays in viewer

---

### Task 5.6: Implement SavedPage with configuration list

**Labels:** `frontend`, `feature`

**Context:**
Users need to view and manage their saved configurations.

**Requirements:**
1. Implement `pages/SavedPage.tsx`:
   - Fetch configurations list on mount
   - Display as cards or table
   - Show configuration name, product name, created date
   - "View" button navigates to configurator with loaded config
   - "Delete" button with confirmation
2. Handle empty state
3. Handle loading state

**Acceptance Criteria:**
- [ ] Configurations list displays
- [ ] Can navigate to view a configuration
- [ ] Can delete a configuration
- [ ] Empty state shown when no configurations
- [ ] Loading state shown while fetching

---

## Phase 6: Testing & Documentation

Add tests and update documentation.

---

### Task 6.1: Create backend API tests

**Labels:** `backend`, `testing`

**Context:**
We need automated tests for all API endpoints.

**Requirements:**
1. Set up test infrastructure:
   - `tests/conftest.py` with fixtures
   - Test database (separate from dev)
   - Async test client
2. Create test files:
   - `tests/api/test_health.py`
   - `tests/api/test_products.py`
   - `tests/api/test_configurations.py`
   - `tests/api/test_jobs.py`
3. Test coverage:
   - Happy path for all endpoints
   - Authentication failures
   - Validation errors
   - Not found errors
   - Authorization (can't access other client's data)

**Acceptance Criteria:**
- [ ] `pytest` runs all tests
- [ ] Tests use isolated test database
- [ ] All endpoints have basic coverage
- [ ] Auth tests verify 401 responses
- [ ] CI can run tests (add to GitHub Actions if exists)

---

### Task 6.2: Create Blender integration tests

**Labels:** `backend`, `testing`, `blender`

**Context:**
Blender integration needs tests to verify GLB generation works.

**Requirements:**
1. Create test fixtures:
   - Simple `.blend` template file in `tests/blender/fixtures/`
   - Sample configuration JSON
2. Create tests:
   - `tests/blender/test_runner.py` - Unit tests with mocked subprocess
   - `tests/blender/test_integration.py` - Integration tests with real Blender (can be skipped in CI without Blender)
3. Test scenarios:
   - Successful GLB generation
   - Timeout handling
   - Invalid config handling
   - Concurrent job limits

**Acceptance Criteria:**
- [ ] Unit tests pass without Blender installed
- [ ] Integration tests marked with `@pytest.mark.integration`
- [ ] Tests verify GLB file is valid
- [ ] Timeout test verifies process killed

---

### Task 6.3: Update CLAUDE.md for new architecture

**Labels:** `documentation`

**Context:**
CLAUDE.md needs to be updated to reflect the new project structure and development workflow.

**Requirements:**
1. Update project overview for Vite + FastAPI architecture
2. Update tech stack section
3. Add development workflow:
   - How to start Docker Compose
   - How to run frontend
   - How to run tests
   - How to run migrations
4. Update agent selection guide if needed
5. Remove Next.js specific guidance

**Acceptance Criteria:**
- [ ] CLAUDE.md reflects current architecture
- [ ] Development commands are accurate
- [ ] Agent guidance is appropriate for new stack

---

### Task 6.4: Create README with setup instructions

**Labels:** `documentation`

**Context:**
The project needs a README with clear setup and development instructions.

**Requirements:**
1. Update or create `README.md` with:
   - Project description
   - Prerequisites (Docker, Node.js, etc.)
   - Quick start guide
   - Development setup steps
   - Environment variables reference
   - Testing instructions
   - Deployment overview (link to ARCHITECTURE.md)
2. Keep it concise, link to detailed docs where appropriate

**Acceptance Criteria:**
- [ ] New developer can set up project following README
- [ ] All prerequisites listed
- [ ] Environment variables documented
- [ ] Links to ARCHITECTURE.md for details

---

## Phase 7: Cleanup & Polish

Final cleanup tasks before the migration is complete.

---

### Task 7.1: Remove old Next.js code

**Labels:** `cleanup`, `migration`

**Context:**
Once migration is complete and verified, remove the old Next.js code.

**Requirements:**
1. Delete `src/webapp/` directory (or wherever old code was archived)
2. Remove any Next.js related configs from root
3. Clean up any unused dependencies
4. Verify nothing breaks

**Acceptance Criteria:**
- [ ] Old Next.js code removed
- [ ] No broken references
- [ ] Git history preserved (old code accessible via git)
- [ ] Project builds and runs successfully

---

### Task 7.2: Update SPEC.md for new architecture

**Labels:** `documentation`

**Context:**
SPEC.md may have outdated information about the original architecture.

**Requirements:**
1. Review SPEC.md
2. Update or remove sections that reference old architecture
3. Ensure feature roadmap aligns with new architecture
4. Add reference to ARCHITECTURE.md for technical details

**Acceptance Criteria:**
- [ ] SPEC.md doesn't reference old Next.js architecture
- [ ] Roadmap is still accurate
- [ ] Links to ARCHITECTURE.md where appropriate

---

### Task 7.3: Create sample Blender template

**Labels:** `content`, `blender`

**Context:**
We need at least one sample Blender template to demonstrate the system.

**Requirements:**
1. Create a simple parametric product in Blender:
   - Basic geometry (e.g., cabinet, box, simple furniture)
   - Named components that can be shown/hidden
   - Materials that can be swapped
   - Dimensions that can be modified
2. Save as `.blend` file
3. Create corresponding `config_schema` JSON
4. Document the template structure

**Acceptance Criteria:**
- [ ] Template file works with GLB generation
- [ ] Config schema allows meaningful customization
- [ ] Documentation explains how to create new templates

---

## Dependency Graph

```
Phase 1 (Infrastructure)
├── 1.1 Directory structure
├── 1.2 Vite frontend ─────────────────────────────────┐
├── 1.3 FastAPI backend ───────┐                       │
├── 1.4 Docker Compose ────────┤                       │
└── 1.5 Dockerfile ────────────┘                       │
                                                       │
Phase 2 (Database) ← depends on 1.3, 1.4              │
├── 2.1 SQLAlchemy models                              │
├── 2.2 Alembic migrations ← 2.1                       │
├── 2.3 Database session                               │
├── 2.4 API key auth ← 2.1, 2.3                        │
└── 2.5 Pydantic schemas ← 2.1                         │
                                                       │
Phase 3 (API) ← depends on Phase 2                    │
├── 3.1 Products API ← 2.4, 2.5                        │
├── 3.2 Configurations API ← 2.4, 2.5                  │
├── 3.3 Jobs API ← 2.4, 2.5                            │
└── 3.4 Router aggregation ← 3.1, 3.2, 3.3             │
                                                       │
Phase 4 (Blender) ← depends on 1.5, 3.3               │
├── 4.1 Blender runner                                 │
├── 4.2 GLB script ← 4.1                               │
├── 4.3 Job worker ← 4.1, 4.2, 3.3                     │
└── 4.4 Blob storage ← 4.3                             │
                                                       │
Phase 5 (Frontend) ← depends on 1.2, 3.4, 4.4 ────────┘
├── 5.1 React Router
├── 5.2 API client ← 3.4
├── 5.3 R3F components
├── 5.4 Control components
├── 5.5 Configurator page ← 5.1, 5.2, 5.3, 5.4
└── 5.6 Saved page ← 5.1, 5.2

Phase 6 (Testing) ← can start alongside Phase 3+
├── 6.1 API tests
├── 6.2 Blender tests
├── 6.3 Update CLAUDE.md
└── 6.4 Create README

Phase 7 (Cleanup) ← after Phase 5 complete
├── 7.1 Remove Next.js
├── 7.2 Update SPEC.md
└── 7.3 Sample template
```

## Labels Reference

| Label | Description |
|-------|-------------|
| `infrastructure` | Project setup, Docker, CI/CD |
| `frontend` | Vite/React frontend code |
| `backend` | FastAPI backend code |
| `database` | SQLAlchemy, migrations, queries |
| `api` | REST API endpoints |
| `blender` | Blender integration |
| `worker` | Background job processing |
| `storage` | Azure Blob Storage |
| `security` | Authentication, authorization |
| `testing` | Tests and test infrastructure |
| `documentation` | Docs, README, CLAUDE.md |
| `cleanup` | Removing old code, refactoring |
| `migration` | Migration-specific tasks |
| `routing` | Frontend routing |
| `ui` | UI components |
| `feature` | Feature implementation |
| `3d` | 3D rendering (R3F/Three.js) |
| `content` | Sample content, templates |
