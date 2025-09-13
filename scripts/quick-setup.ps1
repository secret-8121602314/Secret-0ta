# ===========================================
# 🚀 Otakon AI - Quick Production Setup
# ===========================================
# Run these commands in PowerShell to get started

Write-Host "🚀 Otakon AI Production Setup" -ForegroundColor Blue
Write-Host "=================================" -ForegroundColor Blue

# Check if gcloud is installed
Write-Host "🔍 Checking Google Cloud CLI..." -ForegroundColor Yellow
try {
    gcloud --version | Out-Null
    Write-Host "✅ Google Cloud CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Google Cloud CLI not found" -ForegroundColor Red
    Write-Host "📥 Installing Google Cloud CLI..." -ForegroundColor Yellow
    winget install Google.CloudSDK
    Write-Host "🔄 Please restart PowerShell and run this script again" -ForegroundColor Yellow
    exit 1
}

# Check if Firebase CLI is installed
Write-Host "🔍 Checking Firebase CLI..." -ForegroundColor Yellow
try {
    firebase --version | Out-Null
    Write-Host "✅ Firebase CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI not found" -ForegroundColor Red
    Write-Host "📥 Installing Firebase CLI..." -ForegroundColor Yellow
    npm install -g firebase-tools
}

# Check if Docker is installed
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found" -ForegroundColor Red
    Write-Host "📥 Please install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Blue
Write-Host "1. Create Google Cloud project: gcloud projects create otakon-production" -ForegroundColor White
Write-Host "2. Set project: gcloud config set project otakon-production" -ForegroundColor White
Write-Host "3. Enable APIs: gcloud services enable secretmanager.googleapis.com run.googleapis.com containerregistry.googleapis.com" -ForegroundColor White
Write-Host "4. Authenticate: gcloud auth login" -ForegroundColor White
Write-Host "5. Set up secrets: .\scripts\setup-secrets.sh otakon-production" -ForegroundColor White
Write-Host "6. Deploy: .\scripts\deploy-production.ps1 -ProjectId 'otakon-production'" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Ready to deploy!" -ForegroundColor Green
