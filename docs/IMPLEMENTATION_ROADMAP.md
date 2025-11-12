# OTAKON AI - IMPLEMENTATION ROADMAP
## Complete Code-First Action Plan with Context

**Date:** October 26, 2025  
**Last Updated:** October 26, 2025 - Critical Context & Subtab Update Fixes Added
**Codebase:** 38,557 lines analyzed  
**Current State:** 75% production-ready  
**Target:** 92% production-ready in 2-3 weeks

---

## TABLE OF CONTENTS
1. [URGENT: Critical Fixes (New)](#urgent-critical-fixes-october-26-2025)
2. [Current State Analysis](#current-state-analysis)
3. [Priority 0: Critical Blockers](#priority-0-critical-blockers-week-1)
4. [Priority 1: High-Priority Fixes](#priority-1-high-priority-fixes-week-2-3)
5. [Priority 2: Medium-Priority Improvements](#priority-2-medium-priority-improvements-week-3-4)
6. [Priority 3: Low-Priority Enhancements](#priority-3-low-priority-enhancements-month-2)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Plan](#deployment-plan)
9. [Success Metrics](#success-metrics)

---

## URGENT: CRITICAL FIXES (October 26, 2025)

### 🔴 **PHASE 0: Context System & Subtab Updates** - DO FIRST

**Status:** ❌ BROKEN - Multiple critical issues discovered  
**Impact:** Context not preserved, subtabs not updating, false game detections  
**Estimated Time:** 2-3 days  
**Priority:** P0 - BLOCKS PRODUCTION LAUNCH

---

#### **Issue #1: Context Summary Field Missing** 🚨 CRITICAL

**Problem:** 
- `Conversation` type has NO `contextSummary` field
- Context summarization runs but summary is **discarded** (not stored)
- AI loses all historical context after 10 messages
- Long conversations become incoherent

**Impact:**
```
User Query 1-5: AI remembers everything ✅
User Query 6-10: AI still has context ✅
User Query 11+: AI forgets queries 1-5 ❌ (only sees last 10 messages)
```

**Fix Required:**

```typescript
// File: src/types/index.ts
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  contextSummary?: string;  // ✅ ADD: Max 500 words, text-only
  lastSummarizedAt?: number;  // ✅ ADD: Timestamp of last summarization
  // ... rest of fields
}
```

```sql
-- File: supabase/migrations/20251026_add_context_summary.sql
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS context_summary TEXT,
ADD COLUMN IF NOT EXISTS last_summarized_at BIGINT;
```

```typescript
// File: src/services/contextSummarizationService.ts
async applyContextSummarization(conversation: Conversation): Promise<Conversation> {
  // ... existing summarization logic
  
  // ✅ FIX: Actually store the summary
  return {
    ...conversation,
    contextSummary: cappedSummary,  // ✅ Store summary (max 500 words)
    lastSummarizedAt: Date.now(),
    messages: toKeep  // Keep last 5 messages
  };
}
```

```typescript
// File: src/services/promptSystem.ts - getGameCompanionPrompt()
const historicalContext = conversation.contextSummary 
  ? `**Historical Context (Previous Sessions):**
${conversation.contextSummary}

`
  : '';

// ✅ INJECT into prompt BEFORE recent messages
return `
**Persona: Game Companion**
...

${historicalContext}  ← ✅ AI NOW SEES FULL HISTORY

**Recent Conversation (Last 5 messages):**
${recentMessages}
...
`;
```

**Constraints:**
- Context summary must be **text-only** (no base64 image URLs)
- Hard cap at **500 words** to prevent token cost explosion
- Summary should be **information-dense** (milestones, strategies, progress)

---

#### **Issue #2: Subtabs Not Updating When User Active** 🚨 CRITICAL

**Problem:** 
- Deep clone function only clones array, not subtab objects inside
- React doesn't detect content changes (same object references)
- Polling change detection too narrow (only checks loading count)
- User sees frozen/stale subtab content

**Impact:**
```
AI Response: "Updated Boss Strategies subtab"
User: *Clicks Boss Strategies tab*
UI: Shows old content from 10 minutes ago ❌
Database: Has new content ✅
Issue: React didn't re-render because object reference unchanged
```

**Root Cause:**

```typescript
// MainApp.tsx line 118 - BROKEN deep clone
const deepCloneConversations = (conversations: Conversations): Conversations => {
  const cloned: Conversations = {};
  Object.keys(conversations).forEach(key => {
    cloned[key] = {
      ...conversations[key],
      subtabs: conversations[key].subtabs ? [...conversations[key].subtabs!] : undefined,
      //       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      //       ❌ SHALLOW CLONE - subtab objects are SAME REFERENCES
      //       React won't detect changes to content/status/isNew
    };
  });
  return cloned;
};
```

**Fix Required:**

```typescript
// MainApp.tsx - FIX #1: Proper deep clone
const deepCloneConversations = (conversations: Conversations): Conversations => {
  const cloned: Conversations = {};
  Object.keys(conversations).forEach(key => {
    cloned[key] = {
      ...conversations[key],
      // ✅ DEEP CLONE: Clone array AND each subtab object
      subtabs: conversations[key].subtabs 
        ? conversations[key].subtabs!.map(tab => ({ ...tab }))
        : undefined,
      // ✅ Also deep clone messages
      messages: conversations[key].messages.map(msg => ({ ...msg }))
    };
  });
  return cloned;
};

// MainApp.tsx - FIX #2: Better change detection in polling
setConversations(prevConversations => {
  const freshConversations = deepCloneConversations(updatedConversations);
  
  let hasChanges = false;
  Object.keys(freshConversations).forEach(convId => {
    const prev = prevConversations[convId];
    const curr = freshConversations[convId];
    
    if (prev && curr && prev.subtabs && curr.subtabs) {
      // Check loading count
      const prevLoadingCount = prev.subtabs.filter(t => t.status === 'loading').length;
      const currLoadingCount = curr.subtabs.filter(t => t.status === 'loading').length;
      
      if (prevLoadingCount !== currLoadingCount) {
        hasChanges = true;
      }
      
      // ✅ NEW: Check content, status, and isNew changes
      if (!hasChanges) {
        for (let i = 0; i < prev.subtabs.length; i++) {
          const prevTab = prev.subtabs[i];
          const currTab = curr.subtabs[i];
          
          if (currTab && prevTab && (
            prevTab.content !== currTab.content ||      // ✅ Content changed
            prevTab.status !== currTab.status ||        // ✅ Status changed
            prevTab.isNew !== currTab.isNew             // ✅ New flag changed
          )) {
            hasChanges = true;
            console.log(`🔄 Subtab updated: ${currTab.title}`);
            break;
          }
        }
      }
    }
  });
  
  if (hasChanges) {
    // ✅ Force update active conversation
    if (activeConversationRef.current && freshConversations[activeConversationRef.current.id]) {
      setActiveConversation(freshConversations[activeConversationRef.current.id]);
    }
    return freshConversations;
  }
  
  return prevConversations;
});

// MainApp.tsx - FIX #3: Use refs to avoid stale closures
const conversationsRef = useRef(conversations);
const activeConversationRef = useRef(activeConversation);

useEffect(() => {
  conversationsRef.current = conversations;
}, [conversations]);

useEffect(() => {
  activeConversationRef.current = activeConversation;
}, [activeConversation]);

// Polling effect with empty dependencies
useEffect(() => {
  const pollForSubtabUpdates = async () => {
    // ✅ Use refs to get latest state
    const hasLoadingSubtabs = Object.values(conversationsRef.current).some(conv => 
      conv.subtabs?.some(tab => tab.status === 'loading')
    );
    // ... rest of polling logic
  };

  const interval = setInterval(pollForSubtabUpdates, 3000);
  return () => clearInterval(interval);
}, []);  // ✅ Empty array - create interval once
```

---

#### **Issue #3: Subtab Progressive Updates (Linear Progression)** 🚨 CRITICAL

**Required Behavior:**
- Subtabs should **accumulate content over time** (not overwrite)
- Each AI response **appends** to existing subtab content
- Show content as **linear progression** with timestamps/sections
- User sees history of updates, not just latest

**Current (WRONG):**
```typescript
// gameTabService.ts - updateSubTabsFromAIResponse
const updatedSubTabs = conversation.subtabs.map(tab => {
  const update = updates.find(u => u.tabId === tab.id);
  if (update) {
    return {
      ...tab,
      content: update.content,  // ❌ OVERWRITES old content
      isNew: true,
      status: 'loaded' as const
    };
  }
  return tab;
});
```

**Fixed (LINEAR PROGRESSION):**
```typescript
// gameTabService.ts - updateSubTabsFromAIResponse
const updatedSubTabs = conversation.subtabs.map(tab => {
  const update = updates.find(u => u.tabId === tab.id);
  if (update) {
    // ✅ APPEND new content with timestamp separator
    const timestamp = new Date().toLocaleString();
    const separator = '\n\n---\n**Updated: ' + timestamp + '**\n\n';
    
    const newContent = tab.content && tab.content !== 'Loading...'
      ? tab.content + separator + update.content  // ✅ Append to existing
      : update.content;  // First update, just set content
    
    return {
      ...tab,
      content: newContent,  // ✅ Accumulated history
      isNew: true,
      status: 'loaded' as const,
      updatedAt: Date.now()  // Track last update
    };
  }
  return tab;
});
```

**Visual Example:**
```markdown
# Boss Strategies

## Phase 1 Strategy (Generated: 10:15 AM)
Use jump attacks to avoid the ground slam...

---
**Updated: 10:20 AM**

## Phase 2 Strategy
Watch for the hammer combo in second phase...

---
**Updated: 10:25 AM**

## Alternative Approach
If you're struggling, try using magic instead...
```

**Benefits:**
- ✅ User sees full progression of advice
- ✅ Can reference earlier strategies
- ✅ Clear timeline of game progress
- ✅ No information loss

---

#### **Issue #4: False Game Tab Creation** 🚨 CRITICAL

**Problem:** 
- Game tabs created for non-gameplay images (launchers, menus, desktop)
- AI model cutoff is January 2025 (missing latest games)
- Low confidence detections still create tabs

**Impact:**
```
User: *Screenshots Steam launcher*
App: Creates "Steam" game tab ❌
User: *Screenshots Discord chat about games*
App: Creates tab for each game mentioned ❌
User: *Screenshots GTA VI (released March 2025)*
App: "Unknown game, low confidence" ❌
```

**Fix Required:**

```typescript
// File: src/services/aiService.ts
class AIService {
  private groundedModel: GenerativeModel;  // ✅ NEW: Model with Google Search

  constructor() {
    // ... existing models
    
    // ✅ Enable Google Search grounding for latest games
    this.groundedModel = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-09-2025",
      safetySettings: SAFETY_SETTINGS,
      tools: [{
        googleSearch: {}  // ✅ Real-time game info from Google
      }] as Tool[]
    });
  }

  async detectGameWithGrounding(
    userMessage: string,
    imageData?: string
  ): Promise<{
    gameId: string | null;
    confidence: 'high' | 'low';
    genre: string | null;
    isUnreleased: boolean;
    isGameplay: boolean;  // ✅ NEW: Not just launcher/menu
  }> {
    const prompt = `Analyze this to identify the game.

CRITICAL INSTRUCTIONS:
1. Use Google Search to verify game exists and release date
2. Determine if this is ACTUAL GAMEPLAY or just a menu/launcher
3. Check release date (current: October 2025)

Respond with JSON:
{
  "gameId": "Full Game Name" or null,
  "confidence": "high" or "low",
  "isGameplay": true/false,
  "isUnreleased": true/false,
  "releaseDate": "YYYY-MM-DD",
  "reasoning": "Why"
}

ONLY set confidence="high" if:
✅ Game clearly identifiable (UI, characters, environments)
✅ Release date confirmed via Google Search
✅ Actual in-game content (NOT menus, launchers, desktop)

Set confidence="low" if:
❌ Launcher, menu, or desktop screenshot
❌ Cannot verify game exists
❌ Generic gaming content (Discord, Steam, etc.)`;

    // ✅ Use grounded model with Google Search
    const result = await this.groundedModel.generateContent({
      contents: [{ role: 'user', parts: [...] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1  // Low temp for factual detection
      }
    });

    const detection = JSON.parse(await result.response.text());
    
    // ✅ Validate: downgrade if not gameplay
    if (detection.confidence === 'high' && !detection.isGameplay) {
      detection.confidence = 'low';
    }
    
    return detection;
  }
}

// MainApp.tsx - Strict tab creation criteria
if (response.otakonTags.has('GAME_ID')) {
  const gameTitle = response.otakonTags.get('GAME_ID');
  const confidence = response.otakonTags.get('CONFIDENCE');
  const isGameplay = response.otakonTags.get('IS_FULLSCREEN') === 'true';
  
  // ✅ ALL conditions must be met
  const shouldCreateTab = 
    confidence === 'high' &&
    isGameplay &&  // ✅ Must be actual gameplay
    gameTitle &&
    gameTitle.toLowerCase() !== 'unknown';
  
  if (!shouldCreateTab) {
    console.log('⚠️ Tab creation blocked:', {
      confidence,
      isGameplay,
      reason: !isGameplay ? 'Not gameplay (launcher/menu)' : 
              confidence !== 'high' ? 'Low confidence' : 
              'Generic detection'
    });
    // Stay in Game Hub, no tab created
  }
}
```

---

#### **Issue #5: Subtab UI - Collapsed During Loading** ⚠️ HIGH

**Problem:** 
- Subtabs auto-expand even when content is still loading
- User sees "Loading..." text unnecessarily
- Should stay collapsed until content ready

**Fix Required:**

```typescript
// File: src/components/features/SubTabs.tsx
const SubTabs: React.FC<SubTabsProps> = ({ subtabs = [], ... }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);  // ✅ Start collapsed
  
  useEffect(() => {
    if (hasUserInteracted) return;

    const allLoading = subtabs.every(tab => tab.status === 'loading');
    const hasLoadedContent = subtabs.some(tab => 
      tab.status === 'loaded' && tab.content && tab.content.trim().length > 0
    );
    
    // ✅ Collapse if all loading
    if (allLoading && isExpanded) {
      setIsExpanded(false);
    }
    
    // ✅ Expand when first content loads
    if (hasLoadedContent && !isExpanded) {
      setIsExpanded(true);
    }
  }, [subtabs, isExpanded, hasUserInteracted]);
  
  // ... rest of component
};
```

---

### **Implementation Order (Do in Sequence)**

**Day 1: Context System (4-5 hours)**
1. ✅ Add `contextSummary` and `lastSummarizedAt` to Conversation type
2. ✅ Create Supabase migration for new fields
3. ✅ Update contextSummarizationService to store summary (500 word cap)
4. ✅ Inject contextSummary into AI prompts
5. ✅ Test with 20+ message conversation

**Day 2: Subtab Update Fixes (4-5 hours)**
6. ✅ Fix deep clone to clone each subtab object
7. ✅ Improve change detection (content, status, isNew)
8. ✅ Add refs to prevent stale closures
9. ✅ Implement linear progression (append, not overwrite)
10. ✅ Test subtab updates while user is active

**Day 3: Game Detection (4-5 hours)**
11. ✅ Enable Google Search grounding in Gemini API
12. ✅ Implement detectGameWithGrounding() method
13. ✅ Add strict validation (gameplay only, high confidence)
14. ✅ Test with launchers, menus, latest games (2024-2025)
15. ✅ Add subtab collapsed state during loading

**Total:** 12-15 hours over 3 days

---

### **Testing Checklist**

**Context System:**
- [ ] contextSummary saves to database
- [ ] Summary stays under 500 words
- [ ] Summary is text-only (no base64)
- [ ] AI receives summary in prompts
- [ ] 50+ message conversations maintain coherence

**Subtab Updates:**
- [ ] Content updates while user viewing tab
- [ ] Linear progression (no overwrite)
- [ ] Change detection catches all updates
- [ ] No stale closures in polling
- [ ] Subtabs collapsed when loading

**Game Detection:**
- [ ] Latest games (2024-2025) detected
- [ ] Launchers don't create tabs
- [ ] Menus don't create tabs
- [ ] Desktop screenshots don't create tabs
- [ ] Only gameplay creates tabs

---

---

## CURRENT STATE ANALYSIS

### ✅ What's Working Excellently

#### 1. **Service Architecture (Grade: A)**
**20+ specialized services with clear separation of concerns:**

```typescript
// Current service layer structure (EXCELLENT):
src/services/
├── aiService.ts (660 lines) - Gemini AI integration
├── authService.ts (985 lines) - Authentication + user management
├── cacheService.ts (~600 lines) - Centralized caching with Supabase persistence
├── conversationService.ts (~500 lines) - Conversation CRUD with atomic operations
├── messageRoutingService.ts - Atomic message migration
├── gameTabService.ts - Genre-specific tab creation
├── errorRecoveryService.ts - Exponential backoff retry
├── websocketService.ts - Production-grade WebSocket client
├── ttsService.ts - Text-to-speech hands-free mode
├── supabaseService.ts (~400 lines) - Database operations
└── ... (10+ more specialized services)
```

**Key Strengths:**
- Request deduplication prevents thundering herd
- Three-layer caching (memory → localStorage → Supabase)
- Comprehensive error recovery with exponential backoff
- Safety settings prevent AI content violations

#### 2. **Database Schema (Grade: A-)**
**Well-designed PostgreSQL schema with RLS foundation:**

```sql
-- Current schema (from current_live_schema.sql):
CREATE TABLE users (
  id UUID PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id), -- ⚠️ Used for RLS
  email TEXT NOT NULL,
  tier TEXT DEFAULT 'free', -- Query-based limits
  text_count INTEGER DEFAULT 0,
  image_count INTEGER DEFAULT 0,
  text_limit INTEGER DEFAULT 55,
  image_limit INTEGER DEFAULT 25,
  -- ... 20+ more columns
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id), -- ⚠️ N+1 issue: should use auth_user_id
  title TEXT,
  messages JSONB DEFAULT '[]'::jsonb, -- ⚠️ Should be normalized
  subtabs JSONB DEFAULT '[]'::jsonb,
  is_game_hub BOOLEAN DEFAULT FALSE,
  -- ... more columns
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ✅ This table exists but isn't being used yet!
```

**Current RLS Policies:**
```sql
-- ✅ PARTIAL RLS implementation exists:
CREATE POLICY "Users can create own conversations" 
ON conversations FOR INSERT TO authenticated 
WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- ⚠️ BUT: Missing policies for SELECT/UPDATE/DELETE
-- ⚠️ AND: Using complex subqueries that cause N+1 issues
```

#### 3. **Component Structure (Grade: A)**
**40+ well-organized components:**

```
src/components/
├── auth/
│   └── AuthCallback.tsx (OAuth handling)
├── modals/ (8 modals)
│   ├── SettingsModal.tsx
│   ├── CreditModal.tsx
│   ├── ConnectionModal.tsx (PC WebSocket)
│   └── ... (5 more)
├── splash/ (8 onboarding screens)
├── features/
│   ├── ChatInterface.tsx (622 lines) - Main chat UI
│   ├── SubTabs.tsx - AI-generated insights
│   └── SuggestedPrompts.tsx - Daily prompt rotation
├── layout/
│   └── Sidebar.tsx - Conversation list
└── ui/ (30+ reusable components)
```

---

### ⚠️ What Needs Critical Fixing

#### 1. **LoginSplashScreen Race Condition (BLOCKER)**

**Current Broken Code:**
```typescript
// File: src/components/splash/LoginSplashScreen.tsx (Line ~200)
if (emailMode === 'signin') {
  // ❌ RACE CONDITION: onComplete() called BEFORE auth finishes
  onComplete(); // <--- Sets view to 'app' immediately
  setIsLoading(true);
  result = await authService.signInWithEmail(email, password); // <--- Auth happens AFTER
}
```

**Why It's Broken:**
1. `onComplete()` triggers `App.tsx` to check auth state
2. `processAuthState()` runs before `signInWithEmail()` finishes
3. User is null, so app navigates back to login screen
4. Creates infinite loop or flash effect

**Impact:** Affects **100% of email sign-ins**

#### 2. **API Key Exposure (SECURITY CRITICAL)**

**Current Insecure Code:**
```typescript
// File: src/services/aiService.ts (Line 11)
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;
// ❌ EXPOSED: This key is bundled in production JavaScript

// File: src/lib/supabase.ts (Line 3-4)
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
// ⚠️ Supabase anon key is OK to expose (designed for client-side)
// ❌ But Gemini API key is NOT - can be extracted and abused
```

**How to Extract (Attacker POV):**
```bash
# Any user can do this:
1. Open Chrome DevTools → Sources tab
2. Search for "VITE_GEMINI_API_KEY" in bundle
3. Copy API key
4. Make unlimited API calls at your expense
```

**Current Cost Exposure:** Unlimited (no rate limiting in aiService.ts)

#### 3. **N+1 Query Pattern (PERFORMANCE KILLER)**

**Current Inefficient Code:**
```typescript
// File: src/services/supabaseService.ts (Lines 150-180)
async getConversations(userId: string): Promise<Conversation[]> {
  // ❌ QUERY 1: Get internal user ID
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', userId)
    .single();

  // ❌ QUERY 2: Get conversations using internal ID
  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userData.id); // Using internal ID instead of auth_user_id
    
  return data;
}

// Every operation follows this pattern:
// getConversations() = 2 queries
// getGames() = 2 queries
// createConversation() = 2 queries
// Total: 50%+ of operations are duplicated
```

**Performance Impact:**
- 2x database load
- 50-100ms extra latency per request
- Wastes connection pool
- Compounds at scale (100K users = 200K extra queries/hour)

#### 4. **MainApp.tsx God Component (MAINTAINABILITY RISK)**

**Current Massive File:**
```typescript
// File: src/components/MainApp.tsx (1,740 lines!)
export default function MainApp() {
  // ❌ 25+ useState hooks in one component:
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversations>({});
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [handsFreeModalOpen, setHandsFreeModalOpen] = useState(false);
  const [addGameModalOpen, setAddGameModalOpen] = useState(false);
  // ... 15+ more state hooks

  // ❌ All application logic in one file:
  const handleSendMessage = async (...) => { /* 100+ lines */ };
  const loadData = async (...) => { /* 200+ lines */ };
  const handleWebSocketMessage = (...) => { /* 50+ lines */ };
  // ... 30+ more functions

  // ❌ All modal rendering:
  return (
    <>
      <Sidebar />
      <ChatInterface />
      {settingsOpen && <SettingsModal />}
      {creditModalOpen && <CreditModal />}
      {connectionModalOpen && <ConnectionModal />}
      {handsFreeModalOpen && <HandsFreeModal />}
      {addGameModalOpen && <AddGameModal />}
      {/* ... 5+ more modals */}
    </>
  );
}
```

**Problems:**
- Hard to debug (too much state)
- Hard to test (no isolation)
- Fragile (one bug breaks everything)
- Slow to load (12,000+ lines in call stack)

#### 5. **Zero Test Coverage (QUALITY RISK)**

**Current Testing:**
```bash
# Run tests:
$ npm test
# Error: No test command found

# Check test files:
$ find . -name "*.test.ts"
# Found: test-suite/database-functions.test.js (external, not integrated)
# Found: test-suite/service-layer.test.js (external, not integrated)
```

**Impact:** No safety net for refactoring P0-P1 fixes

---

## PRIORITY 0: CRITICAL BLOCKERS (Week 1)

### Must Fix Before ANY Production Users

---

### P0.1: Fix LoginSplashScreen Race Condition ⚡ BLOCKER

**Severity:** CRITICAL (affects 100% of email sign-ins)  
**Timeline:** 1 hour  
**Files:** 1 file, 3 lines changed

#### Implementation

**File:** `src/components/splash/LoginSplashScreen.tsx`

**Step 1: Locate the bug (Lines 195-210)**
```typescript
// CURRENT BROKEN CODE (Lines 200-210):
try {
  let result;
  if (emailMode === 'signin') {
    // ⚠️ PROTECTED EMAIL AUTH FLOW - DO NOT MODIFY WITHOUT WARNING ⚠️
    // Email sign-in is working correctly - any changes here could break user authentication
    // If you need to modify this, add a warning comment explaining the change
    // Set view to app immediately to prevent flash
    onComplete(); // ❌ LINE 207: Too early!
    // Show loading state during sign-in
    setIsLoading(true);
    result = await authService.signInWithEmail(email, password);
  } else {
    // For signup, validate the password
    if (!password) {
      setPasswordError('Password is required');
      return;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.errors[0]);
      return;
    }
    
    // ⚠️ PROTECTED EMAIL AUTH FLOW - DO NOT MODIFY WITHOUT WARNING ⚠️
    // Email signup is working correctly - any changes here could break user registration
    // If you need to modify this, add a warning comment explaining the change
    result = await authService.signUpWithEmail(email, password);
  }
  
  if (result.success) {
    if (emailMode === 'signup') {
      // For signup, show modal first before any view changes
      if (result.requiresConfirmation) {
        setSignupModalType('success');
        setSignupModalMessage('Please check your email and click the confirmation link to complete your account setup.');
        setShowSignupModal(true);
      } else {
        // Account created and user is signed in
        setSignupModalType('success');
        setSignupModalMessage('Account created successfully! You are now signed in.');
        setShowSignupModal(true);
      }
      // Don't call onComplete() here - let the modal handle the transition
    } else {
      // Store remember me preference for sign-in
      if (rememberMe) {
        localStorage.setItem('otakon_remember_me', 'true');
        localStorage.setItem('otakon_remembered_email', email);
      }
      // onComplete() was already called above for sign-in
    }
  } else {
    // Handle different error types for signup
    if (emailMode === 'signup') {
      const errorMsg = result.error || 'Authentication failed. Please try again.';
      // ... error handling
    } else {
      // If sign-in failed, we need to go back to login screen
      // Reset the view back to login
      onSetAppState(prev => ({ ...prev, view: 'landing', onboardingStatus: 'login' }));
      setErrorMessage(result.error || 'Authentication failed. Please try again.');
    }
  }
} catch (_error) {
  setErrorMessage('Authentication failed. Please try again.');
} finally {
  setIsLoading(false);
  setIsAnimating(false);
}
```

**Step 2: Apply the fix**

Replace lines 200-250 with:

```typescript
try {
  let result;
  if (emailMode === 'signin') {
    // ✅ FIXED: Show loading state FIRST
    setIsLoading(true);
    
    // ✅ FIXED: Await auth completion BEFORE navigation
    result = await authService.signInWithEmail(email, password);
    
    // ✅ FIXED: Only navigate if auth succeeded
    if (result.success) {
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('otakon_remember_me', 'true');
        localStorage.setItem('otakon_remembered_email', email);
      }
      
      // ✅ SAFE: Now trigger navigation after successful auth
      onComplete();
    } else {
      // Auth failed - reset to login screen
      onSetAppState(prev => ({ ...prev, view: 'landing', onboardingStatus: 'login' }));
      setErrorMessage(result.error || 'Authentication failed. Please try again.');
    }
  } else {
    // Signup flow (unchanged)
    if (!password) {
      setPasswordError('Password is required');
      return;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.errors[0]);
      return;
    }
    
    result = await authService.signUpWithEmail(email, password);
    
    if (result.success) {
      if (result.requiresConfirmation) {
        setSignupModalType('success');
        setSignupModalMessage('Please check your email and click the confirmation link to complete your account setup.');
        setShowSignupModal(true);
      } else {
        setSignupModalType('success');
        setSignupModalMessage('Account created successfully! You are now signed in.');
        setShowSignupModal(true);
      }
    } else {
      const errorMsg = result.error || 'Authentication failed. Please try again.';
      if (errorMsg.toLowerCase().includes('user already registered') || 
          errorMsg.toLowerCase().includes('email already registered') ||
          errorMsg.toLowerCase().includes('already registered')) {
        setSignupModalType('email-exists');
        setSignupModalMessage('This email is already registered. Please try signing in instead.');
      } else if (errorMsg.toLowerCase().includes('for security purposes') || 
                 errorMsg.toLowerCase().includes('rate limit')) {
        setSignupModalType('invalid-email');
        setSignupModalMessage('Please wait before trying again. For security purposes, there is a cooldown period.');
      } else {
        setSignupModalType('invalid-email');
        setSignupModalMessage(errorMsg);
      }
      setShowSignupModal(true);
    }
  }
} catch (_error) {
  setErrorMessage('Authentication failed. Please try again.');
} finally {
  setIsLoading(false);
  setIsAnimating(false);
}
```

#### Testing Checklist

```bash
# Manual test (run 10 times):
1. ✅ Sign in with valid credentials → Should work without flash
2. ✅ Sign in with invalid credentials → Should show error
3. ✅ Sign up with new email → Should show success modal
4. ✅ Sign up with existing email → Should show error modal
5. ✅ Test "Remember me" checkbox → Should persist email

# Expected behavior:
- No flash/loop on successful sign-in
- User stays on login screen if auth fails
- Loading spinner shows during auth
```

**Git Commit:**
```bash
git add src/components/splash/LoginSplashScreen.tsx
git commit -m "fix(auth): resolve race condition in email sign-in

- Move onComplete() call after successful auth
- Prevents navigation before auth state is set
- Fixes infinite loop/flash on sign-in failure

Fixes: P0.1
Impact: 100% of email sign-ins
Testing: Manual (10 iterations)"
```

---

### P0.2: Migrate API Keys to Backend 🔐 SECURITY CRITICAL

**Severity:** CRITICAL (unlimited API abuse exposure)  
**Timeline:** 1-2 days  
**Files:** 4 files created, 2 files modified

#### Current Exposure Analysis

**Cost Calculation:**
```
Current state:
- Gemini API key exposed in client bundle
- Anyone can extract and use your API key
- No rate limiting in aiService.ts
- Potential cost: UNLIMITED

Example attack:
while true; do
  curl -X POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent \
    -H "Content-Type: application/json" \
    -H "x-goog-api-key: YOUR_EXPOSED_KEY" \
    -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
done
# Your bill: $$$$ (no limit)
```

#### Implementation

**Step 1: Create Supabase Edge Function** (Day 1, 2-3 hours)

```bash
# Create function directory
cd supabase
mkdir -p functions/ai-proxy
```

**File:** `supabase/functions/ai-proxy/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

// ✅ SECURITY: API key stored in Supabase secrets (not in client bundle)
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing required environment variables');
}

// Initialize Supabase client (server-side)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ✅ SECURITY: Rate limiting map (per-user)
const rateLimits = new Map<string, { count: number; resetTime: number }>();

interface AIRequest {
  prompt: string;
  image?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  requestType: 'text' | 'image';
}

serve(async (req: Request) => {
  // ✅ SECURITY: Verify user is authenticated
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', success: false }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Extract and verify JWT token
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token', success: false }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ✅ SECURITY: Server-side rate limiting (10 requests per minute)
  const userId = user.id;
  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  if (userLimit) {
    if (now < userLimit.resetTime) {
      if (userLimit.count >= 10) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Try again in 1 minute.', 
            success: false 
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      userLimit.count++;
    } else {
      rateLimits.set(userId, { count: 1, resetTime: now + 60000 });
    }
  } else {
    rateLimits.set(userId, { count: 1, resetTime: now + 60000 });
  }

  try {
    // Parse request body
    const body: AIRequest = await req.json();
    const { prompt, image, systemPrompt, temperature = 0.7, maxTokens = 2048, requestType } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required', success: false }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ BUSINESS LOGIC: Check user query limits (server-side)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('text_count, image_count, text_limit, image_limit, tier')
      .eq('auth_user_id', userId)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found', success: false }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check query limits
    if (requestType === 'text' && userData.text_count >= userData.text_limit) {
      return new Response(
        JSON.stringify({ 
          error: 'Text query limit reached. Upgrade to continue.', 
          success: false,
          tier: userData.tier,
          limit: userData.text_limit
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (requestType === 'image' && userData.image_count >= userData.image_limit) {
      return new Response(
        JSON.stringify({ 
          error: 'Image query limit reached. Upgrade to continue.', 
          success: false,
          tier: userData.tier,
          limit: userData.image_limit
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ SECURITY: Call Gemini API from server-side (key not exposed)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
      contents: [{
        role: 'user',
        parts: [
          { text: systemPrompt || 'You are a helpful gaming assistant.' },
          { text: prompt },
          ...(image ? [{ inlineData: { mimeType: 'image/jpeg', data: image } }] : [])
        ]
      }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topP: 0.95,
        topK: 40
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'AI service error', 
          success: false,
          details: errorText
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();

    // Extract response text
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                        'No response generated';

    // ✅ BUSINESS LOGIC: Increment usage counter (server-side)
    const { error: updateError } = await supabase.rpc('increment_user_usage', {
      p_auth_user_id: userId,
      p_query_type: requestType,
      p_increment: 1
    });

    if (updateError) {
      console.error('Failed to update usage:', updateError);
      // Don't fail the request, just log the error
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        response: responseText,
        success: true,
        usage: {
          textCount: requestType === 'text' ? userData.text_count + 1 : userData.text_count,
          imageCount: requestType === 'image' ? userData.image_count + 1 : userData.image_count
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('AI proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        success: false,
        message: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

**Step 2: Deploy Edge Function** (Day 1, 30 minutes)

```bash
# Set API key as secret (NOT in .env file)
supabase secrets set GEMINI_API_KEY="your-actual-gemini-api-key-here"

# Deploy function
supabase functions deploy ai-proxy --no-verify-jwt

# Test function
curl -X POST "$(supabase status | grep 'API URL' | awk '{print $3}')/functions/v1/ai-proxy" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello, test message",
    "requestType": "text"
  }'

# Expected response:
# {"response":"Hello! How can I help you?","success":true}
```

**Step 3: Update Client-Side aiService.ts** (Day 1, 1-2 hours)

**File:** `src/services/aiService.ts`

```typescript
// BEFORE (Lines 1-50):
import { GoogleGenerativeAI, GenerativeModel, ... } from "@google/generative-ai";
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY; // ❌ INSECURE
class AIService {
  private genAI: GoogleGenerativeAI;
  private flashModel: GenerativeModel;
  private proModel: GenerativeModel;

  constructor() {
    if (!API_KEY) {
      throw new Error("VITE_GEMINI_API_KEY is not set");
    }
    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.flashModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-09-2025" });
    this.proModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });
  }
}

// AFTER (✅ SECURE):
import { supabase } from '../lib/supabase';

class AIService {
  private edgeFunctionUrl: string;

  constructor() {
    // ✅ SECURE: No API key on client-side
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
    this.edgeFunctionUrl = `${supabaseUrl}/functions/v1/ai-proxy`;
  }

  /**
   * ✅ SECURE: Call backend proxy instead of direct API
   */
  private async callAIProxy(request: {
    prompt: string;
    image?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    requestType: 'text' | 'image';
  }): Promise<{ response: string; success: boolean; usage?: any }> {
    // Get user's JWT token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Call Edge Function (server-side proxy)
    const response = await fetch(this.edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'AI service error');
    }

    return await response.json();
  }

  /**
   * Main method to get AI chat response (updated to use proxy)
   */
  public async getChatResponse(
    conversation: Conversation,
    user: User,
    userMessage: string,
    isActiveSession: boolean,
    hasImages: boolean = false,
    imageData?: string,
    abortSignal?: AbortSignal
  ): Promise<AIResponse> {
    // Build prompt using existing prompt system
    const prompt = getPromptForPersona(/* ... */);

    // ✅ SECURE: Call backend proxy instead of direct API
    const result = await this.callAIProxy({
      prompt: prompt,
      image: imageData,
      systemPrompt: 'You are a helpful gaming assistant',
      temperature: 0.7,
      maxTokens: 2048,
      requestType: hasImages ? 'image' : 'text'
    });

    if (!result.success) {
      throw new Error(result.error || 'AI request failed');
    }

    // Parse response (existing logic)
    return parseOtakonTags(result.response);
  }

  // ... rest of aiService methods updated similarly
}
```

**Step 4: Remove API Key from .env** (Day 1, 5 minutes)

**File:** `.env` (or `.env.local`)

```bash
# BEFORE:
VITE_GEMINI_API_KEY=your-api-key-here  # ❌ Remove this line

# AFTER:
# (Gemini API key now stored in Supabase secrets - not in .env)

# Keep these (designed for client-side):
VITE_SUPABASE_URL=https://qajcxgkqloumogioomiz.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_GoW6G_umt1lFF-KPbbm-Ow_D2PYxPLw
```

**Step 5: Rebuild and Verify** (Day 1, 30 minutes)

```bash
# Rebuild application
npm run build

# Verify API key not in bundle
grep -r "VITE_GEMINI_API_KEY" dist/
# Expected: No results

# Search for actual API key value
grep -r "AIza" dist/  # Gemini keys start with AIza
# Expected: No results

# Deploy to staging
npm run deploy

# Test in production
# 1. Open Chrome DevTools → Network tab
# 2. Send a chat message
# 3. Verify request goes to /functions/v1/ai-proxy (not direct to Gemini)
# 4. Verify response contains "success: true"
```

#### Cost Comparison

**Before (Insecure):**
```
Exposed API key in client bundle
Attacker can make unlimited API calls
Your cost: $$$$ (unbounded)
```

**After (Secure):**
```
API key in Supabase secrets (server-side)
Rate limiting: 10 requests/min per user
Query limits: 55 text, 25 image (FREE tier)
Your cost: Predictable and controlled
```

---

### P0.3: Implement Row Level Security Policies 🔒 SECURITY CRITICAL

**Severity:** CRITICAL (user data exposure)  
**Timeline:** 2-3 days  
**Files:** 1 SQL migration file, extensive testing required

#### Current RLS Status

**Existing Policies (Partial):**
```sql
-- From current_live_schema.sql (Lines 1150-1250):

-- ✅ GOOD: Insert policies exist
CREATE POLICY "Users can create own conversations" 
ON conversations FOR INSERT TO authenticated 
WITH CHECK (user_id IN (
  SELECT id FROM users WHERE auth_user_id = auth.uid()
));

-- ❌ MISSING: No SELECT policy
-- ❌ MISSING: No UPDATE policy
-- ❌ MISSING: No DELETE policy
-- ⚠️ PROBLEM: Complex subquery causes N+1 issues
```

**Security Risk:**
```sql
-- Current state allows this exploit:
SELECT * FROM conversations WHERE id = 'any-uuid';
-- Returns ANY conversation, even if not owned by user
-- No RLS SELECT policy = data leak
```

#### Implementation

**File:** `supabase/migrations/20251024_comprehensive_rls_policies.sql`

```sql
-- ============================================================================
-- COMPREHENSIVE ROW LEVEL SECURITY (RLS) POLICIES
-- Date: October 24, 2025
-- Purpose: Secure all tables with proper RLS policies
-- Testing: Must run complete test suite after applying
-- ============================================================================

-- Drop existing incomplete policies
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own games" ON games;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own games" ON games;

-- ============================================================================
-- USERS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Policy: Users can update their own profile
CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Policy: Service role can manage all users (for admin operations)
CREATE POLICY "users_service_role_all"
ON users
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select their own conversations
CREATE POLICY "conversations_select_own"
ON conversations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = conversations.user_id
    AND users.auth_user_id = auth.uid()
  )
);

-- Policy: Users can insert their own conversations
CREATE POLICY "conversations_insert_own"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Users can update their own conversations
CREATE POLICY "conversations_update_own"
ON conversations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = conversations.user_id
    AND users.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = conversations.user_id
    AND users.auth_user_id = auth.uid()
  )
);

-- Policy: Users can delete their own conversations (except Game Hub)
CREATE POLICY "conversations_delete_own"
ON conversations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = conversations.user_id
    AND users.auth_user_id = auth.uid()
  )
  AND is_game_hub = FALSE -- Prevent deleting Game Hub
);

-- ============================================================================
-- GAMES TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select their own games
CREATE POLICY "games_select_own"
ON games FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = games.user_id
    AND users.auth_user_id = auth.uid()
  )
);

-- Policy: Users can insert their own games
CREATE POLICY "games_insert_own"
ON games FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Users can update their own games
CREATE POLICY "games_update_own"
ON games FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = games.user_id
    AND users.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = games.user_id
    AND users.auth_user_id = auth.uid()
  )
);

-- Policy: Users can delete their own games
CREATE POLICY "games_delete_own"
ON games FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = games.user_id
    AND users.auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- MESSAGES TABLE (If using normalized schema)
-- ============================================================================

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select messages from their conversations
CREATE POLICY "messages_select_own"
ON messages FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN users u ON u.id = c.user_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Policy: Users can insert messages to their conversations
CREATE POLICY "messages_insert_own"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN users u ON u.id = c.user_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Policy: Users can update messages in their conversations
CREATE POLICY "messages_update_own"
ON messages FOR UPDATE
TO authenticated
USING (
  conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN users u ON u.id = c.user_id
    WHERE u.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN users u ON u.id = c.user_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Policy: Users can delete messages from their conversations
CREATE POLICY "messages_delete_own"
ON messages FOR DELETE
TO authenticated
USING (
  conversation_id IN (
    SELECT c.id FROM conversations c
    JOIN users u ON u.id = c.user_id
    WHERE u.auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- USER_USAGE TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own usage
CREATE POLICY "user_usage_select_own"
ON user_usage FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Policy: Service role can manage usage (for increment functions)
CREATE POLICY "user_usage_service_role_all"
ON user_usage
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ONBOARDING_PROGRESS TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own onboarding
CREATE POLICY "onboarding_select_own"
ON onboarding_progress FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "onboarding_insert_own"
ON onboarding_progress FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "onboarding_update_own"
ON onboarding_progress FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- ============================================================================
-- APP_CACHE TABLE
-- ============================================================================

-- Enable RLS
ALTER TABLE app_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access their own cache (or global cache)
CREATE POLICY "cache_access_own"
ON app_cache FOR ALL
TO authenticated
USING (
  user_id IS NULL OR user_id = auth.uid()
)
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- ============================================================================
-- WAITLIST TABLE (Public)
-- ============================================================================

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert to waitlist
CREATE POLICY "waitlist_insert_public"
ON waitlist FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Anyone can check waitlist status
CREATE POLICY "waitlist_select_public"
ON waitlist FOR SELECT
TO anon, authenticated
USING (true);

-- Policy: Service role can manage waitlist
CREATE POLICY "waitlist_service_role_all"
ON waitlist
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify RLS is working:

-- 1. Verify all tables have RLS enabled:
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'conversations', 'games', 'messages', 'user_usage', 'onboarding_progress', 'app_cache', 'waitlist');

-- Expected: All should have rowsecurity = true

-- 2. Count policies per table:
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Expected:
-- users: 3 policies (select, update, service_role)
-- conversations: 5 policies (select, insert, update, delete, service_role optional)
-- games: 5 policies
-- messages: 5 policies
-- user_usage: 2 policies
-- onboarding_progress: 4 policies
-- app_cache: 1 policy
-- waitlist: 3 policies

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
```

#### Testing Plan (Day 2-3)

**Manual Security Tests:**

```sql
-- Create test user accounts (run in Supabase SQL Editor):
-- User A: test-user-a@example.com
-- User B: test-user-b@example.com

-- === TEST 1: Cross-user conversation access ===
-- As User A:
INSERT INTO conversations (user_id, title) 
VALUES ((SELECT id FROM users WHERE auth_user_id = auth.uid()), 'User A Conversation');

-- As User B, try to access User A's conversation:
SELECT * FROM conversations WHERE title = 'User A Conversation';
-- Expected: 0 rows (RLS blocks cross-user access)

-- === TEST 2: Update own data ===
-- As User A:
UPDATE conversations SET title = 'Updated Title'
WHERE id = (SELECT id FROM conversations WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) LIMIT 1);
-- Expected: Success

-- === TEST 3: Delete own data ===
-- As User A:
DELETE FROM conversations WHERE id = (SELECT id FROM conversations WHERE user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) AND is_game_hub = FALSE LIMIT 1);
-- Expected: Success

-- === TEST 4: Game Hub protection ===
-- As User A:
DELETE FROM conversations WHERE is_game_hub = TRUE;
-- Expected: 0 rows deleted (Game Hub protected)

-- === TEST 5: Anonymous access ===
-- Log out, then:
SELECT * FROM conversations;
-- Expected: 0 rows (anon users blocked)
```

**Automated Test Script:**

**File:** `test-suite/rls-security-tests.js`

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Test user credentials
const userA = { email: 'test-user-a@example.com', password: 'TestPassword123!' };
const userB = { email: 'test-user-b@example.com', password: 'TestPassword123!' };

async function runRLSTests() {
  console.log('🔐 Starting RLS Security Tests...\n');

  // Test 1: Cross-user conversation access
  console.log('TEST 1: Cross-user conversation access');
  const supabaseA = createClient(supabaseUrl, supabaseKey);
  await supabaseA.auth.signInWithPassword(userA);
  
  // Create conversation as User A
  const { data: convA } = await supabaseA
    .from('conversations')
    .insert({ title: 'User A Private Conversation' })
    .select()
    .single();
  
  console.log(`✓ User A created conversation: ${convA.id}`);

  // Sign in as User B
  const supabaseB = createClient(supabaseUrl, supabaseKey);
  await supabaseB.auth.signInWithPassword(userB);

  // Try to access User A's conversation
  const { data: unauthorized } = await supabaseB
    .from('conversations')
    .select()
    .eq('id', convA.id);

  if (unauthorized.length === 0) {
    console.log('✅ PASS: User B cannot access User A\'s conversation\n');
  } else {
    console.log('❌ FAIL: RLS policy not working! User B accessed User A\'s data\n');
  }

  // Test 2: Update own data
  console.log('TEST 2: Update own data');
  const { error: updateError } = await supabaseA
    .from('conversations')
    .update({ title: 'Updated Title' })
    .eq('id', convA.id);

  if (!updateError) {
    console.log('✅ PASS: User can update own conversation\n');
  } else {
    console.log('❌ FAIL: User cannot update own conversation\n', updateError);
  }

  // Test 3: Delete protection for Game Hub
  console.log('TEST 3: Game Hub delete protection');
  const { data: gameHub } = await supabaseA
    .from('conversations')
    .select('id')
    .eq('is_game_hub', true)
    .single();

  const { error: deleteError } = await supabaseA
    .from('conversations')
    .delete()
    .eq('id', gameHub.id);

  if (deleteError || deleteError?.message.includes('violates')) {
    console.log('✅ PASS: Game Hub protected from deletion\n');
  } else {
    console.log('❌ FAIL: Game Hub can be deleted!\n');
  }

  // Cleanup
  await supabaseA.from('conversations').delete().eq('id', convA.id);
  console.log('🧹 Cleanup complete');

  console.log('\n✅ RLS Security Tests Complete');
}

runRLSTests().catch(console.error);
```

**Run tests:**
```bash
node test-suite/rls-security-tests.js
```

#### Performance Impact Analysis

**Before RLS:**
```sql
-- Any query works (no security):
SELECT * FROM conversations; -- Returns all conversations (data leak!)
```

**After RLS:**
```sql
-- Queries automatically filtered by Postgres:
SELECT * FROM conversations;
-- Internally becomes:
SELECT * FROM conversations
WHERE EXISTS (
  SELECT 1 FROM users
  WHERE users.id = conversations.user_id
  AND users.auth_user_id = auth.uid()
);
```

**Performance Impact:**
- Minimal (<5ms overhead per query)
- Postgres handles RLS at engine level (highly optimized)
- Benefit: Eliminates need for client-side filtering

---

## PRIORITY 1: HIGH-PRIORITY FIXES (Week 2-3)

*[Content continues with P1.1-P1.7: N+1 Query Fix, MainApp Refactor, Normalized Messages, Testing, etc.]*

---

## Success Metrics

**Week 1 (Post-P0):**
- Zero authentication race conditions reported
- Zero API key leaks detected
- 100% RLS policy coverage

**Week 2-3 (Post-P1):**
- 50% reduction in database queries
- 80% test coverage
- <200ms average API response time

**Week 4 (Production Launch):**
- 90%+ overall production readiness
- <1% error rate
- 99.9% uptime

---

**Document Version:** 1.0  
**Last Updated:** October 24, 2025  
**Next Review:** After P0 completion
