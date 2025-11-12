# PowerShell script to fix duplicate RLS policies
# Requires: PostgreSQL client (psql) installed
# Alternative: Run the SQL directly in Supabase Dashboard SQL Editor

Write-Host "🔧 Fixing duplicate RLS policies on subtabs table..." -ForegroundColor Cyan

# Check if psql is available
$psqlExists = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlExists) {
    Write-Host "❌ psql command not found." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please use one of these alternatives:" -ForegroundColor Yellow
    Write-Host "1. Copy the contents of 'fix_duplicate_policies.sql' to Supabase Dashboard SQL Editor and run it" -ForegroundColor Yellow
    Write-Host "2. Install PostgreSQL client tools to use psql" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Supabase Dashboard URL: https://supabase.com/dashboard/project/_/sql" -ForegroundColor Cyan
    exit 1
}

# Load DATABASE_URL from .env
$envContent = Get-Content .env -Raw
$DATABASE_URL = ($envContent | Select-String -Pattern 'DATABASE_URL=(.+)' | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()

if (-not $DATABASE_URL) {
    Write-Host "❌ DATABASE_URL not found in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "📡 Connecting to database..." -ForegroundColor Green

# Execute the SQL file
$env:PGPASSWORD = $DATABASE_URL -replace '^postgresql://postgres:([^@]+)@.*', '$1'
$result = psql $DATABASE_URL -f fix_duplicate_policies.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully fixed duplicate policies!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifying policies..." -ForegroundColor Cyan
    
    # Verify
    psql $DATABASE_URL -c "SELECT policyname, cmd FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subtabs' ORDER BY cmd, policyname;"
    
} else {
    Write-Host "❌ Error executing SQL. Check the output above for details." -ForegroundColor Red
    exit 1
}

Remove-Variable PGPASSWORD -ErrorAction SilentlyContinue
