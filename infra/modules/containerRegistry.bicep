@description('Environment name (test, prod)')
@allowed(['test', 'prod'])
param environment string

@description('Azure region for the resource group')
param location string = 'eastus'

// ACR names must be alphanumeric only (no hyphens)
var name = 'acrmsscfg${environment}${replace(location, '-', '')}'

// Basic SKU is sufficient for single-app workloads
var sku = 'Basic'

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2025-04-01' = {
  name: name
  location: location
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: false
    publicNetworkAccess: 'Enabled'
  }
  tags: {
    environment: environment
    workload: 'msscfg'
  }
}

@description('The name of the container registry')
output name string = containerRegistry.name

@description('The resource ID of the container registry')
output id string = containerRegistry.id

@description('The login server URL for the container registry')
output loginServer string = containerRegistry.properties.loginServer
