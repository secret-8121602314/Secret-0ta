# ===========================================
# 🚀 Otakon AI Production Deployment Script (PowerShell)
# ===========================================
# Complete deployment pipeline for Firebase + Cloud Run on Windows

param(
    [string]$ProjectId = "otakon-production",
    [string]$Region = "us-central1"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

Write-Host "🚀 Starting Otakon AI Production Deployment" -ForegroundColor $Blue
Write-Host "=============================================="

# Configuration
$ServiceName = "otakon-backend"
$FrontendSite = "otagon-0509"

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor $Blue

# Check if gcloud is installed
try {
    gcloud --version | Out-Null
    Write-Host "✅ gcloud CLI found" -ForegroundColor $Green
} catch {
    Write-Host "❌ gcloud CLI is not installed" -ForegroundColor $Red
    Write-Host "Download from: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Check if Firebase CLI is installed
try {
    firebase --version | Out-Null
    Write-Host "✅ Firebase CLI found" -ForegroundColor $Green
} catch {
    Write-Host "❌ Firebase CLI is not installed" -ForegroundColor $Red
    Write-Host "Install with: npm install -g firebase-tools"
    exit 1
}

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✅ Docker found" -ForegroundColor $Green
} catch {
    Write-Host "❌ Docker is not installed" -ForegroundColor $Red
    exit 1
}

# Check if user is authenticated with gcloud
try {
    $authCheck = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
    if (-not $authCheck) {
        throw "Not authenticated"
    }
    Write-Host "✅ gcloud authenticated" -ForegroundColor $Green
} catch {
    Write-Host "❌ Not authenticated with gcloud" -ForegroundColor $Red
    Write-Host "Run: gcloud auth login"
    exit 1
}

# Check if Firebase is logged in
try {
    firebase projects:list | Out-Null
    Write-Host "✅ Firebase authenticated" -ForegroundColor $Green
} catch {
    Write-Host "❌ Not logged in to Firebase" -ForegroundColor $Red
    Write-Host "Run: firebase login"
    exit 1
}

Write-Host "✅ All prerequisites met" -ForegroundColor $Green

# Set project
Write-Host "📋 Setting project to: $ProjectId" -ForegroundColor $Blue
gcloud config set project $ProjectId
firebase use $ProjectId

# Step 1: Build Frontend
Write-Host "📦 Building frontend..." -ForegroundColor $Blue

if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found. Run this script from the project root." -ForegroundColor $Red
    exit 1
}

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor $Blue
npm ci

# Build frontend
Write-Host "🔨 Building frontend..." -ForegroundColor $Blue
npm run build

if (-not (Test-Path "dist")) {
    Write-Host "❌ Build failed - dist directory not created" -ForegroundColor $Red
    exit 1
}

Write-Host "✅ Frontend built successfully" -ForegroundColor $Green

# Step 2: Build and Deploy Backend
Write-Host "🐳 Building backend Docker image..." -ForegroundColor $Blue

# Build Docker image
docker build -t "gcr.io/$ProjectId/$ServiceName" ./backend

# Push to Google Container Registry
Write-Host "📤 Pushing Docker image..." -ForegroundColor $Blue
docker push "gcr.io/$ProjectId/$ServiceName"

Write-Host "✅ Backend image pushed successfully" -ForegroundColor $Green

# Step 3: Deploy Backend to Cloud Run
Write-Host "🚀 Deploying backend to Cloud Run..." -ForegroundColor $Blue

gcloud run deploy $ServiceName `
    --image "gcr.io/$ProjectId/$ServiceName" `
    --platform managed `
    --region $Region `
    --allow-unauthenticated `
    --set-env-vars NODE_ENV=production `
    --set-secrets SUPABASE_URL=supabase-url:latest,SUPABASE_SERVICE_KEY=supabase-service-key:latest,GEMINI_API_KEY=gemini-api-key:latest `
    --memory 1Gi `
    --cpu 1 `
    --max-instances 10 `
    --min-instances 0 `
    --port 8080 `
    --timeout 300 `
    --quiet

# Get the Cloud Run URL
$BackendUrl = gcloud run services describe $ServiceName --region=$Region --format="value(status.url)"
Write-Host "✅ Backend deployed to: $BackendUrl" -ForegroundColor $Green

# Step 4: Update Frontend Environment Variables
Write-Host "🔧 Updating frontend environment variables..." -ForegroundColor $Blue

# Update vite.config.ts with the new backend URL
$viteConfig = Get-Content "vite.config.ts" -Raw
$viteConfig = $viteConfig -replace "VITE_API_BASE_URL.*", "VITE_API_BASE_URL=${BackendUrl}"
Set-Content "vite.config.ts" $viteConfig

# Rebuild frontend with new backend URL
npm run build

Write-Host "✅ Frontend updated with new backend URL" -ForegroundColor $Green

# Step 5: Deploy Frontend to Firebase
Write-Host "🔥 Deploying frontend to Firebase..." -ForegroundColor $Blue

firebase deploy --only hosting

Write-Host "✅ Frontend deployed to Firebase" -ForegroundColor $Green

# Step 6: Health Check
Write-Host "🏥 Running health checks..." -ForegroundColor $Blue

# Check backend health
Write-Host "🔍 Checking backend health..." -ForegroundColor $Blue
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/health" -UseBasicParsing -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend health check passed" -ForegroundColor $Green
    } else {
        Write-Host "❌ Backend health check failed" -ForegroundColor $Red
    }
} catch {
    Write-Host "❌ Backend health check failed: $($_.Exception.Message)" -ForegroundColor $Red
}

# Get Firebase hosting URL
$FrontendUrl = firebase hosting:sites:list --format="value(defaultUrl)" | Select-Object -First 1
if (-not $FrontendUrl) {
    $FrontendUrl = "https://$ProjectId.web.app"
}

Write-Host "🔍 Checking frontend accessibility..." -ForegroundColor $Blue
try {
    $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend accessibility check passed" -ForegroundColor $Green
    } else {
        Write-Host "❌ Frontend accessibility check failed" -ForegroundColor $Red
    }
} catch {
    Write-Host "❌ Frontend accessibility check failed: $($_.Exception.Message)" -ForegroundColor $Red
}

# Step 7: Final Summary
Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor $Green
Write-Host "=============================================="
Write-Host "📋 Deployment Summary:" -ForegroundColor $Blue
Write-Host "   Frontend URL: $FrontendUrl"
Write-Host "   Backend URL: $BackendUrl"
Write-Host "   Project ID: $ProjectId"
Write-Host "   Region: $Region"
Write-Host ""
Write-Host "🔍 Post-deployment checklist:" -ForegroundColor $Blue
Write-Host "   ✅ Test authentication flow"
Write-Host "   ✅ Test chat functionality"
Write-Host "   ✅ Test error handling"
Write-Host "   ✅ Check performance"
Write-Host "   ✅ Verify PWA features"
Write-Host ""
Write-Host "📊 Monitoring:" -ForegroundColor $Blue
Write-Host "   - Cloud Run logs: gcloud logging read 'resource.type=cloud_run_revision'"
Write-Host "   - Firebase hosting: firebase hosting:channel:list"
Write-Host "   - Performance: Check Google Cloud Console"
Write-Host ""
Write-Host "🚀 Your Otakon AI app is now live in production!" -ForegroundColor $Green
