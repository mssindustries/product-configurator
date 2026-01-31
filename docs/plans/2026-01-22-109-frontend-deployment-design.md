# Frontend Deployment Design

**Issue:** #109
**Date:** 2026-01-22
**Status:** Approved

## Overview

Design for deploying the React + Vite frontend to Azure Static Web Apps with support for test, production, and PR preview environments.

---

## Architecture

### Workflow Structure

**Main workflow:** `.github/workflows/deploy-frontend.yml`
- Orchestrates deployments
- Handles triggers: push to main, manual dispatch, PR events

**Reusable workflow:** `.github/workflows/deploy-frontend-reusable.yml`
- Contains deployment logic
- Called by main workflow
- Mirrors backend deployment pattern

### Deployment Targets

**Test Static Web App:** `stapp-msscfg-test` (existing)
- URL: `https://happy-hill-08bf5351e.6.azurestaticapps.net`
- Deploys on: push to main, manual trigger
- Backend API: `https://ca-msscfg-test.ashyforest-bcfad665.westus2.azurecontainerapps.io`

**Production Static Web App:** `stapp-msscfg-prod` (to be created)
- URL: TBD when deployed
- Deploys on: manual trigger only (requires approval)
- Backend API: `https://ca-msscfg-prod.ashyforest-bcfad665.westus2.azurecontainerapps.io`

**PR Preview Environments:**
- URL: `https://happy-hill-08bf5351e-{pr-number}.6.azurestaticapps.net`
- Created/updated automatically on PR events
- Deleted automatically when PR closes
- Uses test backend API

### Deployment Triggers

**Frontend:**
- Push to main → deploy to test
- Manual dispatch → deploy to test or prod
- PR opened/updated → create/update preview environment

**Backend (updated to match):**
- Push to main → deploy to test
- Manual dispatch → deploy to test or prod
- PR opened/updated → deploy to test (no preview environments)

---

## Environment ProductCustomization

### .env Files

Create three environment files in `src/frontend/`:

**`.env.development`** (local dev):
```env
VITE_API_URL=http://localhost:8000
```

**`.env.test`** (test environment):
```env
VITE_API_URL=https://ca-msscfg-test.ashyforest-bcfad665.westus2.azurecontainerapps.io
```

**`.env.production`** (production environment):
```env
VITE_API_URL=https://ca-msscfg-prod.ashyforest-bcfad665.westus2.azurecontainerapps.io
```

### Vite Mode Loading

- `npm run dev` → loads `.env.development`
- `npm run build -- --mode test` → loads `.env.test`
- `npm run build -- --mode production` → loads `.env.production`

### Usage in Code

```typescript
// src/frontend/src/services/api.ts (already exists)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

All `.env` files are committed to repo (API URLs are public).

---

## Workflow Implementation

### Main Workflow

**File:** `.github/workflows/deploy-frontend.yml`

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths: ['src/frontend/**']
  pull_request:
    types: [opened, synchronize, reopened, closed]
    paths: ['src/frontend/**']
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to (test or prod)'
        required: true
        type: choice
        options:
          - test
          - prod
        default: test

jobs:
  deploy-test:
    if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'
    uses: ./.github/workflows/deploy-frontend-reusable.yml
    with:
      environment: ${{ inputs.environment || 'test' }}
    secrets: inherit

  deploy-preview:
    if: github.event_name == 'pull_request'
    uses: ./.github/workflows/deploy-frontend-reusable.yml
    with:
      environment: test
      is-preview: true
    secrets: inherit
```

**Key Features:**
- Path filters: only triggers when `src/frontend/**` changes
- Three trigger types: push to main, manual dispatch, PR events
- Uses reusable workflow for all deployments
- PR deployments flagged with `is-preview: true`

### Reusable Workflow

**File:** `.github/workflows/deploy-frontend-reusable.yml`

**Inputs:**
- `environment` (string, required): test or prod
- `is-preview` (boolean, default: false): whether this is a PR preview

**Secrets Required:**
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - deployment token (environment-specific)

**GitHub Environment Setup:**
- **test environment:** Set `AZURE_STATIC_WEB_APPS_API_TOKEN` for `stapp-msscfg-test`
- **prod environment:** Set `AZURE_STATIC_WEB_APPS_API_TOKEN` for `stapp-msscfg-prod`

**Deployment Steps:**

```yaml
jobs:
  deploy:
    name: Deploy to ${{ inputs.environment }}
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: src/frontend/package-lock.json

      - name: Install dependencies
        working-directory: src/frontend
        run: npm ci

      - name: Build application
        working-directory: src/frontend
        run: npm run build -- --mode ${{ inputs.environment }}

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: ${{ github.event_name == 'pull_request' && github.event.action == 'closed' && 'close' || 'upload' }}
          app_location: "src/frontend"
          output_location: "dist"
          api_location: ""
```

**Static Web App ProductCustomization:**
- `app_location: "src/frontend"` - where package.json is
- `output_location: "dist"` - Vite's default build output
- `api_location: ""` - no Azure Functions API

**Preview Handling:**
- PR previews automatically get unique URLs
- Closed PRs trigger cleanup (action handles automatically)

---

## Backend Workflow Updates

### Update deploy-backend.yml

**File:** `.github/workflows/deploy-backend.yml`

**Current triggers:**
```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

**Updated triggers:**
```yaml
on:
  push:
    branches: [main]
    paths: ['src/backend/**']
  pull_request:
    types: [opened, synchronize, reopened]
    paths: ['src/backend/**']
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to (test or prod)'
        required: true
        type: choice
        options:
          - test
          - prod
        default: test
```

**Changes:**
- Added path filter: only triggers when `src/backend/**` changes
- Added PR triggers (matching frontend pattern)
- Added environment choice input for manual dispatch

**Behavior:**
- Push to main → deploy backend to test
- PR opened/updated → deploy backend to test (overwrites test environment)
- Manual dispatch → choose test or prod

**Note:** Backend doesn't have separate preview environments like Static Web Apps - PR deployments overwrite the test environment.

---

## Verification

### After Deployment

**Test Environment:**
- Frontend accessible: `https://happy-hill-08bf5351e.6.azurestaticapps.net`

**PR Previews:**
- Open a test PR → verify preview URL is created in PR comment
- Preview is accessible

**Production (when deployed):**
- Frontend accessible at prod Static Web App URL

### Rollback Strategy

- Redeploy previous commit via manual workflow dispatch
- Static Web Apps keeps deployment history in Azure portal

---

## Files to Create/Modify

### Create:
1. `src/frontend/.env.development`
2. `src/frontend/.env.test`
3. `src/frontend/.env.production`
4. `.github/workflows/deploy-frontend.yml`
5. `.github/workflows/deploy-frontend-reusable.yml`

### Modify:
1. `.github/workflows/deploy-backend.yml` - add PR triggers and path filters

### GitHub Secrets Setup:
1. Test environment: Add `AZURE_STATIC_WEB_APPS_API_TOKEN`
2. Prod environment: Add `AZURE_STATIC_WEB_APPS_API_TOKEN` (when prod deployed)

---

## Implementation Order

1. Create `.env` files in `src/frontend/`
2. Create reusable workflow: `deploy-frontend-reusable.yml`
3. Create main workflow: `deploy-frontend.yml`
4. Update backend workflow: `deploy-backend.yml`
5. Get deployment token from Azure Static Web App
6. Add token to GitHub test environment secrets
7. Test deployment: manual dispatch to test
8. Test PR preview: create test PR

---

## Success Criteria

- [ ] Frontend deploys on push to main
- [ ] PR previews are created automatically
- [ ] Manual deployment to test works
- [ ] Environment variables correctly loaded (.env.test for test, .env.production for prod)
- [ ] Backend workflow matches frontend pattern (PR triggers, path filters)
- [ ] Deployment tokens configured in GitHub environments
