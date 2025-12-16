# 🔧 Detailed Credit Limits Change Plan

## 📋 Target Values

### **New Credit Limits**
| Tier | Monthly Text Credits | Monthly Image Credits |
|------|---------------------|----------------------|
| **Free** | 20 | 15 |
| **Pro** | 350 | 150 |
| **Vanguard Pro** | 350 | 150 |

### **Current Values (To Be Changed)**
| Tier | Monthly Text Credits | Monthly Image Credits |
|------|---------------------|----------------------|
| **Free** | 55 | 25 |
| **Pro** | 1,583 | 328 |
| **Vanguard Pro** | 1,583 | 328 |

---

## 🎯 Complete File Modification Checklist

### **PHASE 1: Frontend Constants & Configuration**

#### 1. **`src/constants/index.ts`**
**Location:** Lines 7-10
```typescript
// CURRENT:
export const TIER_LIMITS = {
  [USER_TIERS.FREE]: { text: 55, image: 25 },
  [USER_TIERS.PRO]: { text: 1583, image: 328 },
  [USER_TIERS.VANGUARD_PRO]: { text: 1583, image: 328 },
} as const;

// CHANGE TO:
export const TIER_LIMITS = {
  [USER_TIERS.FREE]: { text: 20, image: 15 },
  [USER_TIERS.PRO]: { text: 350, image: 150 },
  [USER_TIERS.VANGUARD_PRO]: { text: 350, image: 150 },
} as const;
```

**Location:** Lines 14-37 (TIER_FEATURES descriptions)
```typescript
// CURRENT:
export const TIER_FEATURES = {
  [USER_TIERS.FREE]: [
    '55 text queries per month',
    '25 image queries per month',
    // ... rest
  ],
  [USER_TIERS.PRO]: [
    '1,583 text queries per month',
    '328 image queries per month',
    // ... rest
  ],
  [USER_TIERS.VANGUARD_PRO]: [
    '1,583 text queries per month',
    '328 image queries per month',
    // ... rest
  ],
} as const;

// CHANGE TO:
export const TIER_FEATURES = {
  [USER_TIERS.FREE]: [
    '20 text queries per month',
    '15 image queries per month',
    // ... rest
  ],
  [USER_TIERS.PRO]: [
    '350 text queries per month',
    '150 image queries per month',
    // ... rest
  ],
  [USER_TIERS.VANGUARD_PRO]: [
    '350 text queries per month',
    '150 image queries per month',
    // ... rest
  ],
} as const;
```

---

#### 2. **`src/services/lemonsqueezy/constants.ts`**
**Location:** Lines 26-60
```typescript
// CURRENT (Lines 35-37):
limits: {
  text: 1583,
  image: 328,
}

// CHANGE TO:
limits: {
  text: 350,
  image: 150,
}

// CURRENT (Lines 52-54):
limits: {
  text: 1583,
  image: 328,
}

// CHANGE TO:
limits: {
  text: 350,
  image: 150,
}
```

**ALSO UPDATE Features Array:**
```typescript
// Line 27-34 (Pro tier)
features: [
  '350 text queries / month',  // Changed from '1,583 text queries / month'
  '150 image queries / month', // Changed from '328 image queries / month'
  // ... rest unchanged
]

// Vanguard keeps same limits as Pro, so no feature text change needed there
```

---

### **PHASE 2: Frontend UI Components**

#### 3. **`src/components/LandingPageFresh.tsx`**

**Line ~1669 (Free Tier Pricing Card):**
```tsx
// CURRENT:
<FeatureListItem>55 Text | 25 Image Queries/month</FeatureListItem>

// CHANGE TO:
<FeatureListItem>20 Text | 15 Image Queries/month</FeatureListItem>
```

**Line ~1701 (Pro Tier Pricing Card):**
```tsx
// CURRENT:
<FeatureListItem>1,583 Text | 328 Image Queries/month</FeatureListItem>

// CHANGE TO:
<FeatureListItem>350 Text | 150 Image Queries/month</FeatureListItem>
```

**Line ~1730 (Vanguard Pro Tier Pricing Card):**
```tsx
// CURRENT:
<FeatureListItem>1,583 Text | 328 Image Queries/month</FeatureListItem>

// CHANGE TO:
<FeatureListItem>350 Text | 150 Image Queries/month</FeatureListItem>
```

---

#### 4. **`src/components/PaymentSuccess.tsx`**
**Line ~67:**
```tsx
// CURRENT:
<span>1,583+ queries</span>

// CHANGE TO:
<span>500 queries</span>  // Total: 350 text + 150 image = 500 per month
```

---

#### 5. **`src/components/splash/ProFeaturesSplashScreen.tsx`**
**Line ~35:**
```tsx
// CURRENT:
{ 
  title: "Massively Increased Limits", 
  description: "Get 1,583 Text | 328 Image Queries every month.", 
  icon: ... 
}

// CHANGE TO:
{ 
  title: "Massively Increased Limits", 
  description: "Get 350 Text | 150 Image Queries every month.", 
  icon: ... 
}
```

---

#### 6. **`src/components/splash/UpgradeSplashScreen.tsx`**
**Line ~32:**
```tsx
// CURRENT:
'1,583 Text | 328 Image Queries/month',

// CHANGE TO:
'350 Text | 150 Image Queries/month',
```

---

#### 7. **`src/components/splash/ProUpgradeSplashScreen.tsx`**
**Lines ~68 and ~73:**
```tsx
// CURRENT (Line 68):
{
  title: '1,583 Text Queries',
  // ...
}

// CHANGE TO:
{
  title: '350 Text Queries',
  // ...
}

// CURRENT (Line 73):
{
  title: '328 Image Queries',
  // ...
}

// CHANGE TO:
{
  title: '150 Image Queries',
  // ...
}
```

---

### **PHASE 3: Database Schema & Migrations**

#### 8. **`supabase/migrations/20251215000000_update_credit_limits.sql`**

**This file already exists and implements the NEW limits (20/15 for Free, 350/150 for Pro/Vanguard)!**

✅ **ALREADY CORRECT - NO CHANGES NEEDED**

Current values in this migration:
```sql
-- Lines 24-29:
WHEN 'pro' THEN
  v_text_limit := 350;
  v_image_limit := 150;
WHEN 'vanguard_pro' THEN
  v_text_limit := 350;
  v_image_limit := 150;
ELSE
  v_text_limit := 20;
  v_image_limit := 15;
```

**ACTION REQUIRED:** Apply this migration to your Supabase database if not already applied.

---

#### 9. **Database Function Update**

The `create_user_record` function needs to match the migration. Check current production schema:

```sql
-- Verify current function in production
SELECT prosrc FROM pg_proc WHERE proname = 'create_user_record';
```

If it doesn't match the migration file, run the migration:
```bash
supabase db push
```

Or manually update via Supabase SQL Editor using the content from `20251215000000_update_credit_limits.sql`.

---

### **PHASE 4: Backend Edge Functions**

#### 10. **`supabase/functions/ai-chat/index.ts`**

**Line ~49-52 (Credit validation constants):**

⚠️ **NOTE:** This file only validates grounding usage, NOT text/image credits. Those are validated by the database schema.

The grounding limits are separate from text/image credits and don't need to change for this update.

**NO CHANGES NEEDED** - Grounding limits remain:
```typescript
const GROUNDING_LIMITS = {
  free: { game_knowledge: 0, ai_message: 4 },
  pro: { game_knowledge: 20, ai_message: 30 },
  vanguard_pro: { game_knowledge: 20, ai_message: 30 }
};
```

---

### **PHASE 5: Services & Backend Logic**

#### 11. **`src/services/groundingControlService.ts`**

**Lines ~35-38:**

**NO CHANGES NEEDED** - These are grounding search limits (separate from text/image query credits):
```typescript
const GROUNDING_LIMITS: Record<UserTier, { gameKnowledge: number; aiMessages: number }> = {
  free: { gameKnowledge: 0, aiMessages: 4 },
  pro: { gameKnowledge: 20, aiMessages: 30 },
  vanguard_pro: { gameKnowledge: 20, aiMessages: 30 }
};
```

---

### **PHASE 6: Documentation Updates**

#### 12. **Update Documentation Files**

Files that reference old limits for documentation purposes:

- **`CREDITS_AND_TOKENS_CHANGE_PLAN.md`** - Update the "Current Values" section
- **`README.md`** (if exists) - Update any tier limit tables
- **`docs/`** folder files that mention credit limits

Search and replace:
- "55 text" → "20 text"
- "25 image" → "15 image"  
- "1,583 text" or "1583 text" → "350 text"
- "328 image" → "150 image"

---

## 🚀 Implementation Steps

### **Step 1: Database First (CRITICAL)**
1. ✅ Verify migration file `20251215000000_update_credit_limits.sql` exists
2. Apply migration to Supabase:
   ```bash
   cd supabase
   supabase db push
   ```
3. Verify in Supabase Dashboard:
   - Check `users` table default values
   - Test `create_user_record()` function with different tiers
   - Verify existing users have correct limits

### **Step 2: Frontend Constants**
1. Update `src/constants/index.ts` (TIER_LIMITS and TIER_FEATURES)
2. Update `src/services/lemonsqueezy/constants.ts` (PRICING_PLANS)

### **Step 3: Frontend Components**
Update all UI components in this order:
1. `LandingPageFresh.tsx` (3 locations)
2. `PaymentSuccess.tsx` (1 location)
3. `ProFeaturesSplashScreen.tsx` (1 location)
4. `UpgradeSplashScreen.tsx` (1 location)
5. `ProUpgradeSplashScreen.tsx` (2 locations)

### **Step 4: Testing**
1. **Create new test users:**
   - Free tier → Verify 20 text + 15 image limits
   - Pro tier → Verify 350 text + 150 image limits
   - Vanguard tier → Verify 350 text + 150 image limits

2. **Test limit enforcement:**
   - Send text queries until limit reached
   - Upload images until limit reached
   - Verify upgrade prompts appear correctly

3. **Test UI displays:**
   - Landing page shows correct limits
   - Credit modal shows correct limits
   - Payment success page shows correct totals
   - Splash screens show correct feature lists

### **Step 5: Deployment**
1. Commit all changes to git
2. Deploy to staging environment
3. Run smoke tests
4. Deploy to production
5. Monitor error logs for 24 hours

---

## 📊 Verification Checklist

### Database
- [ ] Migration applied successfully
- [ ] `create_user_record()` function returns correct limits
- [ ] New users created with tier=free have text_limit=20, image_limit=15
- [ ] New users created with tier=pro have text_limit=350, image_limit=150
- [ ] New users created with tier=vanguard_pro have text_limit=350, image_limit=150
- [ ] Existing users updated to new limits

### Frontend Constants
- [ ] `TIER_LIMITS` object updated in `src/constants/index.ts`
- [ ] `TIER_FEATURES` descriptions updated in `src/constants/index.ts`
- [ ] `PRICING_PLANS` limits updated in `src/services/lemonsqueezy/constants.ts`
- [ ] `PRICING_PLANS` feature descriptions updated in `src/services/lemonsqueezy/constants.ts`

### UI Components
- [ ] Landing page Free tier shows "20 Text | 15 Image"
- [ ] Landing page Pro tier shows "350 Text | 150 Image"
- [ ] Landing page Vanguard tier shows "350 Text | 150 Image"
- [ ] Payment success page shows "500 queries" total
- [ ] Pro features splash screen shows "350 Text | 150 Image"
- [ ] Upgrade splash screen shows "350 Text | 150 Image"
- [ ] Pro upgrade splash screen shows "350 Text Queries" and "150 Image Queries"

### User Testing
- [ ] Create new free user → See 20/15 limits in credit modal
- [ ] Create new pro user → See 350/150 limits in credit modal
- [ ] Create new vanguard user → See 350/150 limits in credit modal
- [ ] Free user hits text limit at 20 queries → Upgrade prompt appears
- [ ] Free user hits image limit at 15 uploads → Upgrade prompt appears
- [ ] Pro user can send 350 text queries successfully
- [ ] Pro user can upload 150 images successfully

---

## ⚠️ Important Notes

### What Does NOT Need to Change
1. **Grounding Limits** - These are separate limits for web searches:
   - Free: 0 game knowledge + 4 AI message searches/month
   - Pro/Vanguard: 20 game knowledge + 30 AI message searches/month
   - These remain unchanged!

2. **Unreleased Tab Limits** - Game tab limits are separate:
   - Free: 3 tabs
   - Pro/Vanguard: 10 tabs
   - These remain unchanged!

3. **Token Limits** - AI response token limits:
   - Game Knowledge: 60,000 tokens
   - Main Chat: 8,192 tokens
   - These remain unchanged!

### Database Migration Safety
The migration file already exists and is correctly configured. Just ensure it's applied to your database. It includes:
- Function update for `create_user_record()`
- Bulk update for existing users
- Default value changes for new users

### User Communication
After this change goes live:
1. Announce the change to existing users
2. Explain this creates a more sustainable service
3. Emphasize Pro tier is still excellent value
4. Consider offering a discount code for affected free users

---

## 🔍 Search Patterns for Verification

Use these grep commands to find any remaining hardcoded values:

```bash
# Find text limit references
grep -r "55" src/ --include="*.ts" --include="*.tsx"
grep -r "1583" src/ --include="*.ts" --include="*.tsx"
grep -r "1,583" src/ --include="*.ts" --include="*.tsx"

# Find image limit references
grep -r "25" src/ --include="*.ts" --include="*.tsx"
grep -r "328" src/ --include="*.ts" --include="*.tsx"

# Find feature description references
grep -r "Text.*month" src/ --include="*.ts" --include="*.tsx"
grep -r "Image.*month" src/ --include="*.ts" --include="*.tsx"
```

Review each result to ensure it's not a false positive (like CSS values, port numbers, etc.).

---

## 📝 File Summary

### Files Requiring Changes: **7 files**
1. ✅ `supabase/migrations/20251215000000_update_credit_limits.sql` - Already correct
2. ⚠️ `src/constants/index.ts` - **NEEDS UPDATE** (2 locations)
3. ⚠️ `src/services/lemonsqueezy/constants.ts` - **NEEDS UPDATE** (4 locations)
4. ⚠️ `src/components/LandingPageFresh.tsx` - **NEEDS UPDATE** (3 locations)
5. ⚠️ `src/components/PaymentSuccess.tsx` - **NEEDS UPDATE** (1 location)
6. ⚠️ `src/components/splash/ProFeaturesSplashScreen.tsx` - **NEEDS UPDATE** (1 location)
7. ⚠️ `src/components/splash/UpgradeSplashScreen.tsx` - **NEEDS UPDATE** (1 location)
8. ⚠️ `src/components/splash/ProUpgradeSplashScreen.tsx` - **NEEDS UPDATE** (2 locations)

### Total Changes Required: **14 specific code locations**

---

## 💡 Recommended Order of Implementation

1. **Database** (apply migration) - 5 minutes
2. **Constants** (2 files) - 10 minutes
3. **Landing Page** (1 file, 3 changes) - 5 minutes
4. **Splash Screens** (3 files, 4 changes) - 10 minutes
5. **Payment Success** (1 file, 1 change) - 2 minutes
6. **Testing** - 30 minutes
7. **Deployment** - 15 minutes

**Total Estimated Time: ~75 minutes**

---

## 🎯 Success Criteria

✅ All changes implemented
✅ Database migration applied
✅ All UI displays show correct limits
✅ Credit enforcement works correctly
✅ New users get correct limits
✅ No console errors
✅ No user complaints about incorrect limits
✅ Payment flow works correctly
✅ Upgrade prompts appear at correct thresholds

---

## 📞 Support & Rollback

### If Issues Occur
1. Check browser console for errors
2. Check Supabase logs for database errors
3. Verify migration was applied correctly
4. Test with fresh user account

### Rollback Plan
If you need to revert to old limits:
1. Run `REVERT_CREDIT_LIMITS.sql` (already exists in project root)
2. Revert frontend changes via git
3. Clear user cache if needed
4. Restart services

---

**Last Updated:** December 16, 2025
**Change Type:** Credit Limit Reduction
**Impact:** All tiers (Free, Pro, Vanguard Pro)
**Status:** Ready for Implementation
