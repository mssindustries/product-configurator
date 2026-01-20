using '../main.bicep'

param environment = 'prod'
param location = 'westus2'
param postgresAdminLogin = 'pgadmin'
// postgresAdminPassword must be provided at deployment time via:
//   az deployment sub create ... --parameters postgresAdminPassword=<value>
// Or use Azure Key Vault reference in CI/CD pipelines
