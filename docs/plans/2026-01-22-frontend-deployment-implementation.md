# Frontend Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Azure Static Web Apps deployment workflows for test, production, and PR preview environments.

**Architecture:** Reusable GitHub Actions workflow pattern matching backend deployment. Vite environment configuration using `.env` files for test/prod/dev API URLs. Azure Static Web Apps with automatic PR previews.

**Tech Stack:** GitHub Actions, Azure Static Web Apps, Vite, Node.js 20

---

## Task 1: Create Environment Configuration Files

**Files:**
- Create: `src/frontend/.env.development`
- Create: `src/frontend/.env.test`
- Create: `src/frontend/.env.production`

**Step 1: Create .env.development**

Create `src/frontend/.env.development`:

```env
# Local development environment
VITE_API_URL=http://localhost:8000
```

**Step 2: Create .env.test**

Create `src/frontend/.env.test`:

```env
# Test environment
VITE_API_URL=https://ca-msscfg-test.ashyforest-bcfad665.westus2.azurecontainerapps.io
```

**Step 3: Create .env.production**

Create `src/frontend/.env.production`:

```env
# Production environment
VITE_API_URL=https://ca-msscfg-prod.ashyforest-bcfad665.westus2.azurecontainerapps.io
```

**Step 4: Verify existing API usage**

Check that `src/frontend/src/services/api.ts` already uses `import.meta.env.VITE_API_URL`:

```bash
grep "VITE_API_URL" src/frontend/src/services/api.ts
```

Expected output: `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';`

**Step 5: Test local build with environment**

```bash
cd src/frontend
npm run build -- --mode test
```

Expected: Build succeeds, check `dist/` created

**Step 6: Commit environment files**

```bash
git add src/frontend/.env.development src/frontend/.env.test src/frontend/.env.production
git commit -m "feat: Add environment configuration for frontend deployments

- .env.development for local dev (localhost:8000)
- .env.test for test environment
- .env.production for prod environment
- Vite automatically loads correct file based on --mode flag"
```

---

## Task 2: Create Reusable Frontend Deployment Workflow

**Files:**
- Create: `.github/workflows/deploy-frontend-reusable.yml`

**Step 1: Create reusable workflow file**

Create `.github/workflows/deploy-frontend-reusable.yml`:

```yaml
name: Deploy Frontend (Reusable)

on:
  workflow_call:
    inputs:
      environment:
        description: 'Environment to deploy to (test or prod)'
        required: true
        type: string
      is-preview:
        description: 'Whether this is a PR preview deployment'
        required: false
        type: boolean
        default: false
    secrets:
      AZURE_STATIC_WEB_APPS_API_TOKEN:
        required: true

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

      - name: Deployment summary
        if: ${{ !inputs.is-preview }}
        run: |
          echo "### Deployment Complete ✅" >> $GITHUB_STEP_SUMMARY
          echo "**Environment**: \`${{ inputs.environment }}\`" >> $GITHUB_STEP_SUMMARY
          echo "**Build Mode**: \`${{ inputs.environment }}\`" >> $GITHUB_STEP_SUMMARY

      - name: Preview deployment summary
        if: ${{ inputs.is-preview }}
        run: |
          echo "### PR Preview Deployed ✅" >> $GITHUB_STEP_SUMMARY
          echo "Preview URL will be posted in PR comment by Azure action" >> $GITHUB_STEP_SUMMARY
```

**Step 2: Commit reusable workflow**

```bash
git add .github/workflows/deploy-frontend-reusable.yml
git commit -m "feat: Add reusable frontend deployment workflow

- Supports test and prod environments
- PR preview deployments with automatic cleanup
- Uses Azure Static Web Apps deploy action
- Configurable environment via inputs
- Deployment summary for visibility"
```

---

## Task 3: Create Main Frontend Deployment Workflow

**Files:**
- Create: `.github/workflows/deploy-frontend.yml`

**Step 1: Create main workflow file**

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'src/frontend/**'
      - '.github/workflows/deploy-frontend*.yml'
  pull_request:
    types: [opened, synchronize, reopened, closed]
    paths:
      - 'src/frontend/**'
      - '.github/workflows/deploy-frontend*.yml'
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
      is-preview: false
    secrets:
      AZURE_STATIC_WEB_APPS_API_TOKEN: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}

  deploy-preview:
    if: github.event_name == 'pull_request'
    uses: ./.github/workflows/deploy-frontend-reusable.yml
    with:
      environment: test
      is-preview: true
    secrets:
      AZURE_STATIC_WEB_APPS_API_TOKEN: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
```

**Step 2: Commit main workflow**

```bash
git add .github/workflows/deploy-frontend.yml
git commit -m "feat: Add main frontend deployment workflow

- Deploys to test on push to main
- Creates PR previews automatically
- Manual dispatch for test/prod deployments
- Path filters for frontend changes only
- Uses reusable workflow for DRY"
```

---

## Task 4: Update Backend Deployment Workflow

**Files:**
- Modify: `.github/workflows/deploy-backend.yml`

**Step 1: Read current backend workflow**

```bash
cat .github/workflows/deploy-backend.yml
```

**Step 2: Update triggers section**

Modify `.github/workflows/deploy-backend.yml` to match this structure:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'src/backend/**'
      - '.github/workflows/deploy-backend*.yml'
  pull_request:
    types: [opened, synchronize, reopened]
    paths:
      - 'src/backend/**'
      - '.github/workflows/deploy-backend*.yml'
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
    uses: ./.github/workflows/deploy-backend-reusable.yml
    with:
      environment: ${{ inputs.environment || 'test' }}
      region: westus2
      skip-build: false
    secrets:
      SHARED_ACR_USERNAME: ${{ secrets.SHARED_ACR_USERNAME }}
      SHARED_ACR_PASSWORD: ${{ secrets.SHARED_ACR_PASSWORD }}
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}

  deploy-pr:
    if: github.event_name == 'pull_request'
    uses: ./.github/workflows/deploy-backend-reusable.yml
    with:
      environment: test
      region: westus2
      skip-build: false
    secrets:
      SHARED_ACR_USERNAME: ${{ secrets.SHARED_ACR_USERNAME }}
      SHARED_ACR_PASSWORD: ${{ secrets.SHARED_ACR_PASSWORD }}
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
```

**Step 3: Commit backend workflow update**

```bash
git add .github/workflows/deploy-backend.yml
git commit -m "feat: Update backend workflow to match frontend pattern

- Add PR triggers for backend deployments
- Add path filters (src/backend/** and workflow files)
- Add workflow_dispatch environment choice
- Matches frontend deployment trigger pattern
- PR deployments overwrite test environment"
```

---

## Task 5: Setup GitHub Secrets

**Files:**
- None (GitHub UI configuration)

**Step 1: Get Static Web App deployment token**

```bash
az staticwebapp secrets list \
  --name stapp-msscfg-test \
  --resource-group rg-msscfg-test-westus2 \
  --query 'properties.apiKey' \
  --output tsv
```

Expected: Long API token string

**Step 2: Add token to GitHub test environment**

Manual steps (document for user):

1. Go to: https://github.com/mssindustries/product-configurator/settings/environments
2. Click on "test" environment
3. Click "Add secret"
4. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
5. Value: Paste token from Step 1
6. Click "Add secret"

**Step 3: Document production setup (for later)**

Create note in deployment summary that production will need:
- Production Static Web App created
- Production deployment token added to prod environment

**Step 4: Create documentation commit**

Create `docs/github-secrets-frontend.md`:

```markdown
# GitHub Secrets for Frontend Deployment

## Test Environment

Navigate to: Settings → Environments → test

### Required Secrets

**AZURE_STATIC_WEB_APPS_API_TOKEN**
- **Purpose:** Deployment token for Azure Static Web App
- **Get value:**
  ```bash
  az staticwebapp secrets list \
    --name stapp-msscfg-test \
    --resource-group rg-msscfg-test-westus2 \
    --query 'properties.apiKey' \
    --output tsv
  ```

## Production Environment (when deployed)

Navigate to: Settings → Environments → prod

### Required Secrets

**AZURE_STATIC_WEB_APPS_API_TOKEN**
- **Purpose:** Deployment token for production Azure Static Web App
- **Get value:**
  ```bash
  az staticwebapp secrets list \
    --name stapp-msscfg-prod \
    --resource-group rg-msscfg-prod-westus2 \
    --query 'properties.apiKey' \
    --output tsv
  ```

## Notes

- Tokens are environment-specific
- Same secret name in both environments
- GitHub Actions automatically uses correct token based on environment
```

```bash
git add docs/github-secrets-frontend.md
git commit -m "docs: Add GitHub secrets documentation for frontend deployment

- Instructions for getting Static Web App deployment tokens
- Test and prod environment setup
- Azure CLI commands for token retrieval"
```

---

## Task 6: Test Deployment

**Files:**
- None (workflow execution)

**Step 1: Push changes to trigger test deployment**

```bash
git push origin main
```

Expected: GitHub Actions workflow triggers automatically

**Step 2: Monitor workflow execution**

```bash
gh run list --workflow="Deploy Frontend" --limit 1
```

Expected: Workflow "Deploy Frontend" shows as running or completed

**Step 3: Check workflow logs**

```bash
gh run watch
```

Expected:
- Node.js setup succeeds
- npm ci completes
- Build with --mode test succeeds
- Azure deployment succeeds

**Step 4: Verify deployment**

```bash
curl -I https://happy-hill-08bf5351e.6.azurestaticapps.net/
```

Expected: HTTP 200 OK

**Step 5: Test manual deployment**

```bash
gh workflow run "Deploy Frontend" -f environment=test
```

Expected: Workflow dispatched successfully

**Step 6: Document test results**

Add comment to issue #109:

```bash
gh issue comment 109 --body "## Deployment Workflow Testing

### Automated Test Deployment
- ✅ Push to main triggered workflow
- ✅ Frontend built with --mode test
- ✅ Deployed to: https://happy-hill-08bf5351e.6.azurestaticapps.net/
- ✅ Environment variables loaded from .env.test

### Manual Deployment
- ✅ Workflow dispatch works
- ✅ Environment selection works (test/prod)

### Next Steps
- Test PR preview deployments
- Configure production Static Web App when ready"
```

---

## Task 7: Test PR Preview Deployment

**Files:**
- None (workflow execution)

**Step 1: Create test branch**

```bash
git checkout -b test/pr-preview-verification
```

**Step 2: Make small frontend change**

Modify `src/frontend/src/App.tsx`:

Add a comment at the top:
```tsx
// Test PR preview deployment
```

**Step 3: Commit and push**

```bash
git add src/frontend/src/App.tsx
git commit -m "test: Verify PR preview deployment"
git push origin test/pr-preview-verification
```

**Step 4: Create PR**

```bash
gh pr create \
  --title "Test: PR Preview Deployment" \
  --body "Testing PR preview deployment workflow" \
  --base main \
  --head test/pr-preview-verification
```

Expected: PR created, workflow triggers

**Step 5: Check for preview URL in PR**

```bash
gh pr view --web
```

Expected: Azure bot comments with preview URL (e.g., `https://happy-hill-08bf5351e-{pr-number}.6.azurestaticapps.net`)

**Step 6: Verify preview is accessible**

After Azure comments with URL:
```bash
curl -I https://happy-hill-08bf5351e-{pr-number}.6.azurestaticapps.net/
```

Expected: HTTP 200 OK

**Step 7: Close PR to test cleanup**

```bash
gh pr close --delete-branch
```

Expected: Workflow triggers to clean up preview environment

**Step 8: Return to main branch**

```bash
git checkout main
```

---

## Task 8: Update Issue and Documentation

**Files:**
- None (GitHub issue updates)

**Step 1: Update issue #109 acceptance criteria**

Comment on issue:

```bash
gh issue comment 109 --body "## ✅ Implementation Complete

All acceptance criteria met:

### Part 1: Azure Static Web Apps Configuration
- ✅ Azure Static Web App created for test environment
- ✅ Custom domain: Using default azurestaticapps.net domain
- ✅ API proxy: Frontend calls backend directly (configured via VITE_API_URL)
- ✅ Environment variables configured (.env files)
- ✅ SSL/TLS certificates: Automatically provided by Azure

### Part 2: Frontend Deployment Workflow
- ✅ GitHub Actions workflow file created (deploy-frontend.yml + reusable)
- ✅ Workflow builds Vite app with optimized production settings
- ✅ Workflow deploys to Azure Static Web Apps (test environment)
- ✅ Environment-specific API URLs configured via .env files
- ✅ Preview deployments enabled for PRs
- ✅ Build artifacts optimized (Vite handles code splitting, minification)

### Additional Updates
- ✅ Backend workflow updated to match frontend trigger pattern
- ✅ Documentation added for GitHub secrets setup

### Testing
- ✅ Test deployment successful
- ✅ Manual dispatch works
- ✅ PR preview deployments verified"
```

**Step 2: Close issue #109**

```bash
gh issue close 109 --comment "Frontend deployment workflow implemented and tested. Production deployment ready when prod infrastructure is created."
```

**Step 3: Update parent issue #99**

```bash
gh issue comment 99 --body "### Progress Update

Completed:
- ✅ #101 Infrastructure Setup
- ✅ #107 Backend Data Layer
- ✅ #109 Frontend Deployment

Remaining:
- #104 Backend Container Deployment (in progress - workflows created, needs testing)

MVP test environment nearly complete!"
```

---

## Verification Checklist

After completing all tasks:

- [ ] Environment files created (.env.development, .env.test, .env.production)
- [ ] Reusable workflow created (deploy-frontend-reusable.yml)
- [ ] Main workflow created (deploy-frontend.yml)
- [ ] Backend workflow updated with PR triggers and path filters
- [ ] GitHub secrets configured (AZURE_STATIC_WEB_APPS_API_TOKEN in test environment)
- [ ] Test deployment successful (push to main)
- [ ] Manual deployment successful (workflow dispatch)
- [ ] PR preview deployment tested and verified
- [ ] Documentation updated (github-secrets-frontend.md)
- [ ] Issue #109 closed
- [ ] All commits follow conventional commit format

---

## Rollback Plan

If deployment fails:

**Rollback workflows:**
```bash
git revert HEAD~3..HEAD  # Revert last 3 commits
git push origin main
```

**Manual rollback in Azure:**
```bash
az staticwebapp deployment show \
  --name stapp-msscfg-test \
  --resource-group rg-msscfg-test-westus2
```

Find previous deployment ID and redeploy if needed via Azure Portal.

---

## Success Criteria

All tasks complete when:
- Frontend deploys automatically on push to main
- Manual deployments work for test and prod
- PR previews create automatically and clean up on PR close
- Environment variables correctly load based on build mode
- Backend workflow matches frontend trigger pattern
- Documentation complete and accurate
