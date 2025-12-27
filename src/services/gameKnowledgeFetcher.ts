/**
 * Background Game Knowledge Fetcher Service
 * 
 * When a game tab is created by Pro/Vanguard users, this service makes a NON-BLOCKING
 * Gemini call WITH GROUNDING to fetch comprehensive game knowledge (60K tokens) and
 * stores it in the GLOBAL Supabase cache for ALL users to benefit from.
 * 
 * Key Changes (Dec 2025):
 * - Uses Supabase global cache instead of LocalStorage
 * - Enables Google Search grounding for real-time accuracy
 * - Increased token limit: 4096 → 32000 → 60000 for maximum comprehensive knowledge
 * - Removed truncation - store full knowledge for RAG context
 * - One-time LocalStorage → Supabase migration on init
 * 
 * This runs in the background and does not block any UI operations.
 */

import { gameKnowledgeCacheService } from './gameKnowledgeCacheService';
import { gameKnowledgeStorage, type GameKnowledgeBase } from './gamingExplorerStorage';
import { supabase } from '../lib/supabase';
import type { ViteImportMeta } from '../types/enhanced';

// Track in-progress fetches to avoid duplicates
const pendingFetches = new Set<number>();

// Track if LocalStorage migration has been attempted
let migrationAttempted = false;

// Track retry counts for each game
const retryTracking = new Map<number, number>();

// Edge Function URL - Use ai-background for knowledge fetching (lower priority)
const getEdgeFunctionUrl = () => {
  const supabaseUrl = (import.meta as ViteImportMeta).env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/ai-background`;
};

/**
 * Enhanced knowledge extraction prompt for owned games
 * Designed to produce comprehensive, RAG-friendly content (60K tokens)
 */
const getKnowledgePrompt = (gameName: string): string => `
You are a comprehensive gaming knowledge expert. Provide EXTREMELY DETAILED, EXHAUSTIVE, encyclopedic information about "${gameName}".

Your response will be used as a knowledge base for an AI gaming assistant. Be MAXIMALLY THOROUGH and cover EVERYTHING a player might ask about.

IMPORTANT: You have 60,000 tokens available. Use them ALL to provide the most comprehensive game knowledge possible. Include extensive details, examples, specific numbers, exact locations, detailed strategies, and thorough explanations for every section.

## CORE GAME MECHANICS
- Complete gameplay systems breakdown
- All progression mechanics (leveling, skills, upgrades)
- Combat system (if applicable) - every attack type, combo, counter
- Movement and traversal mechanics
- Resource management and economy
- Crafting/building systems (if applicable)

## COMPLETE WALKTHROUGH FRAMEWORK
- Main story progression points
- All major areas/chapters in order
- Key objectives and how to complete them
- Recommended level/gear for each section
- Points of no return warnings

## DETAILED BOSS/CHALLENGE GUIDE
- Every major boss with full strategies
- Attack patterns and telegraphs
- Recommended builds/loadouts for each
- Cheese strategies and easy methods
- No-hit or challenge run tips

## COMPREHENSIVE TIPS AND TRICKS
- Essential beginner knowledge
- Intermediate optimization strategies
- Advanced/expert techniques
- Hidden mechanics most players miss
- Efficiency and speedrun tips

## COLLECTIBLES AND SECRETS
- All collectible types and locations
- Hidden areas and secret content
- Easter eggs and references
- Achievement/trophy guide
- 100% completion requirements

## CHARACTER BUILDS AND LOADOUTS
- All viable build archetypes
- Meta/optimal builds with explanations
- Fun/unique build ideas
- Stat allocation priorities
- Equipment recommendations per build

## STORY AND LORE
- Complete world lore (spoiler-tagged context)
- Character backgrounds and motivations
- Timeline of events
- Faction information
- Ending explanations (MAJOR SPOILERS clearly marked)

## MULTIPLAYER/ONLINE (if applicable)
- PvP strategies and meta
- Co-op tips and etiquette
- Server/region information
- Community resources

## TECHNICAL INFORMATION
- Known bugs and workarounds
- Performance optimization tips
- PC-specific settings recommendations
- Save management

Be comprehensive. This knowledge base will help players with ANY question about the game.
Use clear headers, bullet points, and organize information for easy searching.
`;

/**
 * One-time migration: Move existing LocalStorage knowledge to Supabase
 * Runs once per session, non-blocking
 */
async function migrateLocalStorageToSupabase(): Promise<void> {
  if (migrationAttempted) {
    return;
  }
  migrationAttempted = true;

  try {
    // Use the gameKnowledgeStorage to get all items
    const storageKey = 'otagon_game_knowledge';
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return;
    }

    const parsed = JSON.parse(stored) as GameKnowledgeBase[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return;
    }

    console.log(`🎮 [GameKnowledge] Found ${parsed.length} items in LocalStorage to migrate`);

    // Process items sequentially to avoid rate limiting
    for (const item of parsed) {
      // Check if already in Supabase (intentionally sequential)
      // eslint-disable-next-line no-await-in-loop
      const exists = await gameKnowledgeCacheService.exists(item.igdbGameId);
      if (exists) {
        console.log(`🎮 [GameKnowledge] ${item.gameName} already in Supabase, skipping`);
        continue;
      }

      // Convert to comprehensive knowledge string
      const sections: string[] = [];
      if (item.gameMechanics) {
        sections.push(`## Game Mechanics\n${item.gameMechanics}`);
      }
      if (item.tipsAndTricks) {
        sections.push(`## Tips and Tricks\n${item.tipsAndTricks}`);
      }
      if (item.bossStrategies) {
        const content = typeof item.bossStrategies === 'object' 
          ? JSON.stringify(item.bossStrategies, null, 2)
          : String(item.bossStrategies);
        sections.push(`## Boss Strategies\n${content}`);
      }
      if (item.collectibles) {
        const content = typeof item.collectibles === 'object'
          ? JSON.stringify(item.collectibles, null, 2)
          : String(item.collectibles);
        sections.push(`## Collectibles\n${content}`);
      }
      if (item.characterBuilds) {
        const content = typeof item.characterBuilds === 'object'
          ? JSON.stringify(item.characterBuilds, null, 2)
          : String(item.characterBuilds);
        sections.push(`## Character Builds\n${content}`);
      }

      if (sections.length === 0) {
        continue;
      }

      const comprehensiveKnowledge = sections.join('\n\n');

      // Store in Supabase (intentionally sequential for migration)
      // eslint-disable-next-line no-await-in-loop
      await gameKnowledgeCacheService.store(
        item.igdbGameId,
        item.gameName,
        comprehensiveKnowledge,
        {
          fetchedWithGrounding: false, // Old data wasn't fetched with grounding
          isPostCutoff: false
        }
      );

      console.log(`🎮 [GameKnowledge] Migrated ${item.gameName} to Supabase`);
    }

    console.log(`🎮 [GameKnowledge] ✅ Migration complete`);
  } catch (error) {
    console.warn(`🎮 [GameKnowledge] Migration failed (non-critical):`, error);
  }
}

/**
 * Fetch game knowledge from Gemini API WITH GROUNDING (non-blocking)
 * Stores results in global Supabase cache for all users
 */
async function fetchGameKnowledge(igdbGameId: number, gameName: string): Promise<void> {
  // Run migration on first fetch (non-blocking)
  migrateLocalStorageToSupabase().catch(() => {});

  // Skip if already fetching
  if (pendingFetches.has(igdbGameId)) {
    console.log(`🎮 [GameKnowledge] Already fetching knowledge for ${gameName}`);
    return;
  }

  // Check global Supabase cache first
  const exists = await gameKnowledgeCacheService.exists(igdbGameId);
  if (exists) {
    console.log(`🎮 [GameKnowledge] Knowledge already exists in global cache for ${gameName}`);
    return;
  }

  // Also check legacy LocalStorage (will be migrated)
  if (gameKnowledgeStorage.exists(igdbGameId)) {
    console.log(`🎮 [GameKnowledge] Knowledge exists in LocalStorage for ${gameName}, will migrate`);
    // Migration will handle this
    return;
  }

  pendingFetches.add(igdbGameId);
  console.log(`🎮 [GameKnowledge] Starting background fetch for ${gameName}...`);

  try {
    // Get user session for auth
    console.log(`🎮 [GameKnowledge] 🔑 Checking for auth session...`);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn(`🎮 [GameKnowledge] ❌ No auth session found - user not logged in!`);
      console.warn(`🎮 [GameKnowledge] 💡 Knowledge fetch requires authenticated user`);
      return;
    }
    console.log(`🎮 [GameKnowledge] ✅ Auth session found, proceeding with fetch...`);
    
    // 🔒 TIER-GATING: Validate based on game release date and user tier
    // Pre-Jan 2025 games: All users can fetch (no grounding needed)
    // Post-Jan 2025 games: Only Pro/Vanguard can fetch (grounding needed)
    
    // Get game info to check release date
    // DISABLED: games_library table doesn't exist in current schema
    // const { data: gameData } = await supabase
    //   .from('games_library')
    //   .select('igdb_data')
    //   .eq('igdb_game_id', igdbGameId)
    //   .single();
    const gameData = null;
    
    const releaseDate = gameData?.igdb_data?.first_release_date; // Unix timestamp in seconds
    const isPostCutoff = releaseDate ? (releaseDate * 1000) > new Date('2025-01-31T23:59:59Z').getTime() : false;
    
    console.log(`🎮 [GameKnowledge] Game release date check:`, {
      gameName,
      releaseDate: releaseDate ? new Date(releaseDate * 1000).toISOString() : 'Unknown',
      isPostCutoff
    });
    
    // Get user tier
    // DISABLED: profiles table doesn't exist in current schema
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('tier')
    //   .eq('auth_user_id', session.user.id)
    //   .single();
    const profile = null;
    
    const tier = profile?.tier || 'free';
    const isPro = tier === 'pro' || tier === 'vanguard_pro';
    
    // Validation logic:
    // - Pre-Jan 2025 games: All users allowed (no grounding needed, AI has training data)
    // - Post-Jan 2025 games: Only Pro/Vanguard allowed (grounding needed for current data)
    if (isPostCutoff && !isPro) {
      console.log(`🔒 [GameKnowledge] Game released after Jan 2025 - requires Pro/Vanguard for grounding`);
      console.log(`🔒 [GameKnowledge] User is ${tier} tier - cannot fetch knowledge for post-cutoff games`);
      return;
    }
    
    if (isPostCutoff) {
      console.log(`🎮 [GameKnowledge] ✅ User is ${tier}, can fetch post-cutoff game WITH grounding`);
    } else {
      console.log(`🎮 [GameKnowledge] ✅ Pre-cutoff game, all users can fetch (no grounding needed)`);
    }

    console.log(`📡 [GEMINI CALL] 🎮 Game Knowledge Fetch | Game: ${gameName} | Post-Cutoff: ${isPostCutoff} | Grounding: ${isPostCutoff ? 'YES' : 'NO'} | Max Tokens: 60000`);
    
    // Make API call - only use grounding for post-cutoff games
    const response = await fetch(getEdgeFunctionUrl(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: getKnowledgePrompt(gameName),
        requestType: 'text',
        model: 'gemini-3-flash-preview',
        temperature: 0.7,
        maxTokens: 60000, // Increased to 60K for maximum comprehensive knowledge
        systemPrompt: isPostCutoff 
          ? 'You are a comprehensive gaming knowledge expert. Provide EXTREMELY detailed, exhaustive, accurate, and practical gaming information. Use ALL available tokens to create the most comprehensive knowledge base possible. Use Google Search grounding to ensure all information is up-to-date and accurate for this recently released game.'
          : 'You are a comprehensive gaming knowledge expert. Provide EXTREMELY detailed, exhaustive, accurate, and practical gaming information about this classic/established game. Use ALL available tokens to create the most comprehensive knowledge base possible.',
        // Enable Google Search grounding ONLY for post-cutoff games
        useGrounding: isPostCutoff,
        groundingConfig: isPostCutoff ? {
          dynamicRetrievalConfig: {
            mode: 'MODE_DYNAMIC',
            dynamicThreshold: 0.3 // Lower threshold = more likely to use grounding
          }
        } : undefined
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`🎮 [GameKnowledge] ❌ Edge function error:`, error);
      throw new Error(error.error || 'Failed to fetch game knowledge');
    }

    const result = await response.json();
    console.log(`🎮 [GameKnowledge] 📦 Received response:`, {
      success: result.success,
      responseLength: result.response?.length || 0,
      tokensUsed: result.tokensUsed || 0
    });
    
    console.log(`✅ [GEMINI CALL] Game Knowledge Fetch SUCCESS | Game: ${gameName} | Grounding: ${isPostCutoff ? 'YES' : 'NO'} | Response Length: ${result.response?.length || 0} chars`);
    
    if (result.success && result.response) {
      // Store comprehensive knowledge in global Supabase cache
      // NO TRUNCATION - store full response for RAG context
      const stored = await gameKnowledgeCacheService.store(
        igdbGameId,
        gameName,
        result.response, // Full response, no parsing/truncation
        {
          tokensUsed: result.tokensUsed || 0,
          fetchedWithGrounding: isPostCutoff,
          isPostCutoff: isPostCutoff,
          knowledgeSummary: result.response.slice(0, 500) // First 500 chars as summary
        }
      );

      if (stored) {
        console.log(`🎮 [GameKnowledge] ✅ Stored ${result.response.length} chars in global cache for ${gameName}`);
        // Show success toast
        import('./toastService').then(({ toastService }) => {
          toastService.success(`Game knowledge created for ${gameName}`);
        });
        // Reset retry count on success
        retryTracking.delete(igdbGameId);
      } else {
        // Fallback: Store in LocalStorage
        const legacyKnowledge = parseKnowledgeResponseLegacy(gameName, igdbGameId, result.response);
        gameKnowledgeStorage.save(legacyKnowledge);
        console.log(`🎮 [GameKnowledge] ⚠️ Stored in LocalStorage fallback for ${gameName}`);
        // Reset retry count on success
        retryTracking.delete(igdbGameId);
      }
    } else {
      console.warn(`🎮 [GameKnowledge] Empty response for ${gameName}`);
    }

  } catch (error) {
    console.error(`🎮 [GameKnowledge] Failed to fetch for ${gameName}:`, error);
    
    // ✅ RETRY LOGIC: Add 1 second delay and retry up to 3 times
    const currentRetries = retryTracking.get(igdbGameId) || 0;
    const maxRetries = 3;
    
    if (currentRetries < maxRetries) {
      retryTracking.set(igdbGameId, currentRetries + 1);
      console.log(`🔄 [GameKnowledge] Retry ${currentRetries + 1}/${maxRetries} for ${gameName} in 1 second...`);
      
      // Wait 1 second then retry
      setTimeout(() => {
        pendingFetches.delete(igdbGameId); // Allow new fetch
        fetchGameKnowledge(igdbGameId, gameName).catch(() => {
          // Final failure - reset retry count
          retryTracking.delete(igdbGameId);
        });
      }, 1000);
    } else {
      // Max retries reached
      console.error(`❌ [GameKnowledge] Max retries reached for ${gameName}`);
      retryTracking.delete(igdbGameId);
    }
  } finally {
    // Only delete from pendingFetches if not retrying
    const currentRetries = retryTracking.get(igdbGameId) || 0;
    if (currentRetries === 0) {
      pendingFetches.delete(igdbGameId);
    }
  }
}

/**
 * Legacy parser for LocalStorage fallback
 */
function parseKnowledgeResponseLegacy(gameName: string, igdbGameId: number, response: string): GameKnowledgeBase {
  return {
    igdbGameId,
    gameName,
    gameMechanics: response.slice(0, 2000), // Simplified - just store what we can
    tipsAndTricks: undefined,
    extractedAt: Date.now(),
    lastUpdated: Date.now(),
  };
}

/**
 * Trigger background knowledge fetch for a game
 * Called when Pro/Vanguard user creates a game tab
 * 
 * IMPORTANT: This is NON-BLOCKING - fires and forgets
 */
export function triggerGameKnowledgeFetch(igdbGameId: number, gameName: string): void {
  console.log(`🎮 [GameKnowledge] 🚀 TRIGGER called for: ${gameName} (IGDB ID: ${igdbGameId})`);
  
  // Fire and forget - don't await
  // This runs completely in the background
  fetchGameKnowledge(igdbGameId, gameName).catch(err => {
    // Log errors so we can debug
    console.error(`🎮 [GameKnowledge] ❌ Background fetch FAILED for ${gameName}:`, err);
    console.error(`🎮 [GameKnowledge] ❌ Error details:`, {
      message: err.message,
      stack: err.stack,
      igdbGameId,
      gameName
    });
  });
  
  console.log(`🎮 [GameKnowledge] ✅ Background fetch initiated for ${gameName}`);
}

/**
 * Get game knowledge for context injection
 * Returns formatted knowledge string or null if none exists
 * 
 * NEW: Uses global Supabase cache first, falls back to LocalStorage
 * NO TRUNCATION: Returns full knowledge for RAG context
 */
export async function getGameKnowledgeContext(igdbGameId: number): Promise<string | null> {
  // Check global Supabase cache first
  const cached = await gameKnowledgeCacheService.getForContext(igdbGameId);
  if (cached) {
    console.log(`🎮 [GameKnowledge] Using Supabase cache for context (${cached.length} chars)`);
    return `\n\n=== GAME KNOWLEDGE BASE ===\n${cached}\n=== END KNOWLEDGE BASE ===`;
  }

  // Fallback to LocalStorage (legacy)
  const legacy = gameKnowledgeStorage.get(igdbGameId);
  if (legacy) {
    console.log(`🎮 [GameKnowledge] Using LocalStorage fallback for context`);
    
    const sections: string[] = [];
    if (legacy.gameMechanics) {
      sections.push(`**Game Mechanics:**\n${legacy.gameMechanics}`);
    }
    if (legacy.tipsAndTricks) {
      sections.push(`**Tips & Tricks:**\n${legacy.tipsAndTricks}`);
    }
    if (legacy.bossStrategies && typeof legacy.bossStrategies === 'object') {
      const content = (legacy.bossStrategies as { content?: string }).content;
      if (content) {
        sections.push(`**Boss Strategies:**\n${content}`);
      }
    }
    
    if (sections.length > 0) {
      return `\n\n=== GAME KNOWLEDGE (${legacy.gameName}) ===\n${sections.join('\n\n')}\n===`;
    }
  }

  return null;
}

/**
 * Sync version for backward compatibility
 * Uses LocalStorage only (for sync contexts)
 */
export function getGameKnowledgeContextSync(igdbGameId: number): string | null {
  const legacy = gameKnowledgeStorage.get(igdbGameId);
  if (!legacy) {
    return null;
  }

  const sections: string[] = [];
  if (legacy.gameMechanics) {
    sections.push(`**Game Mechanics:**\n${legacy.gameMechanics.slice(0, 800)}`);
  }
  if (legacy.tipsAndTricks) {
    sections.push(`**Tips & Tricks:**\n${legacy.tipsAndTricks.slice(0, 800)}`);
  }
  
  if (sections.length === 0) {
    return null;
  }

  return `\n\n=== GAME KNOWLEDGE (${legacy.gameName}) ===\n${sections.join('\n\n')}\n===`;
}

/**
 * Check if knowledge is being fetched for a game
 */
export function isKnowledgeFetching(igdbGameId: number): boolean {
  return pendingFetches.has(igdbGameId);
}

/**
 * Check if knowledge exists for a game (async - checks Supabase)
 */
export async function hasGameKnowledge(igdbGameId: number): Promise<boolean> {
  // Check Supabase first
  const exists = await gameKnowledgeCacheService.exists(igdbGameId);
  if (exists) {
    return true;
  }

  // Fallback to LocalStorage
  return gameKnowledgeStorage.exists(igdbGameId);
}

/**
 * Sync version for backward compatibility
 */
export function hasGameKnowledgeSync(igdbGameId: number): boolean {
  return gameKnowledgeStorage.exists(igdbGameId);
}
