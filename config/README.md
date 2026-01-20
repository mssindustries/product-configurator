# Environment Configuration

This directory contains environment configuration templates for the MSS Product Configurator.

## Usage

### Test Environment (Local Development)

1. Copy the test template to create your local environment file:
   ```bash
   cp config/test.env.example config/test.env
   ```

2. Fill in the placeholder values (marked with `<PLACEHOLDER>`) with actual values.

3. Load the environment file before running deployments or scripts.

### Production Environment

**Do not create a local `prod.env` file.** Production secrets are managed through:
- **Azure Key Vault** - Stores sensitive values (passwords, connection strings)
- **GitHub Secrets** - Used by CI/CD pipelines
- **Container App Secrets** - Injected at runtime from Key Vault

The `prod.env.example` file serves as documentation of what variables the production environment requires. These values are configured in Azure, not in local files.

## Environment Variables

### Backend (FastAPI)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL async connection string | `postgresql+asyncpg://user:pass@host:5432/db` |
| `AZURE_STORAGE_ACCOUNT_NAME` | Storage account name | `stmsscfgtestwestus2` |
| `AZURE_STORAGE_BLOB_ENDPOINT` | Blob service endpoint URL | `https://stmsscfgtestwestus2.blob.core.windows.net` |

### Frontend (Vite)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL (Container App FQDN) | `https://ca-msscfg-test-westus2.azurecontainerapps.io` |

### Deployment

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `AZURE_RESOURCE_GROUP` | Resource group name | `rg-msscfg-test-westus2` |
| `AZURE_LOCATION` | Azure region | `westus2` |
| `AZURE_ENVIRONMENT` | Environment name | `test` or `prod` |

## Secrets Management

**Do NOT commit actual secrets to the repository.**

The following values should be stored securely:

| Secret | Local Development | Production |
|--------|-------------------|------------|
| Database password | Local `.env` file (gitignored) | Azure Key Vault |
| Storage account keys | Managed Identity (no keys needed) | Managed Identity |
| Connection strings | Local `.env` file | Container App secrets from Key Vault |

### Production Secrets in Azure Key Vault

Production secrets are stored in Azure Key Vault and referenced by Container Apps:

- `database-password` - PostgreSQL admin password
- `database-connection-string` - Full connection string (if not using Managed Identity)

### Local Development

For local development with Docker Compose:
- PostgreSQL runs locally with development credentials
- Azurite emulates Azure Storage (no keys needed)
- Copy `test.env.example` and fill in local values

## File Structure

```
config/
  README.md              # This file
  test.env.example       # Test environment template (copy to test.env)
  prod.env.example       # Production environment reference (do not copy)
  test.env               # Your local test environment (gitignored)
```

