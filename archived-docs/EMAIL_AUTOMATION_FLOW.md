# Waitlist Email Automation Flow

## 📊 Architecture Diagram

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│                    USER SIGNS UP FOR WAITLIST                       │
│                    (Landing Page Form)                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    WAITLIST SERVICE                                 │
│  src/services/waitlistService.ts                                    │
│  - Validates email format                                           │
│  - Checks for duplicates                                            │
│  - Inserts into Supabase                                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                                │
│  Table: public.waitlist                                             │
│  - id (uuid)                                                        │
│  - email (text, unique)                                             │
│  - source (text)                                                    │
│  - status (pending/approved/rejected)                               │
│  - created_at (timestamp)                                           │
│  - email_sent_at (timestamp)                                        │
│  - email_status (pending/sent/failed)                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ INSERT event triggers
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│             DATABASE TRIGGER / WEBHOOK                              │
│  Option A: pg_trigger (trigger_waitlist_email function)             │
│  Option B: Database Webhook (configured in Supabase Dashboard)      │
│  - Fires on INSERT                                                  │
│  - Calls Edge Function with email data                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTION                           │
│  supabase/functions/waitlist-email/index.ts                         │
│  - Receives email address                                           │
│  - Validates email format                                           │
│  - Generates HTML email template                                    │
│  - Creates login URL with email parameter                           │
│  - Calls Resend API                                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         RESEND API                                  │
│  https://api.resend.com/emails                                      │
│  - Receives email request                                           │
│  - Validates sender domain                                          │
│  - Queues email for delivery                                        │
│  - Returns success/failure status                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EMAIL DELIVERY                                   │
│  - SMTP delivery to recipient                                       │
│  - SPF/DKIM authentication                                          │
│  - Spam filtering                                                   │
│  - Inbox placement                                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    USER RECEIVES EMAIL                              │
│  Subject: 🎮 Welcome to Otagon - Your Gaming Assistant Awaits!     │
│  - Branded HTML template                                            │
│  - Welcome message                                                  │
│  - "Access Your Account" CTA button                                 │
│  - Feature highlights                                               │
│  - Getting started guide                                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ User clicks CTA button
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    OTAGON LOGIN PAGE                                │
│  URL: https://otagon.app?source=waitlist_email&email=user@email.com │
│  - LoginSplashScreen component                                      │
│  - Email pre-filled (if query param present)                        │
│  - User can sign up with Google/Discord/Email                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    USER AUTHENTICATED                               │
│  - Account created in Supabase Auth                                 │
│  - User record created in users table                               │
│  - Onboarding flow begins                                           │
│  - User can start using Otagon                                      │
└─────────────────────────────────────────────────────────────────────┘
\`\`\`

## 🔄 Data Flow

### 1. Email Capture
\`\`\`
User Input → Validation → Supabase Insert → Success Message
\`\`\`

### 2. Automatic Email Trigger
\`\`\`
Database Event → Trigger/Webhook → Edge Function → Email API → Delivery
\`\`\`

### 3. User Conversion
\`\`\`
Email Link → Login Page → Authentication → User Record → Onboarding
\`\`\`

## ⚡ Performance Metrics

| Stage | Expected Time |
|-------|---------------|
| Form submission to database | < 500ms |
| Database insert to trigger | < 100ms |
| Edge Function execution | 200-500ms |
| Resend API processing | 500ms - 2s |
| Email delivery | 1-30 seconds |
| **Total (signup to inbox)** | **2-35 seconds** |

## 🔐 Security Layers

\`\`\`
┌─────────────────────────────────────────────┐
│  Client-Side Validation                     │
│  - Email format check                       │
│  - Duplicate prevention (UI)                │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│  Database Constraints                       │
│  - Unique email constraint                  │
│  - NOT NULL checks                          │
│  - Status enum validation                   │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│  Edge Function Validation                   │
│  - Email regex validation                   │
│  - Request body validation                  │
│  - Error handling                           │
└──────────────┬──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────┐
│  Resend API Security                        │
│  - API key authentication                   │
│  - Rate limiting                            │
│  - SPF/DKIM verification                    │
└─────────────────────────────────────────────┘
\`\`\`

## 📈 Scaling Considerations

| Users/Month | Emails/Month | Resend Plan | Cost |
|-------------|--------------|-------------|------|
| 0 - 3,000 | 0 - 3,000 | Free | $0 |
| 3,000 - 50,000 | 3,000 - 50,000 | Basic | $20/mo |
| 50,000 - 250,000 | 50,000 - 250,000 | Pro | $80/mo |
| 250,000+ | 250,000+ | Custom | Contact sales |

## 🛠️ Monitoring Points

### 1. Application Logs
\`\`\`powershell
supabase functions logs waitlist-email --tail
\`\`\`

### 2. Database Queries
\`\`\`sql
-- Recent signups
SELECT * FROM waitlist ORDER BY created_at DESC LIMIT 20;

-- Email status summary
SELECT email_status, COUNT(*) FROM waitlist GROUP BY email_status;
\`\`\`

### 3. Resend Dashboard
- Email delivery rate
- Open rate (if tracking enabled)
- Bounce rate
- Spam complaints

### 4. Error Tracking
- Edge Function errors
- Resend API errors
- Database constraint violations
- Network timeouts

## 🎯 Success Metrics

Track these KPIs:

1. **Conversion Rate:** Waitlist signups → Account creation
2. **Email Deliverability:** Sent → Delivered (target: >95%)
3. **Open Rate:** Delivered → Opened (target: 20-30%)
4. **Click Rate:** Opened → Clicked CTA (target: 10-20%)
5. **Time to Convert:** Signup → First login (monitor median)

## 🔄 Failure Handling

\`\`\`
Edge Function Fails
    ↓
Email status = 'failed'
    ↓
Logged in database
    ↓
Can retry manually or automatically
    ↓
Query: SELECT * FROM waitlist WHERE email_status = 'failed'
    ↓
Re-trigger email via Edge Function
\`\`\`

---

**Visual guide for understanding the complete automation flow!**
