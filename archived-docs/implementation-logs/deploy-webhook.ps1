# Deploy LemonSqueezy Webhook Handler to Supabase
# This script deploys the edge function and sets up secrets

Write-Host "🚀 Deploying LemonSqueezy Webhook Handler" -ForegroundColor Cyan
Write-Host "=" -Repeat 60 -ForegroundColor Gray
Write-Host ""

# Check if Supabase CLI is installed
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OR use the manual method below:" -ForegroundColor Yellow
    Write-Host "1. Go to Supabase Dashboard → Edge Functions" -ForegroundColor Yellow
    Write-Host "2. Create new function: handle-lemonsqueezy-webhook" -ForegroundColor Yellow
    Write-Host "3. Copy code from: supabase/functions/handle-lemonsqueezy-webhook/index.ts" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Supabase CLI found!" -ForegroundColor Green
Write-Host ""

# Login check
Write-Host "Checking Supabase login..." -ForegroundColor Cyan
supabase status 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to Supabase" -ForegroundColor Yellow
    Write-Host "Logging in..." -ForegroundColor Cyan
    supabase login
}

Write-Host ""
Write-Host "📦 Deploying edge function..." -ForegroundColor Cyan
supabase functions deploy handle-lemonsqueezy-webhook --project-ref qajcxgkqloumogioomiz

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Edge function deployed!" -ForegroundColor Green
Write-Host ""

# Set secrets
Write-Host "🔐 Setting up secrets..." -ForegroundColor Cyan
Write-Host "Reading from .env.secrets file..." -ForegroundColor Gray

$envFile = ".\.env.secrets"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    
    # Extract secrets
    if ($content -match 'LEMONSQUEEZY_STORE_ID=(\d+)') {
        $storeId = $matches[1]
        Write-Host "Setting LEMONSQUEEZY_STORE_ID..." -ForegroundColor Gray
        supabase secrets set LEMONSQUEEZY_STORE_ID=$storeId --project-ref qajcxgkqloumogioomiz
    }
    
    if ($content -match 'LEMONSQUEEZY_API_KEY=(.+)') {
        $apiKey = $matches[1].Trim()
        Write-Host "Setting LEMONSQUEEZY_API_KEY..." -ForegroundColor Gray
        supabase secrets set LEMONSQUEEZY_API_KEY=$apiKey --project-ref qajcxgkqloumogioomiz
    }
    
    if ($content -match 'LEMONSQUEEZY_WEBHOOK_SECRET=(.+)') {
        $webhookSecret = $matches[1].Trim()
        Write-Host "Setting LEMONSQUEEZY_WEBHOOK_SECRET..." -ForegroundColor Gray
        supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=$webhookSecret --project-ref qajcxgkqloumogioomiz
    }
    
    Write-Host ""
    Write-Host "✅ Secrets configured!" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.secrets file not found" -ForegroundColor Yellow
    Write-Host "Manually set secrets in Supabase Dashboard" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" -Repeat 60 -ForegroundColor Gray
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "Webhook URL:" -ForegroundColor Cyan
Write-Host "https://qajcxgkqloumogioomiz.supabase.co/functions/v1/handle-lemonsqueezy-webhook" -ForegroundColor White
Write-Host ""
Write-Host "Next step: Update this URL in LemonSqueezy webhook settings!" -ForegroundColor Yellow
