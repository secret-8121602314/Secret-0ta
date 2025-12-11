# Run LemonSqueezy Database Migration
# This script helps you run the migration using Supabase CLI

Write-Host "🚀 LemonSqueezy Payment Integration - Database Migration" -ForegroundColor Cyan
Write-Host "=" -Repeat 60 -ForegroundColor Gray
Write-Host ""

# Check if Supabase CLI is installed
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please use Option 1 (Supabase Dashboard) instead:" -ForegroundColor Yellow
    Write-Host "1. Go to https://supabase.com/dashboard/project/qajcxgkqloumogioomiz" -ForegroundColor Yellow
    Write-Host "2. Click 'SQL Editor'" -ForegroundColor Yellow
    Write-Host "3. Copy content from: supabase/migrations/20251211_lemonsqueezy_subscriptions.sql" -ForegroundColor Yellow
    Write-Host "4. Paste and run in SQL Editor" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Supabase CLI found!" -ForegroundColor Green
Write-Host ""

# Ask for confirmation
Write-Host "This will:" -ForegroundColor Cyan
Write-Host "  • Create 'subscriptions' table" -ForegroundColor White
Write-Host "  • Create 'payment_events' table" -ForegroundColor White
Write-Host "  • Update 'users' table" -ForegroundColor White
Write-Host "  • Set up RLS policies" -ForegroundColor White
Write-Host "  • Create helper functions" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Proceed? (y/n)"

if ($confirm -ne 'y') {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Running migration..." -ForegroundColor Cyan

# Run the migration
supabase db push

Write-Host ""
Write-Host "✅ Migration complete! Check Supabase dashboard to verify." -ForegroundColor Green
