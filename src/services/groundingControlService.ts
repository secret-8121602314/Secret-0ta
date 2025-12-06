/**
 * Grounding Control Service
 * 
 * Controls when Google Search grounding is used based on:
 * 1. User subscription tier (free/pro/vanguard_pro)
 * 2. Monthly usage limits per tier
 * 3. Query type classification
 * 4. Game type (live service games NEED current data)
 * 5. AI knowledge cutoff (Jan 2025 - games after need grounding)
 * 
 * COST OPTIMIZATION:
 * - Free tier: Limited grounding (8x/month) - prioritize news & new games
 * - Pro tier: Moderate grounding (30x/month) - includes live service meta
 * - Vanguard Pro: Liberal grounding (100x/month) - full access
 * 
 * IMPORTANT: Gemini 2.5 Flash knowledge cutoff is January 2025.
 * Games released after this date NEED grounding for any help.
 */

import { supabase } from '../lib/supabase';
import type { UserTier } from '../types';

// ============================================================================
// GROUNDING LIMITS BY TIER (increased for better experience)
// ============================================================================
const GROUNDING_LIMITS: Record<UserTier, number> = {
  free: 8,            // 8 grounded searches per month (2x per week avg)
  pro: 30,            // 30 grounded searches per month  
  vanguard_pro: 100   // 100 grounded searches per month
};

// ============================================================================
// LIVE SERVICE / MULTIPLAYER GAMES
// These games have constantly changing meta, patches, balance updates
// ============================================================================
const LIVE_SERVICE_GAMES = new Set([
  // Battle Royales
  'fortnite', 'apex legends', 'warzone', 'call of duty warzone', 'pubg', 'playerunknown\'s battlegrounds',
  // MOBAs
  'league of legends', 'lol', 'dota 2', 'dota', 'smite', 'heroes of the storm',
  // Hero Shooters
  'overwatch', 'overwatch 2', 'valorant', 'rainbow six siege', 'r6', 'paladins',
  // MMORPGs
  'world of warcraft', 'wow', 'final fantasy xiv', 'ffxiv', 'ff14', 'guild wars 2', 'gw2',
  'elder scrolls online', 'eso', 'destiny 2', 'destiny', 'warframe', 'lost ark', 'new world',
  // Live Service Action
  'diablo 4', 'diablo iv', 'path of exile', 'poe', 'genshin impact', 'honkai star rail',
  'zenless zone zero', 'zzz', 'wuthering waves', 'tower of fantasy',
  // Sports (roster updates)
  'fifa', 'ea fc', 'fc 24', 'fc 25', 'madden', 'nba 2k', '2k24', '2k25',
  // Card Games
  'hearthstone', 'marvel snap', 'legends of runeterra', 'lor', 'magic arena', 'mtg arena',
  // Fighting Games (balance patches)
  'street fighter 6', 'sf6', 'tekken 8', 'mortal kombat 1', 'mk1', 'guilty gear strive',
  // Other Live Service
  'the finals', 'xdefiant', 'helldivers 2', 'sea of thieves', 'no man\'s sky',
  'fall guys', 'rocket league', 'dead by daylight', 'dbd'
]);

// ============================================================================
// GAMES RELEASED AFTER AI KNOWLEDGE CUTOFF (Feb 2025+)
// These games Gemini won't know - MUST use grounding
// ============================================================================
const POST_CUTOFF_GAMES = new Set([
  // 2025 releases (add as they come out)
  'gta 6', 'grand theft auto 6', 'grand theft auto vi',
  'monster hunter wilds',
  'death stranding 2', 'death stranding 2: on the beach',
  'ghost of yotei',
  'like a dragon: pirate yakuza in hawaii',
  'kingdom come deliverance 2', 'kingdom come 2',
  'avowed',
  'civilization 7', 'civ 7', 'civilization vii',
  'fable',
  'assassin\'s creed shadows',
  'split fiction',
  'doom: the dark ages',
  'borderlands 4',
  'mafia: the old country',
  'marvel 1943',
  'judge 0',
  // Add more as 2025 progresses...
]);

// ============================================================================
// AI KNOWLEDGE CUTOFF
// Gemini 2.5 Flash knowledge cutoff is January 2025
// Games released AFTER this date need grounding for accurate info
// ============================================================================
export const KNOWLEDGE_CUTOFF_TIMESTAMP = new Date('2025-01-31T23:59:59Z').getTime();

/**
 * Check if a game was released AFTER the AI knowledge cutoff using IGDB data
 * This is more accurate than the hardcoded POST_CUTOFF_GAMES list
 * @param igdbReleaseDate - Unix timestamp in SECONDS from IGDB first_release_date
 * @returns true if game released after Jan 2025 (AI won't have training knowledge)
 */
export function isRecentRelease(igdbReleaseDate?: number | null): boolean {
  if (!igdbReleaseDate) return false;
  // IGDB uses Unix seconds, convert to milliseconds
  const releaseDateMs = igdbReleaseDate * 1000;
  return releaseDateMs > KNOWLEDGE_CUTOFF_TIMESTAMP;
}

// ============================================================================
// QUERY CLASSIFICATION
// ============================================================================

/**
 * Query types that determine if grounding should be used
 */
export type GroundingQueryType = 
  | 'current_news'        // Latest gaming news, announcements
  | 'release_dates'       // Release date info for upcoming games
  | 'patch_notes'         // Recent patch notes, updates, balance changes
  | 'live_service_meta'   // Current meta, tier lists, best builds for live games
  | 'post_cutoff_game'    // Game released after Jan 2025 - AI doesn't know it
  | 'general_knowledge'   // Can be answered with built-in knowledge
  | 'game_help';          // Gameplay help, strategies, tips for known games

/**
 * Check if a game is a live service game that needs current data
 */
export function isLiveServiceGame(gameTitle: string | undefined | null): boolean {
  if (!gameTitle) {
    return false;
  }
  const normalized = gameTitle.toLowerCase().trim();
  return LIVE_SERVICE_GAMES.has(normalized) || 
         Array.from(LIVE_SERVICE_GAMES).some(game => normalized.includes(game));
}

/**
 * Check if a game was released after AI knowledge cutoff
 */
export function isPostCutoffGame(gameTitle: string | undefined | null): boolean {
  if (!gameTitle) {
    return false;
  }
  const normalized = gameTitle.toLowerCase().trim();
  return POST_CUTOFF_GAMES.has(normalized) ||
         Array.from(POST_CUTOFF_GAMES).some(game => normalized.includes(game));
}

/**
 * Classify the query type to determine grounding necessity
 * @param userMessage - The user's message
 * @param gameTitle - Optional game title for context
 * @param igdbReleaseDate - Optional IGDB first_release_date (Unix seconds) for dynamic cutoff detection
 */
export function classifyQuery(
  userMessage: string, 
  gameTitle?: string | null,
  igdbReleaseDate?: number | null
): GroundingQueryType {
  const msg = userMessage.toLowerCase();
  
  // FIRST: Check if the game is post-cutoff using IGDB data (most accurate)
  // This dynamically detects ANY game released after Jan 2025, not just hardcoded ones
  if (isRecentRelease(igdbReleaseDate)) {
    console.log(`🔍 [GroundingControl] Game detected as post-cutoff via IGDB release date`);
    return 'post_cutoff_game';
  }
  
  // FALLBACK: Check hardcoded POST_CUTOFF_GAMES list (for when IGDB data unavailable)
  if (isPostCutoffGame(gameTitle) || isPostCutoffGame(userMessage)) {
    return 'post_cutoff_game';
  }
  
  // Check for live service game meta queries
  const isLiveService = isLiveServiceGame(gameTitle) || isLiveServiceGame(userMessage);
  if (isLiveService && (
    msg.includes('meta') ||
    msg.includes('tier list') ||
    msg.includes('best') ||
    msg.includes('current') ||
    msg.includes('viable') ||
    msg.includes('nerf') ||
    msg.includes('buff') ||
    msg.includes('season') ||
    msg.includes('ranked') ||
    msg.includes('competitive') ||
    msg.includes('patch')
  )) {
    return 'live_service_meta';
  }
  
  // Current news/announcements - NEEDS grounding
  if (
    msg.includes('latest news') ||
    msg.includes('recent news') ||
    msg.includes('gaming news') ||
    msg.includes('announced today') ||
    msg.includes('announced this week') ||
    msg.includes('just announced') ||
    msg.includes('breaking news') ||
    msg.includes('new announcement')
  ) {
    return 'current_news';
  }
  
  // Patch notes / recent updates - NEEDS grounding
  if (
    msg.includes('patch notes') ||
    msg.includes('latest patch') ||
    msg.includes('recent update') ||
    msg.includes('new update') ||
    msg.includes('hotfix') ||
    msg.includes('balance change') ||
    msg.includes('what changed') ||
    (msg.includes('patch') && (msg.includes('today') || msg.includes('latest') || msg.includes('new')))
  ) {
    return 'patch_notes';
  }
  
  // Release dates for upcoming/recent games - MIGHT need grounding
  if (
    (msg.includes('release') && msg.includes('date')) ||
    msg.includes('when does') ||
    msg.includes('when is') ||
    msg.includes('coming out') ||
    msg.includes('launch date') ||
    msg.includes('coming soon') ||
    msg.includes('2025') ||
    msg.includes('2026')
  ) {
    return 'release_dates';
  }
  
  // Game help for KNOWN games - NO grounding needed (use AI knowledge)
  if (!isLiveService && (
    msg.includes('how do i') ||
    msg.includes('how to') ||
    msg.includes('help me') ||
    msg.includes('stuck on') ||
    msg.includes('boss') ||
    msg.includes('strategy') ||
    msg.includes('build') ||
    msg.includes('tips') ||
    msg.includes('guide') ||
    msg.includes('walkthrough') ||
    msg.includes('where is') ||
    msg.includes('where can i') ||
    msg.includes('best way to') ||
    msg.includes('how do you') ||
    msg.includes('explain')
  )) {
    return 'game_help';
  }
  
  // Default: general knowledge (no grounding needed)
  return 'general_knowledge';
}

/**
 * Determine if grounding should be used based on query type and tier
 * Returns true only for queries that genuinely NEED current web data
 */
export function shouldUseGrounding(
  queryType: GroundingQueryType,
  tier: UserTier,
  monthlyUsage: number
): { useGrounding: boolean; reason: string } {
  
  // Check if user has remaining grounding quota
  const limit = GROUNDING_LIMITS[tier];
  if (monthlyUsage >= limit) {
    return {
      useGrounding: false,
      reason: `Monthly grounding limit reached (${monthlyUsage}/${limit}). AI will use training knowledge.`
    };
  }
  
  // Post-cutoff games - ALWAYS need grounding (AI doesn't know them)
  if (queryType === 'post_cutoff_game') {
    return {
      useGrounding: true,
      reason: 'Game released after AI knowledge cutoff (Jan 2025) - web search required'
    };
  }
  
  // Live service meta - NEEDS grounding for accurate current info
  if (queryType === 'live_service_meta') {
    // Free tier gets limited live service support
    if (tier === 'free' && monthlyUsage >= 4) {
      return {
        useGrounding: false,
        reason: 'Free tier live service meta limited - upgrade for more current data'
      };
    }
    return {
      useGrounding: true,
      reason: 'Live service game - current meta/patch info requires web search'
    };
  }
  
  // Current news - use grounding if quota available
  if (queryType === 'current_news') {
    return {
      useGrounding: true,
      reason: 'Current news query requires web search'
    };
  }
  
  // Patch notes - use grounding for all tiers (important for accuracy)
  if (queryType === 'patch_notes') {
    return {
      useGrounding: true,
      reason: 'Recent patch notes require web search'
    };
  }
  
  // Release dates - use grounding (dates change frequently)
  if (queryType === 'release_dates') {
    return {
      useGrounding: true,
      reason: 'Release date verification via web search'
    };
  }
  
  // Game help for known games - NO grounding needed
  if (queryType === 'game_help') {
    return {
      useGrounding: false,
      reason: 'Known game - AI has comprehensive training knowledge'
    };
  }
  
  // General knowledge - NO grounding needed
  if (queryType === 'general_knowledge') {
    return {
      useGrounding: false,
      reason: 'General gaming knowledge - AI can answer from training'
    };
  }
  
  // Default: no grounding
  return {
    useGrounding: false,
    reason: 'Default: use AI knowledge'
  };
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

// In-memory cache of monthly usage (refreshed from DB periodically)
const usageCache: Map<string, { count: number; month: string; lastSync: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache

// Flag to track if DB table exists (avoid repeated failures)
let dbTableExists: boolean | null = null;

/**
 * Get current month key (YYYY-MM)
 */
function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get user's grounding usage for current month
 * Falls back to in-memory tracking if DB table doesn't exist yet
 */
export async function getGroundingUsage(authUserId: string): Promise<number> {
  const currentMonth = getCurrentMonthKey();
  const cached = usageCache.get(authUserId);
  
  // Return cached if fresh and same month
  if (cached && cached.month === currentMonth && Date.now() - cached.lastSync < CACHE_TTL) {
    return cached.count;
  }
  
  // If we know the table doesn't exist, use cache only
  if (dbTableExists === false) {
    return cached?.count || 0;
  }
  
  try {
    // Fetch from database using type assertion for new table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('user_grounding_usage')
      .select('usage_count')
      .eq('auth_user_id', authUserId)
      .eq('month_year', currentMonth)
      .single();
    
    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('[GroundingControl] DB table not yet created, using in-memory tracking');
        dbTableExists = false;
        return cached?.count || 0;
      }
      if (error.code !== 'PGRST116') { // PGRST116 = not found (which is OK)
        console.error('[GroundingControl] Failed to fetch usage:', error);
        return cached?.count || 0;
      }
    }
    
    dbTableExists = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const count = (data as any)?.usage_count || 0;
    
    // Update cache
    usageCache.set(authUserId, {
      count,
      month: currentMonth,
      lastSync: Date.now()
    });
    
    return count;
  } catch (err) {
    console.error('[GroundingControl] Error fetching usage:', err);
    return cached?.count || 0;
  }
}

/**
 * Increment user's grounding usage for current month
 * Falls back to in-memory tracking if DB table doesn't exist yet
 */
export async function incrementGroundingUsage(authUserId: string): Promise<void> {
  const currentMonth = getCurrentMonthKey();
  
  // Update in-memory cache first (always works)
  const cached = usageCache.get(authUserId);
  if (cached && cached.month === currentMonth) {
    cached.count++;
    cached.lastSync = Date.now();
  } else {
    usageCache.set(authUserId, {
      count: 1,
      month: currentMonth,
      lastSync: Date.now()
    });
  }
  
  // If we know the table doesn't exist, skip DB update
  if (dbTableExists === false) {
    console.log(`🔍 [GroundingControl] Incremented usage (in-memory) for ${authUserId} (month: ${currentMonth})`);
    return;
  }
  
  try {
    // Try to upsert to database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('user_grounding_usage')
      .upsert({
        auth_user_id: authUserId,
        month_year: currentMonth,
        usage_count: usageCache.get(authUserId)?.count || 1,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'auth_user_id,month_year'
      });
    
    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('[GroundingControl] DB table not yet created, using in-memory tracking');
        dbTableExists = false;
        return;
      }
      
      // If upsert failed, try RPC increment
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .rpc('increment_grounding_usage', {
          p_auth_user_id: authUserId,
          p_month_year: currentMonth
        });
    }
    
    dbTableExists = true;
    console.log(`🔍 [GroundingControl] Incremented usage for ${authUserId} (month: ${currentMonth})`);
  } catch (err) {
    console.error('[GroundingControl] Failed to increment usage:', err);
    // In-memory cache is already updated, so we're OK
  }
}

/**
 * Get remaining grounding quota for user
 */
export async function getRemainingQuota(authUserId: string, tier: UserTier): Promise<number> {
  const usage = await getGroundingUsage(authUserId);
  const limit = GROUNDING_LIMITS[tier];
  return Math.max(0, limit - usage);
}

// ============================================================================
// MAIN CONTROL FUNCTION
// ============================================================================

/**
 * Main function to check if grounding should be used
 * Call this before making AI requests
 * 
 * @param authUserId - User's auth ID for quota tracking
 * @param tier - User's subscription tier
 * @param userMessage - The message being sent to AI
 * @param gameTitle - Optional game title for context
 * @param igdbReleaseDate - Optional IGDB first_release_date (Unix seconds) for dynamic post-cutoff detection
 */
export async function checkGroundingEligibility(
  authUserId: string,
  tier: UserTier,
  userMessage: string,
  gameTitle?: string,
  igdbReleaseDate?: number | null
): Promise<{ 
  useGrounding: boolean; 
  queryType: GroundingQueryType;
  reason: string;
  remainingQuota: number;
}> {
  // Classify the query (now with IGDB release date for accurate cutoff detection)
  const queryType = classifyQuery(userMessage, gameTitle, igdbReleaseDate);
  
  // Get current usage
  const usage = await getGroundingUsage(authUserId);
  const limit = GROUNDING_LIMITS[tier];
  const remainingQuota = Math.max(0, limit - usage);
  
  // Determine if grounding should be used
  const { useGrounding, reason } = shouldUseGrounding(queryType, tier, usage);
  
  console.log(`🔍 [GroundingControl] Check result:`, {
    tier,
    queryType,
    useGrounding,
    reason,
    usage: `${usage}/${limit}`,
    remainingQuota,
    igdbReleaseDate: igdbReleaseDate ? new Date(igdbReleaseDate * 1000).toISOString() : 'N/A'
  });
  
  return {
    useGrounding,
    queryType,
    reason,
    remainingQuota
  };
}

export const groundingControlService = {
  classifyQuery,
  shouldUseGrounding,
  getGroundingUsage,
  incrementGroundingUsage,
  getRemainingQuota,
  checkGroundingEligibility,
  isLiveServiceGame,
  isPostCutoffGame,
  isRecentRelease,
  GROUNDING_LIMITS,
  LIVE_SERVICE_GAMES,
  POST_CUTOFF_GAMES,
  KNOWLEDGE_CUTOFF_TIMESTAMP
};
