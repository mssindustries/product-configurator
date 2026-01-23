# MSS Industries Product Configurator

## Test Environment

**Frontend:** https://happy-hill-08bf5351e.6.azurestaticapps.net

**Backend API:** https://ca-msscfg-test.ashyforest-bcfad665.westus2.azurecontainerapps.io

**API Docs:** https://ca-msscfg-test.ashyforest-bcfad665.westus2.azurecontainerapps.io/docs

## Development Workflow

### Branch Naming Guidelines

Use the following patterns for branch names:

**Feature branches:**
```
feature/short-description
```
For new features or enhancements. Examples:
- `feature/pr-workflow-quality-gates`
- `feature/frontend-deployment-workflow`

**Backend-specific work:**
```
backend/short-description
```
For backend-only changes. Examples:
- `backend/container-deployment-workflows`
- `backend/api-optimization`

**Infrastructure work:**
```
infrastructure/short-description
```
For infrastructure and deployment changes. Examples:
- `infrastructure/deploy-azure-test-environment`
- `infrastructure/add-monitoring`

**Test/experimental branches:**
```
test/short-description
```
For testing workflows, proof-of-concepts, or experiments. Examples:
- `test/backend-pr-workflow`
- `test/pr-preview-url-comment`

**Issue-based branches:**
```
{issue-number}-short-description
```
When working directly on a GitHub issue. Examples:
- `101-infrastructure-setup`
- `95-set-up-consistent-themingstyling-system-with-cva`

**Guidelines:**
- Use kebab-case (lowercase with hyphens)
- Keep descriptions concise but clear
- Prefix clearly indicates the scope/domain
- Delete branches after merging
