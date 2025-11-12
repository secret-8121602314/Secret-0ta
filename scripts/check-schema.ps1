# Check current Supabase schema
Write-Host "Checking Supabase schema..." -ForegroundColor Cyan

# Read the SQL file
$sql = Get-Content "check_schema.sql" -Raw

# Execute using supabase CLI
Write-Host "`nExecuting schema check queries..." -ForegroundColor Yellow
npx supabase db execute --file check_schema.sql

Write-Host "`nDone!" -ForegroundColor Green
