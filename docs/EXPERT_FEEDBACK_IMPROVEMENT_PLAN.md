# 🎯 Expert Feedback - AI System Improvement Plan

**Date:** December 13, 2025  
**Status:** Planning Phase (Implementation Not Started)  
**Based On:** Expert analysis of Otagon's AI instruction system

---

## 📋 Executive Summary

An AI system expert has reviewed Otagon's prompt engineering and context injection architecture. They praised the sophisticated approach, calling it a "dynamic orchestrator" that goes beyond typical system prompts. However, they identified four critical optimization opportunities that could significantly improve performance, reliability, and user experience.

---

## 🎖️ What's Working Well (Keep These)

### 1. **ExperienceEvolutionContext** ⭐
**Expert Rating:** "Best Feature"  
- Adapts AI responses based on player progress (5% vs 80% completion)
- Prevents spoilers and "mansplaining" basic mechanics to advanced players
- Dynamic adjustment based on conversation depth (20+ messages = expert mode)

**Status:** ✅ Already Excellent - No changes needed

### 2. **OTAKON Tag Protocol** ⭐
**Expert Rating:** "Smartest Technical Choice"  
- Forces LLM to act as API via structured tags
- State management through `[OTAKON_PROGRESS]`, `[OTAKON_OBJECTIVE_SET]`
- Subtab updates via `[OTAKON_SUBTAB_UPDATE]` create persistent memory

**Status:** ✅ Already Excellent - No changes needed

### 3. **Cross-Game Terminology Guard** ⭐
- Prevents mixing "Bonfires" (Dark Souls) with "Sites of Grace" (Elden Ring)
- Game-specific accuracy enforcement
- Explicit terminology validation

**Status:** ✅ Already Excellent - No changes needed

### 4. **Context Window Management** ⭐
- Character count limits (`MAX_CONTEXT_CHARS`, `MAX_SUBTAB_CHARS`)
- Prevents token overflow
- Graceful degradation

**Status:** ✅ Already Excellent - No changes needed

---

## 🚨 Critical Issues to Address

### Issue #1: Full Game Knowledge Injection Risk 🔴

**Current Situation:**
```typescript
// File: promptSystem.ts, Line 910
gameKnowledgeContext = `\n\n=== GAME KNOWLEDGE DATABASE ===
The following is comprehensive, up-to-date information about ${conversation.gameTitle}.
${knowledge}  // ← FULL 60,000 characters injected
=== END KNOWLEDGE DATABASE ===`;
```

**The Problem:**
- Currently injecting **entire 60K character knowledge base** into every prompt
- Even with Gemini 2.5 Flash's 1M token context window, this creates:
  - **Attention Dilution:** Model "drowns" in irrelevant text when answering "Who is Malenia?"
  - **Token Waste:** Spending tokens on content that isn't relevant to the specific query
  - **Latency:** Larger prompts = slower responses
  - **Cost:** More tokens = higher API costs

**Expert's Warning:**
> "Even with Gemini 2.5 Flash's large context window, injecting 60,000 characters of raw text plus conversation history plus system instructions is heavy. It may dilute the model's attention."

**Current State:**
- ✅ You have `gameKnowledgeCacheService` with global Supabase storage
- ✅ You have 60K token comprehensive knowledge
- ❌ No semantic search/retrieval (RAG)
- ❌ No relevance ranking
- ❌ No vector embeddings

**What We Need: Retrieval-Augmented Generation (RAG)**

Instead of injecting all 60K characters, we should:
1. **Chunk the knowledge** into semantic sections (~500-1000 chars each)
2. **Generate embeddings** for each chunk
3. **Retrieve only relevant chunks** based on user query
4. **Inject 3-5 most relevant chunks** (~5K chars) instead of full 60K

**Benefits:**
- 📉 **12x smaller context:** 5K vs 60K characters
- 🎯 **Better accuracy:** AI sees only relevant information
- ⚡ **Faster responses:** Smaller prompts = faster processing
- 💰 **Lower costs:** Fewer tokens per request

---

### Issue #2: Strict Markdown Formatting via Prompt 🟡

**Current Situation:**
```typescript
// File: promptSystem.ts, Line 755-780
**CRITICAL MARKDOWN FORMATTING RULES - FOLLOW EXACTLY:**
1. Bold text must be on the SAME LINE: "**Game Title**" NOT "**Game Title\n**"
2. NO spaces after opening bold markers: "**Release Date:**" NOT "** Release Date:**"
3. NO spaces before closing bold markers: "**Title**" NOT "**Title **"
// ... 8 more rules screaming at the AI
```

**The Problem:**
LLMs are notoriously bad at following negative constraints ("Do NOT do X"). Despite having 8+ strict formatting rules, you'll still see:
- `** Hint:**` (space after opening)
- `**Hint:\n**` (newline inside bold)
- `**Title: ` (missing closing marker)

**Expert's Advice:**
> "LLMs are bad at following negative constraints. It is often more reliable to **post-process the text on the client side** using Regex to fix spacing issues before rendering."

**Current State:**
- ✅ You already have extensive cleaning in `aiService.ts` (lines 1300-1450)
- ✅ You fix many markdown issues post-response
- ❌ Spending valuable prompt tokens on formatting instructions
- ❌ AI still produces formatting errors despite rules

**What We Need: Enhanced Post-Processing**

1. **Remove formatting rules from prompts** (save ~500 tokens)
2. **Enhance existing cleaning logic** with more patterns
3. **Create dedicated markdown formatter utility**
4. **Test with edge cases**

**Benefits:**
- 📉 **Smaller prompts:** Remove ~500 tokens of formatting rules
- ✅ **More reliable:** Regex is deterministic, AI is not
- 🎯 **Better AI focus:** AI focuses on content, not formatting
- 🛠️ **Easier maintenance:** Update cleaning logic vs rewriting prompts

---

### Issue #3: Mandatory "Hint:" Section Constraint 🟠

**Current Situation:**
```typescript
// File: promptSystem.ts, Line 1063
1. **ALWAYS start with "Hint:" section** - This is MANDATORY for all game-specific queries

// But also:
// Game Hub (line 802): NO structured "Hint:" sections
// Unreleased games (line 1177): No structured "Hint:" sections
```

**The Problem:**
- **Lore questions feel unnatural:** "Who is Malenia?" → AI forced to start with "**Hint:** Read the item description"
- **TTS optimization overreach:** Optimizing for Text-to-Speech shouldn't compromise conversational queries
- **Genre mismatch:** Not all games need "hints" (e.g., walking simulators, visual novels)

**Expert's Concern:**
> "This might feel unnatural for conversational queries like 'Who is Malenia?' The 'Hint' doesn't force the AI to give gameplay advice where none is needed."

**Current State:**
- ✅ You have `detectQueryType` to distinguish query types
- ✅ You skip "Hint:" for Game Hub and unreleased games
- ❌ Still forcing "Hint:" for pure lore/story questions
- ❌ Not adapting to genre (strategy vs narrative games)

**What We Need: Intelligent "Hint:" Detection**

1. **Query Type Classification:**
   - `gameplay` → Needs "Hint:"
   - `lore` → No "Hint:", just answer directly
   - `strategy` → "Strategy:" header instead
   - `location` → "Places of Interest:" header

2. **Genre-Based Adaptation:**
   - **Strategy/Tactical:** Always use "Hint:" (Dark Souls, XCOM)
   - **Story-Driven:** Use "Lore:" for narrative questions (The Witcher, RDR2)
   - **Exploration:** Use "Navigation:" or "Discovery:" (Breath of the Wild)

3. **Profile-Based Preference:**
   - User with `hintStyle: "direct"` → Skip "Hint:", answer directly
   - User with `hintStyle: "cryptic"` → Use "Hint:" for everything

**Benefits:**
- 💬 **Natural conversations:** "Who is Malenia?" gets direct answer
- 🎮 **Genre-appropriate:** Response style matches game type
- 👤 **Personalized:** Respects user's hint style preference
- 🎯 **Precise:** "Hint:" only when actually helpful

---

### Issue #4: Hardcoded Dates in Prompts 🟢

**Current Situation:**
```typescript
// File: promptSystem.ts, Line 284-286
**📅 IMPORTANT: Your knowledge cutoff is January 2025.**
- Games released BEFORE Feb 2025: You know them well!
- Games released AFTER Jan 2025: You need web search for these.

// Also in groundingControlService.ts, Line 73
// GAMES RELEASED AFTER AI KNOWLEDGE CUTOFF (Feb 2025+)
const KNOWLEDGE_CUTOFF_DATE = new Date('2025-02-01');
```

**The Problem:**
- In **6 months** (June 2025), prompt will say "Your cutoff is January 2025" (5 months ago)
- In **1 year** (Dec 2025), prompt will say "games after Jan 2025 need grounding" (obsolete)
- **Code aging instantly:** Will need manual updates every few months
- **Inconsistency:** Different hardcoded dates across files

**Expert's Warning:**
> "This code will age instantly. Instead of hardcoding 'Jan 2025', use a dynamic variable."

**Current State:**
- ❌ Hardcoded: `"January 2025"` in prompts
- ❌ Hardcoded: `new Date('2025-02-01')` in grounding service
- ❌ Will become outdated silently
- ❌ Multiple sources of truth

**What We Need: Dynamic Date Management**

```typescript
// New utility: src/utils/knowledgeCutoff.ts
export const AI_KNOWLEDGE_CUTOFF = {
  // Training cutoff (when model was trained)
  trainingDate: new Date('2025-01-01'),
  
  // Dynamic calculation
  isPostCutoff: (releaseDate: Date) => releaseDate > this.trainingDate,
  
  // Human-readable for prompts
  getPromptString: () => {
    const monthYear = this.trainingDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    return `Your knowledge cutoff is ${monthYear}`;
  },
  
  // For grounding decisions
  needsGrounding: (releaseDate: Date) => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return releaseDate > threeMonthsAgo;
  }
};
```

**Benefits:**
- 📅 **Always accurate:** Dates relative to "now"
- 🔄 **Self-updating:** No manual maintenance
- 📍 **Single source of truth:** One constant across all files
- 🧪 **Testable:** Can mock for tests

---

## 📊 Implementation Priority Matrix

| Issue | Impact | Effort | Priority | Timeline |
|-------|--------|--------|----------|----------|
| **#1 RAG System** | 🔴 High | 🔴 High | **P0** | 2-3 weeks |
| **#4 Dynamic Dates** | 🟢 Low | 🟢 Low | **P1** | 1-2 days |
| **#2 Post-Processing** | 🟡 Medium | 🟢 Low | **P2** | 3-5 days |
| **#3 Hint Detection** | 🟠 Medium | 🟡 Medium | **P3** | 1 week |

**Reasoning:**
- **P0 (RAG):** Biggest performance impact, but requires most work
- **P1 (Dates):** Quick win, prevents future issues
- **P2 (Formatting):** Moderate benefit, easy implementation
- **P3 (Hints):** Polish feature, lower urgency

---

## 🎯 Phase 1: Quick Wins (Week 1)

### Day 1-2: Dynamic Date Management (P1)

**Files to Create:**
1. `src/utils/knowledgeCutoff.ts` - Date utility
2. `src/utils/knowledgeCutoff.test.ts` - Unit tests

**Files to Update:**
3. `src/services/promptSystem.ts` - Replace hardcoded dates
4. `src/services/groundingControlService.ts` - Use dynamic dates
5. `src/services/gameKnowledgeCacheService.ts` - Use dynamic dates

**Acceptance Criteria:**
- ✅ No hardcoded date strings in prompts
- ✅ All date checks use utility function
- ✅ Unit tests pass
- ✅ No regression in grounding logic

---

### Day 3-5: Enhanced Markdown Post-Processing (P2)

**Files to Create:**
1. `src/utils/markdownFormatter.ts` - Dedicated formatter
2. `src/utils/markdownFormatter.test.ts` - Test suite with edge cases

**Files to Update:**
3. `src/services/aiService.ts` - Use new formatter
4. `src/services/promptSystem.ts` - Remove formatting rules (save tokens)

**Test Cases:**
```typescript
// Edge cases to handle:
'** Hint:**'              → '**Hint:**'
'**Hint:\n**'            → '**Hint:**'
'**Title: '              → '**Title:**'
'###** Game Title'       → '### Game Title'
'**Some Text: **'        → '**Some Text:**'
'orphaned ** text'       → 'orphaned text'
```

**Acceptance Criteria:**
- ✅ All formatting issues fixed post-response
- ✅ 500+ tokens saved from prompts
- ✅ 20+ test cases passing
- ✅ No visual regressions in UI

---

## 🎯 Phase 2: Intelligent Hints (Week 2)

### Day 6-10: Query Type Classification (P3)

**Files to Create:**
1. `src/services/queryClassifier.ts` - ML-style classifier
2. `src/services/queryClassifier.test.ts` - Test suite

**Files to Update:**
3. `src/services/promptSystem.ts` - Add query-aware hint instructions
4. `src/types/index.ts` - Add `QueryClassification` type

**Query Types:**
```typescript
type QueryType = 
  | 'gameplay'          // "How do I beat this boss?"
  | 'lore'              // "Who is Malenia?"
  | 'strategy'          // "What's the best build?"
  | 'navigation'        // "Where is Volcano Manor?"
  | 'mechanics'         // "How does poise work?"
  | 'progression'       // "What should I do next?"
  | 'general';          // General questions

type ResponseHeaderStyle = 
  | 'hint'              // **Hint:**
  | 'lore'              // **Lore:**
  | 'strategy'          // **Strategy:**
  | 'navigation'        // **Places of Interest:**
  | 'direct'            // No header, direct answer
  | 'none';             // Conversational
```

**Classification Logic:**
```typescript
function classifyQuery(query: string, genre: string, profile: PlayerProfile): QueryClassification {
  // Check for explicit keywords
  if (/how do i|how to|what's the best way/i.test(query)) {
    return { type: 'gameplay', headerStyle: 'hint' };
  }
  
  if (/who is|what is|tell me about|backstory/i.test(query)) {
    return { type: 'lore', headerStyle: 'lore' };
  }
  
  if (/best build|optimal|meta|stats/i.test(query)) {
    return { type: 'strategy', headerStyle: 'strategy' };
  }
  
  // Genre-based defaults
  if (genre === 'Action RPG' || genre === 'Souls-like') {
    return { type: 'gameplay', headerStyle: 'hint' };
  }
  
  if (genre === 'Visual Novel' || genre === 'Narrative') {
    return { type: 'lore', headerStyle: 'direct' };
  }
  
  // Profile-based override
  if (profile.hintStyle === 'direct') {
    return { type: 'general', headerStyle: 'direct' };
  }
  
  return { type: 'general', headerStyle: 'hint' };
}
```

**Acceptance Criteria:**
- ✅ 90%+ accuracy on test queries
- ✅ Genre-appropriate defaults
- ✅ Profile preferences respected
- ✅ Graceful fallback for edge cases

---

## 🎯 Phase 3: RAG Implementation (Week 3-5)

### Overview: Retrieval-Augmented Generation System

This is the most impactful but also most complex change. We'll build it incrementally.

---

### Week 3: Infrastructure Setup

**Step 1: Database Schema (Day 11-12)**

```sql
-- New table: game_knowledge_chunks
CREATE TABLE game_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_knowledge_cache_id UUID NOT NULL REFERENCES game_knowledge_cache(id) ON DELETE CASCADE,
  igdb_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_tokens INTEGER NOT NULL,
  section_type TEXT, -- 'mechanics', 'story', 'characters', 'locations', 'tips'
  embedding vector(768), -- Gemini embeddings (768 dimensions)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(game_knowledge_cache_id, chunk_index)
);

-- Indexes for fast retrieval
CREATE INDEX idx_chunks_igdb ON game_knowledge_chunks(igdb_id);
CREATE INDEX idx_chunks_section ON game_knowledge_chunks(section_type);

-- Vector similarity search (requires pgvector extension)
CREATE INDEX idx_chunks_embedding ON game_knowledge_chunks 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Supabase RPC function for similarity search
CREATE OR REPLACE FUNCTION match_game_knowledge(
  query_embedding vector(768),
  igdb_game_id INTEGER,
  match_threshold FLOAT DEFAULT 0.78,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  chunk_text TEXT,
  section_type TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    game_knowledge_chunks.id,
    game_knowledge_chunks.chunk_text,
    game_knowledge_chunks.section_type,
    1 - (game_knowledge_chunks.embedding <=> query_embedding) AS similarity
  FROM game_knowledge_chunks
  WHERE game_knowledge_chunks.igdb_id = igdb_game_id
    AND 1 - (game_knowledge_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

**Step 2: Chunking Service (Day 13-14)**

**File:** `src/services/knowledgeChunker.ts`

```typescript
/**
 * Intelligent chunking strategy:
 * - Split on section headers (### Boss Strategies, ### Characters)
 * - Keep semantic units together (don't break mid-paragraph)
 * - Target 500-1000 tokens per chunk
 * - Overlap chunks by 50 tokens for context preservation
 */

interface Chunk {
  text: string;
  tokens: number;
  sectionType: 'mechanics' | 'story' | 'characters' | 'locations' | 'tips' | 'general';
  index: number;
}

export class KnowledgeChunker {
  private readonly TARGET_CHUNK_SIZE = 800; // tokens
  private readonly OVERLAP_SIZE = 50;       // tokens
  private readonly MIN_CHUNK_SIZE = 300;    // tokens
  
  /**
   * Split comprehensive game knowledge into semantic chunks
   */
  chunkKnowledge(knowledge: string): Chunk[] {
    // 1. Split on section headers
    const sections = this.splitOnHeaders(knowledge);
    
    // 2. Further split large sections
    const chunks: Chunk[] = [];
    let index = 0;
    
    for (const section of sections) {
      const sectionType = this.detectSectionType(section.header);
      const sectionChunks = this.chunkSection(section.content, sectionType, index);
      chunks.push(...sectionChunks);
      index += sectionChunks.length;
    }
    
    return chunks;
  }
  
  private splitOnHeaders(text: string): Array<{header: string, content: string}> {
    // Split on markdown headers (###, ##, #)
    const headerRegex = /^(#{1,3})\s+(.+)$/gm;
    // Implementation details...
  }
  
  private detectSectionType(header: string): Chunk['sectionType'] {
    const lower = header.toLowerCase();
    if (/boss|combat|strategy|guide/i.test(lower)) return 'mechanics';
    if (/story|plot|lore|narrative/i.test(lower)) return 'story';
    if (/character|npc|companion/i.test(lower)) return 'characters';
    if (/location|area|zone|region/i.test(lower)) return 'locations';
    if (/tip|trick|secret|hidden/i.test(lower)) return 'tips';
    return 'general';
  }
  
  private chunkSection(content: string, sectionType: Chunk['sectionType'], startIndex: number): Chunk[] {
    // Split large sections while preserving semantic units
    // Implementation details...
  }
  
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }
}
```

**Step 3: Embedding Generation (Day 15-16)**

**File:** `src/services/embeddingService.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

export class EmbeddingService {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  }
  
  /**
   * Generate embeddings using Gemini embedding-001 model
   * Returns 768-dimensional vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    const result = await model.embedContent({
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_DOCUMENT' // Optimized for RAG
    });
    
    return result.embedding.values;
  }
  
  /**
   * Batch generate embeddings (more efficient)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Gemini supports batch embedding
    const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    const promises = texts.map(text => 
      model.embedContent({
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_DOCUMENT'
      })
    );
    
    const results = await Promise.all(promises);
    return results.map(r => r.embedding.values);
  }
  
  /**
   * Generate query embedding (different task type for better retrieval)
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    const result = await model.embedContent({
      content: { parts: [{ text: query }] },
      taskType: 'RETRIEVAL_QUERY' // Optimized for search queries
    });
    
    return result.embedding.values;
  }
}
```

---

### Week 4: Chunking Pipeline

**Step 4: Chunk Storage Service (Day 17-18)**

**File:** `src/services/knowledgeChunkService.ts`

```typescript
import { supabase } from '../lib/supabase';
import { KnowledgeChunker } from './knowledgeChunker';
import { EmbeddingService } from './embeddingService';

export class KnowledgeChunkService {
  private chunker = new KnowledgeChunker();
  private embeddings = new EmbeddingService();
  
  /**
   * Process and store knowledge chunks with embeddings
   * Called after comprehensive knowledge is fetched
   */
  async processAndStoreKnowledge(
    cacheId: string,
    igdbId: number,
    knowledge: string
  ): Promise<void> {
    console.log(`📦 [ChunkService] Processing knowledge for game ${igdbId}`);
    
    // 1. Chunk the knowledge
    const chunks = this.chunker.chunkKnowledge(knowledge);
    console.log(`📦 [ChunkService] Created ${chunks.length} chunks`);
    
    // 2. Generate embeddings for all chunks (batch)
    const chunkTexts = chunks.map(c => c.text);
    const embeddings = await this.embeddings.generateEmbeddings(chunkTexts);
    console.log(`🧮 [ChunkService] Generated ${embeddings.length} embeddings`);
    
    // 3. Store chunks with embeddings
    const chunkRecords = chunks.map((chunk, i) => ({
      game_knowledge_cache_id: cacheId,
      igdb_id: igdbId,
      chunk_index: chunk.index,
      chunk_text: chunk.text,
      chunk_tokens: chunk.tokens,
      section_type: chunk.sectionType,
      embedding: JSON.stringify(embeddings[i]) // PostgreSQL vector type
    }));
    
    const { error } = await supabase
      .from('game_knowledge_chunks')
      .insert(chunkRecords);
    
    if (error) {
      console.error('📦 [ChunkService] Failed to store chunks:', error);
      throw error;
    }
    
    console.log(`✅ [ChunkService] Stored ${chunks.length} chunks for game ${igdbId}`);
  }
  
  /**
   * Check if chunks exist for a game
   */
  async hasChunks(igdbId: number): Promise<boolean> {
    const { count, error } = await supabase
      .from('game_knowledge_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('igdb_id', igdbId);
    
    return !error && (count || 0) > 0;
  }
}
```

**Step 5: Update Knowledge Fetcher (Day 19-20)**

**File:** `src/services/gameKnowledgeFetcher.ts` (Update)

```typescript
// Add after storing in cache (line ~310)
const stored = await gameKnowledgeCacheService.store(...);

if (stored) {
  // NEW: Process knowledge into chunks + embeddings
  try {
    const chunkService = new KnowledgeChunkService();
    
    // Get the cache record we just created
    const cacheRecord = await gameKnowledgeCacheService.getCacheRecord(igdbGameId);
    
    if (cacheRecord?.id) {
      // Process and store chunks (non-blocking for user)
      chunkService.processAndStoreKnowledge(
        cacheRecord.id,
        igdbGameId,
        result.response
      ).catch(err => {
        console.warn('📦 [GameKnowledge] Failed to chunk knowledge:', err);
        // Don't fail the main operation
      });
    }
  } catch (err) {
    console.warn('📦 [GameKnowledge] Chunking error:', err);
  }
}
```

---

### Week 5: Retrieval & Integration

**Step 6: RAG Retrieval Service (Day 21-22)**

**File:** `src/services/ragRetrieval.ts`

```typescript
import { supabase } from '../lib/supabase';
import { EmbeddingService } from './embeddingService';

interface RetrievalResult {
  chunks: Array<{
    text: string;
    sectionType: string;
    similarity: number;
  }>;
  totalTokens: number;
}

export class RAGRetrievalService {
  private embeddings = new EmbeddingService();
  
  /**
   * Retrieve relevant knowledge chunks for a query
   */
  async retrieve(
    userQuery: string,
    igdbId: number,
    options: {
      maxChunks?: number;
      minSimilarity?: number;
      sectionFilter?: string[]; // Filter by section type
    } = {}
  ): Promise<RetrievalResult> {
    const {
      maxChunks = 5,
      minSimilarity = 0.75,
      sectionFilter
    } = options;
    
    console.log(`🔍 [RAG] Retrieving knowledge for query: "${userQuery.slice(0, 50)}..."`);
    
    // 1. Generate query embedding
    const queryEmbedding = await this.embeddings.generateQueryEmbedding(userQuery);
    
    // 2. Call Supabase RPC function for similarity search
    const { data, error } = await supabase.rpc('match_game_knowledge', {
      query_embedding: queryEmbedding,
      igdb_game_id: igdbId,
      match_threshold: minSimilarity,
      match_count: maxChunks
    });
    
    if (error) {
      console.error('🔍 [RAG] Retrieval error:', error);
      return { chunks: [], totalTokens: 0 };
    }
    
    // 3. Filter by section type if requested
    let results = data || [];
    if (sectionFilter && sectionFilter.length > 0) {
      results = results.filter(r => sectionFilter.includes(r.section_type));
    }
    
    // 4. Calculate total tokens
    const totalTokens = results.reduce((sum, r) => {
      return sum + Math.ceil(r.chunk_text.length / 4);
    }, 0);
    
    console.log(`🔍 [RAG] Retrieved ${results.length} chunks (${totalTokens} tokens, avg similarity: ${(results.reduce((s, r) => s + r.similarity, 0) / results.length).toFixed(2)})`);
    
    return {
      chunks: results,
      totalTokens
    };
  }
  
  /**
   * Format retrieved chunks for AI context
   */
  formatForContext(result: RetrievalResult, gameTitle: string): string {
    if (result.chunks.length === 0) {
      return '';
    }
    
    const sections = result.chunks.map((chunk, i) => {
      return `**[${chunk.sectionType}] (Relevance: ${(chunk.similarity * 100).toFixed(0)}%)**\n${chunk.text}`;
    }).join('\n\n---\n\n');
    
    return `
=== RELEVANT GAME KNOWLEDGE (${result.totalTokens} tokens) ===
The following ${result.chunks.length} knowledge chunks are most relevant to the user's query.

${sections}

=== END RELEVANT KNOWLEDGE ===
`;
  }
}
```

**Step 7: Integrate RAG into Prompt System (Day 23-24)**

**File:** `src/services/promptSystem.ts` (Update)

```typescript
// Replace lines 903-918 with this:

// 🎮 RAG: Inject RELEVANT game knowledge (5 chunks ~5K chars) instead of full 60K
let gameKnowledgeContext = '';
if (conversation.gameTitle) {
  const libraryGame = libraryStorage.getByGameTitle(conversation.gameTitle);
  if (libraryGame?.igdbGameId) {
    try {
      // Check if we have chunks for this game
      const chunkService = new KnowledgeChunkService();
      const hasChunks = await chunkService.hasChunks(libraryGame.igdbGameId);
      
      if (hasChunks) {
        // NEW: Use RAG retrieval
        const ragService = new RAGRetrievalService();
        const retrieval = await ragService.retrieve(
          userMessage,
          libraryGame.igdbGameId,
          {
            maxChunks: 5,       // 5 most relevant chunks
            minSimilarity: 0.75  // 75% similarity threshold
          }
        );
        
        if (retrieval.chunks.length > 0) {
          gameKnowledgeContext = ragService.formatForContext(retrieval, conversation.gameTitle);
          console.log(`🎮 [PromptSystem] Injected ${retrieval.totalTokens} tokens of RELEVANT knowledge (${retrieval.chunks.length} chunks)`);
        } else {
          console.log(`🎮 [PromptSystem] No relevant chunks found, query too distant from knowledge base`);
        }
      } else {
        // FALLBACK: Use full knowledge if no chunks (backward compatibility)
        const knowledge = await gameKnowledgeCacheService.getForContext(libraryGame.igdbGameId);
        if (knowledge) {
          gameKnowledgeContext = `\n\n=== GAME KNOWLEDGE DATABASE ===\n${knowledge}\n=== END ===\n`;
          console.log(`🎮 [PromptSystem] Using FULL knowledge (no chunks available) - ${knowledge.length} chars`);
        }
      }
    } catch (error) {
      console.warn(`🎮 [PromptSystem] RAG retrieval failed:`, error);
      // Continue without knowledge - graceful degradation
    }
  }
}
```

**Step 8: Testing & Optimization (Day 25-30)**

**Test Scenarios:**

1. **Boss Strategy Query:**
   - Query: "How do I beat Malenia?"
   - Expected: Retrieve chunks from 'mechanics' and 'tips' sections
   - Verify: Only boss-related content retrieved

2. **Lore Query:**
   - Query: "Who is Ranni the Witch?"
   - Expected: Retrieve chunks from 'characters' and 'story' sections
   - Verify: No combat/strategy content

3. **Location Query:**
   - Query: "Where is Volcano Manor?"
   - Expected: Retrieve chunks from 'locations' section
   - Verify: Map guidance and area connections

4. **Fallback Test:**
   - Scenario: Game with no chunks yet
   - Expected: Use full knowledge fallback
   - Verify: Response still works

**Optimization Targets:**

| Metric | Before RAG | After RAG | Improvement |
|--------|-----------|-----------|-------------|
| Avg Context Size | 60K chars | 5K chars | **12x reduction** |
| Relevance Score | N/A | >85% | **Higher accuracy** |
| Response Time | 3-4s | 1-2s | **2x faster** |
| Token Cost/Query | ~15K tokens | ~1.5K tokens | **10x cheaper** |

---

## 🧪 Testing Strategy

### Unit Tests

**Files to Create:**
1. `src/utils/knowledgeCutoff.test.ts`
2. `src/utils/markdownFormatter.test.ts`
3. `src/services/queryClassifier.test.ts`
4. `src/services/knowledgeChunker.test.ts`
5. `src/services/embeddingService.test.ts`
6. `src/services/ragRetrieval.test.ts`

### Integration Tests

**Test Flow:**
1. Create test game with known content
2. Fetch knowledge (trigger chunking)
3. Wait for chunks to be stored
4. Test various query types
5. Verify correct chunks retrieved
6. Validate response quality

### Performance Tests

**Metrics to Track:**
- Context size: Before vs After RAG
- Response latency: P50, P95, P99
- Token usage: Per query, per session
- Retrieval accuracy: Relevant vs irrelevant chunks
- Cache hit rate: Memory vs Supabase

---

## 📈 Success Metrics

### Phase 1 (Quick Wins)
- ✅ 500+ tokens saved per prompt (formatting rules removed)
- ✅ Zero hardcoded dates in codebase
- ✅ 95%+ formatting accuracy post-processing
- ✅ No regression in existing features

### Phase 2 (Intelligent Hints)
- ✅ 90%+ query classification accuracy
- ✅ Genre-appropriate response styles
- ✅ User profile preferences respected
- ✅ More natural lore responses

### Phase 3 (RAG System)
- ✅ 10x reduction in context size (60K → 5K)
- ✅ 2x faster response times
- ✅ 85%+ retrieval relevance score
- ✅ 10x cost reduction per query
- ✅ Backward compatible (fallback to full knowledge)

---

## 🚧 Migration & Rollback Strategy

### Gradual Rollout

**Week 1-2 (Quick Wins):**
- ✅ Low risk, immediate deploy
- No user-facing changes
- Monitor for regressions

**Week 3 (Hint Detection):**
- 🔄 A/B test with 10% of users
- Compare satisfaction scores
- Full rollout if positive

**Week 4-6 (RAG System):**
- 🔄 Canary deploy to Pro users only
- Monitor performance metrics
- Fallback to full knowledge if issues
- Gradual rollout: 10% → 25% → 50% → 100%

### Rollback Plan

**If RAG causes issues:**
1. Feature flag: `USE_RAG_RETRIEVAL = false`
2. Automatic fallback to full knowledge injection
3. No data loss (chunks stored separately)
4. Can re-enable after fixes

**Monitoring:**
- Error rates (Supabase queries)
- Response quality (user feedback)
- Latency metrics (P95, P99)
- Token usage (cost tracking)

---

## 💰 Cost Analysis

### Current Costs (No RAG)

**Per Query:**
- System prompt: ~1,000 tokens
- Full knowledge: ~15,000 tokens (60K chars ÷ 4)
- Conversation: ~2,000 tokens
- **Total Input:** ~18,000 tokens

**Monthly (10K queries):**
- Input: 180M tokens × $0.15/1M = **$27.00**
- Output: 50M tokens × $0.60/1M = **$30.00**
- **Total:** **$57.00/month**

### With RAG System

**Per Query:**
- System prompt: ~500 tokens (removed formatting)
- RAG knowledge: ~1,500 tokens (5 chunks)
- Conversation: ~2,000 tokens
- **Total Input:** ~4,000 tokens

**Monthly (10K queries):**
- Input: 40M tokens × $0.15/1M = **$6.00**
- Output: 50M tokens × $0.60/1M = **$30.00**
- Embedding: 50K queries × $0.001/query = **$50.00**
- **Total:** **$86.00/month**

**Wait, costs INCREASED?**

The catch is embedding costs. BUT:
- Embeddings generated **once** when knowledge is fetched (not per query)
- For 1,000 games × 50 chunks = 50K embeddings **one-time**
- After that, retrieval queries are free (just Supabase compute)

**Adjusted Monthly (after initial embedding):**
- Input: 40M tokens × $0.15/1M = **$6.00**
- Output: 50M tokens × $0.60/1M = **$30.00**
- **Total:** **$36.00/month** (37% savings)

**At Scale (100K queries/month):**
- Without RAG: **$570/month**
- With RAG: **$360/month**
- **Savings:** **$210/month (37%)**

---

## 📚 Documentation Updates Needed

After implementation, update these docs:

1. **AI_INSTRUCTIONS_DEEP_DIVE_REPORT.md**
   - Add RAG system section
   - Update context injection flow
   - Add performance metrics

2. **SECURITY_AUDIT_CREDITS_AND_AI_CALLS.md** (current file)
   - Add RAG retrieval costs
   - Update token calculations
   - Add embedding costs

3. **New:** `RAG_SYSTEM_ARCHITECTURE.md`
   - Complete RAG implementation guide
   - Chunking strategy
   - Embedding generation
   - Retrieval algorithm
   - Performance tuning

4. **New:** `QUERY_CLASSIFICATION_GUIDE.md`
   - Query types and examples
   - Classification algorithm
   - Genre-based defaults
   - Profile integration

---

## 🎓 Learning Resources

For the team implementing RAG:

1. **RAG Fundamentals:**
   - [Retrieval-Augmented Generation for LLMs](https://python.langchain.com/docs/tutorials/rag/)
   - [Vector Search Best Practices](https://www.pinecone.io/learn/vector-search/)

2. **Gemini Embeddings:**
   - [Gemini Embedding Models](https://ai.google.dev/gemini-api/docs/embeddings)
   - [Semantic Search with Gemini](https://github.com/google-gemini/cookbook/blob/main/quickstarts/Embeddings.ipynb)

3. **PostgreSQL pgvector:**
   - [Supabase Vector Guide](https://supabase.com/docs/guides/ai/vector-search)
   - [pgvector Performance](https://github.com/pgvector/pgvector#performance)

4. **Chunking Strategies:**
   - [Text Splitting for RAG](https://www.llamaindex.ai/blog/evaluating-the-ideal-chunk-size-for-a-rag-system-using-llamaindex-6207e5d3fec5)
   - [Semantic Chunking](https://python.langchain.com/docs/how_to/semantic-chunker/)

---

## ✅ Checklist for Getting Started

### Pre-Implementation (You Are Here)

- [ ] Read and understand this plan
- [ ] Review expert's original feedback
- [ ] Confirm priority: P0 (RAG), P1 (Dates), P2 (Formatting), P3 (Hints)
- [ ] Decide on implementation timeline
- [ ] Assign team members to phases

### Phase 1 Kickoff (Week 1)

- [ ] Create `src/utils/knowledgeCutoff.ts`
- [ ] Write unit tests
- [ ] Update all date references
- [ ] Create `src/utils/markdownFormatter.ts`
- [ ] Remove formatting rules from prompts
- [ ] Test in staging

### Phase 2 Kickoff (Week 2)

- [ ] Create `src/services/queryClassifier.ts`
- [ ] Build test suite with 50+ examples
- [ ] Integrate with prompt system
- [ ] A/B test with 10% of users

### Phase 3 Kickoff (Week 3-5)

- [ ] Run SQL migration for chunks table
- [ ] Enable pgvector extension
- [ ] Create chunking service
- [ ] Create embedding service
- [ ] Update knowledge fetcher
- [ ] Create RAG retrieval service
- [ ] Integrate with prompt system
- [ ] Run performance tests
- [ ] Deploy to Pro users (canary)

---

## 🔮 Future Enhancements (Post-RAG)

Once RAG is working, consider:

### 1. **Hybrid Search**
Combine vector similarity with keyword search for better recall:
```sql
-- BM25 + Vector hybrid
WITH bm25 AS (
  SELECT id, ts_rank(to_tsvector(chunk_text), query) as bm25_score
  FROM game_knowledge_chunks
  WHERE to_tsvector(chunk_text) @@ query
),
vector AS (
  SELECT id, 1 - (embedding <=> query_embedding) as vector_score
  FROM game_knowledge_chunks
)
SELECT 
  chunks.*,
  (COALESCE(bm25.bm25_score, 0) * 0.3 + COALESCE(vector.vector_score, 0) * 0.7) as final_score
FROM game_knowledge_chunks chunks
LEFT JOIN bm25 ON bm25.id = chunks.id
LEFT JOIN vector ON vector.id = chunks.id
ORDER BY final_score DESC;
```

### 2. **Contextual Re-ranking**
Use conversation history to boost relevant chunks:
```typescript
// Boost chunks from previously discussed sections
const rerank = (chunks: Chunk[], history: Message[]) => {
  const discussedSections = extractSections(history);
  return chunks.map(chunk => ({
    ...chunk,
    score: chunk.similarity * (discussedSections.includes(chunk.sectionType) ? 1.2 : 1.0)
  })).sort((a, b) => b.score - a.score);
};
```

### 3. **Adaptive Chunk Count**
Adjust number of chunks based on query complexity:
```typescript
const getChunkCount = (query: string, type: QueryType) => {
  if (type === 'gameplay' && /boss|strategy/i.test(query)) return 7; // More detail
  if (type === 'lore' && /who is|backstory/i.test(query)) return 3;  // Less needed
  return 5; // Default
};
```

### 4. **User Feedback Loop**
Let users rate response quality to improve retrieval:
```typescript
// Store feedback in database
await supabase.from('retrieval_feedback').insert({
  query,
  retrieved_chunk_ids,
  user_rating,  // 👍/👎
  conversation_id
});

// Use feedback to tune similarity thresholds
```

---

## 📞 Questions & Support

**For Implementation Questions:**
- Slack: #otagon-ai-team
- GitHub Discussions: "RAG Implementation Thread"

**For Technical Issues:**
- Check logs: `[RAG]` prefix
- Review metrics dashboard
- Consult this plan

**For Performance Issues:**
- Check retrieval latency (<200ms target)
- Verify chunk count (5-7 optimal)
- Review similarity threshold (0.75-0.85 range)

---

## 🎯 TL;DR - Executive Summary

An expert reviewed our AI system and gave it high marks, but identified 4 optimization opportunities:

1. **🔴 RAG System (P0):** Stop injecting 60K chars of knowledge. Use semantic search to find 5 relevant chunks (~5K chars). **12x smaller context, 2x faster, 10x cheaper.**

2. **🟢 Dynamic Dates (P1):** Remove hardcoded "January 2025" strings. Use utility that calculates relative to "now". **Prevents code aging.**

3. **🟡 Post-Processing (P2):** Stop telling AI how to format markdown. Clean it with regex after response. **500+ tokens saved, more reliable.**

4. **🟠 Query Classification (P3):** Don't force "Hint:" for lore questions. Detect query type and use appropriate header style. **More natural conversations.**

**Timeline:** 5 weeks total
**Investment:** ~120 hours development
**ROI:** 37% cost savings, 2x speed, better UX

**Next Step:** Get approval to proceed with Phase 1 (Quick Wins).

---

**Last Updated:** December 13, 2025  
**Author:** GitHub Copilot  
**Status:** ✅ Planning Complete - Ready for Implementation
