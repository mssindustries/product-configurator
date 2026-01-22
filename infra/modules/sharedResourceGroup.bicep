targetScope = 'subscription'

@description('Azure region for the shared resource group')
param location string = 'westus2'

var name = 'rg-msscfg-shared-${location}'

resource resourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: name
  location: location
  tags: {
    environment: 'shared'
    workload: 'msscfg'
  }
}

@description('The name of the resource group')
output name string = resourceGroup.name

@description('The resource ID of the resource group')
output id string = resourceGroup.id

@description('The location of the resource group')
output location string = resourceGroup.location
