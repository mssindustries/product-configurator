@description('Environment name (test, prod)')
@allowed(['test', 'prod'])
param environment string

@description('Azure region for the resource')
param location string = 'westus2'

@description('Resource ID of the Container Apps Environment')
param containerAppsEnvironmentId string

@description('Login server URL for the container registry (e.g., acrmsscfgtestwestus2.azurecr.io)')
param containerRegistryLoginServer string

@description('Resource ID of the user-assigned managed identity')
param userAssignedIdentityId string

@description('FQDN of the PostgreSQL Flexible Server')
param postgresHost string

@description('PostgreSQL administrator login name')
param postgresUser string

@secure()
@description('PostgreSQL administrator password')
param postgresPassword string

@description('Name of the Azure Storage Account')
param storageAccountName string

@description('Blob endpoint URL of the Azure Storage Account')
param storageBlobEndpoint string

// Container App names: max 32 chars, per naming-conventions.md ca- prefix, no region suffix
var name = 'ca-msscfg-${environment}'
// Use actual backend image from shared ACR
var imageName = '${containerRegistryLoginServer}/msscfg-backend:latest'
var databaseName = 'configurator'

// Construct PostgreSQL connection string for SQLAlchemy async driver
var databaseUrl = 'postgresql+asyncpg://${postgresUser}:${postgresPassword}@${postgresHost}:5432/${databaseName}'

resource containerApp 'Microsoft.App/containerApps@2026-01-01' = {
  name: name
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    configuration: {
      secrets: [
        {
          name: 'database-url'
          value: databaseUrl
        }
      ]
      ingress: {
        external: true
        targetPort: 8000
        transport: 'http'
        allowInsecure: false
      }
      registries: [
        {
          server: containerRegistryLoginServer
          // Using user-assigned managed identity for ACR pull
          // Role assignment is created before Container App deployment
          identity: userAssignedIdentityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'msscfg-backend'
          image: imageName
          resources: {
            cpu: json('2.0')
            memory: '4Gi'
          }
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'AZURE_STORAGE_ACCOUNT_NAME'
              value: storageAccountName
            }
            {
              name: 'AZURE_STORAGE_BLOB_ENDPOINT'
              value: storageBlobEndpoint
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
      }
    }
  }
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${userAssignedIdentityId}': {}
    }
  }
  tags: {
    environment: environment
    workload: 'msscfg'
  }
}

@description('The name of the Container App')
output name string = containerApp.name

@description('The resource ID of the Container App')
output id string = containerApp.id

@description('The fully qualified domain name (FQDN) of the Container App')
output fqdn string = containerApp.properties.configuration.ingress.fqdn
