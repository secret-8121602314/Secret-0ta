#!/bin/bash

# ===========================================
# 🔐 Google Cloud Secret Manager Setup Script
# ===========================================
# This script sets up all required secrets for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Setting up Google Cloud Secret Manager for Otakon AI${NC}"
echo "=================================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Not authenticated with gcloud. Please run 'gcloud auth login' first.${NC}"
    exit 1
fi

# Set project ID
PROJECT_ID=${1:-"otakon-production"}
echo -e "${BLUE}📋 Using project: ${PROJECT_ID}${NC}"

# Set project
gcloud config set project $PROJECT_ID

echo -e "${YELLOW}⚠️  Please have the following values ready:${NC}"
echo "   - Supabase URL"
echo "   - Supabase Service Key"
echo "   - Supabase Anon Key"
echo "   - Gemini API Key"
echo ""

# Function to create secret
create_secret() {
    local secret_name=$1
    local secret_description=$2
    local prompt_message=$3
    
    echo -e "${BLUE}🔑 Creating secret: ${secret_name}${NC}"
    echo -e "${YELLOW}${prompt_message}${NC}"
    read -s secret_value
    
    if [ -z "$secret_value" ]; then
        echo -e "${RED}❌ Secret value cannot be empty${NC}"
        return 1
    fi
    
    # Create secret if it doesn't exist
    if ! gcloud secrets describe $secret_name &> /dev/null; then
        echo -n "$secret_value" | gcloud secrets create $secret_name \
            --data-file=- \
            --labels="app=otakon,environment=production" \
            --replication-policy="automatic"
        echo -e "${GREEN}✅ Secret ${secret_name} created${NC}"
    else
        # Add new version to existing secret
        echo -n "$secret_value" | gcloud secrets versions add $secret_name --data-file=-
        echo -e "${GREEN}✅ Secret ${secret_name} updated${NC}"
    fi
}

# Create secrets
create_secret "supabase-url" "Supabase URL" "Enter your Supabase URL (e.g., https://your-project.supabase.co): "
create_secret "supabase-service-key" "Supabase Service Key" "Enter your Supabase Service Key: "
create_secret "supabase-anon-key" "Supabase Anon Key" "Enter your Supabase Anon Key: "
create_secret "gemini-api-key" "Gemini API Key" "Enter your Gemini API Key: "

echo ""
echo -e "${BLUE}🔐 Setting up IAM permissions...${NC}"

# Get the default compute service account
SERVICE_ACCOUNT="${PROJECT_ID}-compute@developer.gserviceaccount.com"

# Grant access to secrets
SECRETS=("supabase-url" "supabase-service-key" "supabase-anon-key" "gemini-api-key")

for secret in "${SECRETS[@]}"; do
    echo -e "${BLUE}🔑 Granting access to ${secret}...${NC}"
    gcloud secrets add-iam-policy-binding $secret \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet || echo -e "${YELLOW}⚠️  Warning: Could not grant access to ${secret}${NC}"
done

echo ""
echo -e "${GREEN}✅ Secret Manager setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Update your Cloud Run service to use these secrets"
echo "2. Deploy your backend with the updated configuration"
echo "3. Test the deployment"
echo ""
echo -e "${BLUE}🔍 To verify secrets were created:${NC}"
echo "gcloud secrets list --filter='labels.app=otakon'"
echo ""
echo -e "${BLUE}🔍 To view a secret (for testing):${NC}"
echo "gcloud secrets versions access latest --secret=supabase-url"
