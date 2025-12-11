# Race Conditions & Flow Analysis - AI Response System

## 🚨 CRITICAL ISSUES FOUND

### 1. **RACE CONDITION: Message Migration** ⚠️⚠️⚠️
**Location**: `MainApp.tsx` lines 3300-3550

**Problem**: 
```typescript
// Line 2863: AI message saved to current conversation
await ConversationService.addMessage(activeConversation.id, aiMessage);

// Lines 3320-3400: Migration decision happens LATER
if (shouldMigrateMessages) {
  // Move messages to game tab
  await ConversationService.migrateMessagesToConversation(...)
}
```

**Race Condition**:
1. User sends message in Game Hub
2. AI response saved to Game Hub (line 2863)
3. AI detects game → should create tab
4. BUT: Between save and migration, user could:
   - Send another message
   - Switch conversations
   - Refresh page
5. Migration happens 500ms+ later
6. **Result**: Messages stuck in wrong conversation

**Impact**: HIGH - Messages can get lost or appear in wrong tabs

**Fix Required**:
```typescript
// DON'T save message immediately, defer until after migration decision
let targetConversationId = activeConversation.id;

// Check migration FIRST
if (response.otakonTags.has('GAME_ID') && confidence === 'high') {
  targetConversationId = await getOrCreateGameTab(...);
}

// THEN save to correct conversation
await ConversationService.addMessage(targetConversationId, aiMessage);
```

---

### 2. **RACE CONDITION: Progress/Objective Updates** ⚠️⚠️
**Location**: `MainApp.tsx` lines 2995-3050

**Problem**:
```typescript
// Lines 2995-3045: Extract progress updates
let progressUpdate: number | null = null;
let objectiveUpdate: string | null = null;

// Line 3048: "DEFER until after migration"
const hasPendingProgressUpdates = progressUpdate !== null;

// Lines 3320+: Migration happens
// Lines 3500+: Progress updates applied

// ❌ BUT: Updates are applied to `activeConversation` which might be STALE
await ConversationService.updateConversation(activeConversation.id, {
  gameProgress: progressUpdate,
  activeObjective: objectiveUpdate
});
```

**Race Condition**:
1. Extract progress from AI response
2. Defer updates
3. Migrate messages to game tab
4. Apply updates to OLD activeConversation (still points to Game Hub!)
5. **Result**: Progress saved to wrong conversation

**Impact**: HIGH - User progress tracking broken

**Fix Required**:
```typescript
// After migration completes:
const finalTargetId = shouldMigrateMessages ? targetConversationId : activeConversation.id;

// Apply to CORRECT conversation
await ConversationService.updateConversation(finalTargetId, {
  gameProgress: progressUpdate,
  activeObjective: objectiveUpdate
});
```

---

### 3. **RACE CONDITION: Subtab Updates** ⚠️⚠️
**Location**: `MainApp.tsx` lines 3055-3090

**Problem**:
```typescript
// Line 3055: Store pending updates
const pendingSubtabUpdates = response.progressiveInsightUpdates || [];

// Line 3100-3160: SUBTAB_UPDATE processed immediately on activeConversation
gameTabService.updateSubTabsFromAIResponse(
  activeConversation.id,  // ❌ Wrong conversation if migrating!
  mappedUpdates
)
```

**Race Condition**:
1. AI response contains subtab updates
2. Updates applied to activeConversation (Game Hub)
3. THEN migration creates/switches to game tab
4. **Result**: Subtabs updated in wrong conversation

**Impact**: MEDIUM-HIGH - Insights appear in wrong place

**Fix Required**:
```typescript
// Don't process ANY subtab updates until AFTER migration decision

// After migration:
const finalTargetId = shouldMigrateMessages ? targetConversationId : activeConversation.id;

if (response.otakonTags.has('SUBTAB_UPDATE')) {
  await gameTabService.updateSubTabsFromAIResponse(finalTargetId, mappedUpdates);
}
```

---

### 4. **TOKEN LIMIT ISSUE: Game Knowledge Injection** ⚠️
**Location**: `promptSystem.ts` lines 890-947

**Problem**:
```typescript
// Line 894: Game knowledge injected SYNCHRONOUSLY
gameKnowledgeContext = getGameKnowledgeContextSync(libraryGame.igdbGameId) || '';

// Line 947: Added to prompt
${gameKnowledgeContext}

// ❌ NO TOKEN LIMIT CHECKING!
// Game knowledge can be 5000-10000 tokens
// + Conversation history (2000-5000 tokens)
// + System prompts (3000 tokens)
// + Subtabs (5000+ tokens each!)
// = Potentially 50,000+ tokens sent to API
```

**Token Budget**:
- Gemini 2.5 Flash input limit: **1 million tokens**
- BUT context window efficient limit: **32k tokens**
- Current system can easily exceed 50k tokens

**Impact**: 
- HIGH cost (billing)
- SLOW responses (processing time)
- TRUNCATED responses (hits token limit)

**Evidence of Problem**:
```typescript
// Line 1003 in aiService.ts:
maxTokens: 8192, // Increased to prevent response truncation
```
↑ This was already increased because responses were being cut off!

**Fix Required**:
1. **Token counting** before sending
2. **Prioritization system**:
   ```
   Priority 1: User message (always)
   Priority 2: Last 3 messages
   Priority 3: Active subtab content
   Priority 4: Game knowledge (summarized)
   Priority 5: Other subtabs (truncated)
   Priority 6: Historical context (dropped if needed)
   ```
3. **Truncation strategy**:
   - Game knowledge: Keep first 2000 tokens (most relevant)
   - Subtabs: Keep only tabs mentioned in last 3 messages
   - History: Summarize to 500 tokens if needed

---

### 5. **BLOCKING OPERATION: Sequential Subtab Updates** ⚠️
**Location**: `MainApp.tsx` lines 3165-3230

**Problem**:
```typescript
// Lines 3180-3220: BLOCKING sequential updates
await Promise.all(consolidateUpdates.map(async (consolidation) => {
  // For each subtab:
  await ConversationService.updateConversation(activeConversation.id, {
    subtabs: updatedSubtabs  // ❌ Full conversation update for each subtab!
  });
}));

// ❌ If 5 subtabs need updating = 5 full conversation writes to Supabase
// Each write takes 100-300ms = 500-1500ms total blocking time
```

**Impact**: MEDIUM - Slow response times, UI lag

**Fix Required**:
```typescript
// Batch all subtab updates into single write
const updatedSubtabs = currentSubtabs.map(subtab => {
  const update = consolidateUpdates.find(u => u.tab === subtab.id);
  return update ? { ...subtab, content: update.content } : subtab;
});

// Single write instead of N writes
await ConversationService.updateConversation(activeConversation.id, {
  subtabs: updatedSubtabs
});
```

---

### 6. **RACE CONDITION: State Updates During Migration** ⚠️
**Location**: Multiple places

**Problem**:
```typescript
// User's perspective of execution flow:
// T0: Send message
// T1: AI response received → saved to Game Hub
// T2: Extract game ID → create game tab (async)
// T3: Migrate messages (async)
// T4: Update progress (async)
// T5: Update subtabs (async)
// T6: Set suggested prompts
// T7: Refresh UI

// ❌ BUT all these happen asynchronously with no synchronization
// User could:
// - Send another message at T3
// - Switch conversations at T4  
// - Close app at T5
```

**Impact**: HIGH - Data inconsistency, lost updates

**Fix Required**:
```typescript
// Add a "processing lock" to prevent concurrent operations
const [isProcessingResponse, setIsProcessingResponse] = useState(false);

if (isProcessingResponse) {
  return; // Block new messages during processing
}

setIsProcessingResponse(true);
try {
  // 1. Migration decision
  // 2. Save messages
  // 3. Apply updates
  // 4. Refresh UI
  // ALL SEQUENTIALLY
} finally {
  setIsProcessingResponse(false);
}
```

---

### 7. **STALE STATE: Conversation Updates** ⚠️
**Location**: Multiple `ConversationService` calls

**Problem**:
```typescript
// activeConversation is React state - can be STALE!

// Line 2863:
await ConversationService.addMessage(activeConversation.id, aiMessage);

// Line 3100:
gameTabService.updateSubTabsFromAIResponse(activeConversation.id, updates);

// Line 3450:
await ConversationService.updateConversation(activeConversation.id, {...});

// ❌ All three use `activeConversation.id` which could be outdated
// by the time async operations complete
```

**Impact**: MEDIUM-HIGH - Updates applied to wrong conversation

**Fix Required**:
```typescript
// Capture conversation ID at start, use everywhere
const targetConversationId = useRef(activeConversation.id);

// Update ref when activeConversation changes
useEffect(() => {
  targetConversationId.current = activeConversation.id;
}, [activeConversation.id]);

// Use ref value instead of state
await ConversationService.addMessage(targetConversationId.current, aiMessage);
```

---

## 🔍 FLOW ANALYSIS: First Message → Second Message

### First Message Flow:
```
1. User sends message in Game Hub
2. ✅ Message saved to Game Hub
3. ✅ AI response received
4. ✅ Game detected (GAME_ID tag)
5. ✅ Create game tab
6. ⚠️ RACE: Save AI message to Game Hub FIRST
7. ⚠️ RACE: Migrate messages LATER (500ms delay)
8. ✅ Switch to game tab
9. ⚠️ RACE: Progress updates applied (to Game Hub? or game tab?)
10. ⚠️ RACE: Subtab updates applied (to Game Hub? or game tab?)
11. ✅ Suggested prompts shown
12. ✅ UI refreshes
```

### Second Message Flow (in game tab):
```
1. User sends message in game tab
2. ✅ Message saved to game tab
3. ✅ AI response received
4. ✅ Game knowledge injected into context
   - ⚠️ TOKEN ISSUE: No limit checking
   - ⚠️ TOKEN ISSUE: All subtabs included
   - ⚠️ TOKEN ISSUE: Full history included
   - Could be 50k+ tokens!
5. ✅ Subtab updates extracted
6. ⚠️ BLOCKING: Sequential subtab updates (100-300ms each)
7. ⚠️ RACE: Updates might target wrong conversation if user switched
8. ✅ Progress updates applied
9. ✅ Suggested prompts shown
10. ✅ UI refreshes
```

---

## 🎯 PRIORITY FIXES (Ordered by Impact)

### P0 (Critical - Do Immediately):
1. **Fix message migration race condition** - Messages getting lost
2. **Fix progress/objective update race condition** - Data going to wrong place
3. **Add token limit checking** - Hitting API limits, slow responses

### P1 (High - Do Soon):
4. **Fix subtab update race condition** - Wrong conversation getting updates
5. **Add processing lock** - Prevent concurrent operations
6. **Batch subtab writes** - Reduce blocking time

### P2 (Medium - Plan):
7. **Fix stale state references** - Use refs instead of state
8. **Add error boundaries** - Graceful handling of race conditions
9. **Add operation queueing** - Serialize critical operations

---

## 📊 RECOMMENDED FLOW REDESIGN

### New Sequential Flow:
```typescript
async function handleAIResponse(response, activeConversation) {
  const processingLock = await acquireProcessingLock();
  
  try {
    // STEP 1: Determine target conversation FIRST
    let targetConvId = activeConversation.id;
    
    if (shouldCreateGameTab(response)) {
      targetConvId = await getOrCreateGameTab(response);
      await switchToConversation(targetConvId);
    }
    
    // STEP 2: Save messages to CORRECT conversation
    await ConversationService.addMessage(targetConvId, userMessage);
    await ConversationService.addMessage(targetConvId, aiMessage);
    
    // STEP 3: Apply ALL updates to CORRECT conversation
    const updates = {
      gameProgress: extractProgress(response),
      activeObjective: extractObjective(response),
      subtabs: applySubtabUpdates(response, targetConvId)
    };
    
    await ConversationService.updateConversation(targetConvId, updates);
    
    // STEP 4: UI updates (non-blocking)
    setSuggestedPrompts(response.followUpPrompts);
    await refreshConversations();
    
  } finally {
    releaseProcessingLock(processingLock);
  }
}
```

---

## 🧪 TOKEN LIMIT STRATEGY

### Implementation:
```typescript
function buildContextWithTokenLimit(conversation, gameKnowledge, maxTokens = 30000) {
  const tokenCounts = {
    systemPrompt: estimateTokens(SYSTEM_PROMPT), // ~3000
    lastMessages: estimateTokens(getLastNMessages(3)), // ~2000
    userMessage: estimateTokens(currentMessage), // ~100-500
    remaining: maxTokens - 5500 // ~24500
  };
  
  // Priority allocation
  const allocations = {
    gameKnowledge: Math.min(3000, tokenCounts.remaining * 0.20),
    activeSubtab: Math.min(2000, tokenCounts.remaining * 0.15),
    otherSubtabs: Math.min(5000, tokenCounts.remaining * 0.35),
    history: Math.min(3000, tokenCounts.remaining * 0.20),
    buffer: tokenCounts.remaining * 0.10
  };
  
  return {
    gameKnowledge: truncateToTokens(gameKnowledge, allocations.gameKnowledge),
    subtabs: prioritizeSubtabs(conversation.subtabs, allocations),
    messages: truncateHistory(conversation.messages, allocations.history)
  };
}

function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
```

---

## ✅ VALIDATION CHECKLIST

After implementing fixes, verify:

- [ ] Messages always saved to correct conversation
- [ ] Progress updates applied to correct conversation
- [ ] Subtab updates applied to correct conversation
- [ ] No concurrent operations during migration
- [ ] Token count stays under 32k tokens
- [ ] Response time under 3 seconds
- [ ] No truncated responses
- [ ] UI updates reflect correct data
- [ ] User can't break flow by rapid actions

---

## 📝 NOTES

**Current System**:
- ❌ Saves first, migrates later
- ❌ No operation ordering
- ❌ No token limit checking
- ❌ No concurrent operation protection

**Ideal System**:
- ✅ Decide destination first
- ✅ Sequential operations
- ✅ Token budget enforced
- ✅ Processing lock prevents races
