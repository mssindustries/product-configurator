@description('Azure region for the shared container registry')
param location string = 'westus2'

var name = 'acrmsscfgshared${replace(location, '-', '')}'
var sku = 'Basic'  // Upgraded from Basic

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2025-11-01' = {
  name: name
  location: location
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: false
    // Public access enabled for GitHub Actions workflows
    // Authentication still required via managed identity or service principal
    publicNetworkAccess: 'Enabled'
  }
  tags: {
    environment: 'shared'
    workload: 'msscfg'
  }
}

@description('The name of the container registry')
output name string = containerRegistry.name

@description('The resource ID of the container registry')
output id string = containerRegistry.id

@description('The login server URL for the container registry')
output loginServer string = containerRegistry.properties.loginServer
