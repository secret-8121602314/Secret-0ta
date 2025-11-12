# Waitlist Email Automation Setup Guide

## 📧 Overview

This guide will help you set up automated welcome emails for waitlist signups using **Resend** (email service) and **Supabase Edge Functions**.

When a user signs up for your waitlist, they will automatically receive a beautifully designed welcome email with:
- 🎮 Branded Otagon styling
- 🔗 Direct link to access the login page
- ✨ Feature highlights and getting started guide
- 📱 Mobile-responsive design

---

## 🚀 Quick Setup (Recommended)

### Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Resend account (free tier available)
- Your Otagon app deployed

---

## Step 1: Create Resend Account & Get API Key

### 1.1 Sign Up for Resend

1. Go to [https://resend.com](https://resend.com)
2. Click "Get Started" or "Sign Up"
3. Create your account (GitHub login recommended)
4. Complete email verification

### 1.2 Add Your Domain (Optional but Recommended)

**For production:**
1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `otagon.app`)
4. Add the DNS records Resend provides to your domain registrar:
   - SPF record
   - DKIM records
   - Return-Path record
5. Wait for verification (usually takes a few minutes)

**For testing (use Resend's test domain):**
- You can use `onboarding@resend.dev` for testing
- Emails will be sent from this domain initially

### 1.3 Generate API Key

1. Navigate to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name it: `Otagon Waitlist Automation`
4. Select permissions: **Full Access** (or just "Send emails")
5. Click **Create**
6. **IMPORTANT:** Copy the API key immediately (you won't see it again!)
   - Format: `re_xxxxxxxxxxxxxxxxxxxxx`

---

## Step 2: Deploy the Edge Function

### 2.1 Navigate to Your Project

\`\`\`powershell
cd "c:\Users\mdamk\OneDrive\Desktop\Otagon App\Otagon Latest\Otagon"
\`\`\`

### 2.2 Set Environment Variables

Set the Resend API key as a Supabase secret:

\`\`\`powershell
# Login to Supabase (if not already logged in)
supabase login

# Link to your project
supabase link --project-ref qajcxgkqloumogioomiz

# Set the Resend API key
supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here

# Set your app URL
supabase secrets set APP_URL=https://otagon.app
\`\`\`

### 2.3 Deploy the Edge Function

\`\`\`powershell
# Deploy the waitlist-email function
supabase functions deploy waitlist-email --no-verify-jwt

# You should see output like:
# Deploying... (source size: XX kB)
# Deployed! 
# https://qajcxgkqloumogioomiz.supabase.co/functions/v1/waitlist-email
\`\`\`

### 2.4 Verify Deployment

Test the function manually:

\`\`\`powershell
# Test with curl
curl -X POST https://qajcxgkqloumogioomiz.supabase.co/functions/v1/waitlist-email `
  -H "Content-Type: application/json" `
  -d '{"email": "test@example.com"}'
\`\`\`

---

## Step 3: Set Up Automatic Triggers

You have **two options** for triggering emails automatically:

### Option A: Database Webhook (Recommended - Easier)

1. **Open Supabase Dashboard:**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project: `qajcxgkqloumogioomiz`

2. **Navigate to Database Webhooks:**
   - Click **Database** in sidebar
   - Click **Webhooks**
   - Click **Create a new hook**

3. **Configure Webhook:**
   - **Name:** `waitlist-email-automation`
   - **Table:** `waitlist`
   - **Events:** Check only **INSERT**
   - **Type:** `HTTP Request`
   - **HTTP Request Details:**
     - **Method:** `POST`
     - **URL:** `https://qajcxgkqloumogioomiz.supabase.co/functions/v1/waitlist-email`
     - **Headers:**
       - Add header: `Content-Type` = `application/json`
     - **Payload:** Leave as default (sends `record` with new row data)
   
4. **Save & Enable:**
   - Click **Create webhook**
   - Toggle the webhook to **Enabled**

5. **Apply the alternative migration:**
   \`\`\`powershell
   # From your project directory
   supabase db push
   \`\`\`

### Option B: Database Trigger with pg_net (Advanced)

This approach uses PostgreSQL's native trigger system.

1. **Enable pg_net extension (if not enabled):**
   \`\`\`sql
   -- In Supabase SQL Editor
   CREATE EXTENSION IF NOT EXISTS pg_net;
   \`\`\`

2. **Apply the trigger migration:**
   \`\`\`powershell
   # Apply the migration
   supabase db push
   \`\`\`

---

## Step 4: Update Email Settings in Resend

### 4.1 Configure "From" Email Address

The Edge Function uses: `welcome@otagon.app`

**If you verified your domain:**
- This will work automatically

**If using test domain:**
- Change line in `index.ts`:
  \`\`\`typescript
  from: 'Otagon <onboarding@resend.dev>',
  \`\`\`

### 4.2 Set Reply-To Email

Update the reply-to address in the Edge Function:
\`\`\`typescript
reply_to: 'support@otagon.app', // Change to your actual support email
\`\`\`

---

## Step 5: Test the Complete Flow

### 5.1 Test via Landing Page

1. Go to your Otagon landing page
2. Enter a test email in the waitlist form
3. Click "Join the Waitlist"
4. Check the email inbox (including spam folder)

### 5.2 Test via Database

Insert directly into the database:

\`\`\`sql
INSERT INTO public.waitlist (email, source, status)
VALUES ('your-test-email@example.com', 'manual_test', 'pending');
\`\`\`

### 5.3 Verify in Resend Dashboard

1. Go to Resend dashboard
2. Click **Emails** in sidebar
3. You should see your test email listed
4. Click on it to view details:
   - Delivery status
   - Opens/clicks (if tracking enabled)
   - Email preview

---

## 📊 Monitoring & Analytics

### View Email Logs in Resend

1. **Emails Tab:** See all sent emails
2. **Analytics:** View open rates, click rates, bounces
3. **Domains:** Check domain health and reputation

### View Logs in Supabase

\`\`\`powershell
# View edge function logs
supabase functions logs waitlist-email --tail
\`\`\`

### Database Queries

Check email status:

\`\`\`sql
-- See all waitlist entries and email status
SELECT 
  email,
  source,
  created_at,
  email_sent_at,
  email_status
FROM public.waitlist
ORDER BY created_at DESC
LIMIT 50;

-- Count pending emails
SELECT COUNT(*) 
FROM public.waitlist 
WHERE email_status = 'pending';
\`\`\`

---

## 🔧 Customization

### Modify Email Template

Edit `supabase/functions/waitlist-email/index.ts`:

\`\`\`typescript
// Find the createWelcomeEmailHTML function
function createWelcomeEmailHTML(email: string, loginUrl: string): string {
  return \`
    <!DOCTYPE html>
    <html>
      <!-- Customize your HTML here -->
    </html>
  \`;
}
\`\`\`

Then redeploy:
\`\`\`powershell
supabase functions deploy waitlist-email --no-verify-jwt
\`\`\`

### Add More Email Types

Create new functions for different email types:
- Welcome series (day 1, 3, 7)
- Feature announcements
- Upgrade prompts
- Re-engagement campaigns

---

## 🛠️ Troubleshooting

### Issue: Emails not sending

**Check:**
1. Edge function logs: `supabase functions logs waitlist-email`
2. Resend dashboard for error messages
3. Database webhook status (if using webhooks)
4. API key is correctly set: `supabase secrets list`

**Common fixes:**
- Verify RESEND_API_KEY is set correctly
- Check "from" email domain is verified
- Ensure webhook is enabled
- Check database trigger is active

### Issue: Emails go to spam

**Solutions:**
1. Verify your domain in Resend
2. Add all DNS records (SPF, DKIM, Return-Path)
3. Use a branded "from" address
4. Add unsubscribe link (for production)
5. Warm up your domain (send gradually increasing volumes)

### Issue: Database trigger not firing

**Check:**
\`\`\`sql
-- List all triggers on waitlist table
SELECT 
  tgname AS trigger_name,
  tgtype,
  tgenabled
FROM pg_trigger
WHERE tgrelid = 'public.waitlist'::regclass;
\`\`\`

**Enable trigger if disabled:**
\`\`\`sql
ALTER TABLE public.waitlist ENABLE TRIGGER on_waitlist_insert;
\`\`\`

---

## 💰 Pricing

### Resend Pricing (as of 2024)

**Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for early-stage waitlist

**Paid Plans:**
- **Basic:** $20/month - 50,000 emails
- **Pro:** $80/month - 250,000 emails
- **Scale:** Custom pricing

[View current pricing](https://resend.com/pricing)

### Supabase Edge Functions

- **Free tier:** 500,000 invocations/month
- **Pro tier:** 2 million invocations/month included
- Additional invocations: $0.50 per 100,000

---

## 🔒 Security Best Practices

1. **Never commit API keys to git**
   - Use Supabase secrets
   - Add `.env*` to `.gitignore`

2. **Use environment-specific keys**
   - Development key for testing
   - Production key for live app

3. **Monitor for abuse**
   - Set up rate limiting
   - Monitor email bounce rates
   - Check for spam complaints

4. **Validate email addresses**
   - The function includes basic validation
   - Consider adding email verification service

---

## 🚀 Next Steps

### Enhance Your Email Automation

1. **Email Series:** Set up follow-up emails (day 3, day 7)
2. **Segmentation:** Send different emails based on user source
3. **A/B Testing:** Test different subject lines and content
4. **Analytics:** Track email opens and link clicks
5. **Unsubscribe:** Add unsubscribe functionality for compliance

### Integration Ideas

- Send notification when user creates account
- Welcome email series (onboarding)
- Monthly digest of new features
- Upgrade prompts for free users
- Re-engagement campaigns

---

## 📞 Support

### Resend Support
- Documentation: [https://resend.com/docs](https://resend.com/docs)
- Email: support@resend.com
- Discord: [Resend Community](https://resend.com/discord)

### Supabase Support
- Documentation: [https://supabase.com/docs](https://supabase.com/docs)
- Discord: [Supabase Community](https://discord.supabase.com)

---

## ✅ Checklist

Before going to production:

- [ ] Resend account created and verified
- [ ] Domain verified in Resend (or using test domain)
- [ ] API key generated and stored in Supabase secrets
- [ ] Edge function deployed successfully
- [ ] Database webhook/trigger configured
- [ ] Test email sent and received
- [ ] Email template customized with your branding
- [ ] "From" and "Reply-to" addresses configured
- [ ] Monitoring set up (Resend + Supabase logs)
- [ ] Email sending tested from landing page
- [ ] Spam folder checked (emails delivering to inbox)
- [ ] Terms of Service and Privacy Policy links work
- [ ] Unsubscribe mechanism in place (for production)

---

## 📝 Summary

You now have a fully automated waitlist email system that:
- ✅ Captures emails from your landing page
- ✅ Automatically sends beautifully designed welcome emails
- ✅ Includes direct links to your login page
- ✅ Tracks delivery and engagement
- ✅ Scales automatically with your growth

The system is production-ready and costs less than $20/month for up to 50,000 emails!

Good luck with your launch! 🎮🚀
