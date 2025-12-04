# Otagon AI Instructions & Context Injection - Deep Dive Report

**Generated:** December 4, 2025  
**Last Updated:** December 5, 2025  
**Scope:** Complete analysis of AI prompts, instructions, rules, context injection, summarization techniques, OTAKON tags, post-response app behavior, tab creation, and progress tracking

---

## Table of Contents

### Part 1: Prompt System & Context Injection
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Persona System (Prompt Selection)](#2-persona-system-prompt-selection)
3. [Gaming Focus Guardrails](#3-gaming-focus-guardrails)
4. [OTAKON Tag System](#4-otakon-tag-system)
5. [Subtab Configuration by Genre](#5-subtab-configuration-by-genre)
6. [Player Profile System](#6-player-profile-system)
7. [Character Immersion Service](#7-character-immersion-service)
8. [Behavior & Non-Repetition System](#8-behavior--non-repetition-system)
9. [Context Summarization (Long Conversations)](#9-context-summarization-long-conversations)
10. [Follow-Up Query Handling](#10-follow-up-query-handling)
11. [Game Progress Tracking](#11-game-progress-tracking)
12. [Structured Response Format](#12-structured-response-format)
13. [Initial Insights Generation](#13-initial-insights-generation)
14. [Command Centre (@commands)](#14-command-centre-commands)
15. [Complete Prompt Flow Diagram](#15-complete-prompt-flow-diagram)

### Part 2: Post-Response App Behavior (NEW)
16. [OTAKON Tag Parsing & Formatting](#16-otakon-tag-parsing--formatting)
17. [App Behavior After AI Response](#17-app-behavior-after-ai-response)
18. [Game Tab Creation Lifecycle](#18-game-tab-creation-lifecycle)
19. [Subtab Update Mechanisms](#19-subtab-update-mechanisms)
20. [Progress Tracking System Details](#20-progress-tracking-system-details)
21. [Message Migration Flow](#21-message-migration-flow)
22. [Complete Response Processing Diagram](#22-complete-response-processing-diagram)

---

## 1. System Architecture Overview

The Otagon AI system uses a **layered prompt injection architecture** where multiple contexts are combined before sending to Gemini 2.5 Flash:

```
┌─────────────────────────────────────────────────────────────────┐
│                        FINAL PROMPT                              │
├─────────────────────────────────────────────────────────────────┤
│  1. Behavior Context (Non-repetition + User Corrections)        │
│  2. Base Persona Prompt (General/Game Companion/Screenshot)     │
│     └── Includes: Gaming Guardrails, Tag Definitions            │
│  3. Session Context (Placeholder - not currently used)          │
│  4. Character Immersion Context (Genre-specific tone)           │
│  5. Structured Response Instructions (JSON schema guidance)     │
└─────────────────────────────────────────────────────────────────┘
```

**Key Files:**
- `src/services/promptSystem.ts` - Main prompt generation
- `src/services/aiService.ts` - AI service orchestration
- `src/services/characterImmersionService.ts` - Genre-based immersion
- `src/services/profileAwareTabService.ts` - Player profile modifiers
- `src/services/ai/behaviorService.ts` - Non-repetition tracking
- `src/services/ai/correctionService.ts` - User correction handling
- `src/services/otakonTags.ts` - Tag parsing

---

## 2. Persona System (Prompt Selection)

The system selects one of **three personas** based on context:

### 2.1 General Gaming Assistant (Game Hub)
**Trigger:** `conversation.isGameHub === true` or no game title set

```typescript
// From getGeneralAssistantPrompt()
**Persona: General Gaming Assistant**
You are Otagon, a helpful and knowledgeable AI gaming assistant for the "Game Hub" tab.

**CRITICAL: Use Real Information**
- Today's date is ${new Date().toLocaleDateString(...)}
- You have access to Google Search grounding for current information
- ALWAYS cite specific game titles, release dates, and accurate details
- NEVER use placeholders like "[Hypothetical Game A]"
- Your knowledge cutoff is January 2025 - use web search for anything after

**Task:**
1. Thoroughly answer the user's query
2. If query is about a SPECIFIC RELEASED GAME, include OTAKON tags
3. Generate three SPECIFIC follow-up prompts

**SPECIAL INSTRUCTIONS FOR GAMING NEWS:**
- Provide AT LEAST 10 news items with substantial detail
- Use proper markdown formatting
- Include sections: Major Releases, Upcoming Games, Industry News, DLC & Updates

**TRAILER REQUESTS - INCLUDE VIDEO LINKS:**
- ALWAYS include direct YouTube links to official trailers
- Format: [Watch Trailer](https://youtube.com/watch?v=VIDEO_ID)
```

### 2.2 Game Companion (Specific Game Tabs)
**Trigger:** `!conversation.isGameHub && conversation.gameTitle exists`

```typescript
// From getGameCompanionPrompt()
**Persona: Game Companion**
You are Otagon, an immersive AI companion for the game "${conversation.gameTitle}".
The user's spoiler preference is: "${user.preferences?.spoilerPreference || 'none'}".
The user's current session mode is: ${isActiveSession ? 'ACTIVE (currently playing)' : 'PLANNING (not playing)'}.

**Web Search Grounding Available:**
- You have access to Google Search for current information
- Use for: patch notes, updates, DLC announcements, strategy guides

**Game Context:**
- Game: ${conversation.gameTitle} (${conversation.genre})
- Current Objective: ${conversation.activeObjective || 'Not set'}
- Game Progress: ${conversation.gameProgress || 0}%

**Player Profile:**
${profileContext}  // <-- Injected from profileAwareTabService

**Current Subtabs (Your Knowledge Base):**
${subtabContext}  // <-- All loaded subtab content

**Historical Context (Previous Sessions):**
${conversation.contextSummary}  // <-- AI-summarized history

**Recent Conversation History:**
${recentMessages}  // <-- Last 10 messages

**User Query:** "${userMessage}"

**Task:**
1. Respond in an immersive, in-character way matching the game's tone
2. Use subtab context to provide informed, consistent answers
3. ADAPT response style based on Player Profile
4. Update subtabs with [OTAKON_SUBTAB_UPDATE] when new info emerges
5. Track progress with [OTAKON_PROGRESS: XX]
6. Set objectives with [OTAKON_OBJECTIVE: "description"]
7. ${isActiveSession ? 'Provide concise, actionable advice' : 'Provide detailed strategic advice'}
8. Generate 3 SPECIFIC follow-up prompts
```

### 2.3 Screenshot Analysis
**Trigger:** `hasImages === true`

```typescript
// From getScreenshotAnalysisPrompt()
**Persona: Game Lore Expert & Screenshot Analyst**
You are Otagon, an expert at analyzing game visuals and providing immersive, lore-rich assistance.

**Task:**
1. Analyze the screenshot to identify the game
2. **CRITICAL TAG REQUIREMENTS - Include ALL tags:**
   - [OTAKON_GAME_ID: Full Game Name]
   - [OTAKON_CONFIDENCE: high|low]
   - [OTAKON_GENRE: Genre]
   - [OTAKON_IS_FULLSCREEN: true|false]
   - [OTAKON_GAME_STATUS: unreleased] (only if not released)
   - **[OTAKON_PROGRESS: XX]** ⚠️ MANDATORY
   - [OTAKON_OBJECTIVE: "current goal"]
3. Answer the user's question with focus on lore and context
4. Provide 3 contextual suggestions

**Understanding Image Sources:**
1. PC Connection (fullscreen): Direct screenshots via WebSocket
2. Console/PC Screenshots (fullscreen): Uploaded from PlayStation, Xbox, Switch, PC
3. Camera Photos (not fullscreen): Phone photos of TV/monitor

**MANDATORY FORMAT FOR IMAGES:**
**Hint:** [Game Name] - [Brief, actionable hint]
**Lore:** [Rich lore explanation about current situation]
**Places of Interest:** [Nearby locations, shops, NPCs for useful interactions]

**What to focus on:**
- Story significance and lore implications
- Character relationships and motivations
- Location importance and world-building
- Gameplay mechanics and strategic advice

**What to avoid:**
- Describing obvious UI elements
- Stating the obvious
- Generic descriptions without value
```

---

## 3. Gaming Focus Guardrails

All personas include these guardrails to keep Otagon focused on gaming:

```typescript
const GAMING_FOCUS_GUARDRAILS = `
**⚠️ IMPORTANT: Gaming-Only Focus**
You are Otagon, a gaming-focused AI assistant. Your expertise is EXCLUSIVELY in:
- Video games (all platforms, genres, eras)
- Gaming strategies, tips, walkthroughs, and guides
- Game lore, storylines, and character information
- Gaming news, releases, and industry updates
- Gaming hardware and peripherals
- Esports and competitive gaming
- Game development topics (as they relate to players)

**How to handle non-gaming queries:**
1. Politely acknowledge their question
2. Explain you're Otagon, a specialized gaming assistant
3. Gently redirect them back to gaming topics
4. Offer gaming-related alternatives if possible

**Example redirections:**
- "What's the weather?" → "I focus on gaming! But I can tell you about weather systems in Death Stranding..."
- "Help with math homework" → "I specialize in gaming! For puzzle games that sharpen math skills, try Portal..."
- "Write me a poem" → "Poetry isn't my specialty, but many games have beautiful writing! Disco Elysium..."

**BE HELPFUL, NOT ANNOYING:**
- Don't over-explain or be preachy
- Keep redirections brief and friendly (1-2 sentences)
- Always offer a gaming alternative
- If non-gaming topic can connect to gaming, make that connection!
`;
```

---

## 4. OTAKON Tag System

The AI outputs structured tags that are parsed by `parseOtakonTags()`:

### 4.1 Tag Definitions (Included in All Prompts)

```typescript
const OTAKON_TAG_DEFINITIONS = `
- [OTAKON_GAME_ID: Game Name]: The full, official name of the game
- [OTAKON_CONFIDENCE: high|low]: Confidence in game identification
- [OTAKON_GENRE: Genre]: Primary genre (must match predefined list):
  • Action RPG, RPG, Souls-like, Metroidvania, Open-World
  • Survival-Crafting, First-Person Shooter, Strategy, Adventure
  • Simulation, Sports, Multiplayer Shooter, Multiplayer Sports
  • Racing, Fighting, Battle Royale, MMORPG, Puzzle, Horror, Default

- [OTAKON_GAME_STATUS: unreleased]: ONLY if game is NOT YET RELEASED
- [OTAKON_IS_FULLSCREEN: true|false]: Whether screenshot shows fullscreen gameplay
- [OTAKON_PROGRESS: 0-100]: **MANDATORY** - Game completion estimate:
  * prologue (5-15%), early game (15-35%), mid-game (35-60%)
  * late game (60-85%), endgame (85-100%)

- [OTAKON_OBJECTIVE: "description"]: Current main objective
- [OTAKON_TRIUMPH: {"type": "boss_defeated", "name": "Boss Name"}]: Victory detection
- [OTAKON_OBJECTIVE_SET: {"description": "New objective"}]: New objective identified

- [OTAKON_INSIGHT_UPDATE: {"id": "sub_tab_id", "content": "content"}]: Update specific subtab
- [OTAKON_SUBTAB_UPDATE: {"tab": "tab_name", "content": "content"}]: Append to subtab
- [OTAKON_INSIGHT_MODIFY_PENDING: {"id": "id", "title": "New Title", "content": "content"}]: Modify subtab
- [OTAKON_INSIGHT_DELETE_REQUEST: {"id": "sub_tab_id"}]: Delete subtab

- [OTAKON_SUGGESTIONS: ["suggestion1", "suggestion2", "suggestion3"]]: Follow-up prompts
`;
```

### 4.2 Tag Parsing Logic

```typescript
// From src/services/otakonTags.ts
export const parseOtakonTags = (rawContent: string): { cleanContent: string; tags: Map<string, unknown> } => {
  // 1. Handle SUGGESTIONS with JSON array
  const suggestionsRegex = /\[OTAKON_SUGGESTIONS:\s*(\[[\s\S]*?\])\s*\]/g;
  
  // 2. Handle SUBTAB_UPDATE with nested JSON
  const subtabUpdateRegex = /\[OTAKON_SUBTAB_UPDATE:\s*(\{[\s\S]*?\})\s*\]/g;
  
  // 3. Handle simple tags (non-JSON values)
  const simpleTagRegex = /\[OTAKON_([A-Z_]+):\s*([^\[\]]+?)\]/g;
  
  // 4. Robust progress detection (multiple formats)
  // Checks: [OTAKON_PROGRESS: XX], PROGRESS: XX, progress XX%
};
```

---

## 5. Subtab Configuration by Genre

The `insightTabsConfig` defines genre-specific subtabs with AI instructions:

### 5.1 Default Tabs (All Genres)
```typescript
'Default': [
  { 
    id: 'story_so_far', 
    title: 'Story So Far', 
    type: 'story', 
    instruction: "Provide a concise summary of main plot events strictly up to estimated progress. 
                  Base ONLY on explicitly provided context - do not invent character names, 
                  relationships, or events. Do not confuse characters. Never mention future events."
  },
  { 
    id: 'missed_items', 
    title: 'Items You May Have Missed', 
    type: 'items', 
    instruction: "Identify 2-3 significant items/secrets player might have overlooked in already 
                  visited areas. Provide clear, actionable hints using landmarks without exact solutions."
  },
  { 
    id: 'game_lore', 
    title: 'Relevant Lore', 
    type: 'story', 
    instruction: "Provide fascinating, spoiler-free lore relevant to current situation. 
                  Base ONLY on explicitly known context - do not invent backstories."
  },
  { 
    id: 'build_guide', 
    title: 'Build Guide', 
    type: 'strategies', 
    instruction: "Suggest effective character builds using items/skills available up to current progress. 
                  Be specific about synergies, stat allocation, and upcoming challenges."
  },
  { 
    id: 'next_session_plan', 
    title: 'Plan Your Next Session', 
    type: 'tips', 
    instruction: "List 3-4 concrete objectives for next session: main quests, important side quests, 
                  interesting areas to explore. Provide compelling reasons for each."
  },
]
```

### 5.2 Genre-Specific Examples

**Souls-like (8 tabs):**
```typescript
'Souls-like': [
  { id: 'story_so_far', ... },
  { 
    id: 'boss_strategy', 
    instruction: "**Do not name the boss or describe appearance.** Provide tactical guidance 
                  based on observable attack patterns: timing windows, positioning, elemental 
                  weaknesses, phase transition tells. Include build-agnostic advice first, 
                  then specific tips for melee/ranged/magic. Respect the challenge."
  },
  { 
    id: 'hidden_paths', 
    instruction: "Hint at secret passages, illusory walls, or shortcuts near current location. 
                  Use environmental clues without explicit directions: 'The pattern of scorch marks 
                  isn't random' or 'Some walls are thinner than they appear.'"
  },
  { 
    id: 'build_optimization', 
    instruction: "Analyze player's apparent build direction. Suggest 2-3 optimization paths 
                  including stat allocation, weapon upgrades, synergistic equipment. 
                  Address common mistakes: 'If using strength weapons, diminishing returns at 60 STR.'"
  },
  { id: 'missed_items', ... },
  { id: 'points_of_interest', ... },
  { 
    id: 'death_recovery', 
    instruction: "Practical advice for safely recovering souls/currency after death. 
                  Suggest preparation, clearing paths, or accepting loss if risk too high. 
                  Emergency tactics: 'Sprint directly to souls and use homeward item.'"
  },
  { 
    id: 'level_layout', 
    instruction: "Help understand area's interconnected design. Identify key shortcuts unlocked, 
                  suggest efficient exploration routes, point out section connections. 
                  Use cardinal directions and landmarks, not exact instructions."
  },
  { 
    id: 'npc_questlines', 
    instruction: "Track NPC questline progress without spoiling outcomes. Suggest next steps, 
                  warn about easily failed questlines: 'Speaking to NPC X before defeating 
                  area boss will lock you out of their merchant services.'"
  },
]
```

**Horror (9 tabs):**
```typescript
'Horror': [
  { id: 'story_so_far', ... },
  { 
    id: 'survival_strategies', 
    instruction: "Comprehensive survival tactics: resource management, safe zone identification, 
                  navigating dangerous areas while minimizing risk."
  },
  { 
    id: 'enemy_behavior', 
    instruction: "Analyze enemy patterns and counter-strategies. How to avoid detection, 
                  exploit weaknesses, use environment against threats."
  },
  { 
    id: 'atmosphere_navigation', 
    instruction: "Strategies for managing psychological aspects of horror. Maintain composure, 
                  use audio cues effectively, navigate tense situations."
  },
  { 
    id: 'resource_management', 
    instruction: "Optimal resource allocation and conservation. Inventory management, 
                  crafting priorities, maximizing survival with limited supplies."
  },
  { id: 'missed_items', ... },
  { id: 'points_of_interest', ... },
  { 
    id: 'safe_zone_mapping', 
    instruction: "Identify 2-3 secure locations for regrouping/healing. Describe safety indicators: 
                  'Single entrance, barricadable door, no vents.' Warn about false safe zones."
  },
  { 
    id: 'sanity_management', 
    instruction: "For games with sanity mechanics: explain triggers (darkness, witnessing events), 
                  restoration methods, warning signs of critical sanity. Playstyle adjustments."
  },
  { 
    id: 'fear_adaptation', 
    instruction: "Psychological coping strategies for horror stress. Audio/lighting adjustments, 
                  session pacing, desensitization techniques. 'Surviving, not suffering, is the goal.'"
  },
]
```

### 5.3 All Supported Genres
- Default, Action RPG, RPG, First-Person Shooter, Strategy, Adventure
- Simulation, Sports, Multiplayer Shooter, Multiplayer Sports, Racing
- Fighting, Battle Royale, MMORPG, Puzzle, Horror, Souls-like, Metroidvania
- Open-World, Survival-Crafting

---

## 6. Player Profile System

The `profileAwareTabService` customizes AI responses based on user preferences:

### 6.1 Profile Dimensions

```typescript
interface PlayerProfile {
  hintStyle: 'Cryptic' | 'Balanced' | 'Direct';
  playerFocus: 'Story-Driven' | 'Completionist' | 'Strategist';
  preferredTone: 'Encouraging' | 'Professional' | 'Casual';
  spoilerTolerance: 'Strict' | 'Moderate' | 'Relaxed';
}
```

### 6.2 Profile Modifiers (Injected into Prompts)

```typescript
// Hint Style
getHintStyleModifier(hintStyle: string): string {
  'Cryptic': 'Use subtle, metaphorical hints. Avoid direct answers. Make the player discover.',
  'Balanced': 'Provide clear guidance while leaving room for exploration.',
  'Direct': 'Give explicit, step-by-step instructions. Be precise and comprehensive.',
}

// Player Focus
getPlayerFocusModifier(playerFocus: string): string {
  'Story-Driven': 'Emphasize narrative elements, character development, story context. 
                   Prioritize lore and thematic content.',
  'Completionist': 'Focus on collectibles, hidden items, side quests, 100% strategies. 
                    Highlight missable content.',
  'Strategist': 'Prioritize optimal strategies, build optimization, efficient progression. 
                 Focus on mechanics and systems.',
}

// Spoiler Tolerance
getSpoilerToleranceModifier(spoilerTolerance: string): string {
  'Strict': 'NEVER mention future events, characters, or plot points. 
             Only discuss content up to current progress.',
  'Moderate': 'You may hint at upcoming content in vague terms, but avoid specific spoilers.',
  'Relaxed': 'You can discuss future content more freely, but still mark major spoilers.',
}

// Preferred Tone
getToneModifier(preferredTone: string): string {
  'Encouraging': 'Use enthusiastic, supportive tone. Celebrate achievements, positive reinforcement.',
  'Professional': 'Maintain knowledgeable, respectful tone. Provide expertise without casualness.',
  'Casual': 'Use friendly, conversational tone. Gaming terminology welcome, be relaxed.',
}
```

### 6.3 Combined Profile Context

```typescript
buildProfileContext(profile: PlayerProfile): string {
  return `
    Hint Style: ${this.getHintStyleModifier(profile.hintStyle)}
    Player Focus: ${this.getPlayerFocusModifier(profile.playerFocus)}
    Spoiler Tolerance: ${this.getSpoilerToleranceModifier(profile.spoilerTolerance)}
    Tone: ${this.getToneModifier(profile.preferredTone)}
  `;
}
```

---

## 7. Character Immersion Service

The `characterImmersionService` adds genre-specific personality to responses:

### 7.1 Game Tones by Genre

```typescript
private gameTones: Record<string, GameTone> = {
  'Action RPG': {
    adjectives: ['epic', 'heroic', 'legendary', 'mystical', 'ancient'],
    personality: 'wise and experienced adventurer',
    speechPattern: 'speaks with the wisdom of ages and the thrill of adventure',
    loreStyle: 'rich with mythology and ancient secrets'
  },
  'FPS': {
    adjectives: ['intense', 'tactical', 'precise', 'combat-ready', 'strategic'],
    personality: 'battle-hardened soldier',
    speechPattern: 'communicates with military precision and combat experience',
    loreStyle: 'focused on warfare, technology, and military history'
  },
  'Horror': {
    adjectives: ['ominous', 'chilling', 'mysterious', 'haunting', 'eerie'],
    personality: 'knowledgeable survivor',
    speechPattern: 'speaks with caution and awareness of lurking dangers',
    loreStyle: 'dark and atmospheric, filled with supernatural elements'
  },
  'Puzzle': {
    adjectives: ['logical', 'methodical', 'analytical', 'clever', 'systematic'],
    personality: 'brilliant problem-solver',
    speechPattern: 'explains with clear logic and step-by-step reasoning',
    loreStyle: 'intellectual and mysterious, focused on patterns and solutions'
  },
  // ... more genres
}
```

### 7.2 Immersion Context Generation

```typescript
generateImmersionContext(context: ImmersionContext): string {
  const tone = this.getGameTone(context.genre);
  
  return `
    **Immersion Context for ${context.gameTitle}:**
    You are speaking as a ${tone.personality} who ${tone.speechPattern}.
    The game's lore is ${tone.loreStyle}.
    
    ${context.currentLocation ? `The player is currently in: ${context.currentLocation}` : ''}
    ${context.playerProgress ? `Player progress: ${context.playerProgress}%` : ''}
    
    **Response Guidelines:**
    - Use ${tone.adjectives.join(', ')} language
    - Maintain the ${tone.personality} personality
    - Focus on ${tone.loreStyle} elements
    - Keep responses immersive and in-character
  `;
}
```

---

## 8. Behavior & Non-Repetition System

The `behaviorService` prevents repetitive responses and applies user corrections:

### 8.1 Data Structure

```typescript
interface BehaviorData {
  aiCorrections: AICorrection[];      // User-submitted corrections
  aiPreferences: AIPreferences;       // Response history scope, correction settings
  responseTopicsCache: ResponseTopicsCache;  // Topics already discussed
}

interface AICorrection {
  id: string;
  gameTitle: string | null;  // null = global
  originalSnippet: string;
  correctionText: string;
  type: 'factual' | 'style' | 'terminology' | 'behavior';
  scope: 'game' | 'global';
  isActive: boolean;
  appliedCount: number;
}
```

### 8.2 Context Injection

```typescript
// From buildBehaviorContextString()
function buildBehaviorContextString(context: BehaviorContext | null): string {
  if (!context || context.scope === 'off') return '';
  
  const parts: string[] = [];
  
  // Previous topics (for non-repetitive responses)
  if (context.previousTopics.length > 0) {
    parts.push(`
      **📚 PREVIOUSLY DISCUSSED TOPICS (Avoid Repetition):**
      The user has already received information about these topics in recent conversations. 
      DO NOT repeat the same information - provide NEW angles, deeper insights, or different aspects.
      Topics covered: ${context.previousTopics.slice(0, 15).join(', ')}
    `);
  }
  
  // User corrections
  if (context.corrections.length > 0) {
    const correctionLines = context.corrections.map(c => {
      const scope = c.scope === 'global' ? '(Global)' : `(${c.gameTitle || 'This Game'})`;
      return `- ${scope} Instead of "${c.originalSnippet.slice(0, 50)}...", prefer: "${c.correctionText}"`;
    });
    
    parts.push(`
      **✏️ USER CORRECTIONS (Apply these preferences):**
      The user has provided the following corrections to improve your responses:
      ${correctionLines.join('\n')}
    `);
  }
  
  return parts.join('\n');
}
```

### 8.3 Topic Extraction & Storage

After each response, topics are extracted and stored:

```typescript
// In aiService.ts after receiving response
const extractedTopics = correctionService.extractTopicsFromResponse(aiResponse.content);
if (extractedTopics.length > 0) {
  behaviorService.addResponseTopics(user.authUserId, gameTitle, extractedTopics);
}
```

---

## 9. Context Summarization (Long Conversations)

For conversations with 50+ messages, an Edge Function generates summaries:

### 9.1 Summarization Prompt

```typescript
// From supabase/functions/summarize-conversations/index.ts
const prompt = `You are a helpful AI assistant that summarizes gaming conversations. 

Summarize the following conversation between a user and a gaming assistant in 300-500 words. Focus on:
1. Main topics discussed
2. Key questions asked by the user
3. Important advice or information provided
4. Current game progress or objectives mentioned
5. Any unresolved issues or ongoing challenges

Keep the summary factual, concise, and helpful for continuing the conversation later.

CONVERSATION:
${conversationText}

SUMMARY:`;
```

### 9.2 Summary Injection

The summary is stored in `conversations.context_summary` and injected:

```typescript
// In getGameCompanionPrompt()
const historicalContext = conversation.contextSummary
  ? `**Historical Context (Previous Sessions):**\n${conversation.contextSummary}\n\n`
  : '';

// Plus recent messages (last 10)
const recentMessages = conversation.messages
  .slice(-10)
  .map(m => `${m.role === 'user' ? 'User' : 'Otagon'}: ${m.content}`)
  .join('\n');
```

---

## 10. Follow-Up Query Handling

The system handles follow-up queries with context awareness:

### 10.1 Session Mode Detection

```typescript
// Active vs Planning mode changes response style
const isActiveSession = conversation.isActiveSession;

// In prompt:
${isActiveSession 
  ? 'Provide concise, actionable advice for immediate use.' 
  : 'Provide more detailed, strategic advice for planning.'
}
```

### 10.2 Contextual Suggestions

```typescript
**CRITICAL - Context-Aware Follow-ups:**
- Your suggestions MUST reference specific content from YOUR response
- ❌ BAD: "What should I do next?" (too generic)
- ✅ GOOD: "How do I counter [specific enemy you mentioned]'s attack pattern?"
- The user is ${isActiveSession 
  ? 'actively playing - suggest immediate tactical questions' 
  : 'planning - suggest strategic/preparation questions'
}

// Different modes:
- NEWS MODE: Generate follow-ups about SPECIFIC games/news mentioned
- GAME MODE: Generate follow-ups about SPECIFIC topic discussed
- GAME HUB MODE: Generate follow-ups about SPECIFIC games/topics discussed
```

---

## 11. Game Progress Tracking

Progress is tracked through multiple mechanisms:

### 11.1 Progress Tag Requirements

```typescript
**⚠️ MANDATORY PROGRESS TRACKING - You MUST include [OTAKON_PROGRESS: X]:**
Current stored progress: ${conversation.gameProgress || 0}%

ALWAYS update based on what the player tells you or screenshots.
Use these estimates:
- Tutorial/beginning area → [OTAKON_PROGRESS: 5]
- First dungeon/boss → [OTAKON_PROGRESS: 15]
- Exploring early regions → [OTAKON_PROGRESS: 25]
- Mid-game content → [OTAKON_PROGRESS: 40]
- Late-game areas → [OTAKON_PROGRESS: 65]
- Final areas/boss → [OTAKON_PROGRESS: 85]
- Post-game → [OTAKON_PROGRESS: 95]

// Game-specific examples (Elden Ring):
- Limgrave → 10%
- Liurnia of the Lakes → 25%
- Raya Lucaria Academy → 30%
- Altus Plateau → 45%
- Leyndell → 55%
- Mountaintops of the Giants → 70%
- Crumbling Farum Azula → 80%
- Elden Throne → 90%
```

### 11.2 Structured Response Tracking

```typescript
// In getChatResponseWithStructure()
stateUpdateTags: {
  type: SchemaType.ARRAY,
  items: { type: SchemaType.STRING },
  description: "MANDATORY: Array of state updates. MUST include 'PROGRESS: XX' (0-100)."
}

// Fallback extraction if tags missing:
const progressMatch = content.match(/(?:\[OTAKON_)?PROGRESS[:\s]+(\d+)/i);
if (progressMatch) {
  stateUpdateTags.push(`PROGRESS: ${parseInt(progressMatch[1])}`);
}
```

---

## 12. Structured Response Format

For enhanced responses, the system uses JSON schema mode:

### 12.1 Schema Definition

```typescript
const result = await modelToUse.generateContent({
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        content: { type: SchemaType.STRING, description: "Main chat response" },
        followUpPrompts: { 
          type: SchemaType.ARRAY, 
          items: { type: SchemaType.STRING },
          description: "3-4 contextual follow-up questions"
        },
        progressiveInsightUpdates: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              tabId: { type: SchemaType.STRING },
              title: { type: SchemaType.STRING },
              content: { type: SchemaType.STRING }
            }
          }
        },
        stateUpdateTags: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "MANDATORY: MUST include 'PROGRESS: XX' (0-100)"
        },
        gamePillData: {
          type: SchemaType.OBJECT,
          properties: {
            shouldCreate: { type: SchemaType.BOOLEAN },
            gameName: { type: SchemaType.STRING },
            genre: { type: SchemaType.STRING },
            wikiContent: { type: SchemaType.STRING }
          }
        }
      },
      required: ["content", "followUpPrompts", "stateUpdateTags"]
    }
  }
});
```

---

## 13. Initial Insights Generation

When creating a new game tab, initial subtab content is generated:

### 13.1 Generation Prompt

```typescript
const prompt = `
You are a gaming assistant generating initial content for ${gameTitle} (${genre} game).

Player Profile:
${profileContext}

${conversationContext ? `Conversation Context:\n${conversationContext}\n\n
⚠️ USE THIS CONTEXT to generate relevant subtab content!` : ''}

Instructions for each tab:
${instructions}  // <-- From insightTabsConfig

CRITICAL ACCURACY RULES (MUST FOLLOW):
1. Base ALL content STRICTLY on the game title and provided context
2. NEVER mix information from different games
3. NEVER confuse characters within the same game
4. NEVER invent character details not provided in context
5. If context insufficient, provide general genre-appropriate guidance

CRITICAL FORMATTING RULES:
1. Return ONLY valid JSON (no markdown fences)
2. Format: {"tab_id": "content", "tab_id": "content"}
3. Each content: 2-4 paragraphs (150-250 words per tab)
4. Use **bold** for key terms, *italic* for emphasis
5. Use \\n\\n for paragraph breaks
6. Include bullet points with • for lists
7. Content should be detailed, spoiler-free, helpful

Generate COMPREHENSIVE valid JSON for ALL tab IDs: ${tabIds.join(', ')}
`;
```

---

## 14. Command Centre (@commands)

Users can manage subtabs with @ commands:

### 14.1 Command Instructions

```typescript
const COMMAND_CENTRE_INSTRUCTIONS = `
**Command Centre - Subtab Management:**
Users can manage subtabs using @ commands:

1. **@<tab_name> <instruction>**: Update a subtab with new information
   - Example: "@story_so_far The player just defeated the first boss"
   - Response: Include [OTAKON_INSIGHT_UPDATE: {"id": "story_so_far", "content": "updated content"}]
   
2. **@<tab_name> \\modify**: Modify or rename a subtab
   - Example: "@tips \\modify change this to combat strategies"
   - Response: Include [OTAKON_INSIGHT_MODIFY_PENDING: {"id": "tips", "title": "Combat Strategies", "content": "..."}]
   
3. **@<tab_name> \\delete**: Delete a subtab
   - Example: "@unused_tab \\delete"
   - Response: Include [OTAKON_INSIGHT_DELETE_REQUEST: {"id": "unused_tab"}]

When you see an @ command:
- Acknowledge the command in your response
- Include the appropriate OTAKON tag to execute the action
- Provide confirmation of what was changed
`;
```

---

## 15. Complete Prompt Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER SENDS MESSAGE                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEDUPLICATION CHECK                              │
│ • Check if identical request already pending                             │
│ • Return cached result if available                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      BEHAVIOR CONTEXT FETCH                              │
│ • Get previousTopics (avoid repetition)                                  │
│ • Get active corrections (user preferences)                              │
│ • Build behavior context string                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        PERSONA SELECTION                                 │
│ ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐                  │
│ │ hasImages?   │  │ isGameHub?   │  │ gameTitle set?  │                  │
│ │      ↓       │  │      ↓       │  │       ↓         │                  │
│ │  Screenshot  │  │   General    │  │ Game Companion  │                  │
│ │   Analysis   │  │  Assistant   │  │                 │                  │
│ └──────────────┘  └──────────────┘  └─────────────────┘                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BASE PROMPT CONSTRUCTION                              │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ • Gaming Focus Guardrails                                           │ │
│ │ • OTAKON Tag Definitions                                            │ │
│ │ • Command Centre Instructions                                       │ │
│ │ • Response Format Guidelines                                        │ │
│ │ • Markdown Formatting Rules                                         │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ For Game Companion, add:                                                │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ • Game Context (title, genre, objective, progress)                  │ │
│ │ • Player Profile (hintStyle, focus, tone, spoilerTolerance)         │ │
│ │ • Current Subtabs (knowledge base)                                  │ │
│ │ • Historical Context (summarized conversation)                      │ │
│ │ • Recent Messages (last 10)                                         │ │
│ │ • Session Mode (active/planning)                                    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  IMMERSION CONTEXT (if game tab)                         │
│ • Genre-specific personality                                             │
│ • Speech patterns and adjectives                                         │
│ • Lore style guidance                                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              STRUCTURED RESPONSE INSTRUCTIONS                            │
│ • followUpPrompts requirements                                           │
│ • progressiveInsightUpdates schema                                       │
│ • stateUpdateTags (MANDATORY PROGRESS)                                   │
│ • gamePillData for tab creation                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      GEMINI 2.5 FLASH API CALL                          │
│ • Edge Function proxy for security                                       │
│ • Google Search grounding enabled                                        │
│ • Safety settings applied                                                │
│ • JSON schema mode (when available)                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    RESPONSE PROCESSING                                   │
│ • Parse OTAKON tags                                                      │
│ • Clean markdown formatting                                              │
│ • Extract suggestions                                                    │
│ • Build stateUpdateTags                                                  │
│ • Store response topics (for non-repetition)                             │
│ • Cache response                                                         │
│ • Log API usage                                                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        RETURN AIResponse                                 │
│ {                                                                        │
│   content: "cleaned response text",                                      │
│   suggestions: ["prompt1", "prompt2", "prompt3"],                        │
│   followUpPrompts: [...],                                                │
│   otakonTags: Map<string, unknown>,                                      │
│   stateUpdateTags: ["PROGRESS: 35", "OBJECTIVE: ..."],                  │
│   progressiveInsightUpdates: [...],                                      │
│   gamePillData: { shouldCreate: bool, ... },                             │
│   metadata: { model, timestamp, tokens }                                 │
│ }                                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Summary of Key Features

| Feature | Implementation | Purpose |
|---------|---------------|---------|
| **3 Personas** | `getPromptForPersona()` | Context-appropriate responses |
| **Gaming Guardrails** | `GAMING_FOCUS_GUARDRAILS` | Keep focus on gaming topics |
| **17 Genre Configs** | `insightTabsConfig` | Genre-specific subtab instructions |
| **Player Profiles** | `profileAwareTabService` | Personalized hint style, focus, tone |
| **Character Immersion** | `characterImmersionService` | Genre-specific personality |
| **Non-Repetition** | `behaviorService` | Track discussed topics |
| **User Corrections** | `correctionService` | Apply user preferences |
| **Context Summarization** | Edge Function | Handle long conversations |
| **Progress Tracking** | OTAKON_PROGRESS tag | Track game completion |
| **Structured Responses** | JSON schema mode | Consistent output format |
| **@Commands** | Command Centre instructions | User-controlled subtab management |

---

*This report documents the complete AI instruction and context injection system as of December 4, 2025.*

---

## Part 2: Post-Response App Behavior

---

## 16. OTAKON Tag Parsing & Formatting

The `otakonTags.ts` service (398 lines) handles all tag extraction and markdown formatting:

### 16.1 Complete Tag Extraction

```typescript
// From src/services/otakonTags.ts

export const parseOtakonTags = (rawContent: string): { 
  cleanContent: string; 
  tags: Map<string, unknown>;
  stateUpdateTags: string[];
} => {
  const tags = new Map<string, unknown>();
  let cleanContent = rawContent;
  const stateUpdateTags: string[] = [];

  // 1. SUGGESTIONS - JSON array extraction
  const suggestionsRegex = /\[OTAKON_SUGGESTIONS:\s*(\[[\s\S]*?\])\s*\]/g;
  // Parses: [OTAKON_SUGGESTIONS: ["prompt1", "prompt2", "prompt3"]]

  // 2. SUBTAB_UPDATE - Nested JSON extraction
  const subtabUpdateRegex = /\[OTAKON_SUBTAB_UPDATE:\s*(\{[\s\S]*?\})\s*\]/g;
  // Parses: [OTAKON_SUBTAB_UPDATE: {"tab": "story_so_far", "content": "..."}]
  
  // 3. INSIGHT_UPDATE, MODIFY_PENDING, DELETE_REQUEST - Command Centre
  // All stored as raw JSON strings for MainApp to parse

  // 4. Simple tags (non-JSON values)
  const simpleTagRegex = /\[OTAKON_([A-Z_]+):\s*([^\[\]]+?)\]/g;
  // Parses: [OTAKON_GAME_ID: Elden Ring], [OTAKON_CONFIDENCE: high]
  
  // 5. CRITICAL: Multi-format progress detection
  const progressPatterns = [
    /\[OTAKON_PROGRESS:\s*(\d+)\]/i,           // [OTAKON_PROGRESS: 45]
    /\bPROGRESS:\s*(\d+)/i,                     // PROGRESS: 45
    /progress[:\s]+(\d+)\s*%/i,                 // progress 45%
    /(\d+)\s*%\s*(?:complete|progress)/i,       // 45% complete
  ];
  
  return { cleanContent, tags, stateUpdateTags };
};
```

### 16.2 Markdown Formatting Fixes

The AI sometimes outputs malformed markdown. Aggressive cleanup is applied:

```typescript
// From fixBoldFormatting() in otakonTags.ts

function fixBoldFormatting(content: string): string {
  let result = content;
  
  // 1. Fix "** Text:**" malformation → "**Text:**"
  result = result.replace(/\*\*\s+([^*\n]+?):\*\*/g, '**$1:**');
  
  // 2. Fix split bold: "**Text**: content" → "**Text:** content"
  result = result.replace(/\*\*([^*\n]+?)\*\*:\s*/g, '**$1:** ');
  
  // 3. Fix orphaned asterisks at line start
  result = result.replace(/^\*\*\s*$/gm, '');
  
  // 4. Fix unpaired bold markers
  result = result.replace(/\*\*([^*]+)$/gm, '**$1**');
  
  // 5. Normalize headers: "##Title" → "## Title"
  result = result.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');
  
  // 6. Clean trailing whitespace
  result = result.replace(/[ \t]+$/gm, '');
  
  return result;
}
```

### 16.3 Progress Parsing (4 Fallback Formats)

The AI doesn't always output progress in the expected format:

```typescript
// Robust progress extraction with 4 fallback patterns

export function extractProgress(content: string, tags: Map<string, unknown>): number | null {
  // Priority 1: Already parsed in tags
  if (tags.has('PROGRESS')) {
    return tags.get('PROGRESS') as number;
  }
  
  // Priority 2: [OTAKON_PROGRESS: XX] format
  const bracketMatch = content.match(/\[OTAKON_PROGRESS:\s*(\d+)\]/i);
  if (bracketMatch) return parseInt(bracketMatch[1]);
  
  // Priority 3: "PROGRESS: XX" inline format
  const inlineMatch = content.match(/\bPROGRESS:\s*(\d+)/i);
  if (inlineMatch) return parseInt(inlineMatch[1]);
  
  // Priority 4: "XX% complete" natural language
  const percentMatch = content.match(/(\d+)\s*%\s*(?:complete|progress|through)/i);
  if (percentMatch) return parseInt(percentMatch[1]);
  
  // Priority 5: stateUpdateTags array
  // Already parsed from structured response schema
  
  return null;
}
```

---

## 17. App Behavior After AI Response

When an AI response is received in `MainApp.tsx`, a complex processing pipeline executes:

### 17.1 Response Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     AI RESPONSE RECEIVED                                 │
│  AIResponse { content, otakonTags, stateUpdateTags, suggestions, ... }  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────────┐
        ▼                            ▼                                ▼
┌───────────────┐          ┌───────────────┐              ┌───────────────┐
│  Display      │          │  Parse Tags   │              │  TTS/Notify   │
│  Message      │          │  Extract Data │              │  (optional)   │
└───────────────┘          └───────┬───────┘              └───────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  Check GAME_ID    │   │  Extract Progress │   │  Extract Subtab   │
│  Should create    │   │  PROGRESS: XX     │   │  Updates          │
│  new game tab?    │   │  OBJECTIVE: "..." │   │  SUBTAB_UPDATE    │
└────────┬──────────┘   └────────┬──────────┘   └────────┬──────────┘
         │                       │                       │
         ▼                       │                       │
┌───────────────────┐            │                       │
│  confidence=high? │            │    ┌──────────────────┘
│  ↓ YES            │            │    │
│  Create/Find Tab  │            │    │
│  Migrate Messages │◄───────────┴────┤
│  Switch Active    │                 │
└────────┬──────────┘                 │
         │                            │
         ▼                            ▼
┌───────────────────────────────────────────────────────────────┐
│                 APPLY DEFERRED UPDATES                         │
│  • Progress → target conversation (not source!)                │
│  • Objective → target conversation                             │
│  • Subtab updates → target conversation                        │
│  • Clear cache, refresh UI                                     │
└───────────────────────────────────────────────────────────────┘
         │
         ▼
┌───────────────────────────────────────────────────────────────┐
│              SET SUGGESTED PROMPTS                             │
│  • Use AI suggestions if provided                              │
│  • Filter out previously shown prompts                         │
│  • Fallback to context-aware defaults                          │
└───────────────────────────────────────────────────────────────┘
```

### 17.2 Key Processing Stages

#### Stage 1: Message Display
```typescript
// Add AI message to state immediately
const aiMessage = {
  id: `msg_${Date.now() + 1}`,
  content: response.content,
  role: 'assistant' as const,
  timestamp: Date.now(),
};

setConversations(prev => ({
  ...prev,
  [activeConversation.id]: {
    ...prev[activeConversation.id],
    messages: [...prev[activeConversation.id].messages, aiMessage],
    updatedAt: Date.now()
  }
}));
```

#### Stage 2: Tag Extraction
```typescript
// Progress updates (deferred until migration decision)
let progressUpdate: number | null = null;
let objectiveUpdate: string | null = null;

// From stateUpdateTags array
for (const tag of response.stateUpdateTags) {
  if (tag.startsWith('PROGRESS:')) {
    progressUpdate = parseInt(tag.split(':')[1].trim());
  }
  if (tag.startsWith('OBJECTIVE:')) {
    objectiveUpdate = tag.split(':')[1].trim();
  }
}

// Fallback to otakonTags Map
if (response.otakonTags.has('PROGRESS') && progressUpdate === null) {
  progressUpdate = response.otakonTags.get('PROGRESS') as number;
}
```

#### Stage 3: Game Tab Decision
```typescript
if (response.otakonTags.has('GAME_ID')) {
  const gameTitle = response.otakonTags.get('GAME_ID');
  const confidence = response.otakonTags.get('CONFIDENCE');
  
  // SIMPLIFIED: Only confidence matters now
  // IS_FULLSCREEN no longer blocks tab creation (camera photos work)
  const shouldCreateTab = confidence === 'high';
  
  if (shouldCreateTab) {
    // Check for existing game tab
    const targetConvId = gameTabService.generateGameConversationId(gameTitle);
    const existingGameTab = await ConversationService.getConversation(targetConvId);
    
    if (!existingGameTab) {
      // Create new game tab
      const newGameTab = await handleCreateGameTab({
        gameTitle, 
        genre, 
        aiResponse: response,
        isUnreleased
      });
    }
    
    // Migrate messages from Game Hub to game tab
    // ...
  }
}
```

---

## 18. Game Tab Creation Lifecycle

### 18.1 Tab Creation Process

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    gameTabService.createGameTab()                        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 1: IDEMPOTENCY CHECK                                              │
│  • Generate conversation ID: game-{sanitized-title}                     │
│  • Check if conversation already exists                                 │
│  • If exists → return existing tab (no duplicate creation)              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 2: TIER GATING                                                    │
│  • Check user tier (free, pro, vanguard_pro)                            │
│  • FREE users: No subtabs, no player profile injection                  │
│  • PRO users: Full subtabs based on genre + player profile              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Pro users only)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 3: GENERATE INITIAL SUBTABS                                       │
│  • Get genre config from insightTabsConfig                              │
│  • Generate unique UUIDs for each subtab (uuidv4)                       │
│  • Set status: 'loading' for all tabs                                   │
│  • Apply player profile modifiers to instructions                       │
│                                                                         │
│  SubTab structure:                                                      │
│  {                                                                      │
│    id: "sub_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", // UUID v4           │
│    title: "Story So Far",                                               │
│    type: "story",                                                       │
│    instruction: "...",      // Genre + profile-modified                 │
│    content: "",             // Empty initially                          │
│    status: "loading",       // Will become "loaded" or "error"          │
│    isNew: true              // Shows badge in UI                        │
│  }                                                                      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 4: CREATE CONVERSATION                                            │
│  {                                                                      │
│    id: "game-elden-ring",                                               │
│    title: "Elden Ring",                                                 │
│    gameTitle: "Elden Ring",                                             │
│    gameId: "elden-ring",                                                │
│    genre: "Souls-like",                                                 │
│    subtabs: [...],          // Generated subtabs                        │
│    subtabsOrder: [...],     // Ordered subtab IDs                       │
│    isGameHub: false,                                                    │
│    isUnreleased: false,                                                 │
│    messages: [],                                                        │
│    gameProgress: 0,                                                     │
│    activeObjective: null,                                               │
│    createdAt: Date.now(),                                               │
│    updatedAt: Date.now()                                                │
│  }                                                                      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 5: DUAL-WRITE SUBTABS                                             │
│  • Write to normalized `conversation_subtabs` table                     │
│  • Also write to JSONB column (backward compatibility)                  │
│  • subtabsService.setSubtabs() handles both                             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 6: TRIGGER BACKGROUND INSIGHTS GENERATION                         │
│  • generateInitialInsights() runs async (non-blocking)                  │
│  • Uses conversation context + AI to populate subtab content            │
│  • Updates subtabs from 'loading' → 'loaded' status                     │
│  • UI polls for updates every 8 seconds                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 18.2 Tier-Based Subtab Generation

```typescript
// From gameTabService.generateInitialSubTabs()

if (tier === 'free') {
  // No subtabs for free users - they only get chat
  return [];
}

// Get genre-specific config
const genreConfig = insightTabsConfig[genre] || insightTabsConfig['Default'];

// Generate subtabs with UUIDs
const subtabs = genreConfig.map(config => ({
  id: `sub_${uuidv4()}`,  // Globally unique ID
  title: config.title,
  type: config.type,
  instruction: playerProfile 
    ? profileAwareTabService.modifyInstruction(config.instruction, playerProfile)
    : config.instruction,
  content: '',
  status: 'loading' as const,
  isNew: true
}));
```

### 18.3 Background Insight Generation

```typescript
// From gameTabService.generateInitialInsights()

async generateInitialInsights(
  conversation: Conversation,
  playerProfile?: PlayerProfile
): Promise<void> {
  
  // Build context from conversation messages or summary
  let conversationContext = '';
  
  if (conversation.contextSummary) {
    conversationContext = `Summary: ${conversation.contextSummary}`;
  }
  
  // Add recent 5 messages for context
  const recentMessages = conversation.messages.slice(-5);
  conversationContext += recentMessages
    .map(m => `${m.role}: ${m.content.substring(0, 500)}`)
    .join('\n');
  
  // Build instructions for each subtab
  const instructions = conversation.subtabs!.map(tab => 
    `For "${tab.title}" (${tab.type}): ${tab.instruction}`
  ).join('\n\n');
  
  // Call Gemini for initial content
  const insights = await aiService.generateContent(prompt);
  
  // Map AI output to subtabs using titleToKeyMap
  const titleToKeyMap = {
    'Story So Far': 'story_so_far',
    'Boss Strategy': 'boss_strategy',
    'Hidden Paths': 'hidden_paths',
    // ... 30+ mappings for all genres
  };
  
  // Update subtabs with content
  const updatedSubTabs = conversation.subtabs.map(subTab => {
    const insightKey = titleToKeyMap[subTab.title];
    const content = insights[insightKey] || fallbackContent;
    return { ...subTab, content, status: 'loaded', isNew: false };
  });
  
  // Dual-write: table + JSONB
  await subtabsService.setSubtabs(conversation.id, updatedSubTabs);
}
```

---

## 19. Subtab Update Mechanisms

### 19.1 Three Update Pathways

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SUBTAB UPDATE TRIGGERS                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. PROGRESSIVE INSIGHT UPDATES (from structured response)              │
│     response.progressiveInsightUpdates: [                               │
│       { tabId: "sub_xxx", title: "Story So Far", content: "..." }       │
│     ]                                                                   │
│     → Applied after migration decision to TARGET conversation           │
│                                                                         │
│  2. OTAKON_SUBTAB_UPDATE (from OTAKON tags)                             │
│     [OTAKON_SUBTAB_UPDATE: {"tab": "story_so_far", "content": "..."}]   │
│     → Converted to progressiveInsightUpdates format                     │
│     → Tab name mapped to ID using tabNameToId dictionary                │
│                                                                         │
│  3. INSIGHT_UPDATE / MODIFY_PENDING / DELETE_REQUEST (Command Centre)  │
│     @story_so_far Update with new boss fight details                    │
│     → Parsed from OTAKON_INSIGHT_UPDATE tag                             │
│     → Direct subtab manipulation                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 19.2 Update Application Logic

```typescript
// From gameTabService.updateSubTabsFromAIResponse()

async updateSubTabsFromAIResponse(
  conversationId: string,
  updates: Array<{ tabId: string; title: string; content: string }>
): Promise<void> {
  
  // Get fresh conversation (avoid race conditions)
  const conversations = await ConversationService.getConversations(true);
  const conversation = conversations[conversationId];
  
  // Update with LINEAR PROGRESSION (append, not overwrite)
  const updatedSubTabs = conversation.subtabs.map(tab => {
    const update = updates.find(u => u.tabId === tab.id);
    if (update) {
      // Append new content with timestamp separator
      const timestamp = new Date().toLocaleString();
      const separator = '\n\n---\n**Updated: ' + timestamp + '**\n\n';
      
      // Only append if tab already has real content
      const shouldAppend = tab.content && 
                           tab.content.trim().length > 0 && 
                           tab.content !== 'Loading...' &&
                           tab.status === 'loaded';
      
      const newContent = shouldAppend
        ? tab.content + separator + update.content  // ✅ Append
        : update.content;  // First update
      
      return {
        ...tab,
        title: update.title || tab.title,
        content: newContent,
        isNew: true,  // Show badge
        status: 'loaded' as const
      };
    }
    return tab;
  });
  
  // Dual-write to normalized table
  await subtabsService.setSubtabs(conversationId, updatedSubTabs);
  ConversationService.clearCache();  // Force fresh reads
}
```

### 19.3 Tab Name to ID Mapping

When AI outputs tab updates by name (not UUID), they must be mapped:

```typescript
// Build mapping from tab title/type to UUID
const currentSubtabs = activeConversation.subtabs || [];
const tabNameToId: Record<string, string> = {};

currentSubtabs.forEach(subtab => {
  // Normalize title: "Story So Far" → "story_so_far"
  const normalizedTitle = subtab.title.toLowerCase().replace(/\s+/g, '_');
  tabNameToId[normalizedTitle] = subtab.id;
  
  // Also map by type
  if (subtab.type) {
    tabNameToId[subtab.type] = subtab.id;
  }
});

// Convert SUBTAB_UPDATE format
const mappedUpdates = subtabUpdates.map(update => {
  const tabId = tabNameToId[update.tab] || 
                tabNameToId[update.tab.toLowerCase().replace(/\s+/g, '_')];
  if (tabId) {
    return {
      tabId,
      title: update.tab.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
      content: update.content
    };
  }
  return null;
}).filter(Boolean);
```

---

## 20. Progress Tracking System Details

### 20.1 Progress Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROGRESS TRACKING LIFECYCLE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. AI RESPONSE                                                         │
│     • [OTAKON_PROGRESS: 35] tag in response                             │
│     • stateUpdateTags: ["PROGRESS: 35"]                                 │
│     • otakonTags.get('PROGRESS') → 35                                   │
│                                                                         │
│  2. EXTRACTION (MainApp.tsx)                                            │
│     let progressUpdate: number | null = null;                           │
│                                                                         │
│     // Check stateUpdateTags first                                      │
│     for (const tag of response.stateUpdateTags) {                       │
│       if (tag.startsWith('PROGRESS:')) {                                │
│         progressUpdate = parseInt(tag.split(':')[1].trim());            │
│       }                                                                 │
│     }                                                                   │
│                                                                         │
│     // Fallback to otakonTags                                           │
│     if (response.otakonTags.has('PROGRESS') && !progressUpdate) {       │
│       progressUpdate = response.otakonTags.get('PROGRESS');             │
│     }                                                                   │
│                                                                         │
│  3. DEFERRED APPLICATION                                                │
│     // DON'T apply immediately - wait for migration decision!           │
│     // If user uploads Game B screenshot from Game A chat,              │
│     // progress should go to Game B, not Game A                         │
│                                                                         │
│  4. APPLY TO TARGET                                                     │
│     const targetConversationId = /* after migration decision */;        │
│                                                                         │
│     if (progressUpdate !== null) {                                      │
│       await ConversationService.updateConversation(targetConvId, {      │
│         gameProgress: progressUpdate,                                   │
│         updatedAt: Date.now()                                           │
│       });                                                               │
│     }                                                                   │
│                                                                         │
│  5. UI DISPLAY                                                          │
│     • Progress bar in game tab header                                   │
│     • Percentage shown: "35% Complete"                                  │
│     • Color gradient based on progress                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 20.2 Objective Tracking

```typescript
// Objective is tracked alongside progress

let objectiveUpdate: string | null = null;

// From stateUpdateTags
if (tag.startsWith('OBJECTIVE:')) {
  objectiveUpdate = tag.split(':').slice(1).join(':').trim();
  // "OBJECTIVE: Defeat Margit, the Fell Omen" → "Defeat Margit, the Fell Omen"
}

// From otakonTags
if (response.otakonTags.has('OBJECTIVE')) {
  objectiveUpdate = response.otakonTags.get('OBJECTIVE') as string;
}

// Apply to conversation
await ConversationService.updateConversation(targetConvId, {
  activeObjective: objectiveUpdate,
  updatedAt: Date.now()
});
```

### 20.3 Progress Persistence

```typescript
// Database schema for progress tracking

conversations {
  id: string,
  game_progress: integer,        // 0-100
  active_objective: text,        // Current objective
  context_summary: text,         // AI-generated summary
  behavior_data: jsonb           // Includes topics, corrections
}
```

---

## 21. Message Migration Flow

When a screenshot is uploaded and a different game is detected:

### 21.1 Migration Decision Matrix

| Source | Detected Game | Action |
|--------|--------------|--------|
| Game Hub | New Game | Create tab, migrate messages |
| Game Hub | Existing Game | Use existing tab, migrate messages |
| Game A Tab | Game A | No migration (same game) |
| Game A Tab | Game B (New) | Create Game B tab, migrate messages |
| Game A Tab | Game B (Exists) | Use existing Game B tab, migrate messages |

### 21.2 Atomic Migration Process

```typescript
// From MessageRoutingService.migrateMessagesAtomic()

async migrateMessagesAtomic(
  messageIds: string[],
  sourceConversationId: string,
  targetConversationId: string
): Promise<void> {
  
  // 1. Update all messages in single transaction
  await supabase
    .from('messages')
    .update({ conversation_id: targetConversationId })
    .in('id', messageIds);
  
  // 2. Update conversation timestamps
  await Promise.all([
    ConversationService.updateConversation(sourceConversationId, {
      updatedAt: Date.now()
    }),
    ConversationService.updateConversation(targetConversationId, {
      updatedAt: Date.now()
    })
  ]);
  
  // 3. Clear caches
  ConversationService.clearCache();
}
```

### 21.3 Migration with Optimistic UI Update

```typescript
// MainApp.tsx - Migration flow

if (shouldMigrateMessages) {
  // Step 1: Optimistic UI update (instant)
  const messagesToMigrate = [userMsgWithDbId, aiMsgWithDbId];
  
  setConversations(prev => ({
    ...prev,
    [sourceConv.id]: {
      ...prev[sourceConv.id],
      messages: prev[sourceConv.id].messages.filter(
        m => !messageIds.includes(m.id)
      )
    },
    [targetConv.id]: {
      ...prev[targetConv.id],
      messages: [...prev[targetConv.id].messages, ...messagesToMigrate]
    }
  }));
  
  // Step 2: Set active to target WITH messages
  setActiveConversation({
    ...destConv,
    messages: [...destConv.messages, ...messagesToMigrate]
  });
  
  // Step 3: Database migration (background, non-blocking)
  await new Promise(resolve => setTimeout(resolve, 500));
  await MessageRoutingService.migrateMessagesAtomic(messageIds, source, target);
  
  // Step 4: Apply deferred updates to TARGET
  if (progressUpdate !== null) {
    await ConversationService.updateConversation(targetConvId, {
      gameProgress: progressUpdate
    });
  }
  
  // Step 5: Trigger subtab updates for target
  await gameTabService.updateSubtabsAfterMigration(targetConvId, response);
}
```

---

## 22. Complete Response Processing Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      handleSendMessage() START                          │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Rate Limiting Check (500ms minimum between requests)                │
│  2. Offline Queue Check (queue if offline)                              │
│  3. Credit/Usage Check (deplete if applicable)                          │
│  4. Context Summarization (if >10 messages)                             │
│  5. Call aiService.getChatResponseWithStructure()                       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI RESPONSE RECEIVED                              │
│  AIResponse {                                                           │
│    content: "cleaned markdown response",                                │
│    otakonTags: Map { GAME_ID, CONFIDENCE, PROGRESS, ... },              │
│    stateUpdateTags: ["PROGRESS: 35", "OBJECTIVE: ..."],                 │
│    suggestions: ["prompt1", "prompt2", "prompt3"],                      │
│    progressiveInsightUpdates: [{ tabId, title, content }],              │
│    gamePillData: { shouldCreate, gameName, genre }                      │
│  }                                                                      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    IMMEDIATE ACTIONS                                     │
│  • Add aiMessage to state (instant UI update)                           │
│  • Save to database (async)                                             │
│  • TTS speak hint (if hands-free mode)                                  │
│  • Show notification (if screen locked)                                 │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXTRACT & DEFER UPDATES                               │
│  • Extract progressUpdate from stateUpdateTags/otakonTags               │
│  • Extract objectiveUpdate from stateUpdateTags/otakonTags              │
│  • Store pendingSubtabUpdates (don't apply yet!)                        │
│  • Process suggestedPrompts, filter shown prompts                       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  SUBTAB UPDATE PROCESSING                                │
│  • Check for OTAKON_SUBTAB_UPDATE tag                                   │
│  • Convert tab names to UUIDs via tabNameToId                           │
│  • Call gameTabService.updateSubTabsFromAIResponse()                    │
│  • Refresh conversations state                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  • Check for OTAKON_INSIGHT_UPDATE (Command Centre)                     │
│  • Check for OTAKON_INSIGHT_MODIFY_PENDING                              │
│  • Check for OTAKON_INSIGHT_DELETE_REQUEST                              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     GAME TAB DECISION                                    │
│  Has GAME_ID tag?                                                       │
│    │                                                                    │
│    ├── NO → Skip to "Apply to Current Conversation"                     │
│    │                                                                    │
│    └── YES → Check confidence                                           │
│              │                                                          │
│              ├── confidence = "low" → Stay in current tab               │
│              │                                                          │
│              └── confidence = "high" → Tab Creation Decision            │
│                                        │                                │
│                                        ├── Tab exists?                  │
│                                        │   ├── YES → Use existing      │
│                                        │   └── NO → Create new         │
│                                        │                                │
│                                        └── Should migrate?              │
│                                            ├── Same convo → NO          │
│                                            └── Different → YES          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
        ┌────────────────────────────┴────────────────────────────┐
        │                                                          │
        ▼                                                          ▼
┌─────────────────────────┐                          ┌─────────────────────────┐
│  MIGRATION FLOW         │                          │  NO MIGRATION           │
├─────────────────────────┤                          ├─────────────────────────┤
│ 1. Optimistic UI update │                          │ Apply updates to        │
│ 2. Set active to target │                          │ CURRENT conversation:   │
│ 3. Database migration   │                          │ • progressUpdate        │
│ 4. Apply progress to    │                          │ • objectiveUpdate       │
│    TARGET conversation  │                          │ • subtab updates        │
│ 5. Apply objective to   │                          │ • suggested prompts     │
│    TARGET conversation  │                          │                         │
│ 6. updateSubtabsAfter-  │                          │                         │
│    Migration()          │                          │                         │
│ 7. Set suggested prompts│                          │                         │
│    for TARGET           │                          │                         │
│ 8. Poll for subtab      │                          │                         │
│    loading (8s delay)   │                          │                         │
│ 9. Apply deferred       │                          │                         │
│    subtab updates       │                          │                         │
└─────────────────────────┘                          └─────────────────────────┘
                          \                          /
                           \                        /
                            ▼                      ▼
                    ┌─────────────────────────────────────┐
                    │         handleSendMessage() END     │
                    │  • Loading state cleared            │
                    │  • AbortController reset            │
                    │  • UI reflects final state          │
                    └─────────────────────────────────────┘
```

---

## Summary of Key Features (Updated)

| Feature | File(s) | Purpose |
|---------|---------|---------|
| **3 Personas** | `promptSystem.ts` | Context-appropriate responses |
| **Gaming Guardrails** | `promptSystem.ts` | Keep focus on gaming topics |
| **17 Genre Configs** | `types/index.ts` | Genre-specific subtab instructions |
| **Player Profiles** | `profileAwareTabService.ts` | Personalized hint style, focus, tone |
| **Character Immersion** | `characterImmersionService.ts` | Genre-specific personality |
| **Non-Repetition** | `behaviorService.ts` | Track discussed topics |
| **User Corrections** | `correctionService.ts` | Apply user preferences |
| **Context Summarization** | Edge Function | Handle long conversations |
| **OTAKON Tag Parsing** | `otakonTags.ts` | Extract structured data from AI |
| **Progress Tracking** | `MainApp.tsx`, `gameTabService.ts` | Track game completion |
| **Structured Responses** | `aiService.ts` | JSON schema mode for consistency |
| **Tab Creation** | `gameTabService.ts` | Idempotent, tier-gated game tabs |
| **Subtab Updates** | `gameTabService.ts`, `subtabsService.ts` | Progressive content updates |
| **Message Migration** | `MessageRoutingService.ts` | Atomic cross-tab message moves |
| **@Commands** | `tabManagementService.ts` | User-controlled subtab management |

---

*This report documents the complete AI instruction, context injection, and post-response processing system as of December 5, 2025.*
