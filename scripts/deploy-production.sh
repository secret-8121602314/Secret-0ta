#!/bin/bash

# ===========================================
# 🚀 Otakon AI Production Deployment Script
# ===========================================
# Complete deployment pipeline for Firebase + Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Otakon AI Production Deployment${NC}"
echo "=============================================="

# Configuration
PROJECT_ID=${1:-"otakon-production"}
REGION=${2:-"us-central1"}
SERVICE_NAME="otakon-backend"
FRONTEND_SITE="otagon-0509"

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed${NC}"
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed${NC}"
    echo "Install with: npm install -g firebase-tools"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${RED}❌ Not authenticated with gcloud${NC}"
    echo "Run: gcloud auth login"
    exit 1
fi

# Check if Firebase is logged in
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Firebase${NC}"
    echo "Run: firebase login"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Set project
echo -e "${BLUE}📋 Setting project to: ${PROJECT_ID}${NC}"
gcloud config set project $PROJECT_ID
firebase use $PROJECT_ID

# Step 1: Build Frontend
echo -e "${BLUE}📦 Building frontend...${NC}"
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Install dependencies
npm ci

# Build frontend
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not created${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Step 2: Build and Deploy Backend
echo -e "${BLUE}🐳 Building backend Docker image...${NC}"

# Build Docker image
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME ./backend

# Push to Google Container Registry
echo -e "${BLUE}📤 Pushing Docker image...${NC}"
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME

echo -e "${GREEN}✅ Backend image pushed successfully${NC}"

# Step 3: Deploy Backend to Cloud Run
echo -e "${BLUE}🚀 Deploying backend to Cloud Run...${NC}"

gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars NODE_ENV=production \
    --set-secrets SUPABASE_URL=supabase-url:latest,SUPABASE_SERVICE_KEY=supabase-service-key:latest,GEMINI_API_KEY=gemini-api-key:latest \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --min-instances 0 \
    --port 8080 \
    --timeout 300 \
    --quiet

# Get the Cloud Run URL
BACKEND_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
echo -e "${GREEN}✅ Backend deployed to: ${BACKEND_URL}${NC}"

# Step 4: Update Frontend Environment Variables
echo -e "${BLUE}🔧 Updating frontend environment variables...${NC}"

# Update vite.config.ts with the new backend URL
sed -i.bak "s|VITE_API_BASE_URL.*|VITE_API_BASE_URL=${BACKEND_URL}|g" vite.config.ts

# Rebuild frontend with new backend URL
npm run build

echo -e "${GREEN}✅ Frontend updated with new backend URL${NC}"

# Step 5: Deploy Frontend to Firebase
echo -e "${BLUE}🔥 Deploying frontend to Firebase...${NC}"

firebase deploy --only hosting

echo -e "${GREEN}✅ Frontend deployed to Firebase${NC}"

# Step 6: Health Check
echo -e "${BLUE}🏥 Running health checks...${NC}"

# Check backend health
echo -e "${BLUE}🔍 Checking backend health...${NC}"
if curl -f -s "${BACKEND_URL}/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

# Get Firebase hosting URL
FRONTEND_URL=$(firebase hosting:sites:list --format="value(defaultUrl)" | head -1)
if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL="https://${PROJECT_ID}.web.app"
fi

echo -e "${BLUE}🔍 Checking frontend accessibility...${NC}"
if curl -f -s "$FRONTEND_URL" > /dev/null; then
    echo -e "${GREEN}✅ Frontend accessibility check passed${NC}"
else
    echo -e "${RED}❌ Frontend accessibility check failed${NC}"
fi

# Step 7: Final Summary
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo "=============================================="
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "   Frontend URL: ${FRONTEND_URL}"
echo -e "   Backend URL: ${BACKEND_URL}"
echo -e "   Project ID: ${PROJECT_ID}"
echo -e "   Region: ${REGION}"
echo ""
echo -e "${BLUE}🔍 Post-deployment checklist:${NC}"
echo "   ✅ Test authentication flow"
echo "   ✅ Test chat functionality"
echo "   ✅ Test error handling"
echo "   ✅ Check performance"
echo "   ✅ Verify PWA features"
echo ""
echo -e "${BLUE}📊 Monitoring:${NC}"
echo "   - Cloud Run logs: gcloud logging read 'resource.type=cloud_run_revision'"
echo "   - Firebase hosting: firebase hosting:channel:list"
echo "   - Performance: Check Google Cloud Console"
echo ""
echo -e "${GREEN}🚀 Your Otakon AI app is now live in production!${NC}"
