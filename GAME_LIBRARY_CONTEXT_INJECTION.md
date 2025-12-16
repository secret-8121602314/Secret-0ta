# Game Library Context Injection

## Overview
The AI now receives context about **all game tabs** the user has created. This enables smarter decisions about tab routing, prevents duplicate tab creation, and allows for better game recommendations based on the user's gaming library.

## Implementation

### New Function: `buildGameLibraryContext()`
**Location:** `src/services/promptSystem.ts`

**Purpose:**
- Retrieves all user conversations via `ConversationService.getConversations()`
- Filters for game tabs (non-Game Hub conversations with game titles)
- Formats them as structured context for AI awareness

**Output Format:**
```
📚 USER'S GAME LIBRARY (X games):
  • Game Title [Genre] (X% progress) [UNRELEASED]
  • Another Game [Genre] (X% progress)
  ...

USAGE INSTRUCTIONS:
- User already has tabs for these games - route related queries to existing tabs
- If user asks about a game NOT in this list, you can suggest creating a new tab
- Use this context to provide related game suggestions
- Reference user's gaming preferences based on their library
```

### Integration Points

The game library context is now injected into **all three prompt types**:

1. **Game Companion Prompt** (`getGameCompanionPrompt`)
   - Positioned after Player Profile, before Game Knowledge
   - Helps AI understand user's full gaming ecosystem
   - Enables smart tab routing when user mentions different games

2. **Screenshot Analysis Prompt** (`getScreenshotAnalysisPrompt`)
   - Positioned after Player Profile, before Progress Context
   - Helps AI identify which game tab to route screenshots to
   - Can suggest "You already have a tab for this game!"

3. **Unreleased Game Prompt** (`getUnreleasedGamePrompt`)
   - Positioned after Player Profile
   - Helps AI suggest related games while user waits for release
   - Can recommend games from user's existing library

## Benefits

### 1. **Prevents Duplicate Tab Creation**
Before this feature:
```
User: "Help me with Elden Ring"
AI: Creates new Elden Ring tab [even if one exists]
```

After this feature:
```
User: "Help me with Elden Ring"
AI: Detects existing Elden Ring tab → Routes to it
```

### 2. **Better Game Recommendations**
The AI can now say:
- "Since you play Dark Souls and Elden Ring, you might enjoy Lies of P"
- "You have tabs for all Souls games - are you a FromSoftware fan?"
- "Based on your library (Cyberpunk, Fallout), you seem to enjoy RPGs with choice-driven narratives"

### 3. **Smarter Tab Routing**
When user mentions a game in the wrong tab:
```
User in Elden Ring tab: "What's in Jig Jig Street?"
AI: Detects Cyberpunk 2077 content
    → Checks library context
    → Finds existing Cyberpunk tab
    → Routes query there (via game detection tags)
```

### 4. **Context-Aware Suggestions**
When user asks "What should I play next?":
- AI can reference games they DON'T have tabs for
- Can suggest games similar to their existing library
- Can identify gaps (e.g., "You play lots of RPGs but no strategy games")

## Technical Details

### Performance Impact
- **Minimal:** The function retrieves conversations from cache (already loaded)
- **Filtering:** Fast - just checking `isGameHub` and `gameTitle` properties
- **Output Size:** Small - typically 10-30 lines of text (~500-1000 chars)
- **Token Cost:** ~125-250 tokens (negligible within 900K input budget)

### Error Handling
- Graceful degradation: If retrieval fails, returns empty string
- No crash risk: Try-catch block with console warning
- User experience unchanged if error occurs

### Conversation Service Integration
```typescript
import { ConversationService } from './conversationService';

async function buildGameLibraryContext(): Promise<string> {
  try {
    const conversations = await ConversationService.getConversations();
    // ... filtering and formatting logic
  } catch (error) {
    console.warn('[PromptSystem] Failed to build game library context:', error);
    return ''; // Graceful degradation
  }
}
```

## Example Output

### User with 3 Games:
```
📚 USER'S GAME LIBRARY (3 games):
  • Cyberpunk 2077 [Action RPG] (45% progress)
  • Elden Ring [Action RPG] (80% progress)
  • Hades [Roguelike] (25% progress)

USAGE INSTRUCTIONS:
- User already has tabs for these games - route related queries to existing tabs
- If user asks about a game NOT in this list, you can suggest creating a new tab
- Use this context to provide related game suggestions
- Reference user's gaming preferences based on their library
```

### New User (No Games):
```
📚 USER'S GAME LIBRARY:
No game tabs created yet. User is new or exploring games.
```

## Usage Scenarios

### Scenario 1: Duplicate Prevention
**User:** "I want help with Dark Souls 3"
**AI Response:** "I can see you already have a Dark Souls 3 tab! Would you like me to route this conversation there, or would you prefer to create a separate tab for a specific build/challenge?"

### Scenario 2: Related Recommendations
**User:** "What should I play next?"
**AI Response:** "Based on your library (Elden Ring, Dark Souls 3, Bloodborne), you clearly enjoy FromSoftware games! Since you don't have a tab for Sekiro yet, I'd highly recommend it - it's their take on fast-paced samurai combat..."

### Scenario 3: Tab Routing Intelligence
**User in Game Hub:** "How do I beat Margit?"
**AI:** Detects Elden Ring content
     → Checks library: User has Elden Ring tab
     → Includes [OTAKON_GAME_ID: Elden Ring] tag
     → System routes to existing tab automatically

### Scenario 4: Gaming Preference Understanding
**User:** "Recommend me some new releases"
**AI Response:** "Looking at your library, you seem to enjoy narrative-driven RPGs (Cyberpunk, Mass Effect, Witcher 3). Here are some upcoming releases that match your style..."

## Future Enhancements

### Potential Additions:
1. **Genre Analysis:**
   - "You play 80% RPGs, 20% Action games - want to try a strategy game?"
   
2. **Completion Tracking:**
   - "You're close to finishing 3 games! Focus on completing them first?"
   
3. **Play Time Insights:**
   - "Based on message count, Elden Ring is your most-discussed game"
   
4. **Achievement Tracking:**
   - Integration with subtab data to show completionist progress

5. **Cross-Game Recommendations:**
   - "You loved X mechanic in Game A - Game B has similar systems"

## Maintenance Notes

### If Adding New Conversation Fields:
Update the filtering logic in `buildGameLibraryContext()` to include new metadata:
```typescript
.map(conv => ({
  title: conv.gameTitle!,
  genre: conv.genre || 'Unknown',
  progress: conv.gameProgress || 0,
  isUnreleased: conv.isUnreleased || false,
  // Add new fields here
}))
```

### If Changing Prompt Structure:
The context is injected using `${gameLibraryContext}` in these locations:
- `getGameCompanionPrompt` → After `${profileContext}`, before `${gameKnowledgeContext}`
- `getScreenshotAnalysisPrompt` → After `${profileContext}`, before `${progressContext}`
- `getUnreleasedGamePrompt` → After `${profileContext}`

## Testing Checklist

- [x] Function retrieves conversations correctly
- [x] Filtering excludes Game Hub
- [x] Formatting includes all game metadata
- [x] Error handling prevents crashes
- [x] Integration with all three prompt types
- [x] TypeScript compilation succeeds
- [x] No runtime errors in console

## Related Files
- `src/services/promptSystem.ts` - Main implementation
- `src/services/conversationService.ts` - Data source
- `src/types/index.ts` - Conversation type definitions

## Conclusion

This feature significantly enhances Otagon's awareness of the user's gaming ecosystem, enabling:
- **Smarter routing** → No more duplicate tabs
- **Better recommendations** → Personalized to user's taste
- **Context-aware responses** → AI understands user's full gaming context
- **Improved UX** → More helpful, less redundant interactions

The implementation is lightweight, error-resistant, and seamlessly integrated into existing prompt generation logic.
