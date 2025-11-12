# 🤖 GEMINI INTEGRATION - COMPLETE ANALYSIS

## Table of Contents
1. [App Environment & Tech Stack](#app-environment--tech-stack)
2. [App Capabilities & Limitations](#app-capabilities--limitations)
3. [Models Used](#models-used)
4. [API Integration Architecture](#api-integration-architecture)
5. [Prompt System](#prompt-system)
6. [Context Injection](#context-injection)
7. [AI Response Flow](#ai-response-flow)
8. [Tab Generation](#tab-generation)
9. [SubTabs Generation](#subtabs-generation)
10. [Suggested Prompts](#suggested-prompts)
11. [Safety & Security](#safety--security)
12. [Performance Optimization](#performance-optimization)

---

## 1. App Environment & Tech Stack

### Frontend Architecture

```typescript
Framework: React 18+ with TypeScript
Build Tool: Vite 5+
Styling: Tailwind CSS 3+ with custom theme
State Management: React Context + Local State
Routing: React Router v6
UI Components: Custom component library with Radix UI primitives
```

### Backend & Services

```typescript
Database: Supabase (PostgreSQL)
Authentication: Supabase Auth (email/password, OAuth providers)
Real-time: Supabase Realtime subscriptions
Storage: Supabase Storage (for screenshots/images)
Edge Functions: Supabase Edge Functions (Deno runtime)
AI API: Google Gemini via Edge Function proxy
```

### Key Dependencies

```json
{
  "react": "^18.x",
  "typescript": "^5.x",
  "vite": "^5.x",
  "tailwindcss": "^3.x",
  "@supabase/supabase-js": "^2.x",
  "@google/generative-ai": "^0.x",
  "react-router-dom": "^6.x",
  "@radix-ui/react-*": "^1.x"
}
```

### Development Environment

```powershell
# Development Server
npm run dev              # Vite dev server on http://localhost:5173

# Build & Preview
npm run build           # TypeScript + Vite production build
npm run preview         # Preview production build locally

# Code Quality
npm run lint            # ESLint checks
npm run type-check      # TypeScript type checking
```

### Deployment Environment

```yaml
Platform: Vercel / Netlify (static hosting)
CDN: Cloudflare / Vercel Edge Network
Environment Variables:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
  - VITE_GEMINI_API_KEY (dev only, not used in production)
  
Supabase Edge Functions:
  - ai-proxy: Handles all Gemini API calls
  - Deployed to: global edge locations
```

### Browser Support

```
✅ Chrome/Edge 100+
✅ Firefox 100+
✅ Safari 15+
✅ Mobile Safari (iOS 15+)
✅ Chrome Mobile (Android 10+)
```

### Device Support

```typescript
// Responsive breakpoints
const breakpoints = {
  sm: '640px',   // Mobile landscape, small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Large desktops
};

// Primary targets:
- 📱 Mobile: 375px - 768px (portrait & landscape)
- 💻 Desktop: 1024px+ (primary gaming setup)
- 🎮 Tablet: 768px - 1024px (secondary device)
```

---

## 2. App Capabilities & Limitations

### ✅ What the App CAN Do

#### 1. Game Identification & Tab Management
```typescript
✅ Identify games from text queries
✅ Identify games from screenshots (menu or gameplay)
✅ Create dedicated game tabs automatically
✅ Manage multiple game conversations simultaneously
✅ Migrate conversations between tabs
✅ Delete and reorganize game tabs
✅ Detect unreleased games (keeps in Game Hub)
```

#### 2. AI-Powered Assistance
```typescript
✅ Answer general gaming questions (Game Hub mode)
✅ Provide in-character game-specific help (Game Companion mode)
✅ Analyze screenshots with lore-rich context
✅ Generate contextual follow-up suggestions
✅ Adapt responses based on player skill level
✅ Respect spoiler preferences (none/minimal/moderate/all)
✅ Access real-time web search for current gaming news
✅ Handle multi-turn conversations with context memory
```

#### 3. Dynamic Content Generation
```typescript
✅ Generate game-specific subtabs (Lore, Tips, Characters, etc.)
✅ Update subtabs progressively as conversation evolves
✅ Extract structured data from AI responses (OTAKON tags)
✅ Create suggested prompts based on current context
✅ Build player profiles from interaction patterns
✅ Summarize long conversation histories automatically
```

#### 4. Session & Progress Tracking
```typescript
✅ Track Planning vs Playing mode per game
✅ Monitor game progress percentage (0-100%)
✅ Set and update active objectives
✅ Record triumphs and achievements
✅ Maintain conversation history per game
✅ Sync state across devices via Supabase
```

#### 5. Image Processing
```typescript
✅ Accept screenshots (PNG, JPG, WEBP)
✅ Support base64 image upload
✅ Analyze fullscreen gameplay vs menus
✅ Extract game titles from visual elements
✅ Identify in-game locations and characters
✅ Process multiple images per conversation
```

#### 6. User Personalization
```typescript
✅ Store player profile (experience, playstyle, goals)
✅ Remember preferred genres
✅ Adapt AI tone based on session mode
✅ Customize spoiler tolerance
✅ Track usage limits per user
✅ Persist preferences across sessions
```

### ❌ What the App CANNOT Do

#### 1. Input Limitations
```typescript
❌ Cannot process video files (only static images)
❌ Cannot handle audio input or voice commands
❌ Cannot accept files other than images (no PDFs, docs, etc.)
❌ Cannot process images larger than 20MB
❌ Cannot analyze extremely low-resolution images (<200x200px)
❌ Cannot read text from heavily compressed/pixelated images
```

#### 2. Output Limitations
```typescript
❌ Cannot generate images or visual content
❌ Cannot produce audio or voice responses
❌ Cannot create downloadable files (guides, PDFs, etc.)
❌ Cannot stream responses in real-time (full response only)
❌ Cannot generate responses longer than 2048 tokens (~1500 words)
❌ Cannot modify or edit previously sent messages
```

#### 3. Functional Limitations
```typescript
❌ Cannot directly interact with games (no game controller integration)
❌ Cannot launch or control games on user's device
❌ Cannot automatically detect which game is running
❌ Cannot capture screenshots from user's system
❌ Cannot access user's local game save files
❌ Cannot provide real-time overlays on game windows
❌ Cannot track game statistics from external sources
```

#### 4. Database & API Constraints
```typescript
// Supabase Usage Limits (Free Tier)
❌ Max 500MB database storage
❌ Max 1GB file storage
❌ Max 2GB bandwidth per month
❌ Max 50,000 monthly active users
❌ Max 500 simultaneous Realtime connections

// Gemini API Limits
❌ Rate limit: 15 requests per minute (RPM)
❌ Token limit: 1,000,000 tokens per minute (TPM)
❌ Context window: 1,048,576 tokens (input)
❌ Output limit: 8,192 tokens per response
❌ Image limit: 16 images per request
```

#### 5. Content Restrictions
```typescript
❌ Cannot provide exact solutions to puzzles (spoiler-heavy)
❌ Cannot assist with game hacking or cheating
❌ Cannot provide pirated game information
❌ Cannot generate content violating safety filters
❌ Cannot discuss unreleased games in dedicated tabs
❌ Cannot provide medical/legal/financial advice (gaming-related only)
```

#### 6. Performance Boundaries
```typescript
// Response Time Expectations
⏱️ Text query: 2-5 seconds (average)
⏱️ Image query: 5-10 seconds (average)
⏱️ Web search query: 10-15 seconds (average)

// Context Limits
❌ Max 10 recent messages kept in full context
❌ Older messages auto-summarized to save tokens
❌ Max 50 messages per conversation before summarization required
❌ Max 10 subtabs per game tab
❌ Max 3 suggested prompts per response
```

### 🔄 Accepted Input Formats

#### Text Input
```typescript
✅ Plain text messages (1-2000 characters recommended)
✅ Questions, statements, commands
✅ Special commands: @delete, @modify, @help
✅ Emoji and Unicode characters
✅ Code snippets (for game mechanics discussion)
✅ Multiple languages (English primary, others supported)
```

#### Image Input
```typescript
✅ Formats: PNG, JPG, JPEG, WEBP, GIF (first frame)
✅ Max size: 20MB per image
✅ Max resolution: 4096x4096 pixels
✅ Min resolution: 200x200 pixels (recommended)
✅ Color: RGB, RGBA, Grayscale
✅ Compression: Any level (quality affects analysis)
```

#### Special Commands
```typescript
✅ @delete [subtab_name] - Delete a subtab
✅ @modify [subtab_name] - Request subtab modification
✅ @help - Show available commands
✅ @clear - Clear current conversation
✅ @export - Export conversation (planned)
```

### 📤 Expected Output Formats

#### AI Response Structure
```typescript
{
  content: string;              // Cleaned display text
  rawContent: string;           // Original with tags
  otakonTags: Map<string, any>; // Extracted structured data
  gamePillData?: {              // Game identification
    title: string;
    genre: string;
    wikiContent?: object;       // SubTabs content
  };
  followUpPrompts?: string[];   // Suggested next prompts
  progressiveInsightUpdates?: { // SubTab updates
    tabId: string;
    content: string;
  }[];
  metadata: {
    modelUsed: string;
    tokensUsed?: number;
    fromCache: boolean;
    processingTime: number;
  };
}
```

#### Message Display Format
```typescript
// Game Hub Response
Hint: [Game Name] - [Brief actionable hint]

[Detailed explanation with context and lore]

// Game Tab Response (Immersive)
[In-character response matching game tone]

[Strategic advice based on current progress]

// Screenshot Analysis Response
Hint: [Game Name] - [What you're looking at]

Lore: [Story significance and world-building context]

Places of Interest: [Nearby locations, NPCs, items, quests]
```

#### UI Output Components
```typescript
✅ Chat messages (user + AI)
✅ Suggested prompts (1-3 contextual follow-ups)
✅ SubTabs accordion (Lore, Tips, Characters, etc.)
✅ Progress bar (0-100% game completion)
✅ Active objective banner
✅ Session mode toggle (Planning/Playing)
✅ Toast notifications (success, error, info)
```

### 🎮 Optimal Use Cases

#### ✨ What the App Does BEST
1. **Real-time Game Help**: Answer "How do I beat this boss?" while playing
2. **Lore Exploration**: Explain story significance and world-building
3. **Strategic Planning**: Provide build recommendations and progression paths
4. **Screenshot Context**: Identify locations, NPCs, and quest objectives from images
5. **Multi-Game Management**: Track progress across multiple games simultaneously
6. **Contextual Suggestions**: Generate relevant follow-up prompts automatically
7. **Gaming News**: Fetch current release dates, patches, DLC announcements

#### ⚠️ What to Avoid
1. **Real-time Overlays**: App cannot display on top of games
2. **Automatic Detection**: Cannot detect which game you're currently playing
3. **Direct Game Control**: Cannot automate inputs or control your game
4. **Save File Editing**: Cannot modify or read local save files
5. **Competitive Advantage**: Cannot provide real-time multiplayer assistance
6. **Piracy/Cheats**: Cannot assist with game cracks or cheat engines

---

## 3. Models Used

### Primary Models
```typescript
// Using gemini-2.5-flash-preview-09-2025 for ALL operations (September 2025)
const MODELS = {
  flash: "gemini-2.5-flash-preview-09-2025",           // All operations
  pro: "gemini-2.5-flash-preview-09-2025",             // All operations
  flashWithGrounding: "gemini-2.5-flash-preview-09-2025" // With Google Search
};
```

### Model Selection Logic

#### **gemini-2.5-flash-preview-09-2025** is Used for ALL Operations:
- General text conversations
- Game companion mode responses
- Screenshot analysis
- All chat interactions
- Enhanced performance and accuracy

#### When **Google Search Grounding** is Added:
```typescript
const needsWebSearch = 
  userMessage.includes('release') ||
  userMessage.includes('new games') ||
  userMessage.includes('coming out') ||
  userMessage.includes('this week') ||
  userMessage.includes('this month') ||
  userMessage.includes('latest') ||
  userMessage.includes('news') ||
  userMessage.includes('announced') ||
  userMessage.includes('update') ||
  userMessage.includes('patch') ||
  userMessage.includes('current') ||
  userMessage.includes('recent') ||
  (gameTitle.includes('2025') || gameTitle.includes('2024'));
```

**Purpose**: Provides real-time web search results for:
- Game release dates
- Patch notes and updates
- DLC announcements
- Current gaming news
- Recent game information (post-January 2025)

---

## 2. API Integration Architecture

### Security-First Design

```typescript
const USE_EDGE_FUNCTION = true; // ALWAYS true in production
```

#### Edge Function Proxy (Production)
```typescript
// Secure server-side proxy via Supabase Edge Functions
const edgeFunctionUrl = `${supabaseUrl}/functions/v1/ai-proxy`;

await fetch(edgeFunctionUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: string,
    image?: string (base64),
    systemPrompt?: string,
    temperature: 0.7,
    maxTokens: 2048,
    requestType: 'text' | 'image',
    model: string,
    tools?: [{ googleSearchRetrieval: {} }]
  })
});
```

**Benefits**:
- ✅ API keys never exposed to client
- ✅ Server-side rate limiting
- ✅ Usage tracking per user
- ✅ Centralized security control

#### Direct API (Development Only)
```typescript
// Legacy mode for local development
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash-preview-09-2025",
  safetySettings: SAFETY_SETTINGS
});
```

### Safety Settings
```typescript
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];
```

---

## 3. Prompt System

### Three Persona Modes

The system uses different prompts based on context:

#### 1. General Assistant (Game Hub)
**When**: User is in Game Hub, no specific game context
**Purpose**: Answer general gaming questions, identify games, provide recommendations

```typescript
const getGeneralAssistantPrompt = (userMessage: string) => `
**Persona: General Gaming Assistant**
You are Otagon, a helpful and knowledgeable AI gaming assistant.

**CRITICAL: Use Real Information**
- Today's date is ${new Date().toLocaleDateString()}
- You have access to Google Search grounding for current information
- ALWAYS cite specific game titles, release dates, and accurate details
- NEVER use placeholders like "[Hypothetical Game A]"
- Your knowledge cutoff is January 2025 - use web search for anything after

**Task:**
1. Answer: "${userMessage}"
2. If query is about a SPECIFIC RELEASED GAME, include:
   - [OTAKON_GAME_ID: Full Game Name]
   - [OTAKON_CONFIDENCE: high|low]
   - [OTAKON_GENRE: Genre]
   - [OTAKON_GAME_STATUS: unreleased] (only if not yet released)
3. Provide three relevant suggested prompts

**Response Style:**
- Helpful and knowledgeable about gaming
- Concise but informative
- Use gaming terminology appropriately
- For game-specific queries, start with "Hint:"
`;
```

#### 2. Game Companion (Game-Specific Tabs)
**When**: User is in a dedicated game tab
**Purpose**: Provide immersive, in-character assistance for that specific game

```typescript
const getGameCompanionPrompt = (
  conversation, userMessage, user, isActiveSession, playerProfile
) => `
**Persona: Game Companion**
You are Otagon, an immersive AI companion for "${conversation.gameTitle}".

**Game Context:**
- Game: ${conversation.gameTitle} (${conversation.genre})
- Current Objective: ${conversation.activeObjective || 'Not set'}
- Game Progress: ${conversation.gameProgress || 0}%
- Session Mode: ${isActiveSession ? 'ACTIVE (currently playing)' : 'PLANNING (not playing)'}

**Player Profile:**
${profileContext} // Experience level, playstyle, preferences

**Current Subtabs (Your Knowledge Base):**
${subtabContext} // All loaded subtab content

**Recent Conversation History:**
${recentMessages} // Last 10 messages

**Task:**
1. Respond in an immersive, in-character way matching the game's tone
2. Use the subtab context to provide informed, consistent answers
3. Adapt your response style based on the Player Profile
4. If query provides new information, update relevant subtabs
5. If query implies progress, identify new objectives
6. ${isActiveSession ? 
   'Provide concise, actionable advice for immediate use' : 
   'Provide detailed, strategic advice for planning'}
7. Generate three contextual suggested prompts

**Response Style:**
- Match the tone and atmosphere of ${conversation.gameTitle}
- Be spoiler-free beyond current progress
- Provide practical, actionable advice
- Use game-specific terminology and references
- Start with "Hint:" for game-specific queries
- Include lore and story context appropriate to player's progress
`;
```

#### 3. Screenshot Analyst
**When**: User uploads a screenshot
**Purpose**: Identify game, analyze visual context, provide lore-rich explanations

```typescript
const getScreenshotAnalysisPrompt = (conversation, userMessage, playerProfile) => `
**Persona: Game Lore Expert & Screenshot Analyst**
You are Otagon, an expert at analyzing game visuals and providing immersive assistance.

**Player Profile:**
${profileContext}

**Task:**
1. Analyze the screenshot to identify the game
2. **CRITICAL TAG REQUIREMENTS - Include ALL of these tags:**
   - [OTAKON_GAME_ID: Full Game Name]
   - [OTAKON_CONFIDENCE: high|low]
   - [OTAKON_GENRE: Genre]
   - [OTAKON_IS_FULLSCREEN: true|false]
   - [OTAKON_GAME_STATUS: unreleased] (only if not yet released)
3. Answer: "${userMessage}" with focus on game lore, significance, and context
4. Provide 3 contextual suggestions

**MANDATORY FORMAT:**
Hint: [Game Name] - [Brief, actionable hint]

Lore: [Rich lore explanation about the situation, characters, story significance]

Places of Interest: [Nearby locations, NPCs, useful items, quests]

**What to focus on:**
- Story significance and lore implications
- Character relationships and motivations
- Location importance and world-building
- Gameplay mechanics and strategic advice
- Narrative context and plot relevance

**What to avoid:**
- Describing obvious UI elements
- Stating the obvious
- Generic descriptions that don't add value
`;
```

### OTAKON Tags System

All prompts include these tag definitions:

```typescript
const OTAKON_TAG_DEFINITIONS = `
You MUST use the following tags to structure your response:

- [OTAKON_GAME_ID: Game Name]: Full, official name of identified game
- [OTAKON_CONFIDENCE: high|low]: Confidence in game identification
- [OTAKON_GENRE: Genre]: Primary genre
- [OTAKON_GAME_STATUS: unreleased]: ONLY if game is NOT YET RELEASED
- [OTAKON_IS_FULLSCREEN: true|false]: Whether screenshot shows fullscreen gameplay
- [OTAKON_TRIUMPH: {"type": "boss_defeated", "name": "Boss Name"}]: Victory screens
- [OTAKON_OBJECTIVE_SET: {"description": "New objective"}]: New player objectives
- [OTAKON_INSIGHT_UPDATE: {"id": "sub_tab_id", "content": "content"}]: Update subtab
- [OTAKON_INSIGHT_MODIFY_PENDING: {...}]: Modify subtab via @command
- [OTAKON_INSIGHT_DELETE_REQUEST: {...}]: Delete subtab via @command
- [OTAKON_SUGGESTIONS: ["suggestion1", "suggestion2", "suggestion3"]]: Follow-up prompts
`;
```

---

## 4. Context Injection

### Layered Context System

The AI receives multiple layers of context in every request:

#### Layer 1: Player Profile Context
```typescript
const profileContext = `
**Player Profile:**
- Experience Level: ${profile.experienceLevel} // Beginner/Intermediate/Advanced/Veteran
- Playstyle: ${profile.playstyle} // Casual/Balanced/Hardcore
- Spoiler Preference: ${user.preferences?.spoilerPreference} // none/minimal/moderate/all
- Preferred Game Genres: ${profile.preferredGenres.join(', ')}
- Gaming Goals: ${profile.gamingGoals.join(', ')}
`;
```

#### Layer 2: Game Context (for Game Tabs)
```typescript
**Game Context:**
- Game: ${conversation.gameTitle} (${conversation.genre})
- Current Objective: ${conversation.activeObjective || 'Not set'}
- Game Progress: ${conversation.gameProgress || 0}%
- Session Mode: ${isActiveSession ? 'ACTIVE' : 'PLANNING'}
```

#### Layer 3: Subtabs Context (Knowledge Base)
```typescript
**Current Subtabs (Your Knowledge Base):**
### Story So Far (ID: story_so_far)
[Full content of story_so_far subtab]

### Characters (ID: characters)
[Full content of characters subtab]

### Tips & Tricks (ID: tips)
[Full content of tips subtab]
...
```

#### Layer 4: Conversation History
```typescript
**Recent Conversation History:**
User: How do I beat the first boss?
Otagon: Hint: For the Asylum Demon in Dark Souls...
User: What about the weapons?
Otagon: Here are the best early weapons...
[Last 10 messages]
```

#### Layer 5: Historical Context (if available)
```typescript
**Historical Context (Previous Sessions):**
${conversation.contextSummary}
// Summary of previous conversations (created by contextSummarizationService)
```

#### Layer 6: Immersion Context (for Game Tabs)
```typescript
// Generated by characterImmersionService
**Immersion Context:**
As a companion for ${gameTitle}, you embody the spirit and atmosphere of ${genre} games.
Your responses should feel like they belong in this game world...
```

### Context Summarization

When conversations get long (>10 messages), the system automatically summarizes older context:

```typescript
if (conversation.messages.length > 10) {
  const summarizedConversation = 
    await contextSummarizationService.applyContextSummarization(conversation);
  
  // Old messages are summarized into contextSummary field
  // Recent 10 messages are kept intact
}
```

---

## 5. AI Response Flow

### Complete Request-Response Cycle

```
┌─────────────────────────────────────────────────────────────┐
│  1. USER SENDS MESSAGE                                       │
│     - Text message or screenshot                            │
│     - Current conversation context                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  2. CONTEXT GATHERING                                        │
│     ├─ Check if image or text query                         │
│     ├─ Load player profile                                  │
│     ├─ Gather subtab context                                │
│     ├─ Get recent conversation history                      │
│     └─ Build immersion context (for game tabs)              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  3. PROMPT CONSTRUCTION                                      │
│     ├─ Select persona (General/Game/Screenshot)             │
│     ├─ Inject all context layers                            │
│     ├─ Add OTAKON tag definitions                           │
│     └─ Add structured response instructions                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  4. MODEL SELECTION                                          │
│     ├─ Check if web search needed                           │
│     │   └─ Keywords: release, news, update, patch, etc.     │
│     ├─ Use gemini-2.5-flash-preview-09-2025                 │
│     ├─ Add Google Search tools if needed                    │
│     └─ Set temperature (0.7) and maxTokens (2048)           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  5. API CALL                                                 │
│     ├─ Use Edge Function proxy (production)                 │
│     │   └─ POST to ${supabaseUrl}/functions/v1/ai-proxy    │
│     ├─ Include auth token                                   │
│     ├─ Send prompt + image (if any)                         │
│     └─ Apply safety settings                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  6. RESPONSE PROCESSING                                      │
│     ├─ Receive raw AI response                              │
│     ├─ Parse OTAKON tags                                    │
│     │   ├─ Extract GAME_ID, CONFIDENCE, GENRE               │
│     │   ├─ Extract SUGGESTIONS                              │
│     │   ├─ Extract INSIGHT_UPDATE commands                  │
│     │   └─ Extract state update tags (PROGRESS, OBJECTIVE)  │
│     ├─ Clean content (remove tags from displayed text)      │
│     └─ Build AIResponse object                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  7. TAB MANAGEMENT                                           │
│     ├─ Check if GAME_ID tag present                         │
│     │   ├─ Yes: Create/switch to game tab                   │
│     │   └─ No: Stay in Game Hub                             │
│     ├─ Check if unreleased game                             │
│     │   └─ GAME_STATUS: unreleased → Stay in Game Hub       │
│     └─ Migrate messages if switching tabs                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  8. SUBTABS GENERATION/UPDATE                                │
│     ├─ For new game tabs: Generate initial subtabs          │
│     │   ├─ Extract from gamePillData.wikiContent            │
│     │   ├─ Or use progressiveInsightUpdates                 │
│     │   └─ Create SubTab objects with titles & content      │
│     ├─ For existing tabs: Update subtabs if needed          │
│     │   └─ Process INSIGHT_UPDATE tags                      │
│     └─ Mark subtabs as 'loaded' when content received       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  9. SUGGESTED PROMPTS                                        │
│     ├─ Extract from [OTAKON_SUGGESTIONS] tag                │
│     ├─ Or use followUpPrompts from structured response      │
│     ├─ Process through suggestedPromptsService              │
│     │   └─ Make context-appropriate and relevant            │
│     └─ Set in UI state for display                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  10. STATE UPDATES                                           │
│     ├─ Update game progress if PROGRESS tag present         │
│     ├─ Update active objective if OBJECTIVE tag present     │
│     ├─ Update conversation in local state                   │
│     ├─ Persist to Supabase (background)                     │
│     └─ Cache response for potential reuse                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  11. UI UPDATE                                               │
│     ├─ Display AI message in chat                           │
│     ├─ Show suggested prompts below message                 │
│     ├─ Update subtabs component (if applicable)             │
│     ├─ Update progress bar (if progress changed)            │
│     └─ Auto-expand subtabs if content loaded                │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Tab Generation

### Game Tab Creation Logic

```typescript
// In MainApp.tsx - handleSendMessage()

// 1. Check for GAME_ID tag in AI response
if (response.otakonTags.has('OTAKON_GAME_ID')) {
  const gameTitle = response.otakonTags.get('OTAKON_GAME_ID');
  const genre = response.otakonTags.get('OTAKON_GENRE');
  const isUnreleased = response.otakonTags.has('OTAKON_GAME_STATUS');
  
  // 2. Don't create tabs for unreleased games
  if (isUnreleased) {
    console.log('Game is unreleased - staying in Game Hub');
    return; // Stay in Game Hub
  }
  
  // 3. Check if tab already exists
  const existingTab = conversations[gameTitle];
  
  if (existingTab) {
    // Tab exists - switch to it
    switchToTab(existingTab.id);
  } else {
    // 4. Create new game tab
    const newGameTab = await gameTabService.getOrCreateGameTab({
      gameTitle,
      genre,
      isUnreleased: false,
      aiResponse: response, // For subtabs generation
      triggeredByImage: hasImages
    });
    
    // 5. Migrate current conversation's messages to new tab
    const updatedTab = await gameTabService.migrateMessagesToGameTab(
      activeConversation.id, // from Game Hub
      newGameTab.id,          // to new game tab
      [userMessage, aiMessage]
    );
    
    // 6. Switch to new tab
    switchToTab(updatedTab.id);
  }
}
```

### Tab Creation Rules

#### ✅ Create New Tab When:
- GAME_ID tag is present
- Game is released (no GAME_STATUS: unreleased tag)
- Screenshot shows ANY game screen (menu or gameplay)
- User explicitly asks about a specific released game

#### ❌ Stay in Game Hub When:
- No GAME_ID tag in response
- GAME_STATUS: unreleased tag is present
- General gaming questions (no specific game)
- Screenshot shows launcher, store page, non-game screens

---

## 7. SubTabs Generation

### Initial SubTabs Creation

When a new game tab is created, subtabs are generated from the AI response:

```typescript
// In gameTabService.ts

// Method 1: From gamePillData.wikiContent (preferred)
if (aiResponse.gamePillData?.wikiContent) {
  subTabs = Object.entries(aiResponse.gamePillData.wikiContent).map(
    ([tabId, content]) => ({
      id: tabId,                              // e.g., "story_so_far"
      title: formatTitle(tabId),              // e.g., "Story So Far"
      content: content as string,             // AI-generated content
      status: 'loaded',
      order: getOrderForTab(tabId)
    })
  );
}

// Method 2: From progressiveInsightUpdates (fallback)
else if (aiResponse.progressiveInsightUpdates?.length > 0) {
  subTabs = aiResponse.progressiveInsightUpdates.map(update => ({
    id: update.tabId,
    title: update.title,
    content: update.content,
    status: 'loaded',
    order: getOrderForTab(update.tabId)
  }));
}

// Method 3: Fallback - Extract from response content
else {
  // Look for "Lore:", "Analysis:", "Hint:" sections
  const loreMatch = content.match(/Lore:(.*?)(?=\n\n|$)/s);
  const analysisMatch = content.match(/Analysis:(.*?)(?=\n\n|$)/s);
  const hintMatch = content.match(/Hint:(.*?)(?=\n\n|$)/s);
  
  if (loreMatch) subTabs.push({ 
    id: 'lore', 
    title: 'Lore', 
    content: loreMatch[1].trim(),
    status: 'loaded'
  });
  
  // Similar for analysis and hint...
}
```

### SubTab Types & Order

```typescript
const SUBTAB_ORDER = {
  'story_so_far': 1,    // Main story progress
  'characters': 2,       // Character information
  'lore': 3,            // World-building and lore
  'analysis': 4,        // Strategic analysis
  'tips': 5,            // Gameplay tips
  'quest_log': 6,       // Active quests
  'places': 7,          // Locations and areas
  'items': 8,           // Important items
  'mechanics': 9        // Game mechanics
};
```

### Progressive SubTab Updates

SubTabs can be updated during conversation:

```typescript
// In MainApp.tsx - after AI response

if (response.progressiveInsightUpdates?.length > 0) {
  // Update existing subtabs with new information
  await gameTabService.updateSubTabsFromAIResponse(
    activeConversation.id,
    response.progressiveInsightUpdates
  );
  
  // Example update:
  // {
  //   tabId: 'story_so_far',
  //   content: 'Updated story: Player just defeated first boss...'
  // }
}
```

### SubTab States

```typescript
type SubTabStatus = 'loading' | 'loaded' | 'error';

// SubTab lifecycle:
1. Created → status: 'loading', content: 'Loading...'
2. AI responds → status: 'loaded', content: actual content
3. If error → status: 'error', content: error message
```

### SubTab Auto-Expansion

```typescript
// In SubTabs.tsx

useEffect(() => {
  // Auto-expand when subtabs finish loading
  const allLoading = subtabs.every(tab => tab.status === 'loading');
  const anyLoaded = subtabs.some(tab => tab.status === 'loaded');
  
  if (allLoading && isExpanded) {
    setIsExpanded(false); // Collapse if all loading
  }
  
  if (anyLoaded && !isExpanded) {
    setIsExpanded(true); // Expand when any content loads
  }
}, [subtabs]);
```

---

## 8. Suggested Prompts

### Generation Methods

#### Method 1: OTAKON_SUGGESTIONS Tag
```typescript
// In AI response
[OTAKON_SUGGESTIONS: ["What should I do next?", "Tell me about this character", "How do I beat this boss?"]]

// Extracted and displayed directly
const suggestions = response.otakonTags.get('SUGGESTIONS');
setSuggestedPrompts(suggestions);
```

#### Method 2: followUpPrompts (Structured)
```typescript
// In structured AI response
{
  followUpPrompts: [
    "What's the best strategy for this area?",
    "Tell me more about the lore",
    "What items should I collect here?"
  ]
}

// Processed by suggestedPromptsService
const processedSuggestions = 
  suggestedPromptsService.processAISuggestions(response.followUpPrompts);
```

#### Method 3: Fallback Prompts
```typescript
// If AI doesn't provide suggestions
const fallbackPrompts = suggestedPromptsService.getFallbackSuggestions(
  conversationId,
  isGameHub
);

// Game Hub fallbacks:
[
  "What new games are coming out this month?",
  "Recommend an RPG for beginners",
  "What's trending in gaming news?"
]

// Game Tab fallbacks:
[
  "What should I do next in ${gameTitle}?",
  "Tell me about ${gameTitle}'s story",
  "What are the best builds in ${gameTitle}?"
]
```

### Context-Aware Suggestions

The AI generates different suggestions based on:

#### Session Mode
```typescript
// PLAYING mode (active session)
[
  "How do I beat this boss?",        // Immediate tactical help
  "What should I do right now?",     // Current situation
  "Where do I go next?"              // Navigation help
]

// PLANNING mode (not playing)
[
  "What should I prepare for this area?", // Strategic planning
  "What builds are recommended?",         // Long-term strategy
  "What items should I prioritize?"       // Resource management
]
```

#### Progress Stage
```typescript
// Early game
[
  "What are the best starting weapons?",
  "How do I learn the controls?",
  "What should I focus on first?"
]

// Mid game
[
  "What's the next main objective?",
  "Tell me about this area's lore",
  "What strategies work for this section?"
]

// Late game
[
  "What's the best endgame build?",
  "How do I access optional content?",
  "What should I complete before finishing?"
]
```

### Mobile vs Desktop Display

```typescript
// Mobile: Accordion-style (collapsible)
<button onClick={() => setAccordionOpen(!accordionOpen)}>
  Gaming News Suggestions
  <ChevronIcon />
</button>
{accordionOpen && <SuggestionsGrid />}

// Desktop: Always visible
<SuggestionsGrid />
```

---

## 9. Safety & Security

### Multi-Layer Security

#### 1. API Key Protection
```typescript
// ✅ Production: API key on server only
USE_EDGE_FUNCTION = true;
// Edge Function holds the API key
// Client never sees it

// ❌ Development: API key in env (not committed)
VITE_GEMINI_API_KEY = "..." // .env.local only
```

#### 2. Safety Settings
```typescript
const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  // ... all categories
];

// Applied to ALL model instances
```

#### 3. Safety Response Checking
```typescript
private checkSafetyResponse(result) {
  // Check if prompt was blocked
  if (result.response.promptFeedback?.blockReason) {
    return { safe: false, reason: 'Content blocked: ...' };
  }
  
  // Check if response was blocked
  if (candidate.finishReason === 'SAFETY') {
    return { safe: false, reason: 'Response blocked by safety filters' };
  }
  
  return { safe: true };
}
```

#### 4. Usage Limits
```typescript
// Check before API call
const queryCheck = hasImages 
  ? await ConversationService.canSendImageQuery()
  : await ConversationService.canSendTextQuery();

if (!queryCheck.allowed) {
  throw new Error(queryCheck.reason || 'Query limit reached');
}

// Track usage
UserService.incrementUsage(queryType);
await supabase.incrementUsage(userId, queryType);
```

#### 5. Authentication
```typescript
// All API calls require valid JWT
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  throw new Error('Not authenticated');
}

// Include in Edge Function call
headers: {
  'Authorization': `Bearer ${session.access_token}`
}
```

---

## 10. Performance Optimization

### Caching Strategy

#### Memory Cache (Fast)
```typescript
// Cache AI responses in memory for instant retrieval
const cacheKey = `ai_response_${conversationId}_${message}_${isActiveSession}`;
const cached = await cacheService.get(cacheKey, true); // true = memory only

if (cached) {
  return { ...cached, metadata: { ...cached.metadata, fromCache: true } };
}

// Cache new response (1 hour TTL)
await cacheService.set(cacheKey, aiResponse, 60 * 60 * 1000);
```

#### Supabase Cache (Persistent)
```typescript
// For responses that might be reused across sessions
await cacheService.set(cacheKey, aiResponse); // false = also persist to Supabase
```

### Context Summarization

```typescript
// Automatically summarize long conversations
if (conversation.messages.length > 10) {
  const summarized = await contextSummarizationService.applyContextSummarization(
    conversation
  );
  
  // Result:
  // - Older messages → summarized into contextSummary
  // - Recent 10 messages → kept intact
  // - Reduces prompt size significantly
}
```

### Abort Control

```typescript
// Allow users to stop long-running requests
const abortController = new AbortController();

await aiService.getChatResponseWithStructure(
  conversation,
  user,
  message,
  isActiveSession,
  hasImages,
  imageData,
  abortController.signal // Pass abort signal
);

// User clicks "Stop" button
abortController.abort();
// Request terminates immediately
```

### Progressive Loading

```typescript
// SubTabs start in loading state
subtabs: [
  { id: 'lore', title: 'Lore', content: 'Loading...', status: 'loading' },
  { id: 'tips', title: 'Tips', content: 'Loading...', status: 'loading' }
]

// UI shows loading spinners
// When AI responds, update to loaded state
subtabs: [
  { id: 'lore', title: 'Lore', content: actualContent, status: 'loaded' },
  { id: 'tips', title: 'Tips', content: actualContent, status: 'loaded' }
]

// Auto-expand when content loads
useEffect(() => {
  if (subtabs.some(tab => tab.status === 'loaded')) {
    setIsExpanded(true);
  }
}, [subtabs]);
```

### Background Persistence

```typescript
// Update UI immediately (optimistic)
setConversations(prev => ({
  ...prev,
  [conversationId]: updatedConversation
}));

// Persist to Supabase in background (non-blocking)
ConversationService.updateConversation(conversationId, updates)
  .catch(error => console.error('Background save failed:', error));
```

---

## Summary

### The Complete Flow

1. **User sends message** → Context gathered (profile, history, subtabs)
2. **Prompt constructed** → Persona selected, context injected
3. **Model selected** → Standard or grounded based on needs
4. **API call** → Via secure Edge Function proxy
5. **Response parsed** → OTAKON tags extracted, content cleaned
6. **Tab management** → Create/switch tabs based on GAME_ID
7. **SubTabs generated** → From AI response or updated progressively
8. **Suggested prompts** → From AI or fallback service
9. **State updated** → Progress, objectives, conversation state
10. **UI rendered** → Messages, subtabs, suggestions displayed

### Key Technologies

- **AI Model**: Gemini 2.5 Flash (September 2025 preview)
- **Grounding**: Google Search integration for current information
- **Security**: Supabase Edge Functions (server-side proxy)
- **Context**: Multi-layer injection (profile, game, history, subtabs)
- **Caching**: Memory + Supabase for performance
- **State Management**: React + local state + Supabase persistence

### Design Principles

1. **Security First**: API keys never exposed, all calls via proxy
2. **Context-Aware**: Responses adapt to game, player, session mode
3. **Progressive Enhancement**: UI loads fast, content fills in progressively
4. **User Control**: Abort requests, manage subtabs, customize experience
5. **Performance**: Cache aggressively, summarize long contexts
6. **Safety**: Multiple layers of content filtering and moderation

---

## Technical Leverage of AI System

### How AI Powers Core Features

#### 1. Intelligent Game Detection
```typescript
// AI analyzes text/images → Extracts game title + genre → Creates dedicated tab
User: "How do I beat Margit in Elden Ring?"
AI: [OTAKON_GAME_ID: Elden Ring] [OTAKON_GENRE: Action RPG]
App: ✅ Creates "Elden Ring" tab automatically
```

#### 2. Dynamic Knowledge Base (SubTabs)
```typescript
// AI generates structured content → App creates navigable subtabs
AI Response: {
  wikiContent: {
    story_so_far: "You're in Limgrave, the starting area...",
    characters: "Margit the Fell Omen guards Stormveil Castle...",
    tips: "Level Vigor early. Summon Rogier for Margit fight..."
  }
}
App: ✅ Creates Lore, Characters, Tips subtabs with content
```

#### 3. Adaptive Conversation Flow
```typescript
// AI reads player profile + game state → Tailors response style
Player Profile: { experienceLevel: "Beginner", spoilerPreference: "minimal" }
Session: "Planning" mode
AI: Provides spoiler-free strategic advice with beginner-friendly explanations

// Same question, different profile
Player Profile: { experienceLevel: "Veteran", spoilerPreference: "all" }
Session: "Playing" mode
AI: Provides tactical combat tips assuming advanced mechanics knowledge
```

#### 4. Progressive Insight Updates
```typescript
// AI tracks conversation → Updates relevant subtabs in real-time
User: "I just beat Margit!"
AI: [OTAKON_INSIGHT_UPDATE: {id: "story_so_far", content: "Victory over Margit..."}]
    [OTAKON_PROGRESS: 15]
    [OTAKON_OBJECTIVE: Enter Stormveil Castle]
App: ✅ Updates Story subtab
     ✅ Progress bar → 15%
     ✅ Objective banner → "Enter Stormveil Castle"
```

#### 5. Context-Aware Suggestions
```typescript
// AI analyzes current state → Generates relevant follow-ups
Current Context: Player stuck on boss, 10% progress, no builds discussed
AI: [OTAKON_SUGGESTIONS: [
  "What's the best build for early game?",
  "Where can I find better weapons?",
  "Should I level up before fighting this boss?"
]]
App: ✅ Displays 3 contextual prompts below message
```

#### 6. Web-Grounded Responses
```typescript
// AI detects "current info needed" keywords → Uses Google Search grounding
User: "What new games are releasing this week?"
AI: Uses gemini-2.5-flash-preview-09-2025 + Google Search tools
    Returns: Real release dates from current web search
App: ✅ Shows accurate, up-to-date gaming news
```

### AI-Driven UX Enhancements

#### Smart Defaults
```typescript
// AI infers user intent → App sets optimal defaults
New game identified → Auto-expand SubTabs accordion
Screenshot uploaded → Auto-analyze for game + location
Question asked → Auto-generate 3 follow-up prompts
Progress indicated → Auto-update progress bar
```

#### Proactive Assistance
```typescript
// AI anticipates needs → Suggests next actions
Player reaches milestone → AI suggests celebration + next goal
Player stuck too long → AI offers hints + alternative strategies
Player mentions difficulty → AI adjusts explanation depth
```

#### Seamless Tab Management
```typescript
// AI handles complexity → User enjoys simple interface
User asks about new game → AI creates tab, migrates context
User switches games → AI maintains separate conversation histories
User deletes tab → AI preserves data for potential re-creation
```

---

## Acceptance Criteria & Boundaries

### Input Acceptance Rules

#### ✅ Always Accepted
- Text messages 1-2000 characters
- Questions about released games
- Screenshots of gameplay or menus
- Requests for game recommendations
- Gaming news queries
- Strategic advice requests
- Lore and story questions

#### ⚠️ Conditionally Accepted
- Very long messages (>2000 chars) → Auto-truncated
- Low-quality images → Analyzed with warning
- Unreleased games → Kept in Game Hub (no dedicated tab)
- Vague questions → AI requests clarification
- Non-gaming questions → Redirected to gaming context

#### ❌ Always Rejected
- Video files → "Please upload a screenshot instead"
- Audio files → "Text or image input only"
- Requests for hacks/cheats → Safety filter blocks
- Harmful/inappropriate content → Safety filter blocks
- Non-image file uploads → "Unsupported file type"

### Output Acceptance Standards

#### ✅ Valid AI Responses Must Include
1. At least one complete sentence
2. Relevant to user's question
3. Contains no safety filter violations
4. Properly formatted (Hint/Lore structure for screenshots)
5. Includes OTAKON tags when game identified

#### ⚠️ Degraded Mode Responses
- No SUGGESTIONS tag → Fallback prompts generated
- No GAME_ID tag → Stays in Game Hub (acceptable)
- Incomplete subtabs → Shows loading state
- Cached response → Displays with "cached" indicator

#### ❌ Unacceptable Responses (Trigger Retry)
- Empty response
- Safety filter blocked response
- API error (500, 429, 503)
- Malformed JSON structure
- Missing required fields (for structured responses)

### Functional Acceptance

#### Core Feature Requirements
```typescript
✅ Game identification accuracy: >90%
✅ Response time: <10 seconds for 95% of queries
✅ Subtab generation: 100% success rate
✅ Tab switching: 100% state preservation
✅ Image analysis: >85% game recognition accuracy
✅ Context memory: 100% of last 10 messages
✅ Suggested prompts: 100% relevance to current context
```

#### User Experience Standards
```typescript
✅ Mobile responsive: All features work on 375px+ screens
✅ Accessibility: Keyboard navigation + screen reader support
✅ Error handling: User-friendly messages, no crashes
✅ Loading states: Always visible for async operations
✅ Offline grace: Shows cached content when possible
✅ Data persistence: 100% conversation sync across devices
```

---

*This document provides a complete understanding of how Gemini AI drives every aspect of the Otagon gaming assistant, including the technical environment, app capabilities, limitations, and acceptance criteria.*
