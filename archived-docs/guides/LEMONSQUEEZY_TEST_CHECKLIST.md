# ✅ LemonSqueezy Integration - Test Checklist

**Status:** Ready for Testing  
**Dev Server:** http://localhost:5174/

---

## 🧪 Manual Testing Steps

### Test 1: Free User → Pro Upgrade
1. [ ] Sign in as a free user
2. [ ] Open Settings or Credit Modal
3. [ ] Click "Upgrade to Pro" 
4. [ ] Verify LemonSqueezy overlay opens
5. [ ] Complete test checkout ($5/month)
6. [ ] Verify modal closes
7. [ ] Verify user is redirected to `/payment-success`
8. [ ] Check user tier is now 'pro'
9. [ ] Verify limits updated (1,583 text, 328 image)

### Test 2: Trial User → Paid Pro
1. [ ] Start with trial user (has `trial_expires_at` set)
2. [ ] Open PaymentModal
3. [ ] Verify trial conversion notice shows
4. [ ] Complete checkout
5. [ ] Verify `trial_expires_at` is cleared in database
6. [ ] User remains as 'pro' tier (not downgraded)

### Test 3: Pro User → Vanguard Upgrade  
1. [ ] Sign in as Pro user
2. [ ] Open PaymentModal
3. [ ] Verify ONLY Vanguard Pro tier shows
4. [ ] Complete checkout ($35/year)
5. [ ] Verify tier updates to 'vanguard_pro'

### Test 4: Free User → Vanguard Direct
1. [ ] Sign in as free user
2. [ ] Open PaymentModal
3. [ ] Select Vanguard Pro tier
4. [ ] Complete checkout
5. [ ] Verify tier updates to 'vanguard_pro'

---

## 🔍 Webhook Verification

After each test purchase, check:

### Via Supabase Dashboard
1. Go to **Database** → **subscriptions** table
   - [ ] New row created with correct `lemon_subscription_id`
   - [ ] `tier` matches selected plan
   - [ ] `status` = 'active'
   - [ ] `user_id` matches

2. Go to **Database** → **payment_events** table
   - [ ] Event logged with `event_type` = 'subscription_created'
   - [ ] `processed` = true
   - [ ] `payload` contains webhook data

3. Go to **Database** → **users** table
   - [ ] `tier` updated correctly
   - [ ] `active_subscription_id` set
   - [ ] `lemon_customer_id` populated
   - [ ] `trial_expires_at` = null (if was trial user)

### Via LemonSqueezy Dashboard
1. Go to **Webhooks** → **History**
   - [ ] See successful 200 response for events
   - [ ] No failed webhook deliveries

---

## 🐛 Known Issues to Watch For

### ✅ FIXED
- ~~auth_user_id not passed in checkout~~ → Fixed in checkoutService.ts
- ~~TypeScript errors with subscriptions table~~ → Fixed with type assertion

### Potential Issues
- **Webhook signature mismatch**: Ensure secret matches exactly
- **User not found**: Check auth_user_id is correct
- **Table doesn't exist**: Migration may need manual run

---

## 📊 Test Results Log

| Test | Date | Result | Notes |
|------|------|--------|-------|
| Free → Pro | | ⏳ Pending | |
| Trial → Paid Pro | | ⏳ Pending | |
| Pro → Vanguard | | ⏳ Pending | |
| Free → Vanguard | | ⏳ Pending | |
| Webhook Events | | ⏳ Pending | |
| Database Updates | | ⏳ Pending | |

---

## 🚀 Next Steps After Testing

1. [ ] Verify all test scenarios pass
2. [ ] Check webhook logs show no errors
3. [ ] Test subscription cancellation flow
4. [ ] Test subscription renewal (if possible in test mode)
5. [ ] Document any issues found
6. [ ] Deploy to production when ready

---

**Dev server running at:** http://localhost:5174/  
**Ready to test!** 🎉
