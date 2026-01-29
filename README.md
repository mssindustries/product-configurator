# MSS Industries Product Customizer

## Test Environment

**Frontend:** https://happy-hill-08bf5351e.6.azurestaticapps.net

**Backend API:** https://ca-msscfg-test.ashyforest-bcfad665.westus2.azurecontainerapps.io

**API Docs:** https://ca-msscfg-test.ashyforest-bcfad665.westus2.azurecontainerapps.io/docs

## Development Workflow

### Branch Naming Guidelines

**Issue-based work:**
```
issue/{number}-description
```
All feature development, bugs, and tasks tied to GitHub issues.

Examples:
- `issue/101-infrastructure-setup`
- `issue/95-theming-system`

**Experiments and testing:**
```
test/description
```
Proof-of-concepts, workflow testing, trying things out.

Examples:
- `test/backend-pr-workflow`
- `test/new-caching-strategy`

**Hotfixes:**
```
fix/description
```
Urgent fixes that need to go directly to main.

Examples:
- `fix/critical-security-patch`
- `fix/production-outage`

**Non-feature work:**
```
chore/description
```
Documentation, configuration, cleanup, refactoring.

Examples:
- `chore/update-dependencies`
- `chore/cleanup-old-migrations`

**Guidelines:**
- Use kebab-case (lowercase with hyphens)
- Keep descriptions concise (2-4 words)
- Delete branches after merging (use `/clean_gone`)
