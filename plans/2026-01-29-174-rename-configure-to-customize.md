# Rename Configure to Customize

**Issue:** #174
**Domain:** backend, frontend, infrastructure
**Date:** 2026-01-29

## Goal

Rename all occurrences of "configuration/configurator" to "product-customization/customizer" throughout the entire codebase for consistent and descriptive terminology.

**Key Terminology Changes:**
- `configuration` → `product_customization` (Python/backend)
- `Configuration` → `ProductCustomization` (class names)
- `configurations` → `product_customizations` (table/collection names)
- `configurator` → `customizer` (application name)
- Frontend: `configuration` → `productCustomization` (camelCase)

## Scope

This is a **breaking change** that affects:
- Database models and schemas
- API endpoints and routes
- Frontend components and services
- Documentation
- Infrastructure configuration
- Environment variables

**Total occurrences:** ~556 across 80 files

## Architecture Impact

### Database Changes
- Rename `configuration` model to `product_customization`
- This will require:
  - Database migration (Alembic)
  - Table rename: `configurations` → `product_customizations`
  - Foreign key updates in `jobs` table
  - Column rename: `configuration_id` → `product_customization_id`

### API Changes
- Rename `/api/v1/configurations` → `/api/v1/product-customizations`
- Update all request/response schemas
- Update repository layer
- JSON response keys will use camelCase: `productCustomization`

### Frontend Changes
- Rename all components, services, types
- Use camelCase: `ProductCustomization`, `productCustomization`
- Update API service calls
- Update routing: `/configurations` → `/product-customizations`

## Implementation Strategy

**Approach:** Big bang rename with migration

**Rationale:**
- This is a terminology change affecting the entire system
- Incremental changes would create inconsistency
- Better to do it all at once with a clear migration path

## Files to Modify

### Backend - Database Layer (src/backend/)

**Models:**
- `app/db/models/configuration.py` → `app/db/models/product_customization.py`
  - Rename class `Configuration` → `ProductCustomization`
  - Update table name: `__tablename__ = "product_customizations"`
- `app/db/models/job.py` - Update foreign key relationship
  - `configuration_id` → `product_customization_id`
  - `configuration` relationship → `product_customization`
- `app/db/models/__init__.py` - Update import

**Schemas:**
- `app/schemas/configuration.py` → `app/schemas/product_customization.py`
  - Rename all classes:
    - `ConfigurationCreate` → `ProductCustomizationCreate`
    - `ConfigurationUpdate` → `ProductCustomizationUpdate`
    - `ConfigurationResponse` → `ProductCustomizationResponse`
    - etc.
  - Update `model_config` alias if using Pydantic aliases
- `app/schemas/job.py` - Update references
- `app/schemas/__init__.py` - Update import

**Repositories:**
- `app/repositories/configuration.py` → `app/repositories/product_customization.py`
  - Rename class `ConfigurationRepository` → `ProductCustomizationRepository`
- `app/repositories/__init__.py` - Update import

**API Routes:**
- `app/api/v1/routes/configurations.py` → `app/api/v1/routes/product_customizations.py`
  - Update all endpoint paths: `/configurations` → `/product-customizations`
  - Update function names (e.g., `create_configuration` → `create_product_customization`)
  - Update route tags: `"configurations"` → `"product-customizations"`
- `app/api/v1/routes/jobs.py` - Update request body parameter names
- `app/api/v1/router.py` - Update router import and path

**Tests:**
- `tests/api/test_configurations.py` → `tests/api/test_product_customizations.py`
  - Update all test functions
  - Update API paths: `/api/v1/configurations` → `/api/v1/product-customizations`
  - Update fixture names
- `tests/api/test_jobs.py` - Update fixture and API paths

### Backend - Infrastructure

**Configuration:**
- `app/core/config.py` - Update any configuration-related settings
- `app/core/exceptions.py` - Update exception messages

**Database Migration:**
- Create Alembic migration to rename table

### Frontend (src/frontend/)

**Types:**
- `src/types/api.ts` - Rename types:
  - `Configuration` → `ProductCustomization`
  - Use camelCase for properties: `configurationId` → `productCustomizationId`

**Services:**
- `src/services/api.ts` - Update API endpoint paths:
  - `/api/v1/configurations` → `/api/v1/product-customizations`
  - Function names: `getConfigurations` → `getProductCustomizations`

**Components/Pages:**
- Update any components that reference configurations
  - Variable names: `configuration` → `productCustomization`
  - Props: `configurationId` → `productCustomizationId`
- Check for hardcoded strings
- Update route paths if any

**Documentation:**
- `src/frontend/README.md` - Update references

### Documentation & Config (root)

**Documentation:**
- `README.md` - Update project description
  - "Product Configurator" → "Product Customizer"
- `CLAUDE.md` - Update references throughout
- `ARCHITECTURE.md` - Update architecture diagrams/descriptions
- `docs/` directory - Search and update all mentions

**Configuration Files:**
- `.env.example` - Update variable names/descriptions
- `docker-compose.yml` - Update service names/descriptions
- `pyproject.toml` - Update project name and metadata
  - `mss-configurator-backend` → `mss-customizer-backend`
- `package.json` - Update project name and description
  - Consider: `product-configurator` → `product-customizer`

### Infrastructure (infra/)

**Bicep Modules:**
- Update resource names and descriptions
- Check for hardcoded "configurator" strings

## Migration Plan

### Phase 1: Backend Database & Models
1. Create Alembic migration to rename table
2. Rename model files and classes
3. Update all imports

### Phase 2: Backend API Layer
1. Rename repository files and classes
2. Rename schema files and classes
3. Rename route files and update endpoints
4. Update router configuration

### Phase 3: Backend Tests
1. Rename test files
2. Update test functions and API paths
3. Run tests to verify backend changes

### Phase 4: Frontend
1. Update types
2. Update API service calls
3. Update components
4. Test frontend functionality

### Phase 5: Documentation & Config
1. Update all documentation
2. Update configuration files
3. Update environment examples

### Phase 6: Infrastructure
1. Update Bicep files
2. Update deployment scripts

## Verification

- [ ] Backend tests pass (make test)
- [ ] Frontend tests pass (npm test)
- [ ] Frontend builds without errors (npm run build)
- [ ] Backend linting passes (make lint)
- [ ] Frontend linting passes (npm run lint)
- [ ] Database migration runs successfully
- [ ] API endpoints respond at new paths
- [ ] Frontend can communicate with renamed API
- [ ] Documentation is consistent
- [ ] No references to "configuration/configurator" remain (except in commit history)

## Risks & Considerations

1. **Breaking Change:** Existing API clients will break
   - Mitigation: This is early development, acceptable
   - Future: Add API versioning before production

2. **Database Migration:** Table rename in production requires downtime
   - Mitigation: Not in production yet, safe to do

3. **Scope Creep:** 556 occurrences across 80 files
   - Mitigation: Systematic approach, thorough testing

## Notes

- This rename should be done in a single PR to avoid confusion
- All tests must pass before merging
- Consider adding a redirect from old to new API paths (optional)
