#!/usr/bin/env bash
set -euo pipefail

# MSS Industries Product Configurator - Infrastructure Deployment Script
# Usage: ./deploy.sh <environment> [--what-if]
# Example: ./deploy.sh test
# Example: ./deploy.sh prod
# Example: ./deploy.sh prod --what-if

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Parse arguments
WHAT_IF=false

if [ $# -eq 0 ]; then
    print_error "No environment specified"
    echo ""
    echo "Usage: $0 <environment> [--what-if]"
    echo ""
    echo "Environments:"
    echo "  test  - Deploy to test environment"
    echo "  prod  - Deploy to production environment"
    echo ""
    echo "Options:"
    echo "  --what-if  - Show what changes would be made without deploying"
    echo ""
    exit 1
fi

ENVIRONMENT=$1

# Check for --what-if flag
if [ $# -eq 2 ]; then
    if [ "$2" == "--what-if" ]; then
        WHAT_IF=true
    else
        print_error "Unknown option: $2"
        echo ""
        echo "Valid options: --what-if"
        echo ""
        exit 1
    fi
fi

# Validate environment
if [[ "$ENVIRONMENT" != "test" && "$ENVIRONMENT" != "prod" ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo ""
    echo "Valid environments: test, prod"
    echo ""
    exit 1
fi

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA_DIR="$PROJECT_ROOT/infra"
PARAM_FILE="$INFRA_DIR/environments/${ENVIRONMENT}.local.bicepparam"

# Check if parameter file exists
if [ ! -f "$PARAM_FILE" ]; then
    print_error "Parameter file not found: $PARAM_FILE"
    echo ""
    echo "Expected location: infra/environments/${ENVIRONMENT}.local.bicepparam"
    echo ""
    exit 1
fi

# Production confirmation (skip for what-if)
if [ "$ENVIRONMENT" == "prod" ] && [ "$WHAT_IF" == "false" ]; then
    echo ""
    print_warning "You are about to deploy to PRODUCTION"
    echo ""
    echo "This will:"
    echo "  - Deploy or update all production Azure resources"
    echo "  - Potentially affect live services"
    echo "  - Incur Azure costs"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Deployment cancelled"
        exit 0
    fi

    print_warning "Double-checking: Type 'prod' to confirm production deployment"
    read -p "Environment: " -r
    echo ""

    if [[ $REPLY != "prod" ]]; then
        print_error "Confirmation failed. Deployment cancelled"
        exit 1
    fi
fi

# Display deployment info
echo ""
if [ "$WHAT_IF" == "true" ]; then
    print_info "Starting what-if analysis (no changes will be made)"
else
    print_info "Starting deployment"
fi
echo ""
echo "  Environment:    $ENVIRONMENT"
echo "  Location:       westus2"
echo "  Template:       $INFRA_DIR/main.bicep"
echo "  Parameters:     $PARAM_FILE"
echo "  Mode:           $([ "$WHAT_IF" == "true" ] && echo "What-If (preview only)" || echo "Deploy")"
echo ""

# Run deployment
DEPLOYMENT_NAME="msscfg-${ENVIRONMENT}"

# Build deployment command with optional what-if flag
WHAT_IF_FLAG=""
if [ "$WHAT_IF" == "true" ]; then
    WHAT_IF_FLAG="--what-if"
    print_info "Running what-if analysis..."
else
    print_info "Running Azure deployment..."
fi
echo ""

if az deployment sub create \
    --name "$DEPLOYMENT_NAME" \
    --location westus2 \
    --template-file "$INFRA_DIR/main.bicep" \
    --parameters "$PARAM_FILE" \
    $WHAT_IF_FLAG; then

    echo ""
    if [ "$WHAT_IF" == "true" ]; then
        print_success "What-if analysis completed!"
        echo ""
        print_info "No changes were made. Review the output above to see what would change."
    else
        print_success "Deployment completed successfully!"
        echo ""

        # Show outputs
        print_info "Deployment outputs:"
        az deployment sub show \
            --name "$DEPLOYMENT_NAME" \
            --query "properties.outputs" \
            --output table
    fi

    echo ""

else
    echo ""
    if [ "$WHAT_IF" == "true" ]; then
        print_error "What-if analysis failed"
    else
        print_error "Deployment failed"
    fi
    echo ""
    print_info "Check the Azure Portal for detailed error information:"
    echo "  https://portal.azure.com/#view/HubsExtension/DeploymentDetailsBlade/~/overview/id/%2Fsubscriptions%2F<subscription-id>%2Fproviders%2FMicrosoft.Resources%2Fdeployments%2F${DEPLOYMENT_NAME}"
    echo ""
    exit 1
fi
