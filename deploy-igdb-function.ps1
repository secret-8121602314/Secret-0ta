# IGDB Edge Function Deployment Script (PowerShell)
# Run this after making changes to the IGDB proxy function

Write-Host "🚀 Deploying IGDB Proxy Edge Function..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseExists = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseExists) {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "Checking Supabase login status..." -ForegroundColor Cyan
$loginCheck = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Supabase. Please run:" -ForegroundColor Red
    Write-Host "   supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Logged in to Supabase" -ForegroundColor Green
Write-Host ""

# Deploy the edge function
Write-Host "Deploying igdb-proxy function..." -ForegroundColor Cyan
supabase functions deploy igdb-proxy --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Edge function deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Verify IGDB credentials in Supabase dashboard:" -ForegroundColor White
    Write-Host "   - IGDB_CLIENT_ID" -ForegroundColor Gray
    Write-Host "   - IGDB_CLIENT_SECRET" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Test the function in browser console:" -ForegroundColor White
    Write-Host @"
   fetch('YOUR_SUPABASE_URL/functions/v1/igdb-proxy', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ queryType: 'popular', limit: 5 })
   }).then(r => r.json()).then(console.log)
"@ -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Clear cache and reload Gaming Explorer:" -ForegroundColor White
    Write-Host "   localStorage.clear()" -ForegroundColor Gray
    Write-Host "   location.reload()" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
    exit 1
}
