# GitHub Environments Setup

This document explains how to configure GitHub environments for the MSS Product Configurator deployment workflows.

## Overview

The backend deployment workflow (`.github/workflows/deploy-backend.yml`) uses GitHub environments to manage deployments to `test` and `prod` environments with different credentials and protection rules.

## Environment Configuration

### 1. Create Environments

In your GitHub repository:

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Create two environments: `test` and `prod`

### 2. Configure Test Environment

**Environment: `test`**

**Protection Rules:**
- No required reviewers (auto-deploy on push to main)
- Deployment branches: `main` only (or leave as "All branches" for manual triggers from feature branches)

**Environment Secrets:**
```
ACR_USERNAME          # Azure Container Registry username
ACR_PASSWORD          # Azure Container Registry password
AZURE_CREDENTIALS     # Azure service principal credentials (JSON)
DATABASE_URL          # PostgreSQL connection string
AZURE_STORAGE_CONNECTION_STRING  # (Optional - if not using managed identity)
```

**Environment Variables:**
```
(None required - resource names are set dynamically in workflow)
```

### 3. Configure Production Environment

**Environment: `prod`**

**Protection Rules:**
- **Required reviewers**: Add yourself and/or team members (1-6 reviewers)
- **Wait timer**: Optional - add a delay before deployment (e.g., 5 minutes)
- **Deployment branches**: `main` only (prevents accidental prod deploys from feature branches)

**Environment Secrets:**
```
ACR_USERNAME          # Azure Container Registry username (prod)
ACR_PASSWORD          # Azure Container Registry password (prod)
AZURE_CREDENTIALS     # Azure service principal credentials (JSON, prod)
DATABASE_URL          # PostgreSQL connection string (prod)
AZURE_STORAGE_CONNECTION_STRING  # (Optional - if not using managed identity)
```

**Environment Variables:**
```
(None required - resource names are set dynamically in workflow)
```

## Secret Values

### ACR_USERNAME and ACR_PASSWORD

**Option 1: ACR Admin User (Quick, not recommended for production)**
```bash
# Enable admin user
az acr update --name acrmsscfgtestwestus2 --admin-enabled true

# Get credentials
az acr credential show --name acrmsscfgtestwestus2

# Use the username and password in GitHub secrets
```

**Option 2: Service Principal (Recommended)**
```bash
# Create service principal with AcrPush role
az ad sp create-for-rbac \
  --name "msscfg-github-acr-test" \
  --role AcrPush \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/rg-msscfg-test-westus2/providers/Microsoft.ContainerRegistry/registries/acrmsscfgtestwestus2

# Use appId as ACR_USERNAME
# Use password as ACR_PASSWORD
```

### AZURE_CREDENTIALS

Create a service principal with permissions to deploy Container Apps:

```bash
# Create service principal with Contributor role on resource group
az ad sp create-for-rbac \
  --name "msscfg-github-deploy-test" \
  --role Contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/rg-msscfg-test-westus2 \
  --sdk-auth

# Copy the entire JSON output to AZURE_CREDENTIALS secret
```

The JSON format should look like:
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

### DATABASE_URL

PostgreSQL connection string for the environment:

**Test:**
```
postgresql+asyncpg://pgadmin:<PASSWORD>@psql-msscfg-test-westus2.postgres.database.azure.com:5432/configurator?sslmode=require
```

**Production:**
```
postgresql+asyncpg://pgadmin:<PASSWORD>@psql-msscfg-prod-westus2.postgres.database.azure.com:5432/configurator?sslmode=require
```

## Deployment Flow

### Test Environment

**Automatic deployment on push to main:**
```
Push to main → Build → Deploy to test → Health checks
```

**Manual deployment:**
```
Actions → Deploy Backend → Run workflow → Select "test" → Run
```

### Production Environment

**Manual deployment with approval:**
```
Actions → Deploy Backend → Run workflow → Select "prod" → Run
→ Waits for approval
→ Reviewer approves
→ Build → Deploy to prod → Health checks
```

## Verifying Setup

After configuring environments:

1. **Check environment configuration:**
   - Go to Settings → Environments
   - Verify both `test` and `prod` are listed
   - Click each environment and verify secrets are set

2. **Test deployment (after authentication is configured):**
   - Push a change to `src/backend/` on main
   - Go to Actions tab
   - Verify workflow runs and uses `test` environment

3. **Test production approval flow:**
   - Go to Actions → Deploy Backend → Run workflow
   - Select `prod` environment
   - Verify it waits for approval
   - Approve and verify deployment proceeds

## Resource Naming Convention

The workflow automatically selects resource names based on the environment:

| Environment | Registry | Container App | Resource Group |
|-------------|----------|---------------|----------------|
| `test` | `acrmsscfgtestwestus2.azurecr.io` | `ca-msscfg-test` | `rg-msscfg-test-westus2` |
| `prod` | `acrmsscfgprodwestus2.azurecr.io` | `ca-msscfg-prod` | `rg-msscfg-prod-westus2` |

## Troubleshooting

### "Environment not found" error
- Verify environment names are exactly `test` and `prod` (lowercase)
- Check repository settings to ensure environments are created

### "Secret not found" error
- Verify secret names match exactly (case-sensitive)
- Check secrets are set in the correct environment (test vs prod)
- Ensure secrets are set as "Environment secrets" not "Repository secrets"

### Approval not required for prod
- Go to Settings → Environments → prod
- Verify "Required reviewers" is enabled
- Add at least one reviewer
- Verify "Deployment branches" is set to limit to main branch

## Security Best Practices

1. **Use separate service principals** for test and prod
2. **Limit service principal permissions** to specific resource groups
3. **Rotate credentials regularly** (quarterly recommended)
4. **Use managed identities** where possible instead of connection strings
5. **Enable branch protection** on main to require PR reviews
6. **Audit environment access** regularly via Settings → Environments → Deployment history

## Next Steps

After configuring environments:

1. Set up production Azure resources (if not already deployed)
2. Uncomment authentication steps in `.github/workflows/deploy-backend.yml`
3. Test deployment to test environment
4. Configure additional environment-specific secrets as needed
5. Set up monitoring and alerting for deployments
