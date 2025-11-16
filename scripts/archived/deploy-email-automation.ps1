# Waitlist Email Automation - Deployment Script
# Run this script to deploy the waitlist email automation

Write-Host "🚀 Otagon Waitlist Email Automation - Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Supabase CLI found" -ForegroundColor Green

# Prompt for Resend API key if not set
Write-Host ""
Write-Host "📧 Resend API Key Setup" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan
$resendKey = Read-Host "Enter your Resend API key (starts with 're_')"

if (-not $resendKey -or -not $resendKey.StartsWith("re_")) {
    Write-Host "❌ Invalid Resend API key format. Should start with 're_'" -ForegroundColor Red
    Write-Host ""
    Write-Host "Get your API key from: https://resend.com/api-keys" -ForegroundColor Yellow
    exit 1
}

# Prompt for App URL
Write-Host ""
$appUrl = Read-Host "Enter your app URL (default: https://otagon.app)"
if ([string]::IsNullOrWhiteSpace($appUrl)) {
    $appUrl = "https://otagon.app"
}

# Confirm before proceeding
Write-Host ""
Write-Host "📋 Configuration Summary:" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan
Write-Host "Resend API Key: $($resendKey.Substring(0, 10))..." -ForegroundColor White
Write-Host "App URL: $appUrl" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Continue with deployment? (y/n)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

# Step 1: Set Supabase secrets
Write-Host ""
Write-Host "Step 1/3: Setting Supabase secrets..." -ForegroundColor Yellow
try {
    supabase secrets set RESEND_API_KEY=$resendKey 2>&1 | Out-Null
    supabase secrets set APP_URL=$appUrl 2>&1 | Out-Null
    Write-Host "✅ Secrets configured successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set secrets: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Deploy Edge Function
Write-Host ""
Write-Host "Step 2/3: Deploying Edge Function..." -ForegroundColor Yellow
try {
    supabase functions deploy waitlist-email --no-verify-jwt
    Write-Host "✅ Edge Function deployed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to deploy Edge Function: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Apply database migration
Write-Host ""
Write-Host "Step 3/3: Applying database migration..." -ForegroundColor Yellow
$applyMigration = Read-Host "Apply database migration for email tracking? (y/n)"

if ($applyMigration -eq "y" -or $applyMigration -eq "Y") {
    try {
        supabase db push
        Write-Host "✅ Database migration applied" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Migration failed - you can apply it manually later" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Skipping database migration" -ForegroundColor Yellow
}

# Success message
Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Set up Database Webhook in Supabase Dashboard:" -ForegroundColor White
Write-Host "   https://supabase.com/dashboard/project/qajcxgkqloumogioomiz/database/webhooks" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure webhook:" -ForegroundColor White
Write-Host "   - Name: waitlist-email-automation" -ForegroundColor Gray
Write-Host "   - Table: waitlist" -ForegroundColor Gray
Write-Host "   - Events: INSERT only" -ForegroundColor Gray
Write-Host "   - URL: https://qajcxgkqloumogioomiz.supabase.co/functions/v1/waitlist-email" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test your setup:" -ForegroundColor White
Write-Host "   Visit your landing page and sign up for the waitlist!" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Monitor logs:" -ForegroundColor White
Write-Host "   supabase functions logs waitlist-email --tail" -ForegroundColor Gray
Write-Host ""
Write-Host "5. View sent emails:" -ForegroundColor White
Write-Host "   https://resend.com/emails" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Full documentation: WAITLIST_EMAIL_AUTOMATION_SETUP.md" -ForegroundColor Cyan
Write-Host ""
