@description('Environment name (test, prod)')
@allowed([
  'test'
  'prod'
])
param environment string

@description('Azure region for the managed identity')
param location string = 'westus2'

// Managed Identity names: id- prefix per Azure abbreviations
// Pattern: id-msscfg-{environment}-{location}
var name = 'id-msscfg-${environment}-${location}'

resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: name
  location: location
  tags: {
    environment: environment
    workload: 'msscfg'
  }
}

@description('The resource ID of the managed identity')
output id string = managedIdentity.id

@description('The principal ID (object ID) of the managed identity')
output principalId string = managedIdentity.properties.principalId

@description('The client ID of the managed identity')
output clientId string = managedIdentity.properties.clientId

@description('The name of the managed identity')
output name string = managedIdentity.name
