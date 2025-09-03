# 🎯 OTAKON AI SYSTEM - COMPLETE BREAKDOWN

## 📋 Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [AI Personas & Routing](#ai-personas--routing)
3. [Query Processing Flow](#query-processing-flow)
4. [User Experience by Tier](#user-experience-by-tier)
5. [Technical Implementation](#technical-implementation)
6. [Query Scenarios & Examples](#query-scenarios--examples)
7. [Performance & Optimization](#performance--optimization)
8. [Error Handling & Fallbacks](#error-handling--fallbacks)

---

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

### **Core Design Philosophy**
Otakon uses a **3-Persona AI Architecture** that automatically routes queries based on:
- **Content Type** (Text, Image, Text+Image)
- **Conversation Context** (Game-specific vs General)
- **User Tier** (Free vs Pro vs Vanguard)
- **Query Intent** (Game help, News, General gaming)

### **System Components**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input   │───▶│  Query Router   │───▶│  AI Personas    │
│ (Text/Image)   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Context Engine  │    │ Response Parser │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
```

---

## 🎭 AI PERSONAS & ROUTING

### **PERSONA 1: THE INITIAL ANALYST (Image-Based Queries)**

#### **Activation Triggers**
- F1/F2 hotkey screenshots from PC client
- Manual image uploads with or without text
- Any query containing images

#### **Core Responsibilities**
1. **Game Identification & Analysis**
   - Analyzes visual cues (UI, art style, characters)
   - **MUST use web search** to verify game identity
   - **MUST verify release date** via search
   - Returns structured tags: `[OTAKON_GAME_ID]`, `[OTAKON_CONFIDENCE]`, `[OTAKON_GAME_PROGRESS]`, `[OTAKON_GENRE]`

2. **Response Structure (5 Mandatory Sections)**
   ```
   **Game Analysis** - Confidence level and visual assessment
   **Current Situation** - What's happening in screenshot
   **Helpful Hints** - 2-3 actionable, spoiler-free hints
   **Lore & Context** - Background information
   **Next Steps** - What to explore next
   ```

3. **Special Protocols**
   - **Triumph Protocol**: Detects victory screens with `[OTAKON_TRIUMPH]`
   - **Inventory Scanner**: Identifies gear with `[OTAKON_INVENTORY_ANALYSIS]`
   - **Progress Tracking**: Updates game completion percentage

#### **System Instructions**
```typescript
**OTAKON MASTER PROMPT V19 - SCREENSHOT ANALYSIS**
- Game Identification & Analysis (CRITICAL FIRST STEP)
- RESPONSE STRUCTURE & FORMATTING (CRITICAL FOR READABILITY)
- Primary Hint & Narrative
- Triumph Protocol
- Inventory Scanner
- Game Progress Line
- SPOILER-FREE GUIDANCE
```

---

### **PERSONA 2: THE GAME COMPANION (Text-Only Game Chats)**

#### **Activation Triggers**
- Follow-up questions in existing game conversations
- Text queries in game-specific tabs
- Any conversation where `conversation.id !== 'everything-else'`

#### **Core Responsibilities**
1. **Context-Aware Responses**
   - References `[META_STORY_SO_FAR]` - Full journey summary
   - Uses `[META_ACTIVE_OBJECTIVE]` - Current quest/task
   - Tracks `[META_INVENTORY]` - Player's gear

2. **Spoiler-Gating System**
   - **STRICTLY FORBIDDEN** from revealing solutions to incomplete objectives
   - Provides cryptic, lore-friendly hints instead of direct answers
   - Only discusses completed objectives freely

3. **Automatic Journey Logging**
   - Updates `[OTAKON_INSIGHT_UPDATE]` after significant progress
   - Sets new objectives with `[OTAKON_OBJECTIVE_SET]`
   - Tracks objective completion with `[OTAKON_OBJECTIVE_COMPLETE]`

4. **Response Structure (4 Sections)**
   ```
   **Current Context** - Recent progress and situation
   **Helpful Guidance** - Actionable hints without spoilers
   **Lore & Background** - Story context and world-building
   **Next Steps** - What to explore next
   ```

#### **System Instructions**
```typescript
**OTAKON MASTER PROMPT V19 - GAME COMPANION (TEXT-ONLY)**
- OBJECTIVE SPOILER-GATING (THE MOST IMPORTANT RULE)
- IMPLICIT JOURNEY LOGGING (LONG-TERM MEMORY)
- NEW OBJECTIVE IDENTIFICATION
- RESPONSE STRUCTURE & FORMATTING
- SPOILER-FREE FOLLOW-UP LOGIC
- Insight Management
```

---

### **PERSONA 3: GENERAL ASSISTANT & TRIAGE (General Gaming)**

#### **Activation Triggers**
- 'Everything else' tab conversations
- General gaming questions not tied to specific games
- Gaming news and culture queries

#### **Core Responsibilities**
1. **Intent Classification**
   - **INTENT 1: Specific Game Help**
     - User mentions specific game/level/boss by name
     - **MUST use web search** to verify release status
     - Returns structured tags for game identification
     - Provides spoiler-free help based on estimated progress

   - **INTENT 2: General Gaming Topics**
     - Gaming news, culture, general topics
     - Direct answers without game-specific context

2. **Response Structure (4 Sections)**
   ```
   **Direct Answer** - Clear response to question
   **Additional Context** - Relevant background info
   **Related Information** - Helpful related details
   **Next Steps** - What to explore next
   ```

#### **System Instructions**
```typescript
**OTAKON MASTER PROMPT V19 - GENERAL ASSISTANT & TRIAGE (TEXT-ONLY)**
- INTENT 1: SPECIFIC GAME IDENTIFICATION & HELP (CRITICAL)
- INTENT 2: GENERAL QUESTIONS & NEWS
- RESPONSE STRUCTURE & FORMATTING
- SPOILER-FREE PRINCIPLE
```

---

## 🔄 QUERY PROCESSING FLOW

### **1. Initial Query Processing**
```typescript
// Check for knowledge base response first
const smartResponse = await gameKnowledgeService.getSmartResponse(text.trim(), gameTitle);

if (smartResponse.source === 'knowledge_base' && smartResponse.confidence >= 0.8) {
    // Use cached knowledge base response (no AI call needed)
    return { success: true, reason: 'knowledge_base_response' };
}
```

### **2. Context Injection**
```typescript
let metaNotes = '';
if(sourceConversation.id !== EVERYTHING_ELSE_ID) {
    if (sourceConversation.insights?.story_so_far?.content) {
        metaNotes += `[META_STORY_SO_FAR: ${sourceConversation.insights.story_so_far.content}]\n`;
    }
    if (sourceConversation.activeObjective) {
        metaNotes += `[META_ACTIVE_OBJECTIVE: ${JSON.stringify(sourceConversation.activeObjective)}]\n`;
    }
    if (sourceConversation.inventory?.length) {
        metaNotes += `[META_INVENTORY: ${sourceConversation.inventory.join(', ')}]\n`;
    }
}
```

### **3. AI Model Selection**
```typescript
const getOptimalModel = (task: string): GeminiModel => {
    if (task === 'insight_generation') {
        return 'gemini-2.5-pro';  // Better for complex analysis
    }
    return 'gemini-2.5-flash';   // Faster, cheaper for chat/images
};
```

### **4. Response Processing & Routing**
```typescript
// Extract structured data from AI response
const gameIdMatch = rawTextResponse.match(/\[OTAKON_GAME_ID:\s*(.*?)\]/);
const genreMatch = rawTextResponse.match(/\[OTAKON_GENRE:\s*(.*?)\]/);
const progressMatch = rawTextResponse.match(/\[OTAKON_GAME_PROGRESS:\s*(\d+)\]/);

// Route to appropriate conversation tab
if (identifiedGameId && (sourceConvoId === EVERYTHING_ELSE_ID || identifiedGameId !== sourceConvoId)) {
    finalTargetConvoId = identifiedGameId; // Switch to game-specific tab
}
```

---

## 👥 USER EXPERIENCE BY TIER

### **FREE TIER USERS**

#### **Query Limits**
- **Text Queries**: 55 per month
- **Image Queries**: 25 per month
- **Concurrent Analysis**: Limited to 1 at a time

#### **AI Response Quality**
- **Model**: Gemini 2.5 Flash (faster, cost-effective)
- **Response Structure**: Basic formatting with section breaks
- **Context**: Limited to current conversation
- **Insights**: No access to insight tabs

#### **Features Available**
- Basic conversation features
- Standard response quality
- Screenshot analysis (F1/F2 hotkeys)
- Game identification and hints
- Basic progress tracking

#### **Limitations**
- Cannot process multiple screenshots simultaneously
- No insight tab generation
- Limited context injection
- Basic response formatting
- No hands-free voice response

---

### **PRO TIER USERS**

#### **Query Limits**
- **Text Queries**: 1,583 per month
- **Image Queries**: 328 per month
- **Concurrent Analysis**: Multiple screenshots simultaneously

#### **AI Response Quality**
- **Model**: Gemini 2.5 Pro for insights, Flash for chat
- **Response Structure**: Enhanced formatting with clear sections
- **Context**: Full story progression, objectives, inventory
- **Insights**: Comprehensive insight tab generation

#### **Features Available**
- Enhanced conversation features
- Improved response quality
- Priority support
- No advertisements
- Batch screenshot processing
- Real-time insight updates
- Hands-free voice response
- Advanced progress tracking

#### **Advanced Capabilities**
- **Insight Tab Generation**: Automatic creation of story, objectives, tips, etc.
- **Real-time Updates**: Insights update during AI responses
- **Context Continuity**: Full conversation history and progress
- **Objective Tracking**: Active quest monitoring and completion
- **Inventory Management**: Automatic gear cataloging

---

### **VANGUARD PRO TIER USERS**

#### **Query Limits**
- **Text Queries**: 1,583 per month
- **Image Queries**: 328 per month
- **All Pro features** plus exclusive content

#### **Additional Features**
- Exclusive Vanguard content
- VIP support
- Early access to new features
- Revenue sharing opportunities
- Founder's Council access

---

## 🎯 SPECIFIC QUERY SCENARIOS & HANDLING

### **SCENARIO 1: First-Time Screenshot (New Game)**

#### **Free User Experience**
1. **Persona 1** activates (Image Analysis)
2. **Web search** verifies game identity and release status
3. **Creates new conversation tab** for the game
4. **Basic response** with game ID, genre, progress, hints
5. **No insight tabs** generated
6. **Limited context** for future queries

#### **Pro User Experience**
1. **Persona 1** activates (Image Analysis)
2. **Web search** verifies game identity and release status
3. **Creates new conversation tab** for the game
4. **Generates instant insight tabs** with placeholder content
5. **Background generation** of comprehensive insights
6. **Enhanced response** with structured sections and rich context
7. **Full progress tracking** and metadata

---

### **SCENARIO 2: Follow-up Question (Same Game)**

#### **Free User Experience**
1. **Persona 2** activates (Game Companion)
2. **Limited context injection**: basic conversation history
3. **Basic spoiler-gating** based on current progress
4. **Standard response** without advanced formatting
5. **No insight updates** or objective tracking

#### **Pro User Experience**
1. **Persona 2** activates (Game Companion)
2. **Full context injection**: story so far, active objective, inventory
3. **Advanced spoiler-gating** with objective tracking
4. **Updates insights** in real-time during response
5. **Maintains conversation continuity** with rich metadata
6. **Automatic objective completion** detection

---

### **SCENARIO 3: New Game Mention (Text Query)**

#### **Free User Experience**
1. **Persona 3** activates (General Assistant)
2. **Web search** verifies game existence and release status
3. **Creates new game tab** if it's a specific game
4. **Basic routing** to appropriate conversation
5. **Limited metadata** updates

#### **Pro User Experience**
1. **Persona 3** activates (General Assistant)
2. **Web search** verifies game existence and release status
3. **Creates new game tab** with full setup
4. **Advanced routing** with insight tab preparation
5. **Comprehensive metadata** and progress tracking setup

---

### **SCENARIO 4: Non-Gaming Query**

#### **All Tiers**
1. **Persona 3** activates (General Assistant)
2. **Declines politely** with gaming focus message
3. **Redirects** to gaming-related topics
4. **Maintains** gaming assistant persona

---

## 🔧 TECHNICAL IMPLEMENTATION DETAILS

### **Memory & Context Management**
- **Local Storage**: Conversations, insights, progress
- **Real-time Updates**: Insights update during AI streaming
- **Context Injection**: Automatic meta-data inclusion
- **Progress Tracking**: Game completion percentage

### **Performance Optimizations**
- **Knowledge Base Caching**: Avoids AI calls for common queries
- **Model Selection**: Flash for chat, Pro for insights
- **Batch Processing**: Multiple insights generated simultaneously
- **Streaming Responses**: Real-time updates and TTS

### **Error Handling & Fallbacks**
- **Quota Management**: Cooldown periods for rate limits
- **Network Resilience**: Abort controllers and retry logic
- **Graceful Degradation**: Fallback to simpler models
- **User Feedback**: Clear error messages and suggestions

---

## 📊 QUERY ROUTING MATRIX

| Query Type | Free User | Pro User | Persona Activated | Response Quality |
|------------|-----------|----------|-------------------|------------------|
| **Screenshot (New Game)** | Basic | Enhanced | Persona 1 | Basic vs Rich |
| **Screenshot (Existing Game)** | Basic | Enhanced | Persona 1 | Basic vs Rich |
| **Text Follow-up (Game)** | Basic | Enhanced | Persona 2 | Basic vs Rich |
| **Text Follow-up (General)** | Basic | Enhanced | Persona 3 | Basic vs Rich |
| **New Game Mention** | Basic | Enhanced | Persona 3 | Basic vs Rich |
| **Insight Generation** | ❌ None | ✅ Full | Persona 2 | N/A vs Rich |
| **Batch Processing** | ❌ Single | ✅ Multiple | Persona 1 | Limited vs Full |
| **Voice Response** | ❌ None | ✅ Full | All | N/A vs Full |

---

## 🚀 PERFORMANCE & OPTIMIZATION

### **AI Model Selection Strategy**
```typescript
// Optimize for cost and performance
const getOptimalModel = (task: string): GeminiModel => {
    if (task === 'insight_generation') {
        return 'gemini-2.5-pro';  // Better for complex analysis
    }
    return 'gemini-2.5-flash';   // Faster, cheaper for chat/images
};
```

### **Knowledge Base Integration**
- **Smart Response Caching**: Avoids AI calls for common queries
- **Confidence Threshold**: 80% confidence required for cache usage
- **Learning System**: Improves responses over time
- **Tier-Aware Caching**: Different strategies for free vs pro

### **Streaming & Real-time Updates**
- **Chunk Processing**: Real-time response streaming
- **Insight Updates**: Live updates during AI responses
- **Progress Tracking**: Continuous metadata updates
- **TTS Integration**: Real-time text-to-speech

---

## 🛡️ ERROR HANDLING & FALLBACKS

### **Quota Management**
```typescript
const checkCooldown = (onError: (error: string) => void): boolean => {
    const cooldownEnd = localStorage.getItem(COOLDOWN_KEY);
    if (cooldownEnd && Date.now() < parseInt(cooldownEnd, 10)) {
        const timeRemaining = Math.ceil((parseInt(cooldownEnd, 10) - Date.now()) / (1000 * 60));
        onError(`The AI is currently resting due to high traffic. Please try again in about ${timeRemaining} minute(s).`);
        return true;
    }
    return false;
};
```

### **Network Resilience**
- **Abort Controllers**: User-initiated cancellation
- **Retry Logic**: Automatic retry for failed requests
- **Graceful Degradation**: Fallback to simpler models
- **Offline Support**: Local storage for conversation history

### **User Experience Protection**
- **Clear Error Messages**: User-friendly error descriptions
- **Progress Preservation**: Maintains conversation state
- **Tier-Aware Limits**: Respects user subscription limits
- **Upgrade Prompts**: Encourages tier upgrades when appropriate

---

## 📈 ANALYTICS & TRACKING

### **User Behavior Tracking**
```typescript
// Track user query patterns
gameAnalyticsService.trackUserQuery({
    conversationId: activeConversationId,
    queryType: imageQueries > 0 ? 'image' : 'text',
    queryText: text.trim(),
    hasImages: imageQueries > 0,
    imageCount: imageQueries,
    queryLength: text.trim().length,
    responseTimeMs: 0,
    success: true,
    gameContext: sourceConversation.id !== EVERYTHING_ELSE_ID ? { gameId: sourceConversation.id } : undefined
});
```

### **AI Response Analysis**
- **Response Length**: Track AI response complexity
- **Code Detection**: Identify technical responses
- **Image Analysis**: Monitor image processing success
- **User Satisfaction**: Track successful vs failed interactions

### **Tier Performance Comparison**
- **Free vs Pro Usage**: Analyze feature adoption
- **Response Quality**: Compare AI response satisfaction
- **Feature Utilization**: Track insight tab usage
- **Upgrade Conversion**: Monitor tier upgrade patterns

---

## 🔮 FUTURE ENHANCEMENTS

### **Planned Features**
- **Advanced Context Understanding**: Better game state recognition
- **Multi-language Support**: International gaming communities
- **Enhanced Voice Integration**: More natural TTS responses
- **Community Features**: User-generated content sharing

### **AI Model Improvements**
- **Custom Fine-tuning**: Otakon-specific model training
- **Multi-modal Understanding**: Better image-text correlation
- **Context Memory**: Longer conversation history retention
- **Personalization**: User-specific response adaptation

---

## 📝 CONCLUSION

The Otakon AI system represents a sophisticated, tier-aware gaming assistant that provides:

1. **Intelligent Query Routing**: Automatic persona selection based on content and context
2. **Tier-Based Experience**: Significantly enhanced capabilities for Pro users
3. **Context Continuity**: Rich conversation history and progress tracking
4. **Spoiler-Free Guidance**: Intelligent content filtering based on user progress
5. **Performance Optimization**: Cost-effective AI model selection and caching
6. **Real-time Updates**: Live insight generation and progress tracking

This architecture ensures that users get the most appropriate AI assistance for their gaming needs while maintaining a clear upgrade path from free to pro tiers. The system's ability to adapt responses based on user context, game progress, and subscription level creates a personalized gaming companion experience that grows with the user's needs.

---

*Last Updated: December 2024*  
*Version: 1.0*  
*Author: Otakon Development Team*
# Otakon AI System Architecture & Constitution

This document outlines the core principles, master prompts, logic, and rules that govern the Otakon AI assistant. The logic is primarily managed within the `services/geminiService.ts` file.

## The Otakon Constitution: Core Prompts & Personas

The heart of Otakon's intelligence is a dynamic system instruction, or "master prompt," that changes based on the context. This "constitution" ensures the AI behaves consistently and adheres to its most important rule: **no spoilers**.

The AI operates under three distinct personas:

### 1. The Screenshot Analyst (When an image is provided)
This is the initial point of contact for most interactions. Its directives are:
- **Identify & Verify:** Its absolute first job is to identify the game from the screenshot. It forms a hypothesis and then **must** use its web search tool to verify the game's identity and official release date. An incorrect identification is considered a critical failure.
- **Provide Core Data:** It embeds structured data in its response using special tags like `[OTAKON_GAME_ID: ...]`, `[OTAKON_CONFIDENCE: high/low]`, `[OTAKON_GENRE: ...]`, and `[OTAKON_GAME_PROGRESS: ...]`. This data is used by the app to create or switch to the correct game conversation tab and update the progress bar.
- **Deliver the Hint:** After providing the data tags, it gives a spoiler-free hint based on the user's request and the image context. For Text-to-Speech in Hands-Free mode, the specific hint portion is wrapped in `[OTAKON_HINT_START]` and `[OTAKON_HINT_END]` tags.

### 2. The Game Companion (For ongoing, text-only chats in a specific game's tab)
Once a game has been identified, the AI switches to this persona.
- **Context is King:** It receives context from the app, such as the `[META_STORY_SO_FAR]` and the current `[META_ACTIVE_OBJECTIVE]`.
- **Strict Spoiler-Gating:** It is strictly forbidden from revealing the solution to an active objective. Its hints must be a mix of cryptic, lore-friendly clues and gentle suggestions about what the player could *do* or where they could *go*.
- **Automated Journaling:** It's responsible for automatically updating the "Story So Far" insight tab by appending new events using the `[OTAKON_INSIGHT_UPDATE: ...]` tag.
- **Insight Management:** It responds to user commands like `@Tab Name \modify [new content]` to manage the game-specific wiki tabs.

### 3. The General Assistant & Triage (For the "Everything Else" chat tab)
This persona's job is to figure out what the user wants.
- **Intent Detection:** If a user asks a question about a specific, named game (e.g., "how do I beat Malenia in Elden Ring?"), it follows the "Analyst" protocol to identify the game, estimate progress, provide the answer, and create a new conversation tab for that game.
- **General Queries:** If the user asks about general gaming news or topics, it answers directly without trying to create a new game session.

## Universal Rules (Apply to all Personas)

- **Strictly Gaming-Focused:** The AI will politely refuse any request not related to video games.
- **No Spoilers:** This is the most important rule, enforced by gating its knowledge to the player's current context.
- **Prompt Injection Defense:** It is instructed to ignore any user attempts to change its core rules.
- **Mandatory Suggestions:** At the end of almost every response, it MUST provide four inquisitive follow-up questions (e.g., "What's the lore behind this weapon?") using the `[OTAKON_SUGGESTIONS: ["...", "..."]]` tag. This keeps the conversation flowing.

## The AI Response Handling Flow

When you send a message, here's the journey it takes:

1.  **Pre-flight Check:** The app first checks if you've hit your monthly query limit. If so, it shows the upgrade screen.
2.  **Context Injection:** The app gathers relevant context (like your story summary and active objective for a specific game) and prepends it to your prompt as `[META_...]` tags.
3.  **API Call:** Your prompt, along with any images and the relevant system instruction (the "persona"), is sent to the Gemini API (`gemini-2.5-flash` model). Pro users use a more powerful model for certain tasks.
4.  **Raw Response Parsing (The Magic Step):** The AI sends back a raw text stream that is a mix of human-readable text and the special `[OTAKON_...]` tags. The app parses this stream in real-time.
    - The `GAME_ID` tag tells the app which conversation tab to use or create.
    - The `GAME_PROGRESS` tag updates the progress bar.
    - `INSIGHT_UPDATE` and other insight tags update the Pro-feature wiki tabs in the background.
    - `TRIUMPH` triggers the confetti and celebratory UI.
    - `INVENTORY_ANALYSIS` logs your gear to the conversation's state.
    - `HINT_START`/`HINT_END` tags are used to extract the precise text for the Text-to-Speech engine in Hands-Free mode.
5.  **UI Update:** As the raw response is parsed, the tags are stripped out, and only the clean, narrative text is displayed to you in the chat bubble.
6.  **Asynchronous Actions:** For Pro users, after the initial hint is delivered, the app makes separate, asynchronous calls to the AI to generate the detailed content for all the insight tabs (like Lore, Build Guides, etc.) in the background.

This structured, tag-based system allows Otakon to function as a stateful, context-aware companion rather than just a simple chatbot, creating a much more intelligent and personalized experience.