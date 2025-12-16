# How Game Knowledge Injection Works - EXPLAINED

## Your Question
> "Game knowledge can contain different datasets, let's say there are 3 game knowledge available or 100 globally across all users? Will we inject all game knowledge which is not possible but how will we inject game knowledge accurately?"

## Short Answer
**We inject ONLY the specific game's knowledge for the current tab, NOT all 100 games.**

The system retrieves knowledge **per-game by IGDB ID**, so if you're in an Elden Ring tab, you only get Elden Ring knowledge (60K tokens). If you're in a Cyberpunk tab, you only get Cyberpunk knowledge (60K tokens). Never both at the same time.

---

## How It Actually Works

### 1. **Game Knowledge Storage (Supabase)**
Game knowledge is stored **per-game** in the `game_knowledge_cache` table:

```sql
CREATE TABLE game_knowledge_cache (
  id UUID PRIMARY KEY,
  igdb_id INTEGER UNIQUE,  -- ← KEY: Each game has unique ID
  game_name TEXT,
  comprehensive_knowledge TEXT,  -- ← 60K tokens per game
  tokens_used INTEGER,
  created_at TIMESTAMP,
  ...
);
```

**Example records:**
| igdb_id | game_name | comprehensive_knowledge | tokens_used |
|---------|-----------|------------------------|-------------|
| 119133 | Elden Ring | "Elden Ring is an action RPG..." | 58,342 |
| 1877 | Cyberpunk 2077 | "Cyberpunk 2077 is a role-playing..." | 59,128 |
| 26909 | Dark Souls 3 | "Dark Souls III is the third..." | 54,891 |
| ... | ... | ... | ... |

Each row contains **ONE game's complete knowledge** (~60K tokens).

---

### 2. **Retrieval Process (Per-Game)**

When you're in a game tab, here's the exact flow:

```typescript
// Step 1: Check current conversation's game
if (conversation.gameTitle) {  // e.g., "Elden Ring"
  
  // Step 2: Look up IGDB ID from library
  const libraryGame = libraryStorage.getByGameTitle(conversation.gameTitle);
  // Returns: { igdbGameId: 119133, title: "Elden Ring", ... }
  
  if (libraryGame?.igdbGameId) {
    
    // Step 3: Fetch ONLY that game's knowledge from cache
    const knowledge = await gameKnowledgeCacheService.getForContext(119133);
    // ↑ This retrieves ONLY Elden Ring's 60K tokens
    
    // Step 4: Inject into prompt
    gameKnowledgeContext = `
      🎮 GAME KNOWLEDGE DATABASE: "ELDEN RING"
      ${knowledge}  // ← Only Elden Ring knowledge here
    `;
  }
}
```

**Key Point:** The function `getForContext(igdbId)` retrieves **exactly ONE game's knowledge** using a SQL query:

```typescript
async getForContext(igdbId: number): Promise<string | null> {
  const result = await this.get(igdbId);
  // ↑ This does: SELECT * FROM game_knowledge_cache WHERE igdb_id = 119133
  
  if (!result.cached || !result.knowledge) {
    return null;
  }
  
  return result.knowledge;  // Returns ONLY this game's knowledge
}
```

---

### 3. **What Happens with 100 Games in Cache?**

**Scenario:** Your Supabase has knowledge for 100 games globally (shared by all users).

| Game | IGDB ID | Cached? |
|------|---------|---------|
| Elden Ring | 119133 | ✅ Yes (60K tokens) |
| Dark Souls 3 | 26909 | ✅ Yes (55K tokens) |
| Cyberpunk 2077 | 1877 | ✅ Yes (59K tokens) |
| Baldur's Gate 3 | 472239 | ✅ Yes (62K tokens) |
| ... | ... | ... |
| **Total: 100 games** | | **~6M tokens stored** |

**User opens Elden Ring tab:**
- **Retrieved:** ONLY Elden Ring (60K tokens)
- **Injected:** ONLY Elden Ring knowledge
- **Ignored:** All other 99 games

**User opens Cyberpunk tab:**
- **Retrieved:** ONLY Cyberpunk 2077 (59K tokens)
- **Injected:** ONLY Cyberpunk knowledge
- **Ignored:** All other 99 games

**Token Math:**
- Input: 60K tokens (one game) + 20K tokens (subtabs) + 10K tokens (system prompt) = **~90K tokens**
- Budget: 900K tokens (well within limit)
- **NOT injected:** 5.94M tokens from other 99 games ✅

---

### 4. **Dual-Layer Cache Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    USER IN ELDEN RING TAB                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │  1. Check Memory Cache (Session)    │
         │     Key: igdb_id = 119133           │
         │     TTL: 30 minutes                 │
         └─────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │  Hit?               │
                └──────────┬──────────┘
                           │
         ┌─────────────────┴─────────────────────┐
         │                                        │
       YES                                       NO
         │                                        │
         ▼                                        ▼
  Return knowledge         ┌──────────────────────────────────┐
  from memory              │  2. Check Supabase Cache         │
                           │     Query: WHERE igdb_id = 119133│
                           │     Returns: Elden Ring knowledge│
                           └──────────────────────────────────┘
                                         │
                                         ▼
                           ┌─────────────────────────────────┐
                           │  3. Cache in memory for session │
                           │     (Future requests = instant) │
                           └─────────────────────────────────┘
                                         │
                                         ▼
                              Return Elden Ring knowledge
```

**Important:** Even if cache has 100 games, the SQL query `WHERE igdb_id = 119133` returns **ONLY ONE ROW** (Elden Ring).

---

### 5. **Why This Scales Perfectly**

| Scenario | Games in Cache | Retrieved per Query | Token Cost |
|----------|----------------|---------------------|------------|
| 3 games | 3 | 1 game | 60K tokens |
| 10 games | 10 | 1 game | 60K tokens |
| 100 games | 100 | 1 game | 60K tokens |
| 1,000 games | 1,000 | 1 game | 60K tokens |

**Token cost is CONSTANT** regardless of total cached games!

---

### 6. **Game Detection & Injection Logic**

The `gameKnowledgeInjectionService.ts` handles **which game's knowledge** to inject:

```typescript
function determineGameForKnowledgeInjection(
  conversation: Conversation,
  userMessage: string,
  hasImage: boolean
): string | null {
  
  // Priority 1: Detect game from text (if query mentions specific game)
  if (!hasImage && userMessage) {
    const detectedGame = detectGameFromText(userMessage);
    if (detectedGame) {
      console.log(`🎯 Detected "${detectedGame}" from text`);
      return detectedGame;  // ← Inject THIS game's knowledge
    }
  }
  
  // Priority 2: Use current tab's game
  if (conversation.gameTitle) {
    console.log(`🎮 Using current tab: "${conversation.gameTitle}"`);
    return conversation.gameTitle;  // ← Inject THIS game's knowledge
  }
  
  // Priority 3: No game context
  return null;  // ← Inject NO knowledge (use AI training data)
}
```

**Example Scenarios:**

| User in Tab | Query | Detected Game | Knowledge Injected |
|-------------|-------|---------------|-------------------|
| Elden Ring | "How to beat Margit?" | Elden Ring | Elden Ring (60K) |
| Elden Ring | "Tell me about Jig Jig Street" | Cyberpunk 2077 | Cyberpunk (60K) |
| Game Hub | "Best Dark Souls 3 build?" | Dark Souls 3 | Dark Souls 3 (60K) |
| Game Hub | "What RPG should I play?" | None | None (0K) |

---

### 7. **Code Path Visualization**

```
User Query: "How to beat Margit in Elden Ring?"
                    │
                    ▼
┌───────────────────────────────────────────────────┐
│ gameKnowledgeInjectionService.ts                  │
│ determineGameForKnowledgeInjection()              │
│                                                   │
│ 1. detectGameFromText("How to beat Margit...")   │
│    → Returns: "Elden Ring" (pattern match)       │
│                                                   │
│ 2. Look up IGDB ID:                               │
│    libraryStorage.getByGameTitle("Elden Ring")   │
│    → Returns: { igdbGameId: 119133, ... }        │
└───────────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────┐
│ gameKnowledgeCacheService.ts                      │
│ getForContext(119133)                             │
│                                                   │
│ 1. Check memory cache for ID 119133              │
│    ├─ Hit? Return cached knowledge               │
│    └─ Miss? Query Supabase                       │
│                                                   │
│ 2. Supabase query:                                │
│    SELECT comprehensive_knowledge                 │
│    FROM game_knowledge_cache                      │
│    WHERE igdb_id = 119133                         │
│    LIMIT 1;  ← Only ONE row returned!            │
│                                                   │
│ 3. Returns: "Elden Ring is an action RPG..."     │
│    (60K tokens of Elden Ring knowledge)          │
└───────────────────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────────────────┐
│ promptSystem.ts                                   │
│ getGameCompanionPrompt()                          │
│                                                   │
│ gameKnowledgeContext = `                          │
│   🎮 GAME KNOWLEDGE DATABASE: "ELDEN RING"       │
│   ${knowledge}  ← Only 60K tokens here           │
│ `;                                                │
│                                                   │
│ Full prompt = System + Profile + Library         │
│              + Knowledge + Subtabs + Query        │
│            = ~90K tokens total                    │
└───────────────────────────────────────────────────┘
                    │
                    ▼
              Send to Gemini AI
         (90K input tokens, 8K output)
```

---

## Summary

### ✅ What DOES Happen
- **One game's knowledge** retrieved per query (by IGDB ID)
- SQL query returns **exactly ONE row** from cache table
- Token cost: **60K tokens max** (one game)
- Scales to **infinite cached games** (cost stays constant)

### ❌ What DOESN'T Happen
- ❌ Retrieving all 100 games' knowledge
- ❌ Injecting multiple games simultaneously
- ❌ Token cost increasing with cache size
- ❌ Fetching unrelated game knowledge

### 🎯 Accuracy Mechanism
1. **Text Queries:** Pattern detection identifies game from query content
2. **Current Tab:** Uses tab's assigned game (conversation.gameTitle)
3. **IGDB Lookup:** Converts game title → unique IGDB ID
4. **Targeted Retrieval:** SQL WHERE clause fetches ONLY that game's row
5. **Single Injection:** Only ONE game's knowledge enters the prompt

### 📊 Token Budget Breakdown
```
Total Input Budget: 900K tokens (~1M limit)

Per Query:
├─ System Prompt: ~10K tokens
├─ User Profile: ~1K tokens
├─ Game Library Context: ~0.5K tokens
├─ Game Knowledge (ONE GAME): ~60K tokens  ← Targeted retrieval
├─ Subtabs Context: ~20K tokens
├─ Recent Messages: ~5K tokens
└─ User Query: ~1K tokens
    ──────────────────────────────
    Total: ~97.5K tokens (10.8% of budget)
```

**Even with 1,000 games in cache, each query costs ~97.5K tokens!**

---

## Analogy

Think of it like a library:
- **Supabase = Library** with 100 books (games)
- **Your query = Requesting ONE book** by title
- **Librarian (SQL) = Finds ONLY that book**, returns it
- **You read = AI processes ONLY that book's content**
- **Other 99 books = Stay on shelf**, never opened

You don't read all 100 books to answer a question about one!

---

## Conclusion

The system is **perfectly accurate and scalable**:
- ✅ Retrieves only relevant game knowledge
- ✅ Constant token cost per query
- ✅ Scales to unlimited cached games
- ✅ SQL WHERE clause ensures precision
- ✅ No risk of injecting wrong knowledge

Your concern about "injecting all 100 games" doesn't happen because we use **targeted database queries** (by IGDB ID), not bulk retrieval!
