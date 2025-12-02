/**
 * Shown Prompts Service
 * 
 * Manages the ai_shown_prompts table to track prompts displayed to users
 * and prevent repetitive suggestions/prompts across sessions.
 */

import { supabase } from '../../lib/supabase';

// ============================================================================
// Types
// ============================================================================

export type PromptType = 'inline' | 'news' | 'suggested' | 'exploration' | 'help';

export interface ShownPrompt {
  id: string;
  authUserId: string;
  conversationId: string | null;
  promptText: string;
  promptType: PromptType;
  gameTitle: string | null;
  shownAt: string;
  clicked: boolean;
  clickedAt: string | null;
}

export interface ShownPromptInsert {
  promptText: string;
  promptType: PromptType;
  gameTitle?: string | null;
  conversationId?: string | null;
}

// ============================================================================
// In-memory cache for recent prompts (reduces DB calls)
// ============================================================================

interface CacheEntry {
  prompts: string[];
  timestamp: number;
}

const promptCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(authUserId: string, promptType: PromptType, gameTitle: string | null): string {
  return `${authUserId}:${promptType}:${gameTitle || 'global'}`;
}

function getCachedPrompts(key: string): string[] | null {
  const entry = promptCache.get(key);
  if (!entry) {
    return null;
  }
  
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    promptCache.delete(key);
    return null;
  }
  
  return entry.prompts;
}

function setCachedPrompts(key: string, prompts: string[]): void {
  promptCache.set(key, {
    prompts,
    timestamp: Date.now(),
  });
}

function invalidateCache(authUserId: string): void {
  for (const key of promptCache.keys()) {
    if (key.startsWith(authUserId)) {
      promptCache.delete(key);
    }
  }
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Get recently shown prompts for a user (with caching)
 */
export async function getRecentShownPrompts(
  authUserId: string,
  promptType: PromptType,
  gameTitle: string | null = null,
  limit: number = 20
): Promise<string[]> {
  const cacheKey = getCacheKey(authUserId, promptType, gameTitle);
  
  // Check cache first
  const cached = getCachedPrompts(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    // Calculate 7 days ago for the time filter
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Build query
    let query = supabase
      .from('ai_shown_prompts')
      .select('prompt_text')
      .eq('auth_user_id', authUserId)
      .eq('prompt_type', promptType)
      .gte('shown_at', sevenDaysAgo.toISOString())
      .order('shown_at', { ascending: false })
      .limit(limit);
    
    // Add game title filter if provided
    if (gameTitle) {
      query = query.or(`game_title.eq.${gameTitle},game_title.is.null`);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('[ShownPromptsService] Error fetching prompts:', error);
      return [];
    }

    const prompts = (data || []).map(p => p.prompt_text);
    
    // Cache the results
    setCachedPrompts(cacheKey, prompts);
    
    return prompts;
  } catch (error) {
    console.error('[ShownPromptsService] Exception fetching prompts:', error);
    return [];
  }
}

/**
 * Record a prompt as shown to a user
 */
export async function recordShownPrompt(
  authUserId: string,
  prompt: ShownPromptInsert
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_shown_prompts')
      .insert({
        auth_user_id: authUserId,
        prompt_text: prompt.promptText,
        prompt_type: prompt.promptType,
        game_title: prompt.gameTitle || null,
        conversation_id: prompt.conversationId || null,
      });

    if (error) {
      console.error('[ShownPromptsService] Error recording prompt:', error);
      return false;
    }

    // Invalidate cache for this user
    invalidateCache(authUserId);
    
    return true;
  } catch (error) {
    console.error('[ShownPromptsService] Exception recording prompt:', error);
    return false;
  }
}

/**
 * Record multiple prompts at once (batch insert)
 */
export async function recordShownPrompts(
  authUserId: string,
  prompts: ShownPromptInsert[]
): Promise<boolean> {
  if (!prompts.length) {
    return true;
  }
  
  try {
    const records = prompts.map(p => ({
      auth_user_id: authUserId,
      prompt_text: p.promptText,
      prompt_type: p.promptType,
      game_title: p.gameTitle || null,
      conversation_id: p.conversationId || null,
    }));

    const { error } = await supabase
      .from('ai_shown_prompts')
      .insert(records);

    if (error) {
      console.error('[ShownPromptsService] Error batch recording prompts:', error);
      return false;
    }

    // Invalidate cache for this user
    invalidateCache(authUserId);
    
    return true;
  } catch (error) {
    console.error('[ShownPromptsService] Exception batch recording prompts:', error);
    return false;
  }
}

/**
 * Mark a prompt as clicked/used
 */
export async function markPromptClicked(
  authUserId: string,
  promptText: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_shown_prompts')
      .update({
        clicked: true,
        clicked_at: new Date().toISOString(),
      })
      .eq('auth_user_id', authUserId)
      .eq('prompt_text', promptText)
      .is('clicked', false);

    if (error) {
      console.error('[ShownPromptsService] Error marking prompt clicked:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ShownPromptsService] Exception marking prompt clicked:', error);
    return false;
  }
}

/**
 * Filter out already-shown prompts from a list
 * Returns only prompts that haven't been shown recently
 */
export async function filterNewPrompts(
  authUserId: string,
  prompts: string[],
  promptType: PromptType,
  gameTitle: string | null = null
): Promise<string[]> {
  if (!prompts.length) {
    return [];
  }
  
  const recentlyShown = await getRecentShownPrompts(authUserId, promptType, gameTitle);
  const shownSet = new Set(recentlyShown.map(p => p.toLowerCase().trim()));
  
  return prompts.filter(p => !shownSet.has(p.toLowerCase().trim()));
}

/**
 * Check if a specific prompt has been shown recently
 */
export async function hasPromptBeenShown(
  authUserId: string,
  promptText: string,
  promptType: PromptType,
  gameTitle: string | null = null
): Promise<boolean> {
  const recentlyShown = await getRecentShownPrompts(authUserId, promptType, gameTitle);
  const normalizedPrompt = promptText.toLowerCase().trim();
  
  return recentlyShown.some(p => p.toLowerCase().trim() === normalizedPrompt);
}

// ============================================================================
// Exports
// ============================================================================

export const shownPromptsService = {
  getRecentShownPrompts,
  recordShownPrompt,
  recordShownPrompts,
  markPromptClicked,
  filterNewPrompts,
  hasPromptBeenShown,
};
