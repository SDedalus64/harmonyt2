#!/bin/bash

# Azure Function Deployment Script
# This script deploys the Trade News Feed Azure Function

echo "🚀 Deploying Trade News Feed Azure Function..."

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Configuration - Update these values for your deployment
RESOURCE_GROUP="dgl-trade-news-rg"
FUNCTION_APP_NAME="dgl-trade-news-api"
STORAGE_ACCOUNT="dgltradenewsstorage"
LOCATION="westus"

echo "📋 Configuration:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Function App: $FUNCTION_APP_NAME"
echo "   Storage Account: $STORAGE_ACCOUNT"
echo "   Location: $LOCATION"
echo ""

# Create resource group if it doesn't exist
echo "🏗️  Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create storage account if it doesn't exist
echo "💾 Creating storage account..."
az storage account create \
    --name $STORAGE_ACCOUNT \
    --location $LOCATION \
    --resource-group $RESOURCE_GROUP \
    --sku Standard_LRS

# Create function app if it doesn't exist
echo "⚡ Creating function app..."
az functionapp create \
    --resource-group $RESOURCE_GROUP \
    --consumption-plan-location $LOCATION \
    --runtime node \
    --runtime-version 18 \
    --functions-version 4 \
    --name $FUNCTION_APP_NAME \
    --storage-account $STORAGE_ACCOUNT

# Deploy the function code
echo "📦 Deploying function code..."
func azure functionapp publish $FUNCTION_APP_NAME

# Get the function URL
echo "🔗 Getting function URL..."
FUNCTION_URL=$(az functionapp function show \
    --resource-group $RESOURCE_GROUP \
    --name $FUNCTION_APP_NAME \
    --function-name tradenewsfeed \
    --query "invokeUrlTemplate" -o tsv)

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your Trade News Feed function is available at:"
echo "   $FUNCTION_URL"
echo ""
echo "📝 Next steps:"
echo "   1. Update the AZURE_FUNCTION_URL in src/components/TariffNewsContent.tsx"
echo "   2. Replace the placeholder URL with: $FUNCTION_URL"
echo "   3. Test the function by visiting the URL in your browser"
echo ""
echo "🧪 Test the function:"
echo "   curl '$FUNCTION_URL'"
echo "" 