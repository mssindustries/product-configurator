# Azure Resource Naming Conventions

Naming conventions for Azure resources in the MSS Product Configurator project.

## Pattern

```
{resource-prefix}-msscfg-{env}-{region}
```

| Component | Description | Values |
|-----------|-------------|--------|
| `resource-prefix` | Azure resource type abbreviation | See table below |
| `msscfg` | Workload identifier (MSS Configurator) | Fixed |
| `env` | Environment | `test`, `prod` |
| `region` | Azure region | `eastus`, `westus2`, etc. |

## Resource Prefixes

| Prefix | Resource Type | Hyphens Allowed | Max Length |
|--------|---------------|-----------------|------------|
| `rg-` | Resource Group | Yes | 90 |
| `stapp-` | Static Web App | Yes | - |
| `cae-` | Container Apps Environment | Yes | - |
| `ca-` | Container App | Yes | 32 |
| `acr` | Container Registry | No | 50 |
| `psql-` | PostgreSQL Flexible Server | Yes | 63 |
| `st` | Storage Account | No | 24 |

## Examples

Standard resource (hyphens allowed):
```
psql-msscfg-test-eastus
```

Alphanumeric-only resource (no hyphens):
```
stmsscfgtesteastus
```

## Notes

- **Global uniqueness**: Container Registry and Storage Account names must be globally unique across Azure
- **Region**: Omit for global resources like Static Web Apps (`stapp-msscfg-test`)
- **Database name**: PostgreSQL database is `configurator` (not environment-specific)
