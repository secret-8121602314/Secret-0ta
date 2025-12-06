/**
 * Background Game Knowledge Fetcher Service
 * 
 * When a game is added as "owned", this service makes a NON-BLOCKING parallel
 * Gemini call to fetch comprehensive game knowledge and stores it for future context.
 * 
 * This runs in the background and does not block any UI operations.
 */

import { gameKnowledgeStorage, type GameKnowledgeBase } from './gamingExplorerStorage';
import { supabase } from '../lib/supabase';
import type { ViteImportMeta } from '../types/enhanced';

// Track in-progress fetches to avoid duplicates
const pendingFetches = new Set<number>();

// Edge Function URL
const getEdgeFunctionUrl = () => {
  const supabaseUrl = (import.meta as ViteImportMeta).env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/ai-proxy`;
};

/**
 * Knowledge extraction prompt for owned games
 */
const getKnowledgePrompt = (gameName: string): string => `
You are a comprehensive gaming knowledge base. Provide detailed, structured information about "${gameName}".

Please provide the following in a clear, organized format:

**GAME MECHANICS:**
- Core gameplay loop
- Key systems and how they interact
- Combat/movement mechanics (if applicable)
- Progression systems

**TIPS AND TRICKS:**
- Essential beginner tips (5-7 tips)
- Advanced strategies
- Common mistakes to avoid
- Efficiency tips

**BOSS/CHALLENGE STRATEGIES:**
- Key boss fights or challenging encounters
- Recommended approaches for each
- Equipment/loadout suggestions

**COLLECTIBLES & SECRETS:**
- Types of collectibles in the game
- Notable secrets or hidden content
- Achievement/trophy guidance

**CHARACTER BUILDS (if applicable):**
- Popular/meta builds
- Build archetypes
- Stat priorities

**STORY CONTEXT (spoiler-free):**
- Main themes
- Setting overview
- Key factions/characters (no plot spoilers)

Keep information practical and actionable. Focus on helping players succeed and enjoy the game.
Format with clear headers and bullet points for easy reference.
`;

/**
 * Parse the AI response into structured knowledge
 */
function parseKnowledgeResponse(gameName: string, igdbGameId: number, response: string): GameKnowledgeBase {
  // Extract sections by looking for headers
  const sections = {
    gameMechanics: '',
    tipsAndTricks: '',
    bossStrategies: {} as Record<string, unknown>,
    collectibles: {} as Record<string, unknown>,
    characterBuilds: {} as Record<string, unknown>,
    storyProgression: {} as Record<string, unknown>,
  };

  // Simple section extraction based on headers
  const mechanicsMatch = response.match(/\*\*GAME MECHANICS:\*\*[\s\S]*?(?=\*\*TIPS AND TRICKS:|$)/i);
  if (mechanicsMatch) {
    sections.gameMechanics = mechanicsMatch[0].replace(/\*\*GAME MECHANICS:\*\*/i, '').trim();
  }

  const tipsMatch = response.match(/\*\*TIPS AND TRICKS:\*\*[\s\S]*?(?=\*\*BOSS|$)/i);
  if (tipsMatch) {
    sections.tipsAndTricks = tipsMatch[0].replace(/\*\*TIPS AND TRICKS:\*\*/i, '').trim();
  }

  const bossMatch = response.match(/\*\*BOSS[\s\S]*?(?=\*\*COLLECTIBLES|$)/i);
  if (bossMatch) {
    sections.bossStrategies = { content: bossMatch[0].trim() };
  }

  const collectiblesMatch = response.match(/\*\*COLLECTIBLES[\s\S]*?(?=\*\*CHARACTER|$)/i);
  if (collectiblesMatch) {
    sections.collectibles = { content: collectiblesMatch[0].trim() };
  }

  const buildsMatch = response.match(/\*\*CHARACTER BUILDS[\s\S]*?(?=\*\*STORY|$)/i);
  if (buildsMatch) {
    sections.characterBuilds = { content: buildsMatch[0].trim() };
  }

  const storyMatch = response.match(/\*\*STORY CONTEXT[\s\S]*$/i);
  if (storyMatch) {
    sections.storyProgression = { context: storyMatch[0].trim() };
  }

  return {
    igdbGameId,
    gameName,
    gameMechanics: sections.gameMechanics || undefined,
    tipsAndTricks: sections.tipsAndTricks || undefined,
    bossStrategies: Object.keys(sections.bossStrategies).length > 0 ? sections.bossStrategies : undefined,
    collectibles: Object.keys(sections.collectibles).length > 0 ? sections.collectibles : undefined,
    characterBuilds: Object.keys(sections.characterBuilds).length > 0 ? sections.characterBuilds : undefined,
    storyProgression: Object.keys(sections.storyProgression).length > 0 ? sections.storyProgression : undefined,
    extractedAt: Date.now(),
    lastUpdated: Date.now(),
  };
}

/**
 * Fetch game knowledge from Gemini API (non-blocking)
 * This runs in the background and stores results for future use
 */
async function fetchGameKnowledge(igdbGameId: number, gameName: string): Promise<void> {
  // Skip if already fetching or already have knowledge
  if (pendingFetches.has(igdbGameId)) {
    console.log(`🎮 [GameKnowledge] Already fetching knowledge for ${gameName}`);
    return;
  }

  if (gameKnowledgeStorage.exists(igdbGameId)) {
    console.log(`🎮 [GameKnowledge] Knowledge already exists for ${gameName}`);
    return;
  }

  pendingFetches.add(igdbGameId);
  console.log(`🎮 [GameKnowledge] Starting background fetch for ${gameName}...`);

  try {
    // Get user session for auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn(`🎮 [GameKnowledge] No auth session, skipping knowledge fetch`);
      return;
    }

    // Make non-blocking API call
    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: getKnowledgePrompt(gameName),
        requestType: 'text',
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        maxTokens: 4096,
        systemPrompt: 'You are a helpful gaming knowledge assistant. Provide accurate, practical gaming information.'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch game knowledge');
    }

    const result = await response.json();
    
    if (result.success && result.response) {
      // Parse and store the knowledge
      const knowledge = parseKnowledgeResponse(gameName, igdbGameId, result.response);
      gameKnowledgeStorage.save(knowledge);
      console.log(`🎮 [GameKnowledge] ✅ Stored knowledge for ${gameName}`);
    } else {
      console.warn(`🎮 [GameKnowledge] Empty response for ${gameName}`);
    }

  } catch (error) {
    console.error(`🎮 [GameKnowledge] Failed to fetch for ${gameName}:`, error);
    // Don't throw - this is background work, shouldn't break anything
  } finally {
    pendingFetches.delete(igdbGameId);
  }
}

/**
 * Trigger background knowledge fetch for an owned game
 * This is called when a game is added to the "own" category
 * 
 * IMPORTANT: This is NON-BLOCKING - fires and forgets
 */
export function triggerGameKnowledgeFetch(igdbGameId: number, gameName: string): void {
  // Fire and forget - don't await
  // This runs completely in the background
  fetchGameKnowledge(igdbGameId, gameName).catch(err => {
    // Silently handle errors - this is background work
    console.error(`🎮 [GameKnowledge] Background fetch failed:`, err);
  });
}

// ============================================================================
// TOKEN LIMITS FOR CONTEXT INJECTION
// ============================================================================
// Prevent context bloat - game knowledge should be helpful but not overwhelming
const MAX_SECTION_CHARS = 800;       // Max chars per section (mechanics, tips, etc.)
const MAX_TOTAL_KNOWLEDGE_CHARS = 2500; // Max total knowledge context (~600 tokens)

/**
 * Truncate text to limit, keeping most useful content (beginning)
 */
function truncateSection(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  // Keep the beginning (most important), add ellipsis
  return text.slice(0, maxChars - 3) + '...';
}

/**
 * Get game knowledge for context injection
 * Returns formatted knowledge string or null if none exists
 * 
 * ⚠️ TRUNCATED: Each section limited to ~800 chars, total ~2500 chars
 * This prevents token bloat while still providing useful context
 */
export function getGameKnowledgeContext(igdbGameId: number): string | null {
  const knowledge = gameKnowledgeStorage.get(igdbGameId);
  if (!knowledge) {
    return null;
  }

  const sections: string[] = [];
  let totalChars = 0;
  
  // Add sections with truncation, stop if we hit total limit
  if (knowledge.gameMechanics && totalChars < MAX_TOTAL_KNOWLEDGE_CHARS) {
    const content = truncateSection(knowledge.gameMechanics, MAX_SECTION_CHARS);
    sections.push(`**Game Mechanics:**\n${content}`);
    totalChars += content.length + 20;
  }
  
  if (knowledge.tipsAndTricks && totalChars < MAX_TOTAL_KNOWLEDGE_CHARS) {
    const content = truncateSection(knowledge.tipsAndTricks, MAX_SECTION_CHARS);
    sections.push(`**Tips & Tricks:**\n${content}`);
    totalChars += content.length + 20;
  }
  
  if (knowledge.bossStrategies && typeof knowledge.bossStrategies === 'object' && totalChars < MAX_TOTAL_KNOWLEDGE_CHARS) {
    const rawContent = (knowledge.bossStrategies as { content?: string }).content;
    if (rawContent) {
      const content = truncateSection(rawContent, MAX_SECTION_CHARS);
      sections.push(`**Boss Strategies:**\n${content}`);
      totalChars += content.length + 20;
    }
  }

  if (sections.length === 0) {
    return null;
  }

  const result = `\n\n=== GAME KNOWLEDGE (${knowledge.gameName}) ===\n${sections.join('\n\n')}\n===`;
  
  console.log(`🎮 [GameKnowledge] Injecting ${result.length} chars of context for ${knowledge.gameName}`);
  
  return result;
}

/**
 * Check if knowledge is being fetched for a game
 */
export function isKnowledgeFetching(igdbGameId: number): boolean {
  return pendingFetches.has(igdbGameId);
}

/**
 * Check if knowledge exists for a game
 */
export function hasGameKnowledge(igdbGameId: number): boolean {
  return gameKnowledgeStorage.exists(igdbGameId);
}
