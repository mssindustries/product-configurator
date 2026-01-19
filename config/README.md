# Environment Configuration

This directory contains environment configuration templates for the MSS Product Configurator.

## Usage

1. Copy the appropriate `.env.example` file to create your environment file:
   ```bash
   # For test environment
   cp config/test.env.example config/test.env

   # For production environment
   cp config/prod.env.example config/prod.env
   ```

2. Fill in the placeholder values (marked with `<PLACEHOLDER>`) with actual values.

3. Load the environment file before running deployments or scripts.

## Environment Variables

### Backend (FastAPI)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL async connection string | `postgresql+asyncpg://user:pass@host:5432/db` |
| `AZURE_STORAGE_ACCOUNT_NAME` | Storage account name | `stmsscfgtesteastus` |
| `AZURE_STORAGE_BLOB_ENDPOINT` | Blob service endpoint URL | `https://stmsscfgtesteastus.blob.core.windows.net` |

### Frontend (Vite)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL (Container App FQDN) | `https://ca-msscfg-test-eastus.azurecontainerapps.io` |

### Deployment

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `AZURE_RESOURCE_GROUP` | Resource group name | `rg-msscfg-test-eastus` |
| `AZURE_LOCATION` | Azure region | `eastus` |
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
  test.env.example       # Test environment template
  prod.env.example       # Production environment template
  test.env               # Your test environment (gitignored)
  prod.env               # Your production environment (gitignored)
```

## Naming Conventions

Resource names follow the pattern documented in `docs/naming-conventions.md`:

```
{resource-prefix}-msscfg-{env}-{region}
```

Examples:
- Resource Group: `rg-msscfg-test-eastus`
- Container App: `ca-msscfg-test-eastus`
- Storage Account: `stmsscfgtesteastus` (no hyphens)
- PostgreSQL: `psql-msscfg-test-eastus`
