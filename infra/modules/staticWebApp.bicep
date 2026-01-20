@description('Environment name (test, prod)')
@allowed(['test', 'prod'])
param environment string

@description('Azure region for resource metadata. Static Web Apps are globally distributed.')
param location string = 'westus2'

// Future use: Configure linked backend for API proxying
// Currently unused - deployment workflow handles VITE_API_URL at build time
@description('Optional backend API URL (Container App FQDN) for API calls')
#disable-next-line no-unused-params
param backendApiUrl string = ''

// Static Web App names: no region suffix (global resource), per naming-conventions.md
var name = 'stapp-msscfg-${environment}'

// Free tier is sufficient for MVP (both test and prod)
var sku = 'Free'

resource staticWebApp 'Microsoft.Web/staticSites@2024-04-01' = {
  name: name
  location: location
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    // GitHub integration is handled separately by GitHub Actions workflow
    // We only create the resource here; deployment is done via workflow
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
  }
  tags: {
    environment: environment
    workload: 'msscfg'
  }
}

@description('The name of the Static Web App')
output name string = staticWebApp.name

@description('The resource ID of the Static Web App')
output id string = staticWebApp.id

@description('The default hostname (*.azurestaticapps.net URL) of the Static Web App')
output defaultHostname string = staticWebApp.properties.defaultHostname
