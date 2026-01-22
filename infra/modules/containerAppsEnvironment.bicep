@description('Environment name (test, prod)')
@allowed(['test', 'prod'])
param environment string

@description('Azure region for the resource')
param location string = 'westus2'

var name = 'cae-msscfg-${environment}-${location}'

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2026-01-01' = {
  name: name
  location: location
  properties: {
    // Consumption plan - pay only for what you use
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
    zoneRedundant: false
  }
  tags: {
    environment: environment
    workload: 'msscfg'
  }
}

@description('The name of the Container Apps Environment')
output name string = containerAppsEnvironment.name

@description('The resource ID of the Container Apps Environment')
output id string = containerAppsEnvironment.id
