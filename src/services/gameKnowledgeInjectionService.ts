/**
 * Game Knowledge Injection Service
 * 
 * Determines which game knowledge (if any) should be injected into the AI prompt
 * BEFORE the AI generates a response.
 * 
 * NEW STRATEGY (Dec 16, 2025):
 * - Inject knowledge with CONDITIONAL USAGE INSTRUCTIONS
 * - AI verifies game context before using the knowledge
 * - If query is about different game, AI ignores the knowledge
 * - This allows us to inject knowledge even when uncertain
 * 
 * Previous limitation (now solved):
 * - Screenshots couldn't be pre-analyzed without AI call
 * - Had to skip knowledge injection to prevent wrong context
 * 
 * Current approach:
 * - Always inject knowledge when available (even for screenshots)
 * - Include clear instructions: "Only use if query is about [GAME]"
 * - AI intelligently ignores knowledge if game doesn't match
 * - Best of both worlds: Knowledge available when right, ignored when wrong
 * 
 * @created December 16, 2025
 * @updated December 16, 2025 - Added conditional usage instructions
 */

import type { Conversation } from '../types';
import { gameKnowledgeCacheService } from './gameKnowledgeCacheService';
import { libraryStorage } from './gamingExplorerStorage';

/**
 * Common game title variations for fast text-based detection
 */
const GAME_PATTERNS = [
  // Souls-like
  { pattern: /\b(elden ring)\b/i, game: 'Elden Ring' },
  { pattern: /\b(dark souls 3|ds3|darksouls 3)\b/i, game: 'Dark Souls III' },
  { pattern: /\b(dark souls 2|ds2|darksouls 2)\b/i, game: 'Dark Souls II' },
  { pattern: /\b(dark souls|ds1|darksouls)\b/i, game: 'Dark Souls' },
  { pattern: /\b(bloodborne)\b/i, game: 'Bloodborne' },
  { pattern: /\b(sekiro)\b/i, game: 'Sekiro: Shadows Die Twice' },
  
  // Popular games
  { pattern: /\b(god of war ragnarok|gow ragnarok)\b/i, game: 'God of War Ragnarök' },
  { pattern: /\b(god of war|gow)\b/i, game: 'God of War' },
  { pattern: /\b(horizon forbidden west|hfw)\b/i, game: 'Horizon Forbidden West' },
  { pattern: /\b(zelda totk|tears of the kingdom)\b/i, game: 'The Legend of Zelda: Tears of the Kingdom' },
  { pattern: /\b(zelda botw|breath of the wild)\b/i, game: 'The Legend of Zelda: Breath of the Wild' },
  { pattern: /\b(baldur's gate 3|bg3)\b/i, game: "Baldur's Gate 3" },
  { pattern: /\b(witcher 3)\b/i, game: 'The Witcher 3: Wild Hunt' },
  { pattern: /\b(cyberpunk 2077|cyberpunk)\b/i, game: 'Cyberpunk 2077' },
  { pattern: /\b(minecraft)\b/i, game: 'Minecraft' },
  { pattern: /\b(terraria)\b/i, game: 'Terraria' },
  { pattern: /\b(stardew valley)\b/i, game: 'Stardew Valley' },
  { pattern: /\b(hollow knight)\b/i, game: 'Hollow Knight' },
  { pattern: /\b(hades)\b/i, game: 'Hades' },
  { pattern: /\b(celeste)\b/i, game: 'Celeste' },
  
  // Generic patterns (lower priority)
  { pattern: /\bplaying\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4})\b/, capture: 1 },
  { pattern: /\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4})\b/, capture: 1 },
  { pattern: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,4})\s+boss\b/, capture: 1 }
];

/**
 * Fast game detection from text message
 * Returns normalized game title or null if not detected
 */
function detectGameFromText(message: string): string | null {
  const normalized = message.trim();
  
  for (const { pattern, game, capture } of GAME_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      return game || (capture ? match[capture] : null);
    }
  }
  
  return null;
}

/**
 * Determine which game knowledge should be injected for this query
 * Returns game title to use for knowledge lookup, or null for no injection
 */
export async function determineGameForKnowledgeInjection(
  conversation: Conversation,
  userMessage: string,
  hasImage: boolean
): Promise<string | null> {
  
  // ✅ STRATEGY: Always try to provide knowledge when available
  // The AI has conditional usage instructions and will:
  // 1. Verify if query matches the knowledge game
  // 2. Use knowledge if match
  // 3. Ignore knowledge if different game
  // This works for ALL scenarios: text, images, and combinations
  
  // Priority 1: Check if text mentions a specific game
  const detectedGame = detectGameFromText(userMessage);
  
  if (detectedGame) {
    console.log(`📝 [KnowledgeInjection] Game detected from text: "${detectedGame}"`);
    
    if (conversation.gameTitle && detectedGame.toLowerCase() !== conversation.gameTitle.toLowerCase()) {
      console.log(`🔄 [KnowledgeInjection] Different game mentioned: "${detectedGame}" (current tab: "${conversation.gameTitle}")`);
    }
    
    return detectedGame;
  }
  
  // Priority 2: Use current tab's game (if in game tab)
  // Even for screenshots - AI will verify and ignore if wrong game
  if (conversation.gameTitle) {
    if (hasImage) {
      console.log(`📷 [KnowledgeInjection] Screenshot in "${conversation.gameTitle}" tab → Injecting knowledge WITH conditional instructions`);
      console.log(`💡 [KnowledgeInjection] AI will verify game context and ignore if screenshot is different game`);
    } else {
      console.log(`🎮 [KnowledgeInjection] Text in "${conversation.gameTitle}" tab → Using tab's knowledge`);
    }
    return conversation.gameTitle;
  }
  
  // Priority 3: No game context available
  console.log(`❓ [KnowledgeInjection] No game context → Using AI training data only`);
  return null;
}

/**
 * Get game knowledge context string for AI prompt injection
 * Returns formatted knowledge string or empty string
 */
export async function getGameKnowledgeContext(
  conversation: Conversation,
  userMessage: string,
  hasImage: boolean
): Promise<string> {
  const gameTitle = await determineGameForKnowledgeInjection(conversation, userMessage, hasImage);
  
  if (!gameTitle) {
    return '';
  }
  
  // Look up IGDB ID from library
  const libraryGame = libraryStorage.getByGameTitle(gameTitle);
  if (!libraryGame?.igdbGameId) {
    console.warn(`⚠️ [KnowledgeInjection] Game "${gameTitle}" not in library, no IGDB ID`);
    return '';
  }
  
  // Fetch knowledge from global cache
  try {
    const knowledgeResult = await gameKnowledgeCacheService.get(libraryGame.igdbGameId);
    
    if (!knowledgeResult.cached || !knowledgeResult.knowledge) {
      console.log(`💾 [KnowledgeInjection] No cached knowledge for "${gameTitle}", using AI training data`);
      return '';
    }
    
    // Inject FULL game knowledge with quick-decision verification header
    const tokenEstimate = Math.ceil(knowledgeResult.knowledge.length / 4);
    console.log(`✅ [KnowledgeInjection] Injecting FULL knowledge for "${gameTitle}": ${knowledgeResult.knowledge.length} chars (~${tokenEstimate} tokens)`);
    console.log(`🌍 [KnowledgeInjection] Source: ${knowledgeResult.source} (populated by Pro/Vanguard, benefits ALL users)`);
    
    return `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 GAME KNOWLEDGE DATABASE: "${gameTitle.toUpperCase()}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ VERIFY FIRST - BEFORE READING FURTHER:

Is this query about "${gameTitle}"?
  ✅ YES → Continue reading, use this knowledge
  ❌ NO → STOP, ignore everything below, use training data instead

Quick verification checklist:
• Does query mention "${gameTitle}" by name? 
• Do boss/item/location names match "${gameTitle}"?
• Does screenshot show "${gameTitle}" UI/visuals?

If verification FAILS:
→ Do NOT read or use the knowledge below
→ Use your training data for the actual game
→ Return [OTAKON_GAME_ID: ActualGameName]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 COMPREHENSIVE KNOWLEDGE FOR "${gameTitle}" (${tokenEstimate} tokens):

${knowledgeResult.knowledge}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END OF ${gameTitle.toUpperCase()} KNOWLEDGE DATABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
    
  } catch (error) {
    console.error(`❌ [KnowledgeInjection] Failed to fetch knowledge for "${gameTitle}":`, error);
    return '';
  }
}
