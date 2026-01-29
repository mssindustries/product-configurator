@description('Environment name (test, prod)')
@allowed(['test', 'prod'])
param environment string

@description('Azure region for the resource')
param location string = 'westus2'

@description('Administrator login name for the PostgreSQL server')
param administratorLogin string

@secure()
@description('Administrator password for the PostgreSQL server')
param administratorPassword string

var name = 'psql-msscfg-${environment}-${location}'
var databaseName = 'customizer'

// Burstable SKU is cost-effective for dev/test and light production workloads
var sku = {
  name: 'Standard_B1ms'
  tier: 'Burstable'
}

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2025-08-01' = {
  name: name
  location: location
  sku: sku
  properties: {
    version: '16'
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
  tags: {
    environment: environment
    workload: 'msscfg'
  }
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2025-08-01' = {
  parent: postgresServer
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Allow connections from Azure services (Container Apps, etc.)
// 0.0.0.0 to 0.0.0.0 is Azure's convention for "any Azure service"
// Note: This allows any Azure service (including other subscriptions) - auth still required
// For production hardening (#123), replace with VNet integration
resource firewallRuleAzureServices 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2025-08-01' = {
  parent: postgresServer
  name: 'AllowAllAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

@description('The name of the PostgreSQL Flexible Server')
output name string = postgresServer.name

@description('The resource ID of the PostgreSQL Flexible Server')
output id string = postgresServer.id

@description('The fully qualified domain name (FQDN) for the PostgreSQL server')
output fqdn string = postgresServer.properties.fullyQualifiedDomainName
