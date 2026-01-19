@description('Principal ID of the Container App managed identity')
param containerAppPrincipalId string

@description('Resource ID of the Container Registry')
param containerRegistryId string

@description('Resource ID of the Storage Account')
param storageAccountId string

// Built-in role definition IDs
// See: https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
var storageBlobDataContributorRoleId = 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'

// AcrPull role assignment - allows Container App to pull images from ACR
resource acrPullRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerRegistryId, containerAppPrincipalId, acrPullRoleId)
  scope: containerRegistry
  properties: {
    principalId: containerAppPrincipalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalType: 'ServicePrincipal'
  }
}

// Storage Blob Data Contributor role assignment - allows Container App to read/write blobs
resource storageBlobRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccountId, containerAppPrincipalId, storageBlobDataContributorRoleId)
  scope: storageAccount
  properties: {
    principalId: containerAppPrincipalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', storageBlobDataContributorRoleId)
    principalType: 'ServicePrincipal'
  }
}

// Reference existing resources to scope the role assignments
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2025-04-01' existing = {
  name: last(split(containerRegistryId, '/'))
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2024-01-01' existing = {
  name: last(split(storageAccountId, '/'))
}
