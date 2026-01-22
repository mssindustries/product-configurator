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
