# Security Linter Fixes - Quick Apply Script
# Run this to apply the security fixes to your database

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "Security Linter Fixes - Migration Application" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "supabase/migrations")) {
    Write-Host "ERROR: Must run from project root directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Issues being fixed:" -ForegroundColor Yellow
Write-Host "  1. Security Definer View (waitlist_pending_emails)" -ForegroundColor White
Write-Host "  2. Function Search Path Mutable (update_waitlist_email_status)" -ForegroundColor White
Write-Host "  3. Leaked Password Protection (manual - Dashboard only)" -ForegroundColor White
Write-Host ""

# Check if migration file exists
$migrationFile = "supabase/migrations/20251115000001_fix_security_linter_warnings.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Migration file found" -ForegroundColor Green
Write-Host ""

# Prompt for confirmation
Write-Host "⚠️  WARNING: This will modify your database schema" -ForegroundColor Yellow
Write-Host ""
$response = Read-Host "Apply migration to local database? (yes/no)"

if ($response -ne "yes") {
    Write-Host "Migration cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Applying migration..." -ForegroundColor Cyan
Write-Host ""

# Apply the migration
try {
    # Method 1: Direct SQL execution via Supabase CLI
    npx supabase db push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "==================================================================" -ForegroundColor Green
        Write-Host "✓ Migration applied successfully!" -ForegroundColor Green
        Write-Host "==================================================================" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "📝 Next steps:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Verify the fixes worked:" -ForegroundColor White
        Write-Host "   - Go to Supabase Dashboard → Database → Linter" -ForegroundColor Gray
        Write-Host "   - Check that the warnings are resolved" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Enable Leaked Password Protection (MANUAL STEP):" -ForegroundColor White
        Write-Host "   a. Go to Supabase Dashboard" -ForegroundColor Gray
        Write-Host "   b. Navigate to: Authentication → Providers → Email" -ForegroundColor Gray
        Write-Host "   c. Scroll to 'Password Security' section" -ForegroundColor Gray
        Write-Host "   d. Enable 'Check for leaked passwords'" -ForegroundColor Gray
        Write-Host "   e. Save changes" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Test your application:" -ForegroundColor White
        Write-Host "   - Verify waitlist functionality still works" -ForegroundColor Gray
        Write-Host "   - Check that email status updates work correctly" -ForegroundColor Gray
        Write-Host ""
        Write-Host "📚 Full documentation:" -ForegroundColor Cyan
        Write-Host "   docs/SECURITY_LINTER_FIXES_2025_11_15.md" -ForegroundColor Gray
        Write-Host ""
        
    } else {
        throw "Migration command failed with exit code $LASTEXITCODE"
    }
    
} catch {
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Red
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "==================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure Supabase CLI is installed: npm install -g supabase" -ForegroundColor White
    Write-Host "2. Check that your local Supabase instance is running: npx supabase status" -ForegroundColor White
    Write-Host "3. Verify database connection in .env or supabase/config.toml" -ForegroundColor White
    Write-Host ""
    Write-Host "Manual application:" -ForegroundColor Yellow
    Write-Host "You can apply the migration manually via Supabase Dashboard:" -ForegroundColor White
    Write-Host "1. Copy contents of: $migrationFile" -ForegroundColor Gray
    Write-Host "2. Go to Dashboard → SQL Editor" -ForegroundColor Gray
    Write-Host "3. Paste and run the SQL" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
