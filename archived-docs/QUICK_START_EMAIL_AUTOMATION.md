# Quick Start: Deploy Waitlist Email Automation

Run these commands in order to set up your automated waitlist emails:

## 1️⃣ Sign up for Resend (2 minutes)
1. Go to https://resend.com
2. Create account
3. Go to API Keys → Create API Key
4. Copy your API key (starts with `re_`)

## 2️⃣ Configure Supabase (1 minute)

\`\`\`powershell
# Navigate to project
cd "c:\Users\mdamk\OneDrive\Desktop\Otagon App\Otagon Latest\Otagon"

# Login to Supabase
supabase login

# Link project
supabase link --project-ref qajcxgkqloumogioomiz

# Set your Resend API key (replace with your actual key)
supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Set your app URL
supabase secrets set APP_URL=https://otagon.app
\`\`\`

## 3️⃣ Deploy Edge Function (1 minute)

\`\`\`powershell
# Deploy the email automation function
supabase functions deploy waitlist-email --no-verify-jwt
\`\`\`

## 4️⃣ Set Up Database Webhook (2 minutes)

### Via Supabase Dashboard (Easiest):
1. Go to https://supabase.com/dashboard/project/qajcxgkqloumogioomiz
2. Click **Database** → **Webhooks**
3. Click **Create a new hook**
4. Configure:
   - **Name:** `waitlist-email-automation`
   - **Table:** `waitlist`
   - **Events:** Check only `INSERT`
   - **Method:** `POST`
   - **URL:** `https://qajcxgkqloumogioomiz.supabase.co/functions/v1/waitlist-email`
   - **Headers:** Add `Content-Type: application/json`
5. Click **Create webhook**
6. Toggle to **Enabled**

### Alternative - Apply SQL Migration:

\`\`\`powershell
# Apply the database migration
supabase db push
\`\`\`

## 5️⃣ Test It! (1 minute)

### Test from your landing page:
1. Go to your Otagon landing page
2. Enter a test email in the waitlist form
3. Submit
4. Check your email inbox

### Or test via command line:

\`\`\`powershell
curl -X POST https://qajcxgkqloumogioomiz.supabase.co/functions/v1/waitlist-email \`
  -H "Content-Type: application/json" \`
  -d '{"email": "your-test@email.com"}'
\`\`\`

## ✅ Done!

Your waitlist automation is now live! Every new signup will automatically receive a welcome email with a link to access your app.

### View Logs:
\`\`\`powershell
# See what's happening
supabase functions logs waitlist-email --tail
\`\`\`

### Monitor Emails:
- Go to https://resend.com/emails to see delivery status

---

**Having issues?** Check the full guide: `WAITLIST_EMAIL_AUTOMATION_SETUP.md`

**Cost:** Free for first 3,000 emails/month with Resend
