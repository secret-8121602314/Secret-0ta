# 🍋 LemonSqueezy Setup Checklist
## What You Need & Where to Find It

---

## ✅ Information You Already Have

- ✅ **Product ID**: `724192`
- ✅ **Variant ID (Pro)**: `1139861`
- ✅ **Variant ID (Vanguard Pro)**: `1139844`

---

## 📝 What You Still Need to Find

### 1. **Store ID** 🏪
**What it is:** Your unique store identifier  
**Where to find it:**
1. Log into your LemonSqueezy dashboard
2. Go to **Settings** (gear icon in sidebar)
3. Click on **Stores**
4. You'll see your store listed with the **Store ID** next to it
5. Example format: `12345` or `store_xxxxx`

**Why you need it:** To identify which store processes the payments

---

### 2. **API Key (Secret)** 🔑
**What it is:** Secret key for making API calls to LemonSqueezy  
**Where to find it:**
1. Go to **Settings** → **API**
2. Click **"Create API Key"** button (or use existing one)
3. Give it a name like "Otagon Production"
4. **Copy the key immediately** (you can only see it once!)
5. Format: `lsk_xxxxxxxxxxxxxxxxxxxxx`

**⚠️ IMPORTANT:** 
- Keep this SECRET - never commit to Git
- This goes in Supabase Edge Function secrets ONLY
- Never expose in frontend code

**Why you need it:** To verify webhooks and make API calls from your backend

---

### 3. **Webhook Signing Secret** 🔐
**What it is:** Secret used to verify webhook authenticity  
**Where to find it:**

**First, create the webhook:**
1. Go to **Settings** → **Webhooks**
2. Click **"Add webhook"** or **"Create webhook"**
3. For **Callback URL**, enter: `TEMPORARY_URL` (we'll update this later)
4. Select these events:
   - ✅ `subscription_created`
   - ✅ `subscription_updated`
   - ✅ `subscription_cancelled`
   - ✅ `subscription_expired`
   - ✅ `subscription_resumed`
   - ✅ `subscription_paused`
   - ✅ `subscription_unpaused`
   - ✅ `subscription_payment_success`
   - ✅ `subscription_payment_failed`
5. Click **"Create webhook"**

**Then get the signing secret:**
1. After creating, click on the webhook you just created
2. Find **"Signing Secret"** section
3. Click **"Show"** or copy icon
4. Format: `whsec_xxxxxxxxxxxxxxxxxxxxx`

**⚠️ IMPORTANT:** 
- Keep this SECRET
- Never commit to Git
- Used to verify webhook requests are actually from LemonSqueezy

**Why you need it:** Security - to prevent fake webhook calls

---

### 4. **Store Subdomain/URL** 🌐
**What it is:** Your checkout page URL  
**Where to find it:**
1. Go to **Settings** → **Stores**
2. Look for **"Store URL"** or **"Checkout URL"**
3. Format: `https://yourstorename.lemonsqueezy.com`

**Example:** If your store is "otagon", it would be: `https://otagon.lemonsqueezy.com`

**Why you need it:** To construct checkout URLs

---

### 5. **Test Mode Toggle** 🧪 (Optional but Recommended)
**What it is:** Allows you to test payments without real charges  
**Where to find it:**
1. Go to **Settings** → **Stores**
2. Look for **"Test mode"** toggle
3. Enable it for testing

**Why you need it:** Test the entire flow before going live

---

## 📋 Information Gathering Template

Copy this and fill it out as you find each item:

```
LEMONSQUEEZY CREDENTIALS
========================

✅ Product ID: 724192
✅ Variant ID (Pro): 1139861
✅ Variant ID (Vanguard Pro): 1139844

Store Information:
[ ] Store ID: _______________________
[ ] Store URL: _______________________
[ ] Store Subdomain: _______________________

API & Security:
[ ] API Key: lsk_______________________
[ ] Webhook Signing Secret: whsec_______________________

Webhook Configuration:
[ ] Webhook URL: (we'll set this after deploying Edge Function)
[ ] Webhook ID: _______________________
[ ] Webhook Status: Active / Inactive

Test Mode:
[ ] Test mode enabled: Yes / No
[ ] Test API Key (if different): _______________________
```

---

## 🎯 Step-by-Step Discovery Process

### Step 1: Get Store ID
1. Dashboard → Settings → Stores
2. Copy Store ID
3. Paste in template above

### Step 2: Create API Key
1. Dashboard → Settings → API
2. Click "Create API Key"
3. Name it "Otagon Production"
4. **COPY IMMEDIATELY** (you can't see it again!)
5. Save in password manager or secure note
6. Paste in template above

### Step 3: Create Webhook
1. Dashboard → Settings → Webhooks
2. Click "Add webhook"
3. URL: `https://placeholder.com` (temporary)
4. Select all subscription events
5. Save webhook
6. Copy Signing Secret
7. Paste in template above

### Step 4: Get Store URL
1. Dashboard → Settings → Stores
2. Copy "Store URL" or "Checkout URL"
3. Paste in template above

### Step 5: Verify Product & Variants
1. Dashboard → Products
2. Click on your product (ID: 724192)
3. Verify both variants exist:
   - Pro (1139861)
   - Vanguard Pro (1139844)
4. Check pricing is correct:
   - Pro: $5/month
   - Vanguard Pro: $35/year

---

## 🔐 Where to Store These Secrets

### Frontend (.env.local)
```env
# Public information (safe to expose)
VITE_LEMONSQUEEZY_STORE_ID=your_store_id
VITE_LEMONSQUEEZY_PRODUCT_ID=724192
VITE_LEMONSQUEEZY_VARIANT_PRO=1139861
VITE_LEMONSQUEEZY_VARIANT_VANGUARD=1139844
```

### Backend (Supabase Edge Function Secrets)
```env
# SECRET - Never expose these!
LEMONSQUEEZY_API_KEY=lsk_xxxxxxxxxxxxx
LEMONSQUEEZY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
LEMONSQUEEZY_STORE_ID=your_store_id
```

**How to add Supabase secrets:**
1. Go to Supabase Dashboard
2. Project Settings → Edge Functions
3. Add each secret using the form
4. Or use CLI: `supabase secrets set LEMONSQUEEZY_API_KEY=your_key`

---

## ⚠️ Important Security Notes

### ✅ DO:
- Store API keys in environment variables
- Use different keys for test/production
- Rotate keys periodically
- Keep webhook secrets private
- Use test mode for development

### ❌ DON'T:
- Commit secrets to Git
- Share API keys publicly
- Use production keys in development
- Expose secrets in frontend code
- Skip webhook signature verification

---

## 🧪 Testing Checklist

Once you have all credentials:

- [ ] Test mode enabled
- [ ] Can access LemonSqueezy API with key
- [ ] Webhook receives test events
- [ ] Webhook signature verification works
- [ ] Can create test checkout
- [ ] Can complete test payment
- [ ] Webhook fires correctly
- [ ] Database updates correctly

---

## 🚀 Next Steps After Gathering Info

1. ✅ Fill out the information template above
2. ✅ Store secrets securely
3. ✅ Enable test mode
4. ✅ Update .env.local with public info
5. ✅ Add secrets to Supabase
6. 🎯 Ready to start Phase 1: Database Setup!

---

## 📞 Need Help?

If you can't find something:
- LemonSqueezy Docs: https://docs.lemonsqueezy.com
- Support: support@lemonsqueezy.com
- Discord: LemonSqueezy Community

---

**Once you have all this information, reply with "Ready" and we'll start Phase 1!** 🚀
