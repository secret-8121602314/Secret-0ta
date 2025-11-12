# AI Response & Game Tab Logic - Complete Documentation

**Date:** October 21, 2025  
**Purpose:** Comprehensive guide to how AI responses, subtab content, game tabs, and suggested prompts work

---

## Table of Contents
1. [AI Response Generation Flow](#ai-response-generation-flow)
2. [Three AI Personas & Prompts](#three-ai-personas--prompts)
3. [Subtab Content Generation](#subtab-content-generation)
4. [Game Tab Behavior & Auto-Creation](#game-tab-behavior--auto-creation)
5. [Suggested Prompts Logic](#suggested-prompts-logic)
6. [OTAKON Tags System](#otakon-tags-system)
7. [Improvements & Recommendations](#improvements--recommendations)

---

## 1. AI Response Generation Flow

### **Entry Point: `MainApp.tsx` → `handleSendMessage()`**

```
User sends message
  ↓
handleSendMessage() triggered
  ↓
Check query limits (text/image credits)
  ↓
Add user message to conversation
  ↓
Apply context summarization (if >10 messages)
  ↓
Call aiService.getChatResponseWithStructure()
  ↓
AI generates response based on context
  ↓
Parse OTAKON tags from response
  ↓
Add AI message to conversation
  ↓
Process suggested prompts
  ↓
Handle game tab creation (if game detected)
  ↓
Handle subtab updates (if progressive updates)
  ↓
Hands-free TTS (if enabled)
```

### **Key Services Involved:**

| Service | Role |
|---------|------|
| `aiService.ts` | Main AI interaction (Gemini 2.5 Flash) |
| `promptSystem.ts` | Persona-based prompt generation |
| `conversationService.ts` | Message persistence & retrieval |
| `gameTabService.ts` | Game tab creation & management |
| `suggestedPromptsService.ts` | Suggested prompts processing |
| `contextSummarizationService.ts` | Context compression for long conversations |
| `characterImmersionService.ts` | Game-specific immersive context |
| `profileAwareTabService.ts` | Player profile-based subtabs |

---

## 2. Three AI Personas & Prompts

The AI adapts its personality and response style based on the conversation context.

### **Persona 1: General Gaming Assistant (Game Hub)**

**When Used:**
- User is in "Game Hub" (Everything Else tab)
- No specific game is selected
- General gaming questions

**Prompt Structure:**
```typescript
getGeneralAssistantPrompt(userMessage)
```

**Capabilities:**
- ✅ Answer general gaming questions
- ✅ Recommend games
- ✅ Provide gaming news & trends
- ✅ **Auto-detect game mentions** and trigger game tab creation
- ✅ Generate news-related suggested prompts

**Example Queries:**
- "What's a good RPG to play?"
- "How do I beat the first boss in Elden Ring?" → **Creates Elden Ring tab**
- "Tell me about upcoming releases"

**OTAKON Tags Used:**
```
[OTAKON_GAME_ID: Elden Ring]
[OTAKON_CONFIDENCE: high]
[OTAKON_GENRE: Action RPG]
[OTAKON_SUGGESTIONS: ["What are the best starting classes?", ...]]
```

---

### **Persona 2: Game Companion (Game-Specific Tab)**

**When Used:**
- User is in a game-specific conversation tab
- Game title & genre are known
- Playing or Planning mode

**Prompt Structure:**
```typescript
getGameCompanionPrompt(conversation, userMessage, user, isActiveSession, playerProfile)
```

**Context Provided to AI:**
1. **Game Info:** Title, genre, progress, current objective
2. **Session Mode:** Playing (active) vs Planning (not active)
3. **Player Profile:** Hint style, player focus, tone, spoiler preference
4. **Subtab Content:** All loaded subtabs (story, tips, walkthrough, etc.)
5. **Recent Messages:** Last 10 messages for conversation continuity
6. **Immersion Context:** Game-specific lore and atmosphere

**Capabilities:**
- ✅ Immersive, in-character responses
- ✅ Reference existing subtab content for consistency
- ✅ Update subtabs with new information (progressive updates)
- ✅ Set objectives when player progresses
- ✅ Adapt to player profile (balanced/detailed hints, story/gameplay focus)
- ✅ Generate contextual follow-up prompts
- ✅ Respect spoiler preferences

**Example Queries:**
- "How do I beat Margit?" → Checks "Boss Strategies" subtab, provides tactical advice
- "Tell me about Malenia's lore" → References "Lore" subtab, adds new insights
- "I just defeated Godrick" → Updates "Story So Far" subtab, sets new objective

**Command Centre Integration:**
```
User: "@story_so_far I just defeated the first boss"
AI: Updates story_so_far subtab with new progress
```

**OTAKON Tags Used:**
```
[OTAKON_INSIGHT_UPDATE: {"id": "story_so_far", "content": "..."}]
[OTAKON_OBJECTIVE_SET: {"description": "Explore Liurnia of the Lakes"}]
[OTAKON_SUGGESTIONS: ["What should I do next?", ...]]
```

---

### **Persona 3: Screenshot Analyst (Image Uploads)**

**When Used:**
- User uploads a screenshot or image
- Works in both Game Hub and game-specific tabs

**Prompt Structure:**
```typescript
getScreenshotAnalysisPrompt(conversation, userMessage, user, playerProfile)
```

**Capabilities:**
- ✅ **Identify game from screenshot** (high/low confidence)
- ✅ Detect fullscreen gameplay vs menus
- ✅ Provide lore-rich, contextual analysis
- ✅ Avoid describing obvious UI elements
- ✅ Focus on significance, not description
- ✅ **Auto-create game tab** if game is identified
- ✅ Detect unreleased games (no tab creation)

**Response Format (Mandatory):**
```markdown
Hint: [Game Name] - [Actionable hint about what to do]

Lore: [Rich lore explanation about current situation, characters, story significance]

Places of Interest: [Nearby locations, NPCs, items, quests]
```

**Example Analysis:**
```markdown
Hint: Elden Ring - Focus on dodging Margit's delayed attacks and punish during his recovery frames.

Lore: Margit the Fell Omen is a manifestation of Morgott's power, sent to guard the path to Stormveil Castle. His presence here shows how far Morgott's influence extends to prevent Tarnished from reaching the Elden Ring.

Places of Interest: After defeating Margit, proceed through the castle gates. Inside, you'll find Nepheli Loux (summonable NPC), Gatekeeper Gostoc (hidden path vendor), and the Rampart Tower Site of Grace.
```

**OTAKON Tags Used:**
```
[OTAKON_GAME_ID: Elden Ring]
[OTAKON_CONFIDENCE: high]
[OTAKON_GENRE: Action RPG]
[OTAKON_IS_FULLSCREEN: true]
[OTAKON_GAME_STATUS: unreleased] ← Only if game not released
[OTAKON_SUGGESTIONS: ["How do I beat this boss?", ...]]
```

---

## 3. Subtab Content Generation

### **Initial Subtab Population (New Game Tab)**

**Flow:**
```
User asks about a game (e.g., "How do I beat the first boss in Elden Ring?")
  ↓
AI detects game mention → Returns OTAKON_GAME_ID tag
  ↓
MainApp detects OTAKON_GAME_ID → Calls handleCreateGameTab()
  ↓
gameTabService.createGameTab() called
  ↓
generateInitialSubTabs() based on genre & player profile
  ↓
Create subtabs with "Loading..." status
  ↓
extractInsightsFromAIResponse() - Use AI response for first subtab
  ↓
Return game tab immediately (non-blocking)
  ↓
generateInitialInsights() runs in background
  ↓
aiService.generateInitialInsights() - AI generates content for all subtabs
  ↓
updateConversation() - Save subtab content to database
  ↓
UI auto-refreshes to show loaded subtabs
```

### **Genre-Based Subtabs**

Subtabs are configured based on game genre in `types/index.ts`:

```typescript
insightTabsConfig = {
  'Action RPG': [
    { id: 'story_so_far', title: 'Story So Far', type: 'lore' },
    { id: 'boss_strategies', title: 'Boss Strategies', type: 'guide' },
    { id: 'builds', title: 'Character Builds', type: 'guide' },
    { id: 'hidden_secrets', title: 'Secrets & Easter Eggs', type: 'tips' }
  ],
  'FPS': [
    { id: 'weapons_loadouts', title: 'Weapons & Loadouts', type: 'guide' },
    { id: 'maps_tactics', title: 'Maps & Tactics', type: 'guide' },
    { id: 'competitive_tips', title: 'Competitive Tips', type: 'tips' }
  ],
  // ... more genres
}
```

### **Profile-Aware Subtabs**

If user has completed profile setup, additional personalized subtabs are added:

**Player Focus: Story**
- `character_relationships` - Character dynamics and interactions
- `plot_analysis` - Deep dive into narrative themes

**Player Focus: Gameplay**
- `advanced_mechanics` - Pro tips and techniques
- `speedrun_strats` - Optimization strategies

**Player Focus: Exploration**
- `hidden_areas` - Secret locations and Easter eggs
- `collectibles_guide` - 100% completion guide

**Player Focus: Completionist**
- `achievements_guide` - Achievement hunting tips
- `platinum_roadmap` - Full completion roadmap

### **Progressive Subtab Updates**

AI can update existing subtabs during conversation:

**Method 1: AI-Driven Updates**
```
User: "I just defeated Margit and entered Stormveil Castle"
  ↓
AI analyzes progress
  ↓
Returns progressiveInsightUpdates in response
  ↓
gameTabService.updateSubTabsFromAIResponse()
  ↓
"Story So Far" subtab updated with new progress
  ↓
Subtab marked with "new" indicator
```

**Method 2: Command Centre**
```
User: "@story_so_far I defeated Godrick and got the Great Rune"
  ↓
AI recognizes @ command
  ↓
Returns [OTAKON_INSIGHT_UPDATE: {"id": "story_so_far", "content": "..."}]
  ↓
MainApp processes OTAKON_INSIGHT_UPDATE tag
  ↓
Subtab updated immediately
```

---

## 4. Game Tab Behavior & Auto-Creation

### **Game Detection & Tab Creation Flow**

```
┌─────────────────────────────────────────────────────────────┐
│ User Message/Screenshot Sent                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ AI Analyzes Message/Image                                    │
│ - Text: Checks for game title mentions                       │
│ - Image: Identifies game from visual elements                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ AI Returns OTAKON Tags                                        │
│ [OTAKON_GAME_ID: Elden Ring]                                 │
│ [OTAKON_CONFIDENCE: high]                                    │
│ [OTAKON_GENRE: Action RPG]                                   │
│ [OTAKON_GAME_STATUS: unreleased] ← Only if not released      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ MainApp checks shouldCreateTab                                │
│ ✅ confidence === 'high'                                      │
│ ✅ NOT unreleased                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
                   ┌───────┴────────┐
                   │                │
        ┌──────────▼──────┐  ┌─────▼──────────┐
        │ Existing Game   │  │ New Game       │
        │ Tab Found       │  │ Create Tab     │
        └──────────┬──────┘  └─────┬──────────┘
                   │                │
                   └───────┬────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ If currently in Game Hub:                                     │
│ 1. Move user message to game tab                             │
│ 2. Move AI response to game tab                              │
│ 3. Remove messages from Game Hub                             │
│ 4. Switch to game tab                                        │
│ 5. Auto-enable Playing mode                                  │
└─────────────────────────────────────────────────────────────┘
```

### **Game Hub vs Game Tab Behavior**

| Feature | Game Hub | Game-Specific Tab |
|---------|----------|-------------------|
| **Purpose** | General gaming questions | Deep dive into specific game |
| **AI Persona** | General Assistant | Game Companion |
| **Subtabs** | None | Genre-based + profile-specific |
| **Game Detection** | ✅ Auto-creates game tabs | N/A (already in game) |
| **Suggested Prompts** | Gaming news prompts | Contextual game prompts |
| **Session Mode** | Always Planning | Playing or Planning |
| **Message Migration** | ✅ Messages move to game tab when detected | No migration |

### **Screenshot Handling**

**Case 1: Screenshot in Game Hub**
```
1. User uploads Elden Ring screenshot
2. AI identifies game → [OTAKON_GAME_ID: Elden Ring]
3. Creates "Elden Ring" tab (or uses existing)
4. Moves screenshot + response to Elden Ring tab
5. Auto-switches to Elden Ring tab
```

**Case 2: Screenshot in Game Tab**
```
1. User uploads screenshot while in Elden Ring tab
2. AI provides lore-rich analysis
3. No new tab created (already in correct tab)
4. Response stays in current tab
```

**Case 3: Screenshot of Unreleased Game**
```
1. User uploads GTA VI screenshot
2. AI detects → [OTAKON_GAME_STATUS: unreleased]
3. NO game tab created (stays in Game Hub)
4. Response explains game isn't released yet
```

**Case 4: Menu/Launcher Screenshot**
```
1. User uploads Steam launcher screenshot
2. AI detects → [OTAKON_IS_FULLSCREEN: false]
3. If released game detected, still creates tab (they own it)
4. If no game detected, stays in Game Hub
```

### **Existing Game Tab vs New Game Tab**

**New Game Tab:**
- Created when game is first detected
- Starts with empty message history
- Subtabs have "Loading..." status initially
- AI generates insights in background
- Auto-switches to Playing mode

**Existing Game Tab:**
- Found by matching `gameTitle` (case-insensitive)
- Preserves all previous messages
- Subtabs already loaded
- Continues conversation seamlessly
- Respects current session mode

---

## 5. Suggested Prompts Logic

### **How Suggested Prompts Are Generated**

**Priority Order:**
```
1. AI-generated prompts (followUpPrompts)
   ↓
2. Fallback to suggestions from OTAKON_SUGGESTIONS tag
   ↓
3. Fallback to static prompts (Game Hub) or generic game prompts
```

### **AI-Generated Prompts (Best)**

AI generates contextual prompts based on conversation:

**In Game Hub:**
```json
[
  "What's the best RPG for beginners?",
  "Tell me about upcoming releases",
  "How do I get started with Elden Ring?"
]
```

**In Game Tab (Context-Aware):**
```json
[
  "What's the best strategy for this boss?",
  "Tell me about this area's lore",
  "What items should I look for here?"
]
```

### **Static News Prompts (Game Hub)**

When AI doesn't provide prompts in Game Hub, use these:

```typescript
newsPrompts = [
  "🎮 What are the latest gaming news and updates?",
  "🚀 Tell me about upcoming game releases this month",
  "🏆 Which games won awards recently?",
  "💬 What's trending in the gaming community?"
]
```

**Reset Logic:**
- Prompts marked as "used" when clicked
- All prompts reset every 24 hours
- Reset on login/app restart
- Ensures fresh daily news content

### **Fallback Game Prompts**

When AI doesn't provide prompts in game tabs:

```typescript
[
  "What should I do next in this area?",
  "Tell me about the story so far",
  "Give me some tips for this game"
]
```

### **Processing Flow**

```typescript
// In MainApp.tsx handleSendMessage()
const suggestionsToUse = response.followUpPrompts || response.suggestions;
const processedSuggestions = suggestedPromptsService.processAISuggestions(suggestionsToUse);

if (processedSuggestions.length > 0) {
  setSuggestedPrompts(processedSuggestions); // Use AI prompts
} else {
  // Fallback
  const fallbackSuggestions = suggestedPromptsService.getFallbackSuggestions(
    activeConversation.id, 
    activeConversation.isGameHub
  );
  setSuggestedPrompts(fallbackSuggestions);
}
```

---

## 6. OTAKON Tags System

### **What Are OTAKON Tags?**

Special markers embedded in AI responses to trigger app-level actions.

**Format:**
```
[OTAKON_TAG_NAME: value]
```

**Parsing:**
- Extracted by `parseOtakonTags()` in `otakonTags.ts`
- Removed from displayed content (invisible to user)
- Stored in `response.otakonTags` Map
- Processed by `MainApp.tsx` after response

### **Complete Tag Reference**

| Tag | Purpose | Example Value | Action Triggered |
|-----|---------|---------------|------------------|
| `GAME_ID` | Identify game | `"Elden Ring"` | Create/switch to game tab |
| `CONFIDENCE` | Detection confidence | `"high"` or `"low"` | Only create tab if high |
| `GENRE` | Game genre | `"Action RPG"` | Determine subtab structure |
| `GAME_STATUS` | Release status | `"unreleased"` | Block tab creation |
| `IS_FULLSCREEN` | Screenshot type | `true` or `false` | Informational only |
| `TRIUMPH` | Victory detection | `{"type": "boss_defeated", "name": "Margit"}` | Show celebration |
| `OBJECTIVE_SET` | New player goal | `{"description": "Explore Liurnia"}` | Update objective tracker |
| `INSIGHT_UPDATE` | Update subtab | `{"id": "story_so_far", "content": "..."}` | Update subtab content |
| `INSIGHT_MODIFY_PENDING` | Rename subtab | `{"id": "tips", "title": "Combat Tips", "content": "..."}` | Modify subtab |
| `INSIGHT_DELETE_REQUEST` | Delete subtab | `{"id": "unused_tab"}` | Remove subtab |
| `SUGGESTIONS` | Follow-up prompts | `["prompt1", "prompt2", "prompt3"]` | Display as suggested prompts |

### **Example AI Response with Tags**

```markdown
[OTAKON_GAME_ID: Elden Ring]
[OTAKON_CONFIDENCE: high]
[OTAKON_GENRE: Action RPG]
[OTAKON_IS_FULLSCREEN: true]
[OTAKON_OBJECTIVE_SET: {"description": "Defeat Margit the Fell Omen"}]
[OTAKON_SUGGESTIONS: ["What are Margit's attack patterns?", "What level should I be?", "Can I summon help?"]]

Hint: Elden Ring - Margit telegraphs his attacks heavily. Watch for the golden glow on his weapons—that's your cue to dodge.

Lore: Margit the Fell Omen guards the entrance to Stormveil Castle on behalf of Morgott the Grace-Given. He's a manifestation of Morgott's power, sent to prevent Tarnished from reaching the Elden Ring.

Places of Interest: After defeating Margit, proceed through the castle gates. Look for Nepheli Loux near the Secluded Cell—she can be summoned for the next boss fight.
```

**After Parsing:**
- Tags extracted: `Map { GAME_ID: "Elden Ring", CONFIDENCE: "high", ... }`
- Clean content displayed to user (all tags removed)
- MainApp processes tags to create game tab, set objective, show suggestions

---

## 7. Improvements & Recommendations

### **Current Strengths ✅**

1. **Adaptive AI Personas** - Different prompts for different contexts
2. **Progressive Subtab Updates** - AI can update existing content
3. **Player Profile Integration** - Personalized hints and subtabs
4. **Auto Game Detection** - Smart screenshot analysis
5. **Context Summarization** - Keeps conversations manageable
6. **Message Migration** - Seamless transfer from Game Hub to game tabs
7. **Command Centre** - @ commands for direct subtab control
8. **Hands-Free Mode** - TTS integration for accessibility

### **Potential Improvements 🚀**

#### **1. Enhanced AI Response Quality**

**Current Issue:** AI sometimes provides generic responses

**Improvements:**
```typescript
// Add more context to prompts
const enhancedPrompt = `
${basePrompt}

**Recent Player Activity:**
- Last played: ${conversation.lastActivityTimestamp}
- Recent achievements: ${recentAchievements}
- Stuck points: ${identifyStuckPoints()}

**Available Resources:**
- Player level: ${playerStats.level}
- Equipment: ${playerStats.equipment}
- Skills unlocked: ${playerStats.skills}
`;
```

**Benefits:**
- More personalized advice
- Contextual difficulty recommendations
- Better progression tracking

#### **2. Smarter Suggested Prompts**

**Current Issue:** Fallback prompts are too generic

**Improvements:**
```typescript
// Generate prompts based on current game state
const contextualPrompts = [
  `What's the best strategy for ${currentBoss}?`,
  `How do I progress in ${currentArea}?`,
  `Tell me about ${nearbyNPC}'s questline`,
  `What items should I get before ${nextObjective}?`
];
```

**Benefits:**
- More relevant suggestions
- Higher engagement
- Reduced "dead-end" questions

#### **3. Subtab Intelligence**

**Current Issue:** Subtabs are static after initial generation

**Improvements:**
```typescript
// Auto-update subtabs as conversation progresses
class SmartSubtabManager {
  async analyzeConversationForUpdates(conversation: Conversation) {
    const updates: SubtabUpdate[] = [];
    
    // Detect new bosses mentioned
    if (newBossDetected) {
      updates.push({
        tabId: 'boss_strategies',
        content: generateBossGuide(boss)
      });
    }
    
    // Detect new areas explored
    if (newAreaDetected) {
      updates.push({
        tabId: 'story_so_far',
        content: updateStoryProgress(area)
      });
    }
    
    return updates;
  }
}
```

**Benefits:**
- Living, evolving subtabs
- No manual updates needed
- Always current information

#### **4. Multi-Modal AI Understanding**

**Current Issue:** Screenshot analysis limited to game identification

**Improvements:**
```typescript
// Deep image analysis
const enhancedScreenshotAnalysis = {
  gameDetection: true,
  visualElements: [
    { type: 'enemy', name: 'Margit', healthPercent: 45 },
    { type: 'player', healthPercent: 20, staminaPercent: 10 },
    { type: 'environment', name: 'Bridge to Stormveil' }
  ],
  situationAnalysis: 'Player is low on health and stamina during boss fight',
  urgentAdvice: 'Disengage and heal immediately - you have enough distance'
};
```

**Benefits:**
- Real-time tactical advice
- Situational awareness
- Emergency guidance

#### **5. Voice Command Integration**

**Current Issue:** Hands-free mode is output-only (TTS)

**Improvements:**
```typescript
// Add voice input
class VoiceCommandService {
  startListening() {
    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript;
      
      if (command.includes('help with boss')) {
        sendMessage('How do I beat this boss?');
      }
      
      if (command.includes('read latest tip')) {
        readSubtab('tips');
      }
    };
  }
}
```

**Benefits:**
- True hands-free gaming
- Accessibility for disabled players
- Gaming while multitasking

#### **6. Multiplayer/Co-op Context**

**Current Issue:** No awareness of multiplayer sessions

**Improvements:**
```typescript
// Add co-op context
const multiplayerPrompt = `
**Multiplayer Context:**
- Playing with: ${friendsList}
- Party size: ${partySize}
- Roles: ${playerRoles}

Provide advice optimized for co-op play, including:
- Role-specific strategies
- Team composition tips
- Communication recommendations
`;
```

**Benefits:**
- Co-op specific advice
- Team strategy suggestions
- Better multiplayer experience

#### **7. Learning from User Behavior**

**Current Issue:** AI doesn't adapt to user preferences over time

**Improvements:**
```typescript
// Track user preferences
class UserBehaviorTracker {
  analyzeUserPreferences(user: User) {
    return {
      prefersDetailedGuides: user.interactions.detailedResponseClicks > 10,
      enjoysLoreContent: user.interactions.loreSubtabViews > 20,
      needsBasicTips: user.interactions.difficultyLevel === 'beginner',
      playstyle: detectPlaystyle(user.gameProgress)
    };
  }
}

// Adapt prompts based on behavior
const adaptivePrompt = `
**User Behavior Analysis:**
${userBehavior.prefersDetailedGuides ? 'Provide comprehensive, step-by-step guides' : 'Keep advice concise and actionable'}
${userBehavior.enjoysLoreContent ? 'Include rich lore and story context' : 'Focus on gameplay mechanics'}
`;
```

**Benefits:**
- Personalized experience
- Better user satisfaction
- Reduced irrelevant information

#### **8. Competitive/Speedrun Mode**

**Current Issue:** No optimization for competitive players

**Improvements:**
```typescript
// Add competitive context
const competitivePrompt = `
**Competitive Context:**
- Player goal: ${speedrun ? 'Speedrun' : 'Competitive PvP'}
- Current record: ${personalBest}
- Optimization focus: ${optimizationGoals}

Provide:
- Frame-perfect strategies
- Advanced movement techniques
- Meta-game analysis
- Time-saving routes
`;
```

**Benefits:**
- Advanced player support
- Speedrunner community engagement
- Esports integration potential

#### **9. News Integration (Game Hub)**

**Current Issue:** Gaming news prompts are static, not real

**Improvements:**
```typescript
// Integrate real gaming news API
class GameHubNewsService {
  async fetchLatestNews() {
    const news = await fetch('https://api.igdb.com/v4/articles');
    return news.map(article => ({
      title: article.title,
      summary: article.summary,
      url: article.url,
      publishedAt: article.publishedAt
    }));
  }
  
  generateNewsPrompts() {
    return [
      `Tell me about ${topNews[0].title}`,
      `What's new with ${trendingGame}?`,
      `Should I buy ${upcomingRelease}?`
    ];
  }
}
```

**Benefits:**
- Real gaming news
- Relevant daily prompts
- Increased engagement

#### **10. Error Recovery & Retry Logic**

**Current Issue:** Failed AI requests don't retry intelligently

**Improvements:**
```typescript
// Smart retry with fallback
class SmartRetryService {
  async generateResponseWithFallback(conversation: Conversation) {
    try {
      // Try primary model (Gemini 2.5 Flash)
      return await aiService.getChatResponse(...);
    } catch (error) {
      console.warn('Primary model failed, trying fallback');
      
      // Try secondary model (Gemini 1.5 Flash)
      return await aiService.getChatResponseFallback(...);
    } catch (error) {
      // Use cached responses if available
      return await cacheService.getSimilarResponse(...);
    } catch (error) {
      // Return helpful error message
      return generateOfflineResponse(conversation);
    }
  }
}
```

**Benefits:**
- Higher reliability
- Better user experience
- Graceful degradation

---

## Summary: How It All Works Together

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User sends message or uploads screenshot                     │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. MainApp determines context:                                   │
│    - Game Hub → General Assistant                                │
│    - Game Tab → Game Companion                                   │
│    - Image → Screenshot Analyst                                  │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. promptSystem builds persona-specific prompt with:             │
│    - Player profile (hint style, focus, tone)                    │
│    - Conversation history (last 10 messages)                     │
│    - Subtab context (existing knowledge)                         │
│    - Session mode (Playing vs Planning)                          │
│    - Immersion context (game lore & atmosphere)                  │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. aiService calls Gemini 2.5 Flash with prompt                 │
│    - JSON mode for structured responses (text only)              │
│    - Regular mode for image analysis                             │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. AI generates response with OTAKON tags:                       │
│    - Content: Main response text                                 │
│    - Tags: GAME_ID, CONFIDENCE, GENRE, SUGGESTIONS, etc.         │
│    - Progressive updates: Subtab updates (optional)              │
│    - Follow-up prompts: Contextual suggestions (optional)        │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. parseOtakonTags extracts tags and cleans content              │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. MainApp processes response:                                   │
│    ✅ Add AI message to conversation                             │
│    ✅ Process suggested prompts (AI or fallback)                 │
│    ✅ Handle game detection (create/switch tabs)                 │
│    ✅ Update subtabs (progressive updates)                       │
│    ✅ Process Command Centre commands                            │
│    ✅ Trigger TTS (if hands-free enabled)                        │
│    ✅ Auto-switch to Playing mode (if game help request)         │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. UI updates:                                                    │
│    - Display AI response                                         │
│    - Show suggested prompts                                      │
│    - Highlight updated subtabs (new indicator)                   │
│    - Switch to new game tab (if created)                         │
│    - Update session mode indicator                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: Key Files

| File | Purpose |
|------|---------|
| `aiService.ts` | AI API calls (Gemini) |
| `promptSystem.ts` | Persona prompts |
| `otakonTags.ts` | Tag parsing |
| `gameTabService.ts` | Game tab management |
| `suggestedPromptsService.ts` | Prompt processing |
| `contextSummarizationService.ts` | Context compression |
| `characterImmersionService.ts` | Game atmosphere |
| `profileAwareTabService.ts` | Profile-based subtabs |
| `MainApp.tsx` | Main orchestration |

---

**Documentation Complete!** 🎉

This document covers the complete AI response generation, subtab content creation, game tab behavior, and suggested prompts logic. Use this as a reference for understanding or improving the system.
