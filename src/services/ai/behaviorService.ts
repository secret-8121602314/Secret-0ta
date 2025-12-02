/**
 * AI Behavior Service
 * 
 * Manages the users.behavior_data JSONB field for:
 * - Response topic history (to avoid repetition)
 * - AI corrections storage
 * - AI preference settings
 * 
 * Uses user-specific, game-specific scope by default.
 */

import { supabase } from '../../lib/supabase';

// ============================================================================
// Mutex for preventing race conditions on behavior_data updates
// ============================================================================

const updateLocks = new Map<string, Promise<void>>();

/**
 * Acquire a lock for a specific user to prevent concurrent updates
 * Uses a simpler approach that avoids await in loop
 */
async function acquireLock(authUserId: string): Promise<() => void> {
  // Wait for any existing operation to complete using recursive approach
  const existingLock = updateLocks.get(authUserId);
  if (existingLock) {
    await existingLock;
    // After waiting, check again (another operation might have started)
    return acquireLock(authUserId);
  }
  
  // Create a new lock
  let releaseLock: () => void = () => { /* placeholder */ };
  const lockPromise = new Promise<void>(resolve => {
    releaseLock = resolve;
  });
  updateLocks.set(authUserId, lockPromise);
  
  return () => {
    updateLocks.delete(authUserId);
    releaseLock();
  };
}

// ============================================================================
// Types
// ============================================================================

export type CorrectionType = 'factual' | 'style' | 'terminology' | 'behavior';
export type CorrectionScope = 'game' | 'global';
export type ResponseHistoryScope = 'game' | 'global' | 'off';

export interface AICorrection {
  id: string;
  gameTitle: string | null; // null = global
  originalSnippet: string;
  correctionText: string;
  type: CorrectionType;
  scope: CorrectionScope;
  isActive: boolean;
  appliedCount: number;
  createdAt: string;
}

export interface AIPreferences {
  responseHistoryScope: ResponseHistoryScope;
  applyCorrections: boolean;
  correctionDefaultScope: CorrectionScope;
}

export interface ResponseTopicsCache {
  [gameTitle: string]: string[]; // Max 20 topics per game
}

export interface BehaviorData {
  aiCorrections: AICorrection[];
  aiPreferences: AIPreferences;
  responseTopicsCache: ResponseTopicsCache;
}

// Default values
const DEFAULT_PREFERENCES: AIPreferences = {
  responseHistoryScope: 'game',
  applyCorrections: true,
  correctionDefaultScope: 'game',
};

const DEFAULT_BEHAVIOR_DATA: BehaviorData = {
  aiCorrections: [],
  aiPreferences: DEFAULT_PREFERENCES,
  responseTopicsCache: {},
};

const MAX_TOPICS_PER_GAME = 20;
const MAX_CORRECTIONS_PER_GAME = 5;
const MAX_GLOBAL_CORRECTIONS = 10;

// ============================================================================
// Behavior Data Management
// ============================================================================

/**
 * Get the behavior_data for a user
 */
export async function getBehaviorData(authUserId: string): Promise<BehaviorData> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('behavior_data')
      .eq('auth_user_id', authUserId)
      .single();

    if (error) {
      console.error('[BehaviorService] Error fetching behavior_data:', error);
      return DEFAULT_BEHAVIOR_DATA;
    }

    // Merge with defaults to ensure all fields exist
    const behaviorData = data?.behavior_data as Partial<BehaviorData> || {};
    return {
      aiCorrections: behaviorData.aiCorrections || [],
      aiPreferences: { ...DEFAULT_PREFERENCES, ...behaviorData.aiPreferences },
      responseTopicsCache: behaviorData.responseTopicsCache || {},
    };
  } catch (error) {
    console.error('[BehaviorService] Exception fetching behavior_data:', error);
    return DEFAULT_BEHAVIOR_DATA;
  }
}

/**
 * Update the behavior_data for a user
 * Uses mutex lock to prevent race conditions from concurrent updates
 */
export async function updateBehaviorData(
  authUserId: string, 
  updates: Partial<BehaviorData>
): Promise<boolean> {
  // Acquire lock to prevent race conditions
  const releaseLock = await acquireLock(authUserId);
  
  try {
    // Get current data first (within lock)
    const current = await getBehaviorData(authUserId);
    
    // Merge updates
    const newData: BehaviorData = {
      ...current,
      ...updates,
      aiPreferences: updates.aiPreferences 
        ? { ...current.aiPreferences, ...updates.aiPreferences }
        : current.aiPreferences,
    };

    const { error } = await supabase
      .from('users')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ behavior_data: newData as any })
      .eq('auth_user_id', authUserId);

    if (error) {
      console.error('[BehaviorService] Error updating behavior_data:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[BehaviorService] Exception updating behavior_data:', error);
    return false;
  } finally {
    // Always release lock
    releaseLock();
  }
}

// ============================================================================
// Response Topics (for non-repetitive responses)
// ============================================================================

/**
 * Get recent topics discussed for a game (or globally)
 */
export async function getResponseTopics(
  authUserId: string,
  gameTitle: string | null,
  scope: ResponseHistoryScope = 'game'
): Promise<string[]> {
  if (scope === 'off') {
    return [];
  }

  const behaviorData = await getBehaviorData(authUserId);
  
  if (scope === 'global') {
    // Return all topics across all games
    return Object.values(behaviorData.responseTopicsCache).flat().slice(0, 50);
  }
  
  // Game-specific
  const key = gameTitle || 'game-hub';
  return behaviorData.responseTopicsCache[key] || [];
}

/**
 * Add new topics after an AI response
 */
export async function addResponseTopics(
  authUserId: string,
  gameTitle: string | null,
  newTopics: string[]
): Promise<void> {
  if (!newTopics.length) {
    return;
  }

  const behaviorData = await getBehaviorData(authUserId);
  const key = gameTitle || 'game-hub';
  
  // Get existing topics for this game
  const existingTopics = behaviorData.responseTopicsCache[key] || [];
  
  // Combine and dedupe, keeping most recent at front
  const combined = [...newTopics, ...existingTopics];
  const deduped = [...new Set(combined)].slice(0, MAX_TOPICS_PER_GAME);
  
  // Update cache
  behaviorData.responseTopicsCache[key] = deduped;
  
  await updateBehaviorData(authUserId, {
    responseTopicsCache: behaviorData.responseTopicsCache,
  });
}

/**
 * Clear topics for a specific game or all games
 */
export async function clearResponseTopics(
  authUserId: string,
  gameTitle?: string | null
): Promise<void> {
  const behaviorData = await getBehaviorData(authUserId);
  
  if (gameTitle === undefined) {
    // Clear all
    await updateBehaviorData(authUserId, { responseTopicsCache: {} });
  } else {
    // Clear specific game
    const key = gameTitle || 'game-hub';
    delete behaviorData.responseTopicsCache[key];
    await updateBehaviorData(authUserId, {
      responseTopicsCache: behaviorData.responseTopicsCache,
    });
  }
}

// ============================================================================
// AI Preferences
// ============================================================================

/**
 * Get AI preferences for a user
 */
export async function getAIPreferences(authUserId: string): Promise<AIPreferences> {
  const behaviorData = await getBehaviorData(authUserId);
  return behaviorData.aiPreferences;
}

/**
 * Update AI preferences
 */
export async function updateAIPreferences(
  authUserId: string,
  updates: Partial<AIPreferences>
): Promise<boolean> {
  const behaviorData = await getBehaviorData(authUserId);
  return updateBehaviorData(authUserId, {
    aiPreferences: { ...behaviorData.aiPreferences, ...updates },
  });
}

// ============================================================================
// AI Corrections (stored in behavior_data for quick access)
// ============================================================================

/**
 * Get active corrections for a user, optionally filtered by game
 */
export async function getActiveCorrections(
  authUserId: string,
  gameTitle: string | null = null,
  includeGlobal: boolean = true
): Promise<AICorrection[]> {
  const behaviorData = await getBehaviorData(authUserId);
  
  return behaviorData.aiCorrections.filter(c => {
    if (!c.isActive) {
      return false;
    }
    
    // Game-specific corrections
    if (c.scope === 'game') {
      return c.gameTitle === gameTitle;
    }
    
    // Global corrections
    return includeGlobal && c.scope === 'global';
  });
}

/**
 * Add a new correction (after validation)
 */
export async function addCorrection(
  authUserId: string,
  correction: Omit<AICorrection, 'id' | 'appliedCount' | 'createdAt' | 'isActive'>
): Promise<{ success: boolean; error?: string }> {
  const behaviorData = await getBehaviorData(authUserId);
  
  // Check limits
  const gameCorrections = behaviorData.aiCorrections.filter(
    c => c.isActive && c.scope === 'game' && c.gameTitle === correction.gameTitle
  );
  const globalCorrections = behaviorData.aiCorrections.filter(
    c => c.isActive && c.scope === 'global'
  );
  
  if (correction.scope === 'game' && gameCorrections.length >= MAX_CORRECTIONS_PER_GAME) {
    return { 
      success: false, 
      error: `Maximum ${MAX_CORRECTIONS_PER_GAME} corrections per game reached` 
    };
  }
  
  if (correction.scope === 'global' && globalCorrections.length >= MAX_GLOBAL_CORRECTIONS) {
    return { 
      success: false, 
      error: `Maximum ${MAX_GLOBAL_CORRECTIONS} global corrections reached` 
    };
  }
  
  // Create new correction
  const newCorrection: AICorrection = {
    ...correction,
    id: crypto.randomUUID(),
    isActive: true,
    appliedCount: 0,
    createdAt: new Date().toISOString(),
  };
  
  behaviorData.aiCorrections.push(newCorrection);
  
  const success = await updateBehaviorData(authUserId, {
    aiCorrections: behaviorData.aiCorrections,
  });
  
  return { success };
}

/**
 * Toggle a correction's active status
 */
export async function toggleCorrection(
  authUserId: string,
  correctionId: string,
  isActive: boolean
): Promise<boolean> {
  const behaviorData = await getBehaviorData(authUserId);
  
  const correction = behaviorData.aiCorrections.find(c => c.id === correctionId);
  if (!correction) {
    return false;
  }
  
  correction.isActive = isActive;
  
  return updateBehaviorData(authUserId, {
    aiCorrections: behaviorData.aiCorrections,
  });
}

/**
 * Remove a correction permanently
 */
export async function removeCorrection(
  authUserId: string,
  correctionId: string
): Promise<boolean> {
  const behaviorData = await getBehaviorData(authUserId);
  
  behaviorData.aiCorrections = behaviorData.aiCorrections.filter(
    c => c.id !== correctionId
  );
  
  return updateBehaviorData(authUserId, {
    aiCorrections: behaviorData.aiCorrections,
  });
}

/**
 * Increment the applied count for a correction
 */
export async function incrementCorrectionApplied(
  authUserId: string,
  correctionId: string
): Promise<void> {
  const behaviorData = await getBehaviorData(authUserId);
  
  const correction = behaviorData.aiCorrections.find(c => c.id === correctionId);
  if (correction) {
    correction.appliedCount++;
    await updateBehaviorData(authUserId, {
      aiCorrections: behaviorData.aiCorrections,
    });
  }
}

// ============================================================================
// Exports
// ============================================================================

export const behaviorService = {
  // Behavior data
  getBehaviorData,
  updateBehaviorData,
  
  // Response topics
  getResponseTopics,
  addResponseTopics,
  clearResponseTopics,
  
  // Preferences
  getAIPreferences,
  updateAIPreferences,
  
  // Corrections
  getActiveCorrections,
  addCorrection,
  toggleCorrection,
  removeCorrection,
  incrementCorrectionApplied,
};
