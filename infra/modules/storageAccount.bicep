@description('Environment name (test, prod)')
@allowed(['test', 'prod'])
param environment string

@description('Azure region for the resource')
param location string = 'eastus'

// Storage account names must be alphanumeric only (no hyphens), 3-24 chars
var name = 'stmsscfg${environment}${replace(location, '-', '')}'

// Standard_LRS is sufficient for both test and prod (cost-effective for blob storage)
var sku = 'Standard_LRS'

resource storageAccount 'Microsoft.Storage/storageAccounts@2024-01-01' = {
  name: name
  location: location
  kind: 'StorageV2'
  sku: {
    name: sku
  }
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowSharedKeyAccess: true
  }
  tags: {
    environment: environment
    workload: 'msscfg'
  }
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2024-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource templatesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2024-01-01' = {
  parent: blobServices
  name: 'templates'
  properties: {
    publicAccess: 'None'
  }
}

resource generatedContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2024-01-01' = {
  parent: blobServices
  name: 'generated'
  properties: {
    publicAccess: 'None'
  }
}

@description('The name of the storage account')
output name string = storageAccount.name

@description('The resource ID of the storage account')
output id string = storageAccount.id

@description('The primary blob endpoint URL for connection strings')
output primaryBlobEndpoint string = storageAccount.properties.primaryEndpoints.blob
