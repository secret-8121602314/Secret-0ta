# AI Retry Logic Fixes - December 9, 2025

## Problem
The AI service was automatically retrying failed requests multiple times (up to 4 attempts), causing:
1. Users to see multiple 429 rate limit errors in console
2. Unnecessary API calls that would never succeed
3. Poor user experience with no manual retry option

## Solution

### ✅ 1. Chat Responses (User-Facing)
**File:** `src/services/aiService.ts` - `getChatResponseWithStructure()`

**Before:**
- Auto-retry up to 3 times using errorRecoveryService
- 429 errors were retried even though they would fail again
- No user control over retries

**After:**
- ⛔ NO auto-retry - stop immediately on first error
- Return error message: "I'm having trouble processing that right now. Please click the retry button to try again."
- User can manually retry via button next to thumbs down

**User Experience:**
- Single error message instead of 4 repeated failures
- Manual retry button gives users control
- Cleaner console logs

---

### ✅ 2. Subtab Generation
**File:** `src/services/aiService.ts` - `generateInitialInsights()`

**Before:**
- No explicit retry logic (fell through to error handler)
- Generic "Failed to generate game insights" toast

**After:**
- ⛔ NO auto-retry - stop immediately on first error
- Toast message: "Failed to generate subtabs. Click retry to try again."
- Retry button will regenerate ALL subtabs at once

**User Experience:**
- Single failure message
- Retry button regenerates all subtabs in one click
- No partial/incomplete subtab sets

---

### ✅ 3. Game Knowledge Fetching (Background)
**File:** `src/services/gameKnowledgeFetcher.ts` - `fetchGameKnowledge()`

**Before:**
- No retry logic - failed once and gave up
- Silent failures in background

**After:**
- ✅ DELAYED RETRY: 1 second delay between attempts
- ✅ MAX 3 RETRIES: Try up to 3 times before giving up
- ✅ SUCCESS TOAST: "Game knowledge created for {game name}"
- Retry tracking per game to avoid infinite loops

**Code:**
```typescript
const retryTracking = new Map<number, number>();

catch (error) {
  const currentRetries = retryTracking.get(igdbGameId) || 0;
  const maxRetries = 3;
  
  if (currentRetries < maxRetries) {
    retryTracking.set(igdbGameId, currentRetries + 1);
    console.log(`🔄 [GameKnowledge] Retry ${currentRetries + 1}/${maxRetries} for ${gameName} in 1 second...`);
    
    setTimeout(() => {
      pendingFetches.delete(igdbGameId);
      fetchGameKnowledge(igdbGameId, gameName).catch(() => {
        retryTracking.delete(igdbGameId);
      });
    }, 1000);
  } else {
    console.error(`❌ [GameKnowledge] Max retries reached for ${gameName}`);
    retryTracking.delete(igdbGameId);
  }
}
```

**User Experience:**
- Background fetches retry automatically with delay
- Success notification when knowledge is created
- Graceful degradation if retries fail

---

### ✅ 4. Conversation Summarization (Background)
**File:** `src/services/contextSummarizationService.ts` - `summarizeMessages()`

**Before:**
- No retry logic - failed once and used fallback
- Silent failures

**After:**
- ✅ DELAYED RETRY: 1 second delay between attempts
- ✅ MAX 3 RETRIES: Try up to 3 times before using fallback
- ✅ SUCCESS TOAST: "Conversation summarized (X → Y words)"
- Uses `await` with setTimeout for synchronous retry

**Code:**
```typescript
const retryTracking = new Map<string, number>();

catch (error) {
  const currentRetries = retryTracking.get('summarization') || 0;
  const maxRetries = 3;
  
  if (currentRetries < maxRetries) {
    retryTracking.set('summarization', currentRetries + 1);
    console.log(`🔄 [ContextSummarization] Retry ${currentRetries + 1}/${maxRetries} in 1 second...`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.summarizeMessages(messages, gameTitle, genre);
  }
  
  retryTracking.delete('summarization');
  // Return fallback summary
}
```

**User Experience:**
- Background summarization retries automatically
- Success notification shows word reduction
- Fallback ensures conversation continues even if AI fails

---

## Edge Function Deployment
All 4 edge functions deployed successfully (no code changes needed):
- ✅ `ai-chat` - User-facing chat (30/min)
- ✅ `ai-subtabs` - Subtab generation (20/min)
- ✅ `ai-background` - Game knowledge (15/min)
- ✅ `ai-summarization` - Context summarization (10/min)

---

## Summary

### User-Facing (Chat + Subtabs)
- ⛔ NO auto-retry
- Manual retry button for user control
- Single error message instead of 4 repeated failures

### Background Tasks (Knowledge + Summarization)
- ✅ Automatic retry with 1 second delay
- ✅ Max 3 attempts before giving up
- ✅ Toast notifications on success
- Graceful degradation with fallbacks

### Benefits
1. **Better UX**: Users see single errors, not cascades
2. **User Control**: Manual retry buttons for important actions
3. **Silent Recovery**: Background tasks retry automatically
4. **Cleaner Logs**: No more 4x repeated 429 errors
5. **Toast Feedback**: Users know when background tasks complete

---

## Testing Checklist

- [ ] Send chat message → get 429 error → see single error message
- [ ] Click retry button next to message → message retries once
- [ ] Create game tab → subtabs fail → click retry → all subtabs regenerate
- [ ] Mark game as owned → game knowledge fetches in background → see toast on success
- [ ] Long conversation → auto-summarization → see toast notification
- [ ] Rate limit error → verify no auto-retry spam in console

---

## Files Modified
1. `src/services/aiService.ts` - Removed auto-retry from chat and subtabs
2. `src/services/gameKnowledgeFetcher.ts` - Added delayed retry for background fetching
3. `src/services/contextSummarizationService.ts` - Added delayed retry for summarization
4. Edge functions deployed (no changes needed)
