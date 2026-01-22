@description('Name of the Storage Account')
param storageAccountName string

@description('Principal ID of the Container App managed identity')
param containerAppPrincipalId string

// Reference existing Storage Account in this resource group
resource storageAccount 'Microsoft.Storage/storageAccounts@2025-06-01' existing = {
  name: storageAccountName
}

// Built-in Storage Blob Data Contributor role definition
// See: https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#storage-blob-data-contributor
resource storageBlobDataContributorRoleDefinition 'Microsoft.Authorization/roleDefinitions@2022-04-01' existing = {
  scope: subscription()
  name: 'ba92f5b4-2d11-453d-a403-e96b0029c9fe'
}

// Storage Blob Data Contributor role assignment - allows Container App to read/write blobs
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, containerAppPrincipalId, storageBlobDataContributorRoleDefinition.id)
  scope: storageAccount
  properties: {
    principalId: containerAppPrincipalId
    roleDefinitionId: storageBlobDataContributorRoleDefinition.id
    principalType: 'ServicePrincipal'
  }
}
