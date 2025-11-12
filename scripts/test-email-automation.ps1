# Test Waitlist Email Automation
# Use this script to test your email automation setup

Write-Host "🧪 Testing Waitlist Email Automation" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for test email
$testEmail = Read-Host "Enter test email address"

if ([string]::IsNullOrWhiteSpace($testEmail) -or $testEmail -notmatch "^[^@]+@[^@]+\.[^@]+$") {
    Write-Host "❌ Invalid email address" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📤 Sending test email to: $testEmail" -ForegroundColor Yellow

# Call the Edge Function directly
$url = "https://qajcxgkqloumogioomiz.supabase.co/functions/v1/waitlist-email"
$body = @{
    email = $testEmail
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
    
    Write-Host ""
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📧 Check your inbox (and spam folder) for the welcome email!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "View email in Resend dashboard:" -ForegroundColor White
    Write-Host "https://resend.com/emails" -ForegroundColor Gray
    
} catch {
    Write-Host ""
    Write-Host "❌ Test failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check if Edge Function is deployed:" -ForegroundColor White
    Write-Host "   supabase functions list" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Check function logs:" -ForegroundColor White
    Write-Host "   supabase functions logs waitlist-email" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Verify Resend API key:" -ForegroundColor White
    Write-Host "   supabase secrets list" -ForegroundColor Gray
    Write-Host ""
}
