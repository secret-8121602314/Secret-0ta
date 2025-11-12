# Quick Debug - Test Resend API Directly

Test your Resend API key directly to ensure it's working:

## Test with PowerShell

```powershell
# Test Resend API directly
$headers = @{
    "Authorization" = "Bearer re_2WqH3YLH_BwSzoa8RAiiXUaJRGABkvC8Q"
    "Content-Type" = "application/json"
}

$body = @{
    from = "Otagon <onboarding@resend.dev>"
    to = @("your-email@example.com")
    subject = "Test Email from Otagon"
    html = "<p>This is a test email!</p>"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method Post -Headers $headers -Body $body
```

## Check Function Logs in Dashboard

1. Go to: https://supabase.com/dashboard/project/qajcxgkqloumogioomiz/functions/waitlist-email
2. Click on "Logs" tab
3. Look for error messages

## Common Issues

### Issue 1: Database Update Error
The function might be failing when trying to update the waitlist table. Since you haven't applied the migration yet, the `email_sent_at` and `updated_at` columns might not exist.

**Solution:** Comment out the database update section temporarily, or apply the migration first.

### Issue 2: Resend Domain Verification
Even `onboarding@resend.dev` might need verification in your Resend account.

**Solution:** 
1. Go to https://resend.com/domains
2. Check if any domains are verified
3. Use an email from a verified domain

### Issue 3: API Key Permissions
The API key might not have send permissions.

**Solution:**
1. Go to https://resend.com/api-keys
2. Check your API key has "Sending access"

## Next Step: Apply Database Migration

Since the function is trying to update `email_sent_at` column which might not exist:

```powershell
# Apply the alternative migration (without pg_net dependency)
supabase db push
```

Or remove the database update from the function temporarily.
