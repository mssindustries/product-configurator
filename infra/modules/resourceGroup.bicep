targetScope = 'subscription'

@description('Environment name (test, prod)')
@allowed(['test', 'prod'])
param environment string

@description('Azure region for the resource group')
param location string = 'eastus'

var name = 'rg-msscfg-${environment}-${location}'

resource resourceGroup 'Microsoft.Resources/resourceGroups@2025-04-01' = {
  name: name
  location: location
  tags: {
    environment: environment
    workload: 'msscfg'
  }
}

@description('The name of the resource group')
output name string = resourceGroup.name

@description('The resource ID of the resource group')
output id string = resourceGroup.id

@description('The location of the resource group')
output location string = resourceGroup.location
