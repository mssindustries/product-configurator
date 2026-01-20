targetScope = 'subscription'

// ============================================================================
// MSS Industries Product Configurator - Main Infrastructure Orchestration
// ============================================================================
// This file orchestrates the deployment of all Azure resources for the
// Product Configurator application. It deploys at subscription scope to
// create the resource group first, then deploys all other resources into it.
// ============================================================================

@description('Environment name (test, prod)')
@allowed(['test', 'prod'])
param environment string

@description('Azure region for all resources')
param location string = 'westus2'

@description('Administrator login name for the PostgreSQL server')
param postgresAdminLogin string = 'pgadmin'

@secure()
@description('Administrator password for the PostgreSQL server')
param postgresAdminPassword string

@description('Docker image tag to deploy for the backend Container App')
param imageTag string = 'latest'

// Resource group name must be calculated at compile time for module scoping
// Uses the same naming convention as modules/resourceGroup.bicep
var resourceGroupName = 'rg-msscfg-${environment}-${location}'

// ============================================================================
// Resource Group (subscription scope)
// ============================================================================

module rg 'modules/resourceGroup.bicep' = {
  name: 'deploy-resourceGroup'
  params: {
    environment: environment
    location: location
  }
}

// ============================================================================
// All other resources (resource group scope)
// ============================================================================
// Deployed as a nested deployment to the resource group created above.
// These modules can be deployed in parallel within the resource group.
// ============================================================================

module containerRegistry 'modules/containerRegistry.bicep' = {
  name: 'deploy-containerRegistry'
  scope: az.resourceGroup(resourceGroupName)
  dependsOn: [rg]
  params: {
    environment: environment
    location: location
  }
}

module postgresFlexible 'modules/postgresFlexible.bicep' = {
  name: 'deploy-postgresFlexible'
  scope: az.resourceGroup(resourceGroupName)
  dependsOn: [rg]
  params: {
    environment: environment
    location: location
    administratorLogin: postgresAdminLogin
    administratorPassword: postgresAdminPassword
  }
}

module storageAccount 'modules/storageAccount.bicep' = {
  name: 'deploy-storageAccount'
  scope: az.resourceGroup(resourceGroupName)
  dependsOn: [rg]
  params: {
    environment: environment
    location: location
  }
}

module containerAppsEnvironment 'modules/containerAppsEnvironment.bicep' = {
  name: 'deploy-containerAppsEnvironment'
  scope: az.resourceGroup(resourceGroupName)
  dependsOn: [rg]
  params: {
    environment: environment
    location: location
  }
}

module containerApp 'modules/containerApp.bicep' = {
  name: 'deploy-containerApp'
  scope: az.resourceGroup(resourceGroupName)
  params: {
    environment: environment
    location: location
    containerAppsEnvironmentId: containerAppsEnvironment.outputs.id
    containerRegistryLoginServer: containerRegistry.outputs.loginServer
    imageTag: imageTag
    postgresHost: postgresFlexible.outputs.fqdn
    postgresUser: postgresAdminLogin
    postgresPassword: postgresAdminPassword
    storageAccountName: storageAccount.outputs.name
    storageBlobEndpoint: storageAccount.outputs.primaryBlobEndpoint
  }
}

// Role assignments for Container App managed identity
// Must be deployed after Container App to get its principal ID
module roleAssignments 'modules/roleAssignments.bicep' = {
  name: 'deploy-roleAssignments'
  scope: az.resourceGroup(resourceGroupName)
  params: {
    containerAppPrincipalId: containerApp.outputs.principalId
    containerRegistryId: containerRegistry.outputs.id
    storageAccountId: storageAccount.outputs.id
  }
}

module staticWebApp 'modules/staticWebApp.bicep' = {
  name: 'deploy-staticWebApp'
  scope: az.resourceGroup(resourceGroupName)
  params: {
    environment: environment
    location: location
    backendApiUrl: 'https://${containerApp.outputs.fqdn}'
  }
}

// ============================================================================
// Outputs
// ============================================================================

@description('The name of the resource group')
output resourceGroupName string = rg.outputs.name

@description('The login server URL for the container registry')
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer

@description('The FQDN of the PostgreSQL Flexible Server')
output postgresHost string = postgresFlexible.outputs.fqdn

@description('The name of the storage account')
output storageAccountName string = storageAccount.outputs.name

@description('The FQDN of the Container App')
output containerAppFqdn string = containerApp.outputs.fqdn

@description('The default hostname of the Static Web App')
output staticWebAppHostname string = staticWebApp.outputs.defaultHostname
