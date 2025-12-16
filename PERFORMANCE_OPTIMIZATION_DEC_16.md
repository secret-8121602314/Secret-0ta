# Performance Optimization Plan - December 16, 2025

## Critical Issues Found in Logs

### 🔴 **PRIORITY 1: Excessive Database Calls**

#### Issue: Game Hub Checked 7+ Times Per Operation
**Current Flow:**
```
ensureGameHubExists → getConversations → ✅ Game Hub exists
loadData → getConversations → ✅ Game Hub exists
getConversation → getConversations → ✅ Game Hub exists  
createGameTab → getConversations → ✅ Game Hub exists
addMessage → getConversations → ✅ Game Hub exists (3x)
updateConversation → getConversations → ✅ Game Hub exists
```

**Fix:**
- Check Game Hub ONCE at app initialization
- Cache result in memory
- Only recheck on user change or explicit refresh
- Remove redundant checks from `getConversations`

**Files to Fix:**
- `src/services/conversationService.ts` - Cache Game Hub existence
- `src/components/MainApp.tsx` - Single Game Hub check on load
- `src/services/supabaseService.ts` - Remove repeated existence checks

**Expected Impact:** Reduce DB calls by 85% (7 calls → 1 call)

---

### 🔴 **PRIORITY 2: Remove Excessive Debug Logs**

#### Issue: 2969 Lines of Logs for Single Screenshot Query
**Problematic Logs:**
```typescript
// supabaseService.ts - Remove these in production:
Line 215: 🔍 [Supabase] mapConversations called with X conversations
Line 221: 🔍 [Supabase] Sample conversation from DB
Line 239: 🔍 [Supabase] Processing conversation
Line 261: 🔍 [Supabase] Processed message
Line 266: 🔍 [Supabase] Final processed messages
Line 328: 📊 [SupabaseService] Loading gameProgress
Line 437: 📊 [SupabaseService] Updating conversation
```

**Fix:**
```typescript
// Create a debug flag
const DEBUG_VERBOSE = import.meta.env.DEV && false; // Only enable when debugging

// Wrap excessive logs:
if (DEBUG_VERBOSE) {
  console.log('🔍 [Supabase] Processing conversation:', conv);
}

// Keep only critical logs:
console.log('✅ [Supabase] Game Hub created'); // Keep
console.error('❌ [Supabase] Failed to load:', error); // Keep
```

**Remove These Entirely:**
- Stack traces on every log (lines with 50+ stack frames)
- "BEFORE cache" / "AFTER cache" logs
- "Sample conversation from DB" logs
- Per-message processing logs
- "Final processed messages" counts

**Expected Impact:** 90% reduction in console output

---

### 🔴 **PRIORITY 3: Optimize Cache Usage**

#### Issue: Cache Miss Immediately Followed by Hit
```
Cache MISS (memory), trying Supabase
Cache MISS (Supabase)
Storing in Supabase
[same operation]
Cache hit for user (age: 25 ms)
Cache hit for user (age: 1 ms)
```

**Fix:**
```typescript
// cacheService.ts - Batch cache operations
class CacheService {
  private pendingWrites = new Map();
  
  async batchStore(items: CacheItem[]) {
    // Deduplicate and batch write
    const unique = new Map();
    items.forEach(item => unique.set(item.key, item));
    await Promise.all([...unique.values()].map(item => this.store(item)));
  }
  
  // Add cache warming on app load
  async warmCache(userId: string) {
    await Promise.all([
      this.get(`user:${userId}`),
      this.get(`chat_context:${userId}`),
      // Pre-load frequently accessed data
    ]);
  }
}
```

**Expected Impact:** 50% reduction in cache operations

---

### 🔴 **PRIORITY 4: Batch Database Updates**

#### Issue: Same Conversation Updated 6+ Times
```
Updating conversation: game-hub with gameProgress: 0
Updating conversation: game-cyberpunk-2077 with gameProgress: 0
[repeated 6 times in 2 seconds]
```

**Fix:**
```typescript
// conversationService.ts - Debounce updates
private updateQueue = new Map<string, ConversationUpdate>();
private updateTimer: NodeJS.Timeout | null = null;

updateConversation(id: string, updates: Partial<Conversation>) {
  // Queue update
  this.updateQueue.set(id, { ...this.updateQueue.get(id), ...updates });
  
  // Debounce batch update
  if (this.updateTimer) clearTimeout(this.updateTimer);
  this.updateTimer = setTimeout(() => this.flushUpdates(), 500);
}

private async flushUpdates() {
  const updates = Array.from(this.updateQueue.entries());
  this.updateQueue.clear();
  
  // Batch update in single transaction
  await supabase
    .from('conversations')
    .upsert(updates.map(([id, data]) => ({ id, ...data })));
}
```

**Expected Impact:** 80% reduction in update operations

---

### 🟡 **PRIORITY 5: Optimize Conversation Loading**

#### Issue: mapConversations Called 6 Times for Same Data
```
mapConversations called with 1 conversations (6x)
mapConversations called with 2 conversations (6x)
```

**Fix:**
```typescript
// conversationService.ts - Cache mapped conversations
private mappedCache = new Map<string, MappedConversation[]>();

async getConversations(forceRefresh = false) {
  const cacheKey = `conversations_${this.userId}`;
  
  if (!forceRefresh && this.mappedCache.has(cacheKey)) {
    return this.mappedCache.get(cacheKey)!;
  }
  
  const conversations = await supabaseService.getConversations();
  const mapped = await supabaseService.mapConversations(conversations);
  
  this.mappedCache.set(cacheKey, mapped);
  return mapped;
}
```

**Expected Impact:** Eliminate 5 out of 6 mapConversations calls

---

### 🟡 **PRIORITY 6: Reduce State Change Triggers**

#### Issue: Redundant State Updates
```typescript
// MainApp.tsx - Fires 5+ times with identical data:
🔥🔥🔥 [MainApp] USER STATE CHANGED: {id: 'd6b597de...', tier: 'free', ...}
🎯 [MainApp] suggestedPrompts STATE CHANGED: {prompts: Array(0), ...}
```

**Fix:**
```typescript
// MainApp.tsx - Deep equality check before setState
const updateUser = (newUser: User) => {
  if (JSON.stringify(user) === JSON.stringify(newUser)) {
    console.log('👍 [MainApp] User unchanged, skipping state update');
    return;
  }
  setUser(newUser);
};

// Better: Use useMemo for derived state
const userState = useMemo(() => ({
  ...user,
  tier: user?.tier || 'free'
}), [user?.id, user?.tier]); // Only deps that matter
```

**Expected Impact:** 80% reduction in React re-renders

---

### 🟡 **PRIORITY 7: Optimize Message Processing**

#### Issue: Excessive Logging in otakonTags Parsing
```
🏷️ [otakonTags] Parsing response (3041 chars)...
🏷️ [otakonTags] ✅ Extracted followUpPrompts
🏷️ [otakonTags] Found OTAKON_PROGRESS format
🏷️ [otakonTags] Found tag: GAME_ID
🏷️ [otakonTags] Found tag: CONFIDENCE
... (7 more tags)
```

**Fix:**
```typescript
// otakonTags.ts - Single summary log
export function parseOtakonTags(response: string) {
  const tags = extractTags(response);
  
  // Single summary log instead of per-tag
  console.log(`🏷️ [otakonTags] Extracted ${tags.size} tags:`, 
    Array.from(tags.keys()).join(', ')
  );
  
  return tags;
}
```

**Expected Impact:** 90% reduction in tag parsing logs

---

### 🟢 **PRIORITY 8: Optimize Image Preloader**

#### Issue: 13 Sequential IndexedDB Reads
```
[ImagePreloader] Loaded from IndexedDB: /images/otagon-logo.webp
[ImagePreloader] Loaded from IndexedDB: /images/mascot/2.webp
... (13 total)
All images preloaded in 165ms (13/13 in-memory cached)
```

**Fix:**
```typescript
// imagePreloader.ts - Parallel loading with Promise.all
async preloadImages(urls: string[]) {
  const results = await Promise.all(
    urls.map(url => this.loadFromCache(url))
  );
  
  console.log(`📸 [ImagePreloader] Loaded ${results.length} images in ${elapsed}ms`);
  // Single log instead of 13
}
```

**Expected Impact:** Potential 30-50% faster load time

---

## Implementation Priority

### Phase 1 (Immediate - Biggest Impact)
1. ✅ Remove excessive debug logs (`supabaseService.ts`, `conversationService.ts`)
2. ✅ Fix Game Hub multiple checks
3. ✅ Batch database updates

### Phase 2 (This Week)
4. ✅ Optimize cache usage
5. ✅ Reduce state change triggers
6. ✅ Cache mapped conversations

### Phase 3 (Nice to Have)
7. ✅ Simplify otakonTags logging
8. ✅ Parallel image preloading

---

## Specific Code Changes Needed

### 1. supabaseService.ts
```typescript
// Line 215-266: Wrap in DEBUG flag
const ENABLE_VERBOSE_LOGS = false;

export async function mapConversations(conversations: Conversation[]) {
  if (ENABLE_VERBOSE_LOGS) {
    console.log('🔍 [Supabase] mapConversations called with', conversations.length);
  }
  
  // Remove per-conversation processing logs
  return conversations.map(conv => processConversation(conv));
}
```

### 2. conversationService.ts
```typescript
// Add Game Hub cache
private gameHubCache: { exists: boolean; id: string } | null = null;

async ensureGameHubExists(forceRefresh = false) {
  if (!forceRefresh && this.gameHubCache) {
    return this.gameHubCache;
  }
  
  // Check once
  const gameHub = await supabaseService.getGameHub();
  this.gameHubCache = gameHub;
  return gameHub;
}

// Clear cache only on user change
onUserChange() {
  this.gameHubCache = null;
}
```

### 3. MainApp.tsx
```typescript
// Line 123: Add deep equality check
useEffect(() => {
  if (!user || JSON.stringify(user) === JSON.stringify(prevUserRef.current)) {
    return;
  }
  prevUserRef.current = user;
  console.log('🔄 [MainApp] User changed:', user.id);
}, [user]);
```

### 4. cacheService.ts
```typescript
// Reduce cache operation logs
async store(key: string, value: any) {
  // Remove verbose logs
  await this.writeToCache(key, value);
  // No console.log for every cache operation
}
```

---

## Expected Performance Gains

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Console Logs** | 2,969 lines | ~300 lines | 90% reduction |
| **DB Calls** | 25+ per action | 3-5 per action | 80% reduction |
| **Cache Operations** | 15+ per action | 5-7 per action | 60% reduction |
| **State Updates** | 8+ per action | 2-3 per action | 70% reduction |
| **Load Time** | ~2-3s | ~0.5-1s | 60% faster |

---

## Testing Checklist

- [ ] Screenshot query creates game tab
- [ ] No excessive console logs
- [ ] Game Hub only checked once
- [ ] Cache operations reduced
- [ ] No duplicate DB updates
- [ ] State changes are minimal
- [ ] App feels faster

---

## Notes

- Keep error logs and critical success messages
- Remove all "Processing..." and "Sample..." logs
- Use DEBUG flag for verbose logging during development
- Consider log levels (ERROR, WARN, INFO, DEBUG)
- Implement proper error boundaries instead of stack traces
