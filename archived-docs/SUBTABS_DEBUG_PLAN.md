# Subtabs Not Loading - Debug Plan

## Issue Summary

Subtabs are stuck showing "Loading..." placeholder even after AI content has been generated and saved to database.

**Symptoms from logs:**
1. ✅ Subtabs created with `status: 'loading'`
2. ✅ AI generates content (fallback due to JSON parse error)
3. ✅ Dual-write to database succeeds: "✅ Table write: SUCCESS" and "✅ JSONB write: SUCCESS"
4. ❌ Polling shows "5 subtabs still loading" even after 8-second delay and multiple poll attempts
5. ❌ Subtabs UI shows "Loading..." text indefinitely

## Root Cause Analysis

The code flow is:
1. `createGameTab()` → Creates subtabs with `status: 'loading'`
2. `generateInitialInsights()` → Runs in background (async)
3. Reads fresh conversation from DB
4. Maps over subtabs and sets `status: 'loaded'` + content
5. Calls `subtabsService.setSubtabs()` → Dual-writes to table + JSONB
6. Both writes return SUCCESS
7. BUT when polling reads back, subtabs still have `status: 'loading'`!

**Hypothesis:** The JSONB field is not being updated correctly, OR the subtabs being written don't actually have `status: 'loaded'` set.

## Added Diagnostic Logging

### 1. In `gameTabService.ts` (line ~420):
```typescript
console.error('🤖 [GameTabService] ALL statuses:', updatedSubTabs.map(s => s.status));
```
This will show the EXACT status values being written.

### 2. Verification Read (line ~430):
```typescript
const verifyConversations = await ConversationService.getConversations(true);
const verifyConv = verifyConversations[conversation.id];
console.error('🤖 [GameTabService] 🔍 VERIFICATION: Read back subtabs after write:', 
  verifyConv.subtabs?.map(s => ({ title: s.title, status: s.status })));
```
This immediately reads back from database after writing to confirm the write succeeded.

## Test Steps

1. **Clear browser cache** (hard refresh: Ctrl+Shift+R)
2. **Upload a game screenshot**
3. **Watch console logs for these key messages:**

### Expected Flow:

```
// 1. Subtabs created
🎮 [GameTabService] Created 5 template subtabs (will populate via background AI)

// 2. AI generates content (may use fallback)
🤖 [GameTabService] ✅ Background insights generated successfully: 5 tabs

// 3. Subtabs prepared for writing
🤖 [GameTabService] Subtabs to save: Array(5)
🤖 [GameTabService] ALL statuses: ['loaded', 'loaded', 'loaded', 'loaded', 'loaded']

// 4. Write to database
🔄 [SubtabsService] Writing 5 subtabs to BOTH table AND JSONB
  ✅ Table write: SUCCESS
  ✅ JSONB write: SUCCESS

// 5. VERIFICATION (NEW)
🤖 [GameTabService] 🔍 VERIFICATION: Read back subtabs after write:
  [
    {title: 'Story So Far', status: 'loaded'},
    {title: 'Active Quests', status: 'loaded'},
    {title: 'Build Optimization', status: 'loaded'},
    {title: 'Upcoming Boss Strategy', status: 'loaded'},
    {title: 'Hidden Paths & Secrets', status: 'loaded'}
  ]

// 6. Polling should detect loaded status
🎮 [MainApp] ✅ All subtabs loaded for "Cyberpunk 2077" after X attempts
```

### If Bug Persists:

Look for these patterns:

**Pattern A: Write has wrong status values**
```
🤖 [GameTabService] ALL statuses: ['loading', 'loading', 'loading', 'loading', 'loading']
```
→ **Problem:** `updatedSubTabs` doesn't have `status: 'loaded'` set correctly

**Pattern B: Verification read returns 'loading'**
```
🤖 [GameTabService] 🔍 VERIFICATION: Read back subtabs after write:
  [{title: '...', status: 'loading'}, ...]
```
→ **Problem:** Database write is silently failing OR JSONB update is not working

**Pattern C: Verification read returns 'loaded', but polling sees 'loading'**
```
🤖 [GameTabService] VERIFICATION: [{..., status: 'loaded'}, ...]
🎮 [MainApp] 🔍 Starting poll: (5 subtabs, 5 loading)
```
→ **Problem:** Cache invalidation issue OR polling reading from wrong source

## Potential Fixes

### Fix A: Force status update in mapping
If `updatedSubTabs` doesn't have correct status:

```typescript
const updatedSubTabs = freshConversation.subtabs?.map(subTab => {
  // ... existing content mapping ...
  
  const result = {
    ...subTab,
    content,
    isNew: false
  };
  
  // ✅ FORCE status to 'loaded' explicitly
  result.status = 'loaded';
  return result;
}) || [];
```

### Fix B: Clear cache after write
If verification shows 'loaded' but polling sees 'loading':

```typescript
await subtabsService.setSubtabs(conversation.id, updatedSubTabs);

// ✅ Invalidate cache to force fresh read
ConversationService.clearCache();
```

### Fix C: Add delay before polling starts
If database write is async and hasn't committed:

```typescript
// In MainApp.tsx, increase delay from 8000ms to 12000ms
setTimeout(() => {
  pollForSubtabUpdates(targetConversationId);
}, 12000); // 12 seconds instead of 8
```

### Fix D: Check JSONB update query
If JSONB isn't being updated:

Look at `subtabsService.ts` line 377:
```typescript
await supabase
  .from('conversations')
  .update({
    subtabs: subtabs as unknown as never, // ← Check if type cast is causing issues
    subtabs_order: subtabs.map((tab) => tab.id) as unknown as never
  })
  .eq('id', conversationId);
```

Try adding `console.error()` to log the exact subtabs object being passed:
```typescript
console.error('🔍 [SubtabsService] Writing to JSONB:', JSON.stringify(subtabs, null, 2));
await supabase.from('conversations').update({ subtabs }).eq('id', conversationId);
```

## Next Steps

1. **Run the test with new logging**
2. **Copy the FULL console logs** (from screenshot upload to polling attempts)
3. **Look for the VERIFICATION log** - this is the key diagnostic
4. **Compare what's written vs what's read back**

The verification logging will definitively tell us whether:
- The write is succeeding with correct data
- The read is returning stale data
- Or there's a disconnect between write and read
