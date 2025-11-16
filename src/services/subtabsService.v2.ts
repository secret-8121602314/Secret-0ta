/**
 * SubtabsService V2 - Clean, Simple, Reliable
 * 
 * ARCHITECTURAL DECISIONS:
 * 1. JSONB-ONLY: Store subtabs in conversations.subtabs column (proven, working)
 * 2. No dual-write complexity: Single source of truth
 * 3. Supabase as primary storage: localStorage as cache only
 * 4. Type-safe: No `as any` casts
 * 5. Error handling: Graceful degradation
 * 
 * WHY JSONB vs NORMALIZED TABLE:
 * - Subtabs are tightly coupled to conversations (always loaded together)
 * - Small dataset per conversation (~5-10 subtabs max)
 * - No need for cross-conversation subtab queries
 * - Simpler architecture = fewer bugs
 * - JSONB indexing is sufficient for this use case
 * 
 * MIGRATION STRATEGY:
 * - Phase 1: Use this service with JSONB (immediate fix)
 * - Phase 2: Monitor performance and usage patterns
 * - Phase 3: If needed, migrate to normalized table with proper UI refactor
 */

import { supabase } from '../lib/supabase';
import { SubTab } from '../types';

export class SubtabsServiceV2 {
  private static instance: SubtabsServiceV2;

  private constructor() {}

  static getInstance(): SubtabsServiceV2 {
    if (!SubtabsServiceV2.instance) {
      SubtabsServiceV2.instance = new SubtabsServiceV2();
    }
    return SubtabsServiceV2.instance;
  }

  /**
   * Get all subtabs for a conversation
   * Reads directly from conversations.subtabs JSONB column
   */
  async getSubtabs(conversationId: string): Promise<SubTab[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('subtabs')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('[SubtabsV2] Error loading subtabs:', error);
        return [];
      }

      // Parse JSONB to SubTab array
      const subtabs = (data?.subtabs as unknown as SubTab[]) || [];
      
            return subtabs;
    } catch (error) {
      console.error('[SubtabsV2] Exception loading subtabs:', error);
      return [];
    }
  }

  /**
   * Set all subtabs for a conversation (replaces existing)
   * Writes to conversations.subtabs JSONB column
   */
  async setSubtabs(conversationId: string, subtabs: SubTab[]): Promise<boolean> {
    try {
            const { error } = await supabase
        .from('conversations')
        .update({
          subtabs: subtabs as unknown as never,
          subtabs_order: subtabs.map(tab => tab.id) as unknown as never,
          updated_at: new Date().toISOString() as never,
        })
        .eq('id', conversationId);

      if (error) {
        console.error('[SubtabsV2] Error saving subtabs:', error);
        return false;
      }

            return true;
    } catch (error) {
      console.error('[SubtabsV2] Exception saving subtabs:', error);
      return false;
    }
  }

  /**
   * Add a single subtab to a conversation
   * Loads existing, appends new one, saves back
   */
  async addSubtab(conversationId: string, subtab: SubTab): Promise<SubTab | null> {
    try {
            // Get current subtabs
      const currentSubtabs = await this.getSubtabs(conversationId);
      
      // Check if subtab with same ID already exists
      const exists = currentSubtabs.some(t => t.id === subtab.id);
      if (exists) {
                return this.updateSubtab(conversationId, subtab.id, subtab);
      }
      
      // Add new subtab
      const updatedSubtabs = [...currentSubtabs, subtab];
      
      // Save back
      const success = await this.setSubtabs(conversationId, updatedSubtabs);
      
      return success ? subtab : null;
    } catch (error) {
      console.error('[SubtabsV2] Exception adding subtab:', error);
      return null;
    }
  }

  /**
   * Update a single subtab in a conversation
   * Loads existing, updates matching one, saves back
   */
  async updateSubtab(
    conversationId: string,
    subtabId: string,
    updates: Partial<SubTab>
  ): Promise<SubTab | null> {
    try {
            // Get current subtabs
      const currentSubtabs = await this.getSubtabs(conversationId);
      
      // Find and update subtab
      let updatedSubtab: SubTab | null = null;
      const updatedSubtabs = currentSubtabs.map(tab => {
        if (tab.id === subtabId) {
          updatedSubtab = { ...tab, ...updates };
          return updatedSubtab;
        }
        return tab;
      });
      
      if (!updatedSubtab) {
        console.error(`[SubtabsV2] Subtab ${subtabId} not found in conversation ${conversationId}`);
        return null;
      }
      
      // Save back
      const success = await this.setSubtabs(conversationId, updatedSubtabs);
      
      return success ? updatedSubtab : null;
    } catch (error) {
      console.error('[SubtabsV2] Exception updating subtab:', error);
      return null;
    }
  }

  /**
   * Delete a subtab from a conversation
   * Loads existing, filters out target, saves back
   */
  async deleteSubtab(conversationId: string, subtabId: string): Promise<boolean> {
    try {
            // Get current subtabs
      const currentSubtabs = await this.getSubtabs(conversationId);
      
      // Filter out the subtab
      const updatedSubtabs = currentSubtabs.filter(tab => tab.id !== subtabId);
      
      // Check if anything was deleted
      if (updatedSubtabs.length === currentSubtabs.length) {
                return false;
      }
      
      // Save back
      return await this.setSubtabs(conversationId, updatedSubtabs);
    } catch (error) {
      console.error('[SubtabsV2] Exception deleting subtab:', error);
      return false;
    }
  }

  /**
   * Update multiple subtabs at once (batch operation)
   * More efficient than calling updateSubtab multiple times
   */
  async updateSubtabs(
    conversationId: string,
    updates: Array<{ id: string; updates: Partial<SubTab> }>
  ): Promise<boolean> {
    try {
            // Get current subtabs
      const currentSubtabs = await this.getSubtabs(conversationId);
      
      // Create update map for O(1) lookups
      const updateMap = new Map(updates.map(u => [u.id, u.updates]));
      
      // Apply updates
      const updatedSubtabs = currentSubtabs.map(tab => {
        const update = updateMap.get(tab.id);
        return update ? { ...tab, ...update } : tab;
      });
      
      // Save back
      return await this.setSubtabs(conversationId, updatedSubtabs);
    } catch (error) {
      console.error('[SubtabsV2] Exception batch updating subtabs:', error);
      return false;
    }
  }

  /**
   * Reorder subtabs by providing new order
   */
  async reorderSubtabs(conversationId: string, orderedIds: string[]): Promise<boolean> {
    try {
            // Get current subtabs
      const currentSubtabs = await this.getSubtabs(conversationId);
      
      // Create ID to subtab map
      const subtabMap = new Map(currentSubtabs.map(tab => [tab.id, tab]));
      
      // Reorder based on provided IDs
      const reorderedSubtabs = orderedIds
        .map(id => subtabMap.get(id))
        .filter((tab): tab is SubTab => tab !== undefined);
      
      // Validate all subtabs are present
      if (reorderedSubtabs.length !== currentSubtabs.length) {
        console.error('[SubtabsV2] Reorder failed: ID mismatch');
        return false;
      }
      
      // Save back
      return await this.setSubtabs(conversationId, reorderedSubtabs);
    } catch (error) {
      console.error('[SubtabsV2] Exception reordering subtabs:', error);
      return false;
    }
  }

  /**
   * Mark a subtab as loaded (status: 'loading' → 'loaded')
   */
  async markSubtabLoaded(
    conversationId: string,
    subtabId: string,
    content: string
  ): Promise<boolean> {
    return !!(await this.updateSubtab(conversationId, subtabId, {
      content,
      status: 'loaded',
      isNew: true,
    }));
  }

  /**
   * Mark a subtab as failed (status: 'loading' → 'error')
   */
  async markSubtabFailed(
    conversationId: string,
    subtabId: string,
    errorMessage: string
  ): Promise<boolean> {
    return !!(await this.updateSubtab(conversationId, subtabId, {
      content: `Error: ${errorMessage}`,
      status: 'error',
      isNew: false,
    }));
  }

  /**
   * Get subtabs by status (useful for finding loading/failed tabs)
   */
  async getSubtabsByStatus(
    conversationId: string,
    status: SubTab['status']
  ): Promise<SubTab[]> {
    const subtabs = await this.getSubtabs(conversationId);
    return subtabs.filter(tab => tab.status === status);
  }

  /**
   * Count subtabs by status
   */
  async countSubtabsByStatus(
    conversationId: string
  ): Promise<Record<string, number>> {
    const subtabs = await this.getSubtabs(conversationId);
    
    return subtabs.reduce((acc, tab) => {
      const status = tab.status || 'loaded';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Check if conversation has any loading subtabs
   */
  async hasLoadingSubtabs(conversationId: string): Promise<boolean> {
    const subtabs = await this.getSubtabs(conversationId);
    return subtabs.some(tab => tab.status === 'loading');
  }

  /**
   * Clear all subtabs from a conversation
   */
  async clearSubtabs(conversationId: string): Promise<boolean> {
        return await this.setSubtabs(conversationId, []);
  }
}

// Export singleton instance
export const subtabsServiceV2 = SubtabsServiceV2.getInstance();

/**
 * MIGRATION GUIDE:
 * 
 * To switch from old subtabsService to subtabsServiceV2:
 * 
 * 1. Update imports:
 *    OLD: import { subtabsService } from './subtabsService';
 *    NEW: import { subtabsServiceV2 } from './subtabsService.v2';
 * 
 * 2. Replace all calls:
 *    OLD: await subtabsService.getSubtabs(id)
 *    NEW: await subtabsServiceV2.getSubtabs(id)
 * 
 * 3. API is identical, no code changes needed beyond import!
 * 
 * 4. Remove old service after testing:
 *    - Delete src/services/subtabsService.ts
 *    - Rename subtabsService.v2.ts → subtabsService.ts
 * 
 * ROLLBACK PLAN:
 * - If V2 has issues, simply switch imports back to old service
 * - Data format is same (JSONB), so no data migration needed
 */
