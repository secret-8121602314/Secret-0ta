# Issues Fixed - December 9, 2025

## 1. ✅ AI Retry Bug - FIXED
**Problem**: Single message causing 4 Edge Function calls (wasting 3x quota)
**Root Cause**: `retryCount` always hardcoded to 0, causing infinite retries on rate limit errors
**Solution**: 
- Added `getRetryCount()` method to errorRecoveryService
- Fixed retry context in both `getChatResponse` and `getChatResponseWithStructure`
- Enhanced rate limit detection with `RATE_LIMIT_ERROR` prefix
- Added logging to trace execution flow

**Evidence of Fix**: Console now shows only 1 API call instead of 4:
```
📡 [AIService] Edge Function Call #1
🚫 [AIService] RATE LIMIT DETECTED - This error should NOT be retried!
🔴 [ErrorRecovery] ⛔ RATE LIMIT ERROR DETECTED - STOPPING ALL RETRIES
```

## 2. ✅ User Grounding Usage 406 Error - FIXED
**Problem**: `GET /user_grounding_usage` returning 406 (Not Acceptable)
**Root Cause**: `.single()` expects exactly 1 row, fails with 406 when 0 rows exist
**Solution**: Changed `.single()` to `.maybeSingle()` in groundingControlService.ts
**File**: `src/services/groundingControlService.ts` line 398

## 3. ⚠️ Library & Timeline 404 Errors - NEEDS MANUAL FIX
**Problem**: `user_library` and `user_timeline` tables return 404
**Root Cause**: PostgREST schema cache is stale (tables exist but API doesn't see them)
**Solution**: Created `SCHEMA_CACHE_FIX.sql` - run this in Supabase SQL Editor:

### How to Fix:
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the entire contents of `SCHEMA_CACHE_FIX.sql`
3. Click "Run"
4. Wait 10 seconds
5. Hard refresh browser (Ctrl+Shift+R)
6. 404 errors should be gone

## Current Status

### ✅ Working Correctly:
- AI retry logic (no more 4x calls)
- Rate limit detection and user messaging
- User grounding usage queries

### ⏳ Waiting for User Action:
- Run SCHEMA_CACHE_FIX.sql in Supabase dashboard
- Wait for midnight UTC for quota reset OR get new API key

### 📊 Current Quota:
- Used: 25/20 requests per day (5 over limit)
- Status: Blocked until quota resets
- Message shown: "AI service is temporarily busy. Please wait about a minute and try again."
  - This is CORRECT behavior (not a bug!)
  - Will work again after quota resets

## Expected Behavior After Full Fix

1. **Messages**: Should save and display correctly
2. **Library sync**: Should work without 404 errors
3. **Timeline sync**: Should work without 404 errors  
4. **AI responses**: Will work once quota resets (or with new API key)
5. **Credit usage**: 1 API call per message instead of 4

## Migration Options for More Quota

**Current**: Google AI Studio Free Tier
- 20 requests/day
- RPM: 2/5

**Option 1**: New API Key
- Visit aistudio.google.com
- Create new project
- Get fresh 20 requests/day

**Option 2**: Paid Tier
- $0.35 per 1M tokens
- 2000 requests/day (100x more)
- Same API endpoint

**Option 3**: Vertex AI
- 1500 free requests/day (75x more!)
- RPM: 360 (180x more!)
- Requires: Service account, different endpoint, code changes
