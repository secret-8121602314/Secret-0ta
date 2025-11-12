# 📧 Waitlist Email Automation

Automated welcome emails for Otagon waitlist signups using **Resend** and **Supabase Edge Functions**.

## 🎯 What This Does

When a user signs up for your waitlist:
1. ✅ Email is captured in Supabase `waitlist` table
2. 🤖 Database webhook/trigger fires automatically
3. 📧 Beautiful welcome email sent via Resend
4. 🔗 Email includes direct link to login page
5. 📊 Delivery tracked in Resend dashboard

## 🚀 Quick Start

### Option 1: Automated Script (Recommended)

\`\`\`powershell
# Run the deployment script
.\deploy-email-automation.ps1
\`\`\`

This will:
- Set up Resend API key
- Deploy the Edge Function
- Configure database migrations
- Guide you through webhook setup

### Option 2: Manual Setup

Follow the detailed guide: **[WAITLIST_EMAIL_AUTOMATION_SETUP.md](./WAITLIST_EMAIL_AUTOMATION_SETUP.md)**

## 📁 Files Created

| File | Purpose |
|------|---------|
| `supabase/functions/waitlist-email/index.ts` | Edge Function that sends emails |
| `supabase/migrations/20241112_waitlist_email_trigger.sql` | Database trigger (Option A) |
| `supabase/migrations/20241112_waitlist_email_alternative.sql` | Webhook support (Option B) |
| `WAITLIST_EMAIL_AUTOMATION_SETUP.md` | Complete setup guide |
| `QUICK_START_EMAIL_AUTOMATION.md` | 5-minute quick start |
| `deploy-email-automation.ps1` | Automated deployment script |
| `test-email-automation.ps1` | Testing script |

## 🧪 Testing

### Test the email function:

\`\`\`powershell
# Using the test script
.\test-email-automation.ps1

# Or manually
curl -X POST https://qajcxgkqloumogioomiz.supabase.co/functions/v1/waitlist-email \`
  -H "Content-Type: application/json" \`
  -d '{"email": "test@example.com"}'
\`\`\`

### Test via landing page:
1. Visit your landing page
2. Enter email in waitlist form
3. Check inbox (and spam folder)

## 📊 Monitoring

### View Function Logs:
\`\`\`powershell
supabase functions logs waitlist-email --tail
\`\`\`

### View Email Delivery:
- Resend Dashboard: https://resend.com/emails

### Database Status:
\`\`\`sql
-- Check recent signups
SELECT 
  email,
  source,
  created_at,
  email_sent_at,
  email_status
FROM public.waitlist
ORDER BY created_at DESC
LIMIT 20;
\`\`\`

## 🎨 Email Template

The welcome email includes:
- **Branded header** with Otagon logo and gradient
- **Personalized greeting** with user's email
- **Call-to-action button** linking to login page
- **Feature highlights** (AI assistant, screenshot analysis, etc.)
- **Getting started guide** (5 simple steps)
- **Professional footer** with links and contact info
- **Mobile-responsive design**

Preview the template in: `supabase/functions/waitlist-email/index.ts` (lines 65-200)

## 🔧 Customization

### Change Email Branding

Edit `supabase/functions/waitlist-email/index.ts`:

\`\`\`typescript
// Colors
background: linear-gradient(135deg, #E53A3A 0%, #D98C1F 100%);

// Logo text
<div class="logo">OTAGON</div>

// From address
from: 'Otagon <welcome@otagon.app>'

// Reply-to
reply_to: 'support@otagon.app'
\`\`\`

Then redeploy:
\`\`\`powershell
supabase functions deploy waitlist-email --no-verify-jwt
\`\`\`

### Change Login URL

Edit line in Edge Function:
\`\`\`typescript
const loginUrl = \`\${APP_URL}?source=waitlist_email&email=\${encodeURIComponent(email)}\`;
\`\`\`

## 💰 Cost

### Resend
- **Free:** 3,000 emails/month, 100 emails/day
- **Basic ($20/mo):** 50,000 emails/month
- **Pro ($80/mo):** 250,000 emails/month

### Supabase
- **Free:** 500,000 function invocations/month
- **Pro:** 2 million invocations/month

**Total for small waitlist:** $0/month 🎉

## 🔒 Security

- ✅ API keys stored in Supabase secrets (not in code)
- ✅ Edge Function validates email format
- ✅ CORS headers configured
- ✅ Service role key used for database operations
- ✅ Webhook authentication via Supabase

## 🐛 Troubleshooting

### Emails not sending?

1. **Check function logs:**
   \`\`\`powershell
   supabase functions logs waitlist-email
   \`\`\`

2. **Verify API key:**
   \`\`\`powershell
   supabase secrets list
   \`\`\`

3. **Test manually:**
   \`\`\`powershell
   .\test-email-automation.ps1
   \`\`\`

4. **Check webhook status:**
   - Supabase Dashboard → Database → Webhooks
   - Ensure webhook is enabled

### Emails in spam?

1. Verify your domain in Resend
2. Add SPF/DKIM records to DNS
3. Use branded "from" address
4. Gradually increase send volume (domain warm-up)

See full troubleshooting guide in **WAITLIST_EMAIL_AUTOMATION_SETUP.md**

## 📚 Documentation

- **Quick Start:** [QUICK_START_EMAIL_AUTOMATION.md](./QUICK_START_EMAIL_AUTOMATION.md) - 5 minutes
- **Complete Guide:** [WAITLIST_EMAIL_AUTOMATION_SETUP.md](./WAITLIST_EMAIL_AUTOMATION_SETUP.md) - Full details
- **Resend Docs:** https://resend.com/docs
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

## 🆘 Support

- **Resend:** support@resend.com
- **Supabase:** https://discord.supabase.com

## ✅ Production Checklist

Before launching:

- [ ] Resend account created and verified
- [ ] Domain verified in Resend (optional but recommended)
- [ ] API key stored in Supabase secrets
- [ ] Edge Function deployed
- [ ] Database webhook/trigger configured and enabled
- [ ] Test email sent successfully
- [ ] Email arrives in inbox (not spam)
- [ ] Login link works correctly
- [ ] Brand colors and messaging updated
- [ ] "From" and "Reply-to" addresses set
- [ ] Monitoring/logging configured
- [ ] Terms of Service and Privacy Policy links work

## 🚀 Next Steps

1. **Email Series:** Set up day 3, day 7 follow-ups
2. **Segmentation:** Different emails based on source
3. **A/B Testing:** Test subject lines and content
4. **Analytics:** Track opens and clicks
5. **Re-engagement:** Email inactive signups

---

**Made with ❤️ for Otagon**

Happy emailing! 🎮📧
