# 🔧 Credits & Token Limits Change Plan

Complete guide to updating user credits and AI token limits across the entire application.

---

## 📊 Current Values

### **User Credits (Monthly Query Limits)**
| Tier | Text Queries | Image Queries |
|------|--------------|---------------|
| Free | 55 | 25 |
| Pro | 1,583 | 328 |
| Vanguard Pro | 1,583 | 328 |

### **Grounding Search Limits (Monthly)**
| Tier | Game Knowledge | AI Messages |
|------|----------------|-------------|
| Free | 0 | 4 |
| Pro | 20 | 30 |
| Vanguard Pro | 20 | 30 |

### **AI Token Limits**
| Function | Max Output Tokens |
|----------|------------------|
| Game Knowledge Fetch | 60,000 |
| Main Chat | 8,192 |
| Subtabs | 8,192 |
| Summarization | 8,192 |

---

## 🎯 Files to Modify

### **1. Frontend Constants**

#### **`src/constants/index.ts`** (Lines 7-10)
**Current:**
```typescript
export const TIER_LIMITS = {
  [USER_TIERS.FREE]: { text: 55, image: 25 },
  [USER_TIERS.PRO]: { text: 1583, image: 328 },
  [USER_TIERS.VANGUARD_PRO]: { text: 1583, image: 328 },
} as const;
```
**Action:** Update text and image values for each tier

#### **`src/constants/index.ts`** (Lines 14-37)
**Current:**
```typescript
export const TIER_FEATURES = {
  [USER_TIERS.FREE]: [
    '55 text queries per month',
    '25 image queries per month',
    // ...
  ],
  [USER_TIERS.PRO]: [
    '1,583 text queries per month',
    '328 image queries per month',
    // ...
  ],
  // ...
```
**Action:** Update feature list descriptions to match new limits

---

### **2. Frontend Components (UI Display)**

#### **`src/components/LandingPageFresh.tsx`**

**Line 1669 (Free Tier):**
```tsx
<FeatureListItem>55 Text | 25 Image Queries/month</FeatureListItem>
```

**Line 1701 (Pro Tier):**
```tsx
<FeatureListItem>1,583 Text | 328 Image Queries/month</FeatureListItem>
```

**Line 1730 (Vanguard Pro Tier):**
```tsx
<FeatureListItem>1,583 Text | 328 Image Queries/month</FeatureListItem>
```
**Action:** Update all three occurrences with new values

#### **`src/components/PaymentSuccess.tsx`** (Line 67)
```tsx
<span>1,583+ queries</span>
```
**Action:** Update to reflect new Pro tier total

#### **`src/components/splash/ProFeaturesSplashScreen.tsx`** (Line 35)
```tsx
{ title: "Massively Increased Limits", description: "Get 1,583 Text | 328 Image Queries every month.", icon: ... }
```
**Action:** Update description with new limits

#### **`src/components/splash/UpgradeSplashScreen.tsx`** (Line 32)
```tsx
'1,583 Text | 328 Image Queries/month',
```
**Action:** Update with new limits

#### **`src/components/splash/ProUpgradeSplashScreen.tsx`** (Lines 68-73)
```tsx
{
  title: '1,583 Text Queries',
  // ...
},
{
  title: '328 Image Queries',
  // ...
}
```
**Action:** Update both titles with new limits

#### **`src/components/ui/CreditIndicator.tsx`**
- No hardcoded values - reads from `user.usage.textLimit` and `user.usage.imageLimit`
- ✅ Will automatically update when backend changes

---

### **3. Grounding Limits (Search Features)**

#### **`src/services/groundingControlService.ts`** (Lines 35-38)
**Current:**
```typescript
const GROUNDING_LIMITS: Record<UserTier, { gameKnowledge: number; aiMessages: number }> = {
  free: { gameKnowledge: 0, aiMessages: 4 },
  pro: { gameKnowledge: 20, aiMessages: 30 },
  vanguard_pro: { gameKnowledge: 20, aiMessages: 30 }
};
```
**Action:** Update gameKnowledge and aiMessages values per tier

---

### **4. Backend Edge Functions (Server-side Validation)**

#### **`supabase/functions/ai-chat/index.ts`** (Lines 49-52)
**Current:**
```typescript
const GROUNDING_LIMITS = {
  free: { game_knowledge: 0, ai_message: 4 },
  pro: { game_knowledge: 20, ai_message: 30 },
  vanguard_pro: { game_knowledge: 20, ai_message: 30 }
};
```
**Action:** Update grounding limits

#### **`supabase/functions/ai-chat/index.ts`** (Lines 238, 281, 295)
**Current:**
```typescript
maxTokens = 8192,  // Line 238 - Default parameter
maxOutputTokens: maxTokens,  // Line 281 - Generation config
maxOutputTokens: 8192,  // Line 295 - Fallback config
```
**Action:** Update token limits if changing max output

#### **`supabase/functions/ai-background/index.ts`** (Lines 46-49)
**Current:**
```typescript
const GROUNDING_LIMITS = {
  free: { game_knowledge: 0, ai_message: 4 },
  pro: { game_knowledge: 20, ai_message: 30 },
  vanguard_pro: { game_knowledge: 20, ai_message: 30 }
};
```
**Action:** Update grounding limits

#### **`supabase/functions/ai-background/index.ts`** (Token limits similar to ai-chat)
**Action:** Update maxOutputTokens if changing

#### **`supabase/functions/ai-subtabs/index.ts`** (Lines 45-48)
**Current:**
```typescript
const GROUNDING_LIMITS = {
  free: { game_knowledge: 0, ai_message: 4 },
  pro: { game_knowledge: 20, ai_message: 30 },
  vanguard_pro: { game_knowledge: 20, ai_message: 30 }
};
```
**Action:** Update grounding limits

#### **`supabase/functions/ai-subtabs/index.ts`** (Lines 185, 213, 227)
**Current:**
```typescript
maxTokens = 8192,
maxOutputTokens: maxTokens,
maxOutputTokens: 8192,
```
**Action:** Update token limits if changing

#### **`supabase/functions/ai-summarization/index.ts`** (Lines 104, 132, 146)
**Current:**
```typescript
maxTokens = 8192,
maxOutputTokens: maxTokens,
maxOutputTokens: 8192,
```
**Action:** Update token limits if changing

#### **`supabase/functions/ai-proxy/index.ts`** (Lines 103, 183)
**Current:**
```typescript
maxTokens = 8192,
maxOutputTokens: maxTokens,
```
**Action:** Update token limits if changing

---

### **5. Game Knowledge Fetcher (Special 60K Token Limit)**

#### **`src/services/gameKnowledgeFetcher.ts`** (Line 260)
**Current:**
```typescript
maxTokens: 60000, // Increased to 60K for maximum comprehensive knowledge
```
**Action:** Update if changing max knowledge fetch tokens

---

### **6. Database Migrations & Schema**

#### **User Table Tier Limits**
These are handled by database triggers that set limits based on tier:

**Migration:** `supabase/migrations/20251212_fix_function_search_path.sql`
**Function:** `update_user_tier()`

**Current logic:**
- When tier changes, backend calls `update_user_tier()` with new limits
- Limits are passed as parameters, not hardcoded in SQL

**Action:** 
- Backend code calling this function must pass new limits
- No SQL changes needed - limits are calculated in application code

---

### **7. Test Files**

#### **`test-suite/database-functions.test.js`** (Lines 607, 630)
**Current:**
```javascript
logTest('PHASE 30', 'Free tier has correct limits (55 text, 25 image)', ...);
logTest('PHASE 30', 'Pro tier has correct limits (1583 text, 328 image)', ...);
```
**Action:** Update test assertions to match new limits

#### **`test-suite/create-test-users.js`** (Lines 192-193, 204, 208)
**Current:**
```javascript
console.log(`   Text queries/month: ${user.text_limit}`);
console.log(`   Image queries/month: ${user.image_limit}`);
console.log('-- Test Free tier limit (55 text):');
console.log('-- Test Pro tier limit (1583 text):');
```
**Action:** Update test output messages

---

### **8. Documentation**

#### **`supabase/migrations/20251212_split_grounding_usage.sql`** (Lines 55-56)
**Current:**
```sql
COMMENT ON COLUMN public.user_grounding_usage.game_knowledge_count IS 
  'Number of game knowledge grounding searches used this month (limit: 20 for Pro/Vanguard)';
COMMENT ON COLUMN public.user_grounding_usage.ai_message_count IS 
  'Number of AI message grounding searches used this month (limit: 30 for Pro/Vanguard)';
```
**Action:** Update comments if changing grounding limits

---

## 🔄 Update Workflow

### **Phase 1: Frontend Constants & Services**
1. ✅ Update `src/constants/index.ts` - TIER_LIMITS
2. ✅ Update `src/constants/index.ts` - TIER_FEATURES descriptions
3. ✅ Update `src/services/groundingControlService.ts` - GROUNDING_LIMITS

### **Phase 2: Backend Edge Functions (CRITICAL - Server-side Validation)**
4. ✅ Update `supabase/functions/ai-chat/index.ts` - GROUNDING_LIMITS
5. ✅ Update `supabase/functions/ai-chat/index.ts` - maxOutputTokens (if changing)
6. ✅ Update `supabase/functions/ai-background/index.ts` - GROUNDING_LIMITS
7. ✅ Update `supabase/functions/ai-background/index.ts` - maxOutputTokens (if changing)
8. ✅ Update `supabase/functions/ai-subtabs/index.ts` - GROUNDING_LIMITS
9. ✅ Update `supabase/functions/ai-subtabs/index.ts` - maxOutputTokens (if changing)
10. ✅ Update `supabase/functions/ai-summarization/index.ts` - maxOutputTokens (if changing)
11. ✅ Update `supabase/functions/ai-proxy/index.ts` - maxOutputTokens (if changing)

### **Phase 3: UI Components**
12. ✅ Update `src/components/LandingPageFresh.tsx` (3 locations)
13. ✅ Update `src/components/PaymentSuccess.tsx`
14. ✅ Update `src/components/splash/ProFeaturesSplashScreen.tsx`
15. ✅ Update `src/components/splash/UpgradeSplashScreen.tsx`
16. ✅ Update `src/components/splash/ProUpgradeSplashScreen.tsx`

### **Phase 4: Special Cases**
17. ✅ Update `src/services/gameKnowledgeFetcher.ts` - 60K token limit (if changing)

### **Phase 5: Tests & Documentation**
18. ✅ Update `test-suite/database-functions.test.js`
19. ✅ Update `test-suite/create-test-users.js`
20. ✅ Update SQL migration comments (if changing grounding limits)

### **Phase 6: Deploy & Verify**
21. 🚀 Deploy Edge Functions to Supabase
22. 🚀 Build & deploy frontend
23. ✅ Verify existing users see updated limits
24. ✅ Test credit enforcement works correctly
25. ✅ Test grounding quota enforcement

---

## ⚠️ Critical Notes

### **Security Considerations**
- ⚠️ **Edge Functions MUST be updated** - They enforce limits server-side
- ⚠️ Frontend changes alone can be bypassed - backend is the source of truth
- ⚠️ Both frontend (`groundingControlService.ts`) and backend Edge Functions must match

### **Database Considerations**
- ✅ No direct SQL changes needed for tier limits
- ✅ Limits are set by application code when tier changes
- ✅ Existing users: Limits update when they change tier or subscription renews
- ⚠️ To update existing users immediately, run SQL update:
  ```sql
  -- Example: Update all Pro users to new limits
  UPDATE users 
  SET text_limit = NEW_VALUE, image_limit = NEW_VALUE, updated_at = NOW()
  WHERE tier = 'pro';
  ```

### **Token Limit Considerations**
- ℹ️ Gemini 2.5 Flash supports up to 8,192 output tokens (standard)
- ℹ️ Game knowledge fetch uses special 60,000 token limit
- ⚠️ Increasing beyond 8,192 may affect response time and costs
- ℹ️ Context window is 1,048,576 tokens (input) - well above usage

### **Testing Requirements**
- ✅ Test each tier's credit limits work
- ✅ Test grounding quotas enforce correctly
- ✅ Test UI displays new limits accurately
- ✅ Test exceeding limits shows proper error messages
- ✅ Test subscription upgrades apply new limits immediately

---

## 📋 Change Template

When updating values, use this template for consistency:

```typescript
// FREE TIER
text: ___,        // Text queries per month
image: ___,       // Image queries per month
gameKnowledge: ___, // Game knowledge grounding searches
aiMessages: ___,    // AI message grounding searches

// PRO TIER
text: ___,
image: ___,
gameKnowledge: ___,
aiMessages: ___,

// VANGUARD PRO TIER
text: ___,
image: ___,
gameKnowledge: ___,
aiMessages: ___,

// TOKEN LIMITS
maxOutputTokens: ___,  // Standard responses
gameKnowledgeTokens: ___, // Game knowledge fetch (currently 60K)
```

---

## 🔍 Files Summary

### **Must Update (Critical)**
- ✅ `src/constants/index.ts` - Main source of truth for frontend
- ✅ `src/services/groundingControlService.ts` - Grounding limits
- ✅ `supabase/functions/ai-chat/index.ts` - Server-side enforcement
- ✅ `supabase/functions/ai-background/index.ts` - Server-side enforcement
- ✅ `supabase/functions/ai-subtabs/index.ts` - Server-side enforcement

### **Should Update (User-facing)**
- ✅ `src/components/LandingPageFresh.tsx` - Marketing page
- ✅ `src/components/PaymentSuccess.tsx` - Post-payment confirmation
- ✅ All splash screens (3 files) - In-app feature announcements

### **Optional Update**
- ⚠️ Test files (for accuracy)
- ⚠️ SQL comments (for documentation)
- ⚠️ Token limits (if changing AI response length)

---

**Generated:** December 15, 2025
**Status:** Ready for implementation
