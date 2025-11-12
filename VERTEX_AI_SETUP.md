# Vertex AI Setup Guide for Production Deployment

This guide will help you migrate from Gemini API to Vertex AI for production-grade AI capabilities with better rate limits and reliability.

## 🎯 Why Vertex AI?

- **Better Rate Limits**: Higher quotas for production use
- **Enterprise-Grade**: Better SLA and reliability
- **Server-Side Security**: Credentials never exposed to client
- **Cost-Effective**: Better pricing for high-volume usage
- **Advanced Features**: Access to latest models and features

---

## 📋 Prerequisites

1. Google Cloud account
2. Google Cloud project with billing enabled
3. Supabase project (already set up)
4. Your app code (already updated)

---

## 🚀 Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project name: `otagon-production` (or your preferred name)
4. Click "Create"
5. **Note your Project ID** (you'll need this later)

### Step 2: Enable Vertex AI API

1. In Google Cloud Console, search for "Vertex AI API"
2. Click "Enable" to activate the API
3. Also enable "Cloud Resource Manager API" if prompted

### Step 3: Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **"Create Service Account"**
3. Enter details:
   - **Name**: `otagon-vertex-ai`
   - **Description**: `Service account for Vertex AI API calls from Supabase`
4. Click "Create and Continue"
5. Grant role: **Vertex AI User** (search for "Vertex AI User" in roles)
6. Click "Continue" → "Done"

### Step 4: Create Service Account Key (JSON)

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **"Add Key"** → **"Create new key"**
4. Choose **JSON** format
5. Click "Create"
6. **Save the downloaded JSON file securely** (don't commit to git!)

The JSON file will look like this:
```json
{
  "type": "service_account",
  "project_id": "otagon-production",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "otagon-vertex-ai@otagon-production.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Step 5: Configure Supabase Secrets

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions** → **Manage Secrets**
3. Add these secrets:

```bash
# Google Cloud Project ID
VERTEX_PROJECT_ID=otagon-production

# Google Cloud Region (optional, defaults to us-central1)
VERTEX_LOCATION=us-central1

# Service Account Credentials (paste entire JSON as single line)
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"otagon-production",...}
```

**Important**: For `GOOGLE_CLOUD_CREDENTIALS`, paste the entire JSON content as a single line (no line breaks).

### Step 6: Deploy Updated Edge Function

Your Edge Function has already been updated to use Vertex AI. Deploy it:

```bash
# Make sure Supabase CLI is installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy ai-proxy
```

### Step 7: Verify Deployment

Test the Edge Function:

```bash
# Get your Supabase URL and anon key from .env file
curl -X POST https://YOUR_SUPABASE_URL/functions/v1/ai-proxy \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Say hello",
    "requestType": "text"
  }'
```

---

## 🔧 Environment Variables Summary

### For Supabase Edge Function:
```bash
VERTEX_PROJECT_ID=your-gcp-project-id
VERTEX_LOCATION=us-central1
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account",...entire JSON...}
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### For Frontend (no changes needed):
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
# VITE_GEMINI_API_KEY no longer needed! ✅
```

---

## 📊 Cost Estimation

Vertex AI pricing (as of Nov 2025):

**Gemini 1.5 Flash**:
- Input: $0.075 per 1M tokens
- Output: $0.30 per 1M tokens

**Gemini 1.5 Pro**:
- Input: $1.25 per 1M tokens
- Output: $5.00 per 1M tokens

**Example costs for 10,000 users:**
- Free tier: 55 text queries = ~275K queries/month
- Assuming avg 500 tokens per query
- Cost: ~$10-20/month for free tier users
- Pro tier generates revenue to cover costs

---

## 🔒 Security Best Practices

✅ **Done Automatically:**
- Service account credentials stored in Supabase secrets
- Never exposed to client-side code
- OAuth tokens cached and refreshed automatically
- Rate limiting per user (10 requests/minute)
- User authentication required for all requests

✅ **You Should Also:**
- Enable VPC Service Controls for extra security
- Set up billing alerts in Google Cloud
- Monitor usage in Google Cloud Console
- Rotate service account keys periodically
- Enable Cloud Audit Logs

---

## 🚨 Troubleshooting

### Error: "Failed to get access token"
**Solution**: Check that:
- Service account JSON is valid
- Private key is not corrupted
- Service account has "Vertex AI User" role

### Error: "API not enabled"
**Solution**: 
- Enable Vertex AI API in Google Cloud Console
- Wait 1-2 minutes for propagation

### Error: "Permission denied"
**Solution**:
- Verify service account has correct role
- Check project ID is correct
- Ensure billing is enabled on GCP project

### Error: "Invalid credentials"
**Solution**:
- Verify JSON is pasted correctly (single line, no line breaks)
- Check for any trailing spaces or newlines
- Re-create service account key if corrupted

---

## 📈 Monitoring & Optimization

### View Usage in Google Cloud:
1. Go to **APIs & Services** → **Dashboard**
2. Select **Vertex AI API**
3. View request counts, latency, errors

### Set Up Alerts:
1. Go to **Monitoring** → **Alerting**
2. Create alerts for:
   - High error rates
   - Quota approaching limit
   - Unusual spending patterns

### Optimize Costs:
- Use Flash model for simple queries
- Use Pro model only for complex analysis
- Implement client-side caching
- Monitor token usage per user

---

## ✅ Verification Checklist

Before going to production:

- [ ] Google Cloud project created and billing enabled
- [ ] Vertex AI API enabled
- [ ] Service account created with "Vertex AI User" role
- [ ] Service account JSON key downloaded and secured
- [ ] Supabase secrets configured (all 3 variables)
- [ ] Edge Function deployed successfully
- [ ] Test API call returns successful response
- [ ] Monitoring and alerts set up
- [ ] Cost tracking configured
- [ ] Security audit completed

---

## 🔄 Migration Checklist

- [x] Edge Function updated to use Vertex AI
- [x] OAuth2 authentication implemented
- [x] Token caching added for performance
- [x] Error handling improved
- [ ] Supabase secrets configured
- [ ] Edge Function deployed
- [ ] Tested in production environment
- [ ] Old GEMINI_KEY secret removed (after confirming Vertex AI works)

---

## 📞 Support Resources

- **Vertex AI Documentation**: https://cloud.google.com/vertex-ai/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Google Cloud Support**: https://cloud.google.com/support
- **Vertex AI Pricing**: https://cloud.google.com/vertex-ai/pricing

---

## 🎉 You're Ready!

Once all steps are completed:
1. Your app will use production-grade Vertex AI
2. Better rate limits and reliability
3. More secure (server-side only)
4. Ready to scale to thousands of users

**Next**: Follow the GitHub Pages deployment guide to deploy your frontend!
