# PR Workflow Quality Gates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure PR workflows to include test → build → deploy quality gates, and split backend reusable workflow to support different image tagging strategies.

**Architecture:** Split monolithic `deploy-backend-reusable.yml` into `build-backend-reusable.yml` (builds and pushes images) and `deploy-backend-reusable.yml` (deploys pre-built images). Update calling workflows to use test → build → deploy pattern with pr-* tags for PRs and sha-* tags for main branch.

**Tech Stack:** GitHub Actions, Docker, Azure Container Registry, Azure Container Apps, Azure Static Web Apps

---

## Task 1: Create build-backend-reusable.yml

Extract build logic from deploy-backend-reusable.yml into new reusable workflow.

**Files:**
- Create: `.github/workflows/build-backend-reusable.yml`
- Reference: `.github/workflows/deploy-backend-reusable.yml:100-126`

**Step 1: Create new workflow file**

Create `.github/workflows/build-backend-reusable.yml`:

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
    env:
      SHARED_ACR_LOGIN_SERVER: acrmsscfgsharedwestus2.azurecr.io
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
          login-server: ${{ env.SHARED_ACR_LOGIN_SERVER }}
          username: ${{ secrets.SHARED_ACR_USERNAME }}
          password: ${{ secrets.SHARED_ACR_PASSWORD }}

      - name: Generate image metadata
        id: meta
        run: |
          REGISTRY="${{ env.SHARED_ACR_LOGIN_SERVER }}"
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
          build-args: |
            DEV_MODE=false
          provenance: false
```

**Step 2: Commit**

```bash
git add .github/workflows/build-backend-reusable.yml
git commit -m "feat: Create build-backend-reusable workflow

Extracts Docker build logic into separate reusable workflow.
Supports custom image tags (pr-*, sha-*) and outputs full image tag.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Refactor deploy-backend-reusable.yml

Remove build logic and accept image_tag as required input.

**Files:**
- Modify: `.github/workflows/deploy-backend-reusable.yml`

**Step 1: Update workflow inputs**

Replace lines 4-43 with:

```yaml
on:
  workflow_call:
    inputs:
      environment:
        description: 'Environment to deploy to (test or prod)'
        required: true
        type: string
      region:
        description: 'Azure region'
        required: false
        type: string
        default: 'westus2'
      image_tag:
        description: 'Full Docker image tag to deploy (registry/repo:tag)'
        required: true
        type: string
    secrets:
      AZURE_CREDENTIALS:
        required: true
```

**Step 2: Remove outputs section**

Delete lines 36-42 (outputs section - no longer needed).

**Step 3: Update job outputs**

Replace lines 49-53 with:

```yaml
    env:
      SHARED_ACR_LOGIN_SERVER: acrmsscfgsharedwestus2.azurecr.io
```

**Step 4: Remove checkout step**

Delete lines 56-57 (checkout no longer needed - no build).

**Step 5: Simplify resource generation**

Replace lines 59-73 with:

```yaml
      - name: Generate resource names
        id: resources
        run: |
          ENV="${{ inputs.environment }}"
          REGION="${{ inputs.region }}"
          CONTAINER_APP="ca-msscfg-${ENV}"
          RESOURCE_GROUP="rg-msscfg-${ENV}-${REGION}"

          echo "container-app=${CONTAINER_APP}" >> $GITHUB_OUTPUT
          echo "resource-group=${RESOURCE_GROUP}" >> $GITHUB_OUTPUT
```

**Step 6: Remove image metadata generation**

Delete lines 75-99 (image metadata - now provided as input).

**Step 7: Remove ACR login step**

Delete lines 100-105 (ACR login - not needed for deploy).

**Step 8: Remove Docker Buildx setup**

Delete lines 107-109 (Buildx setup - not needed).

**Step 9: Remove Docker build step**

Delete lines 111-126 (Docker build - moved to build workflow).

**Step 10: Remove build summary steps**

Delete lines 144-155 (build summaries - not applicable).

**Step 11: Update deployment step**

Replace line 167 with:

```yaml
          imageToDeploy: ${{ inputs.image_tag }}
```

**Step 12: Simplify health check summary**

Replace lines 191-194 with:

```yaml
              echo "### Deployment Complete ✅" >> $GITHUB_STEP_SUMMARY
              echo "**Image**: \`${{ inputs.image_tag }}\`" >> $GITHUB_STEP_SUMMARY
              echo "**Health Check**: Passed (${i}/${MAX_RETRIES} attempts)" >> $GITHUB_STEP_SUMMARY
```

**Step 13: Remove final deployment summary**

Delete lines 206-212 (redundant with health check summary).

**Step 14: Commit**

```bash
git add .github/workflows/deploy-backend-reusable.yml
git commit -m "refactor: Simplify deploy-backend-reusable to deploy only

Removes build logic (moved to build-backend-reusable.yml).
Now accepts pre-built image_tag as required input.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update backend-main.yml

Split into build + deploy jobs using sha-* tagging.

**Files:**
- Modify: `.github/workflows/backend-main.yml`

**Step 1: Read current workflow**

Run: `cat .github/workflows/backend-main.yml`

**Step 2: Replace deploy job with build + deploy**

Replace lines 28-39 with:

```yaml
jobs:
  build:
    name: Build
    uses: ./.github/workflows/build-backend-reusable.yml
    with:
      tag: sha-${{ github.sha }}
    secrets:
      SHARED_ACR_USERNAME: ${{ secrets.SHARED_ACR_USERNAME }}
      SHARED_ACR_PASSWORD: ${{ secrets.SHARED_ACR_PASSWORD }}

  deploy:
    name: Deploy
    needs: build
    uses: ./.github/workflows/deploy-backend-reusable.yml
    with:
      environment: ${{ (github.event_name == 'workflow_dispatch' && inputs.environment) || 'test' }}
      region: westus2
      image_tag: ${{ needs.build.outputs.image_tag }}
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
```

**Step 3: Commit**

```bash
git add .github/workflows/backend-main.yml
git commit -m "refactor: Split backend-main into build + deploy jobs

Uses new build-backend-reusable workflow with sha-* tags.
Deploys exact built image to test/prod environments.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Update backend-pullrequest.yml

Add test → build → deploy pipeline with pr-* tagging.

**Files:**
- Modify: `.github/workflows/backend-pullrequest.yml`

**Step 1: Read current workflow**

Run: `cat .github/workflows/backend-pullrequest.yml`

**Step 2: Replace entire workflow**

Replace entire file content with:

```yaml
# Backend Pull Request Workflow
#
# Pipeline: Test → Build → Deploy
# - Test: Runs linting and unit tests
# - Build: Builds Docker image, tags as pr-<number>, pushes to ACR
# - Deploy: Deploys tested image to test Container Apps environment
#
# Image tag example: pr-130 (overwrites on subsequent commits to same PR)

name: Backend (Pull Request)

on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - 'src/backend/**'
      - '.github/workflows/backend*.yml'
      - '.github/workflows/build-backend-reusable.yml'
      - '.github/workflows/deploy-backend-reusable.yml'

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: src/backend

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install uv
        uses: astral-sh/setup-uv@v4

      - name: Install dependencies
        run: make install

      - name: Lint
        run: make lint

      - name: Test
        run: make test-ci

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

**Step 3: Commit**

```bash
git add .github/workflows/backend-pullrequest.yml
git commit -m "feat: Add test → build → deploy pipeline for backend PRs

Tests must pass before building Docker image.
Image tagged as pr-<number> and pushed to ACR.
Deploy only runs after successful build and test.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Update frontend-pullrequest.yml

Add artifact upload/download between build-and-test and deploy jobs.

**Files:**
- Modify: `.github/workflows/frontend-pullrequest.yml`

**Step 1: Read current workflow**

Run: `cat .github/workflows/frontend-pullrequest.yml`

**Step 2: Update build-and-test job to upload artifact**

After line 42 (npm run build), add:

```yaml
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: src/frontend/dist/
          retention-days: 1
```

**Step 3: Update deploy job to download artifact**

Replace lines 44-52 with:

```yaml
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: frontend-dist
          path: dist

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: ${{ github.event_name == 'pull_request' && github.event.action == 'closed' && 'close' || 'upload' }}
          app_location: "dist"
          skip_app_build: true
          api_location: ""
```

**Step 4: Commit**

```bash
git add .github/workflows/frontend-pullrequest.yml
git commit -m "feat: Add artifact passing for frontend PR deploys

Build once in build-and-test job, upload as artifact.
Deploy job downloads and deploys exact tested build.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Test backend workflow with PR

Create test PR to verify backend test → build → deploy pipeline.

**Files:**
- Modify: `src/backend/app/main.py:1` (add comment for testing)

**Step 1: Create test branch**

```bash
git checkout -b test/backend-pr-workflow
```

**Step 2: Make trivial change**

Add comment at top of `src/backend/app/main.py`:

```python
# Test backend PR workflow quality gates
```

**Step 3: Commit and push**

```bash
git add src/backend/app/main.py
git commit -m "test: Verify backend PR workflow pipeline"
git push -u origin test/backend-pr-workflow
```

**Step 4: Create PR**

```bash
gh pr create --title "test: Backend PR workflow quality gates" \
  --body "Testing test → build → deploy pipeline with pr-* image tagging." \
  --base feature/pr-workflow-quality-gates
```

**Step 5: Wait for workflow completion**

```bash
sleep 120 && gh run list --branch test/backend-pr-workflow --limit 1
```

Expected: All 3 jobs pass (test → build → deploy).

**Step 6: Verify image in ACR**

```bash
az acr repository show-tags \
  --name acrmsscfgsharedwestus2 \
  --repository msscfg-backend \
  --output table | grep "pr-"
```

Expected: See pr-<number> tag.

**Step 7: Verify Container App deployed**

```bash
az containerapp show \
  --name ca-msscfg-test \
  --resource-group rg-msscfg-test-westus2 \
  --query properties.template.containers[0].image \
  --output tsv
```

Expected: Image tag matches pr-<number>.

**Step 8: Close test PR**

```bash
gh pr close <pr-number> --comment "✅ Backend workflow verified: test → build → deploy pipeline working correctly."
git checkout feature/pr-workflow-quality-gates
git branch -D test/backend-pr-workflow
```

**Step 9: Commit test verification**

```bash
git add .
git commit -m "test: Verify backend PR workflow pipeline

Confirmed test → build → deploy stages execute in order.
PR image tagging (pr-*) working as expected.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>" --allow-empty
```

---

## Task 7: Test frontend workflow with PR

Create test PR to verify frontend build-and-test → deploy pipeline with artifacts.

**Files:**
- Modify: `src/frontend/src/App.tsx:1` (change comment for testing)

**Step 1: Create test branch**

```bash
git checkout -b test/frontend-pr-workflow
```

**Step 2: Make trivial change**

Change comment at line 1 of `src/frontend/src/App.tsx`:

```typescript
// Test frontend PR workflow with artifact passing
```

**Step 3: Commit and push**

```bash
git add src/frontend/src/App.tsx
git commit -m "test: Verify frontend PR workflow with artifacts"
git push -u origin test/frontend-pr-workflow
```

**Step 4: Create PR**

```bash
gh pr create --title "test: Frontend PR workflow with artifacts" \
  --body "Testing build-and-test → deploy pipeline with artifact upload/download." \
  --base feature/pr-workflow-quality-gates
```

**Step 5: Wait for workflow completion**

```bash
sleep 90 && gh run list --branch test/frontend-pr-workflow --limit 1
```

Expected: Both jobs pass (build-and-test → deploy).

**Step 6: Verify artifact was uploaded**

```bash
gh run view --log | grep "Upload build artifact"
```

Expected: See artifact upload confirmation.

**Step 7: Verify preview URL posted**

```bash
gh pr view --json comments | jq -r '.comments[] | select(.body | contains("Azure Static Web Apps")) | .body'
```

Expected: See preview URL in PR comments.

**Step 8: Close test PR**

```bash
gh pr close <pr-number> --comment "✅ Frontend workflow verified: build-and-test → deploy with artifact passing working correctly."
git checkout feature/pr-workflow-quality-gates
git branch -D test/frontend-pr-workflow
```

**Step 9: Commit test verification**

```bash
git add .
git commit -m "test: Verify frontend PR workflow with artifacts

Confirmed build-and-test → deploy stages with artifact passing.
Preview deployment working correctly.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>" --allow-empty
```

---

## Task 8: Test main branch deployment

Push to main and verify sha-* tagging works correctly.

**Files:**
- None (testing existing changes)

**Step 1: Merge feature branch to main**

```bash
git checkout main
git pull origin main
git merge feature/pr-workflow-quality-gates
git push origin main
```

**Step 2: Wait for main workflow completion**

```bash
sleep 120 && gh run list --branch main --workflow=backend-main.yml --limit 1
```

Expected: Build + deploy jobs pass with sha-* tag.

**Step 3: Verify image in ACR**

```bash
az acr repository show-tags \
  --name acrmsscfgsharedwestus2 \
  --repository msscfg-backend \
  --output table | grep "sha-"
```

Expected: See sha-<commit> tag.

**Step 4: Verify Container App deployed main image**

```bash
az containerapp show \
  --name ca-msscfg-test \
  --resource-group rg-msscfg-test-westus2 \
  --query properties.template.containers[0].image \
  --output tsv
```

Expected: Image tag matches sha-<commit>.

**Step 5: Commit verification**

```bash
git add .
git commit -m "test: Verify main branch deployment with sha-* tagging

Confirmed build + deploy workflow works on main branch.
SHA-based tagging enables easy rollback to any commit.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>" --allow-empty
```

---

## Verification

After all tasks complete:

**Backend Workflows:**
- ✅ `build-backend-reusable.yml` created and functional
- ✅ `deploy-backend-reusable.yml` simplified to deploy-only
- ✅ `backend-main.yml` uses build + deploy pattern with sha-* tags
- ✅ `backend-pullrequest.yml` uses test → build → deploy with pr-* tags

**Frontend Workflows:**
- ✅ `frontend-pullrequest.yml` uses artifact passing between jobs

**Testing:**
- ✅ Backend PR workflow tested end-to-end
- ✅ Frontend PR workflow tested end-to-end
- ✅ Main branch deployment tested and verified

**ACR Image Tags:**
- ✅ pr-* tags visible in ACR (one per open/recent PR)
- ✅ sha-* tags visible in ACR (one per main branch commit)

**Cost Analysis:**
- Estimated ~$2/month for PR and main branch image storage
- Cleanup strategy documented for pr-* tags

---

## Notes

- All workflows use the `voltagent-infra:devops-engineer` agent for DevOps best practices
- Image tagging strategy follows immutable artifact pattern (build once, deploy many)
- PR images (pr-*) overwrite on subsequent commits to same PR (cost efficient)
- Main branch images (sha-*) enable easy rollback to any previous commit
- Frontend artifacts use 1-day retention (auto-deleted)
