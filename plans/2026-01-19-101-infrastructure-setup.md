# Infrastructure Setup Implementation Plan

**Issue:** #101
**Domain:** infrastructure
**IaC Tool:** Bicep

**Goal:** Create Azure infrastructure definitions, naming conventions, and environment configuration files for the MVP test environment.

---

## Architecture Overview

```
Subscription: MSS Industries
└── Resource Group: rg-msscfg-{env}-{region}
    ├── Static Web App: stapp-msscfg-{env}
    ├── Container Apps Environment: cae-msscfg-{env}-{region}
    │   └── Container App: ca-msscfg-{env}
    ├── Container Registry: acrmsscfg{env}{region}  (no hyphens allowed)
    ├── PostgreSQL Flexible Server: psql-msscfg-{env}-{region}
    └── Storage Account: stmsscfg{env}{region}  (no hyphens allowed)
```

**Environments:** test, prod
**Default Region:** eastus

---

## Directory Structure

```
infra/
├── main.bicep              # Main orchestration file
├── main.bicepparam         # Parameter file (shared)
├── modules/
│   ├── resourceGroup.bicep
│   ├── staticWebApp.bicep
│   ├── containerAppsEnvironment.bicep
│   ├── containerApp.bicep
│   ├── containerRegistry.bicep
│   ├── postgresFlexible.bicep
│   └── storageAccount.bicep
└── environments/
    ├── test.bicepparam     # Test environment parameters
    └── prod.bicepparam     # Prod environment parameters

config/
├── README.md               # Configuration documentation
├── test.env.example        # Test environment template
└── prod.env.example        # Prod environment template

docs/
└── naming-conventions.md   # Naming convention documentation
```

---

## Task 1: Create Naming Convention Documentation

**Files:**
- Create: `docs/naming-conventions.md`

**Content:**
- Document naming pattern: `{resource-prefix}-msscfg-{env}-{region}`
- List all resource types with examples
- Note Azure naming restrictions (length, allowed characters)
- Include table of resource abbreviations

---

## Task 2: Create Bicep Module - Resource Group

**Files:**
- Create: `infra/modules/resourceGroup.bicep`

**Parameters:**
- `environment` (test/prod)
- `location` (default: eastus)

**Output:**
- Resource group name
- Resource group ID

---

## Task 3: Create Bicep Module - Container Registry

**Files:**
- Create: `infra/modules/containerRegistry.bicep`

**Parameters:**
- `environment`
- `location`

**Notes:**
- ACR names must be alphanumeric (no hyphens)
- Use Basic SKU for test, Standard for prod
- Container App will use managed identity for pull access (AcrPull role)

---

## Task 4: Create Bicep Module - PostgreSQL Flexible Server

**Files:**
- Create: `infra/modules/postgresFlexible.bicep`

**Parameters:**
- `environment`
- `location`
- `administratorLogin`
- `administratorPassword` (secure)

**Notes:**
- Burstable SKU (B_Standard_B1ms) for test
- General Purpose SKU for prod
- PostgreSQL 16
- Create default database: `configurator`

---

## Task 5: Create Bicep Module - Storage Account

**Files:**
- Create: `infra/modules/storageAccount.bicep`

**Parameters:**
- `environment`
- `location`

**Notes:**
- Storage account names must be alphanumeric (no hyphens), 3-24 chars
- Standard_LRS for test, Standard_GRS for prod
- Create blob containers: `templates`, `generated`

---

## Task 6: Create Bicep Modules - Container Apps

**Files:**
- Create: `infra/modules/containerAppsEnvironment.bicep`
- Create: `infra/modules/containerApp.bicep`

**Container Apps Environment Parameters:**
- `environment`
- `location`

**Container App Parameters:**
- `environment`
- `location`
- `containerAppsEnvironmentId`
- `containerRegistryName`
- `containerRegistryLoginServer`
- `imageTag`

**Notes:**
- Container Apps Environment hosts the app (one per resource group)
- 2 CPU, 4GB memory for FastAPI + Blender
- Scale: min 0, max 1 for test (scale-to-zero)
- Ingress: external with HTTPS
- Configure environment variables for database/storage connection
- Managed identity for ACR pull access

---

## Task 7: Create Bicep Module - Static Web App

**Files:**
- Create: `infra/modules/staticWebApp.bicep`

**Parameters:**
- `environment`
- `location`
- `repositoryUrl`
- `branch`

**Notes:**
- Free tier for test
- Configure API backend URL

---

## Task 8: Create Main Bicep Orchestration

**Files:**
- Create: `infra/main.bicep`
- Create: `infra/environments/test.bicepparam`
- Create: `infra/environments/prod.bicepparam`

**Content:**
- Import all modules
- Wire up dependencies (ACR -> Container App, Storage -> Container App, PostgreSQL -> Container App)
- Output connection strings and URLs (including Container App FQDN)

---

## Task 9: Create Environment Configuration Files

**Files:**
- Create: `config/README.md`
- Create: `config/test.env.example`
- Create: `config/prod.env.example`
- Update: `.gitignore`

**Content:**
- Database connection string (with placeholder for password)
- Storage account connection string
- API URL
- CORS allowed origins
- Document which secrets go in Key Vault (deferred to hardening)

---

## Task 10: Validate Bicep Templates

**Commands:**
```bash
az bicep build --file infra/main.bicep
az deployment sub what-if --location eastus --template-file infra/main.bicep --parameters infra/environments/test.bicepparam
```

---

## Verification

- [ ] `az bicep build` succeeds without errors
- [ ] All modules have consistent parameter naming
- [ ] Naming conventions documented and applied
- [ ] Environment config files created with placeholders
- [ ] `.gitignore` includes `*.env` (but not `*.env.example`)

---

## Notes

- **Container Apps**: Chosen over Container Instances for scale-to-zero, built-in HTTPS, and revision-based deployments.
- **Secrets**: For MVP, admin passwords will be passed as parameters. Production hardening (#123) will add Key Vault integration.
- **Networking**: For MVP, resources are publicly accessible. Production hardening will add VNet integration.
- **Deployment**: Actual deployment to Azure is handled in subsequent issues (#104, #107, #109).
