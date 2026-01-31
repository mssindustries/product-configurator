# PR Workflow Quality Gates Design

## Overview

Restructure pull request workflows to include quality gates (test → build → deploy) before deployment. Split backend reusable workflow into separate build and deploy workflows to support different tagging strategies for main vs PRs.

## Problem Statement

Current PR workflows deploy immediately without running tests first. Additionally, the monolithic deploy-backend-reusable workflow doesn't support different image tagging strategies for main branch (sha-based) vs pull requests (pr-number based).

## Architecture Decision

### Split Backend Reusable Workflow

**Current (Monolithic):**
```
deploy-backend-reusable.yml
  ├─ Build Docker image
  ├─ Push to ACR
  └─ Deploy to Container Apps
```

**New (Split Pattern):**
```
build-backend-reusable.yml         deploy-backend-reusable.yml
  ├─ Build Docker image              ├─ Takes image tag as input
  ├─ Tag with input parameter        ├─ Deploy to Container Apps
  ├─ Push to ACR                     └─ Health check
  └─ Output: full image tag
```

**Benefits:**
- Build once, deploy many (immutable artifacts)
- Support different tagging strategies (sha-*, pr-*, release-*)
- Easy rollback (redeploy previous image tag)
- Clear separation of concerns
- Eliminates redundant builds

---

## Workflow Architecture

### Backend: Test → Build → Deploy

#### PR Workflow (`backend-pullrequest.yml`)

```yaml
name: Backend (Pull Request)

on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - 'src/backend/**'
      - '.github/workflows/backend*.yml'

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Python 3.12 + uv
      - Install dependencies (make install)
      - Run linting (make lint)
      - Run tests (make test-ci)

  build:
    name: Build
    needs: test
    uses: ./.github/workflows/build-backend-reusable.yml
    with:
      tag: pr-${{ github.event.pull_request.number }}
    secrets:
      SHARED_ACR_USERNAME: ${{ secrets.SHARED_ACR_USERNAME }}
      SHARED_ACR_PASSWORD: ${{ secrets.SHARED_ACR_PASSWORD }}

  deploy:
    name: Deploy to Test
    needs: build
    uses: ./.github/workflows/deploy-backend-reusable.yml
    with:
      environment: test
      region: westus2
      image_tag: ${{ needs.build.outputs.image_tag }}
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
```

**Image Tagging:**
- Format: `acrmsscfgsharedwestus2.azurecr.io/msscfg-backend:pr-130`
- Multiple commits to same PR overwrite the same tag
- Storage cost: ~$0.50-1.00/month for typical PR volume

#### Main Workflow (`backend-main.yml`)

```yaml
name: Backend (Main)

on:
  push:
    branches: [main]
    paths:
      - 'src/backend/**'
      - '.github/workflows/backend*.yml'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to (test or prod)'
        required: true
        type: choice
        options: [test, prod]
        default: test

jobs:
  build:
    uses: ./.github/workflows/build-backend-reusable.yml
    with:
      tag: sha-${{ github.sha }}
    secrets:
      SHARED_ACR_USERNAME: ${{ secrets.SHARED_ACR_USERNAME }}
      SHARED_ACR_PASSWORD: ${{ secrets.SHARED_ACR_PASSWORD }}

  deploy:
    needs: build
    uses: ./.github/workflows/deploy-backend-reusable.yml
    with:
      environment: ${{ (github.event_name == 'workflow_dispatch' && inputs.environment) || 'test' }}
      region: westus2
      image_tag: ${{ needs.build.outputs.image_tag }}
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
```

**Image Tagging:**
- Format: `acrmsscfgsharedwestus2.azurecr.io/msscfg-backend:sha-abc123`
- One tag per commit to main
- Enables easy rollback to any previous commit

---

### Frontend: Build/Test → Deploy

#### PR Workflow (`frontend-pullrequest.yml`)

```yaml
name: Frontend (Pull Request)

on:
  pull_request:
    types: [opened, synchronize, reopened, closed]
    paths:
      - 'src/frontend/**'
      - '.github/workflows/frontend*.yml'

permissions:
  contents: read
  pull-requests: write

jobs:
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 20
      - npm ci
      - npm run build -- --mode test
      - Upload dist/ artifact (retention: 1 day)
      - Install Playwright browsers
      - npm run test:e2e
      - Upload test results (if failed)

  deploy:
    name: Deploy Preview
    needs: build-and-test
    runs-on: ubuntu-latest
    environment: test
    steps:
      - Download dist/ artifact
      - Deploy to Azure Static Web Apps
        - skip_app_build: true
        - app_location: dist/
```

**No changes to frontend-main.yml** - remains as-is.

---

## New Reusable Workflows

### build-backend-reusable.yml

```yaml
name: Build Backend (Reusable)

on:
  workflow_call:
    inputs:
      tag:
        description: 'Image tag (e.g., pr-130, sha-abc123)'
        required: true
        type: string
    secrets:
      SHARED_ACR_USERNAME:
        required: true
      SHARED_ACR_PASSWORD:
        required: true
    outputs:
      image_tag:
        description: 'Full image tag with registry'
        value: ${{ jobs.build.outputs.image_tag }}

jobs:
  build:
    name: Build and Push
    runs-on: ubuntu-latest
    outputs:
      image_tag: ${{ steps.meta.outputs.image-full }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Azure Container Registry
        uses: azure/docker-login@v1
        with:
          login-server: ${{ secrets.SHARED_ACR_LOGIN_SERVER }}
          username: ${{ secrets.SHARED_ACR_USERNAME }}
          password: ${{ secrets.SHARED_ACR_PASSWORD }}

      - name: Generate image metadata
        id: meta
        run: |
          REGISTRY="${{ secrets.SHARED_ACR_LOGIN_SERVER }}"
          REPOSITORY="msscfg-backend"
          TAG="${{ inputs.tag }}"
          IMAGE_FULL="${REGISTRY}/${REPOSITORY}:${TAG}"

          echo "image-full=${IMAGE_FULL}" >> $GITHUB_OUTPUT
          echo "### Image Built 🐳" >> $GITHUB_STEP_SUMMARY
          echo "**Image**: \`${IMAGE_FULL}\`" >> $GITHUB_STEP_SUMMARY

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: src/backend
          file: src/backend/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.image-full }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### deploy-backend-reusable.yml (Modified)

```yaml
name: Deploy Backend (Reusable)

on:
  workflow_call:
    inputs:
      environment:
        description: 'Environment to deploy to (test or prod)'
        required: true
        type: string
      region:
        description: 'Azure region'
        required: true
        type: string
      image_tag:
        description: 'Full image tag to deploy'
        required: true
        type: string
    secrets:
      AZURE_CREDENTIALS:
        required: true

jobs:
  deploy:
    name: Deploy to ${{ inputs.environment }}
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    steps:
      - name: Generate resource names
        id: resources
        run: |
          ENV="${{ inputs.environment }}"
          REGION="${{ inputs.region }}"
          CONTAINER_APP="ca-msscfg-${ENV}"
          RESOURCE_GROUP="rg-msscfg-${ENV}-${REGION}"

          echo "container-app=${CONTAINER_APP}" >> $GITHUB_OUTPUT
          echo "resource-group=${RESOURCE_GROUP}" >> $GITHUB_OUTPUT

      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy to Azure Container Apps
        uses: azure/container-apps-deploy-action@v1
        with:
          containerAppName: ${{ steps.resources.outputs.container-app }}
          resourceGroup: ${{ steps.resources.outputs.resource-group }}
          imageToDeploy: ${{ inputs.image_tag }}

      - name: Health check
        run: |
          APP_URL=$(az containerapp show \
            --name ${{ steps.resources.outputs.container-app }} \
            --resource-group ${{ steps.resources.outputs.resource-group }} \
            --query properties.configuration.ingress.fqdn \
            --output tsv)

          for i in {1..5}; do
            RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://${APP_URL}/health)
            if [ "$RESPONSE" -eq 200 ]; then
              echo "### Deployment Complete ✅" >> $GITHUB_STEP_SUMMARY
              echo "**Image**: \`${{ inputs.image_tag }}\`" >> $GITHUB_STEP_SUMMARY
              echo "**Health Check**: Passed" >> $GITHUB_STEP_SUMMARY
              exit 0
            fi
            echo "Health check attempt $i failed, retrying..."
            sleep 10
          done
          echo "### Deployment Failed ❌" >> $GITHUB_STEP_SUMMARY
          exit 1
```

---

## Migration Strategy

### Phase 1: Create New Build Workflow
1. Create `build-backend-reusable.yml`
2. Extract build logic from `deploy-backend-reusable.yml`
3. Add image_tag output
4. Test with manual workflow dispatch

### Phase 2: Modify Deploy Workflow
1. Update `deploy-backend-reusable.yml`
2. Remove build steps
3. Add image_tag input parameter
4. Update Container Apps deploy to use input image

### Phase 3: Update Backend Main Workflow
1. Modify `backend-main.yml`
2. Split into build + deploy jobs
3. Use sha-based tagging
4. Pass image_tag between jobs

### Phase 4: Update Backend PR Workflow
1. Modify `backend-pullrequest.yml`
2. Add test job (lint + pytest)
3. Add build job (calls build-backend-reusable with pr-* tag)
4. Add deploy job (calls deploy-backend-reusable with image_tag)

### Phase 5: Update Frontend PR Workflow
1. Modify `frontend-pullrequest.yml`
2. Rename deploy job to build-and-test
3. Add artifact upload after build
4. Keep deploy job, download artifact

### Phase 6: Testing
1. Create test PR for backend changes
2. Verify test → build → deploy pipeline
3. Create test PR for frontend changes
4. Verify build-and-test → deploy pipeline
5. Push to main, verify workflows still work

---

## Files to Modify

### New Files
- `.github/workflows/build-backend-reusable.yml` (extracted from deploy-backend-reusable)

### Modified Files
- `.github/workflows/deploy-backend-reusable.yml` (remove build logic, add image_tag input)
- `.github/workflows/backend-main.yml` (split into build + deploy)
- `.github/workflows/backend-pullrequest.yml` (add test + build + deploy)
- `.github/workflows/frontend-pullrequest.yml` (add artifact passing)

### Unchanged Files
- `.github/workflows/frontend-main.yml` (no changes needed)
- `.github/workflows/deploy-frontend-reusable.yml` (no changes needed)
- `.github/workflows/test-backend.yml` (keep for main branch)
- `.github/workflows/test-frontend.yml` (keep for main branch)

---

## Cost Analysis

### Backend - Docker Image Storage

**ACR ProductCustomization:**
- Tier: Basic
- Included storage: 10 GB
- Additional storage: ~$0.003/GB/day (~$0.09/GB/month)

**Main Branch Images (sha-*):**
- Commits per month: ~50
- Image size: ~500 MB
- Storage: ~25 GB
- Cost: ~$1.50/month

**PR Images (pr-*):**
- PRs per month: ~10
- Image size: ~500 MB (one per PR, overwrites on new commits)
- Storage: ~5 GB
- Cost: ~$0.50/month

**Total: ~$2/month additional storage cost**

**Cleanup Strategy:**
- Manual: Delete pr-* tags after PR close/merge
- Future: Scheduled cleanup job (weekly)

### Frontend - Artifact Storage

- GitHub Actions artifact storage: Negligible (~$0.01/month)
- Artifacts auto-deleted after 1 day

---

## Success Criteria

- [x] Design approved
- [ ] `build-backend-reusable.yml` created
- [ ] `deploy-backend-reusable.yml` updated
- [ ] `backend-main.yml` updated (build + deploy split)
- [ ] `backend-pullrequest.yml` updated (test + build + deploy)
- [ ] `frontend-pullrequest.yml` updated (artifact passing)
- [ ] Test PR for backend workflow
- [ ] Test PR for frontend workflow
- [ ] Both workflows tested end-to-end
- [ ] Main branch workflows still function correctly
- [ ] Image tags visible in ACR (pr-*, sha-*)

---

## Future Enhancements

### Security Scanning
Add Trivy scanning to build-backend-reusable.yml:
```yaml
- name: Scan image for vulnerabilities
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ steps.meta.outputs.image-full }}
    severity: 'CRITICAL,HIGH'
    exit-code: '1'  # Fail build on critical vulns
```

### Image Cleanup Automation
Create scheduled workflow to delete old PR images:
```yaml
name: Cleanup ACR Images
on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly
jobs:
  cleanup:
    steps:
      - Delete pr-* tags for closed PRs
      - Keep sha-* tags from last 30 days
```

### Environment Protection
Add manual approval gates in GitHub Settings → Environments → test:
- Required reviewers
- Wait timer
- Branch restrictions

### Deployment Smoke Tests
Add smoke tests after deployment in deploy-backend-reusable.yml:
```yaml
- name: Smoke tests
  run: |
    # Test critical API endpoints
    # Validate database connectivity
    # Check external service integrations
```
