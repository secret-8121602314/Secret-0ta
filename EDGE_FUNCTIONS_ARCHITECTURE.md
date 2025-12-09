# Edge Functions Architecture - Complete Implementation

**Date**: December 9, 2025  
**Status**: ✅ DEPLOYED AND ACTIVE

## Overview

We've successfully separated the single `ai-proxy` edge function into **FOUR dedicated edge functions**, each with optimized rate limits for their specific use case. This prevents user-facing operations from being blocked by background tasks.

---

## What Happened to ai-proxy?

The original `ai-proxy` edge function is **still deployed but NO LONGER USED** by the client code. 

**Current Status:**
- ✅ Deployed and functional (can be used as rollback)
- ❌ Not referenced by any client code
- ⚠️ Recommend deleting after 1-2 weeks of stable operation

**To Delete:**
```bash
supabase functions delete ai-proxy
```

---

## Architecture - 4 Separate Edge Functions

### 1. **ai-chat** (Priority: HIGHEST)
- **Purpose**: User-facing chat messages and real-time conversation
- **Rate Limit**: 30 requests/minute per user
- **Endpoint**: `{SUPABASE_URL}/functions/v1/ai-chat`
- **Used By**:
  - `aiService.getChatResponse()` - Regular chat messages (default)
  - `aiService.getChatResponseWithStructure()` - Structured responses with JSON

**What does 30/min mean?** Each individual user can make 30 chat requests per minute. If User A makes 30 requests, User B can still make their own 30 requests independently.

---

### 2. **ai-subtabs** (Priority: HIGH)
- **Purpose**: Subtab content generation when opening game tabs
- **Rate Limit**: 20 requests/minute per user
- **Endpoint**: `{SUPABASE_URL}/functions/v1/ai-subtabs`
- **Used By**:
  - `aiService.generateInitialInsights()` - Creates insight tabs for new game tabs

**What does 20/min mean?** Each user can generate 20 subtabs per minute. During tab creation, 3-8 subtabs are created at once, so this accommodates multiple rapid tab creations.

---

### 3. **ai-background** (Priority: MEDIUM)
- **Purpose**: Game knowledge fetching (32K tokens with Google Search grounding)
- **Rate Limit**: 15 requests/minute per user
- **Endpoint**: `{SUPABASE_URL}/functions/v1/ai-background`
- **Used By**:
  - `gameKnowledgeFetcher.fetchGameKnowledge()` - Comprehensive game knowledge with grounding
  - Stores results in global `game_knowledge_cache` table

**What does 15/min mean?** Each user can fetch knowledge for 15 games per minute. This is a background task that doesn't block UI, so lower priority is fine.

---

### 4. **ai-summarization** (Priority: LOW)
- **Purpose**: Context summarization to keep conversation history manageable
- **Rate Limit**: 10 requests/minute per user
- **Endpoint**: `{SUPABASE_URL}/functions/v1/ai-summarization`
- **Used By**:
  - `contextSummarizationService.summarizeMessages()` - Summarizes old messages to 300 words
  - Called automatically when conversation exceeds 900 words

**What does 10/min mean?** Each user can summarize 10 conversations per minute. Summarization happens automatically in background, so this is lowest priority.

---

## Rate Limiting Architecture

### Per-User Rate Limiting (IMPORTANT!)
Each function maintains its own `rateLimitMap` tracking counts **per individual user ID**:
```typescript
const rateLimitMap = new Map<string, RateLimitEntry>();

interface RateLimitEntry {
  count: number;
  resetTime: number;
}
```

**What does "30/20/15/10 per minute" actually mean?**

Example with 3 users:
- **User A**: Makes 30 chat requests → ✅ All succeed
- **User B**: Makes 30 chat requests → ✅ All succeed (independent quota)
- **User C**: Makes 31 chat requests → ❌ 31st request gets 429 error

Each user has their **own independent quota**:
- User A: 30 chat + 20 subtabs + 15 background + 10 summarization per minute
- User B: 30 chat + 20 subtabs + 15 background + 10 summarization per minute
- User C: 30 chat + 20 subtabs + 15 background + 10 summarization per minute

**NOT Global Limits:**
- ❌ NOT "30 requests total across all users"
- ❌ NOT "shared pool of requests"
- ✅ YES "30 requests per user, every user gets their own 30"

**Why Per-User?**
- Protects API costs on a per-user basis
- One heavy user can't block others
- Fair resource allocation
- Easier to scale (just add more users)

---

## Client-Side Routing

### aiService.ts Changes
```typescript
private edgeFunctionUrls: {
  chat: string;           // User-facing chat messages (30/min per user)
  subtabs: string;        // Subtab generation (20/min per user)
  background: string;     // Game knowledge fetching (15/min per user)
  summarization: string;  // Context summarization (10/min per user)
};

private async callEdgeFunction(request: {
  // ... other params
  callType?: 'chat' | 'subtabs' | 'background' | 'summarization';
}) {
  const callType = request.callType || 'chat';
  const edgeFunctionUrl = this.edgeFunctionUrls[callType];
  // Route to appropriate function
}
```

### Call Type Assignments
1. **Chat Messages** → `callType: 'chat'` (default)
   - `getChatResponse()` - Regular chat
   - `getChatResponseWithStructure()` - Structured responses

2. **Subtab Generation** → `callType: 'subtabs'`
   - `generateInitialInsights()` - Creates insight tabs

3. **Game Knowledge Fetch** → `callType: 'background'`
   - `gameKnowledgeFetcher.ts` - 32K token fetch with grounding

4. **Context Summarization** → `callType: 'summarization'`
   - `contextSummarizationService.ts` - 300-word summaries
  // Route to appropriate function
}
```

### Call Type Assignments
1. **Chat Messages** → `callType: 'chat'`
   - `getChatResponse()` - line ~487
   - `getChatResponseWithStructure()` - line ~1006

2. **Subtab Generation** → `callType: 'subtabs'`
   - `generateInitialInsights()` - line ~1689

3. **Background Tasks** → `callType: 'background'`
   - `gameKnowledgeFetcher.ts` - uses direct URL
   - Context summarization - goes through `aiService.getChatResponse()` but could be separated

---

## API Key Requirements

### Current Setup (AI Studio)
✅ **One API key is sufficient** for all three functions.

All three edge functions use the **same `GEMINI_API_KEY`** environment variable. They are:
- Deployed to the same Supabase project
- Share the same secrets/environment variables
- Use the same AI Studio key

### Future Setup (Vertex AI)
When migrating to Vertex AI, you'll still use **one set of credentials** (service account key), but with much higher quotas:

| Metric | AI Studio | Vertex AI |
|--------|-----------|-----------|
| Requests/min | 15 RPM | 300-1000+ RPM |
| Tokens/min | 1M TPM | 4M-30M TPM |
| Cost Model | Free tier limited | Pay-per-use, scalable |

**No need for multiple API keys** - the separation is architectural, not credential-based.

---

## Why This Architecture?

### Problem Solved
**Before**: Single `ai-proxy` function with 10 req/min → user gets "temporarily busy" error after 3-4 rapid calls

**After**: Three functions with independent rate limits:
- Chat: 30/min (instant responses)
- Subtabs: 20/min (handles burst creation)
- Background: 15/min (doesn't block users)

### Benefits
1. ✅ **User Experience**: Chat messages never blocked by background tasks
2. ✅ **Resource Allocation**: Different priorities for different use cases
3. ✅ **Scalability**: Easy to adjust limits per function
4. ✅ **Monitoring**: Clear separation makes debugging easier
5. ✅ **Cost Control**: Rate limits still protect API costs per user

---

## Deployment Status

All **FOUR** functions deployed successfully:

```bash
✅ ai-chat deployed (89.39kB)
✅ ai-subtabs deployed (89.4kB)
✅ ai-background deployed (89.44kB)
✅ ai-summarization deployed (89.35kB)
```

View in Supabase Dashboard:
https://supabase.com/dashboard/project/qajcxgkqloumogioomiz/functions

**Legacy Function:**
⚠️ `ai-proxy` still exists but is NOT USED by client code. Safe to delete after testing period.

---

## Testing Checklist

To verify the implementation:

1. **Chat Messages** (ai-chat - 30/min):
   - [ ] Send regular chat message in conversation
   - [ ] Upload image and ask about it
   - [ ] Verify 30 rapid messages work, 31st gets rate limit

2. **Subtab Generation** (ai-subtabs - 20/min):
   - [ ] Create new game tab as Pro user
   - [ ] Verify all insight tabs populate
   - [ ] Try creating multiple game tabs rapidly

3. **Game Knowledge Fetch** (ai-background - 15/min):
   - [ ] Mark game as "owned" to trigger knowledge fetch
   - [ ] Check `game_knowledge_cache` table for entry
   - [ ] Verify 32K token knowledge stored

4. **Context Summarization** (ai-summarization - 10/min):
   - [ ] Have conversation exceed 900 words
   - [ ] Verify automatic summarization occurs
   - [ ] Check summary message in conversation history

5. **Rate Limiting**:
   - [ ] Exceed limits on each function independently
   - [ ] Verify 429 error with `retryAfter` in response
   - [ ] Confirm other functions still work when one is rate limited
   - [ ] Verify each user has independent quotas

---

## Migration Notes

### Old Function (ai-proxy)
The original `ai-proxy` function is still deployed but **NO LONGER USED** by client code.

**Recommendation**: Delete after 1-2 weeks of stable operation
```bash
supabase functions delete ai-proxy
```

**Why Keep Temporarily?**
- Rollback option if issues discovered
- Some cached clients might still reference it
- Gives time to verify new architecture works

**When to Delete?**
- After verifying all 4 new functions work correctly
- After confirming no 404 errors in logs
- After at least 1 week of production use

### Rollback Plan
If issues occur, revert client code:
```typescript
// In aiService.ts constructor:
this.edgeFunctionUrl = `${supabaseUrl}/functions/v1/ai-proxy`;

// In callEdgeFunction, remove callType logic and use:
const response = await fetch(this.edgeFunctionUrl, { ... });
```

---

## Future Enhancements

1. **Dynamic Rate Limits by Tier**:
   ```typescript
   const limits = {
     free: { chat: 10, subtabs: 5, background: 3 },
     pro: { chat: 30, subtabs: 20, background: 15 },
     vanguard: { chat: 60, subtabs: 40, background: 30 }
   };
   ```

2. **Priority Queue for Background Tasks**:
   - Implement queue system for knowledge fetches
   - Process during low-traffic periods
   - Batch multiple fetches together

3. **Vertex AI Migration**:
   - Switch to `@google-cloud/aiplatform`
   - Use service account authentication
   - Leverage higher quotas (300+ RPM)

4. **Monitoring Dashboard**:
   - Track per-function usage metrics
   - Alert on rate limit hits
   - Cost analysis per function type

---

## Configuration

All functions share these environment variables (set in Supabase Dashboard):

```bash
GEMINI_API_KEY=<your-ai-studio-key>
SUPABASE_URL=<your-project-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

No additional configuration needed for the three-function architecture.

---

## Summary

✅ **FOUR dedicated edge functions deployed**  
✅ **Independent rate limits per use case**  
✅ **Client code updated with routing logic**  
✅ **No additional API keys required**  
✅ **Per-user rate limiting (not global)**  
✅ **User-facing operations never blocked**  
✅ **Background tasks separated by priority**

### Rate Limits Per User:
- **Chat**: 30 requests/min (instant responses)
- **Subtabs**: 20 requests/min (tab creation bursts)
- **Knowledge**: 15 requests/min (background fetch)
- **Summarization**: 10 requests/min (lowest priority)

### Old ai-proxy Function:
- Still deployed but NOT USED
- Can be deleted after testing period
- No client code references it anymore

**Result**: Users can chat, create tabs, and fetch knowledge independently without any operation blocking another. Each user gets their own quota that resets every minute.
