import { supabase } from '../lib/supabase';
import { SubTab } from '../types';
import { FEATURE_FLAGS } from '../constants';
import { safeString } from '../utils/typeHelpers';

/**
 * SubtabsService - Abstraction layer for subtab storage
 * 
 * Supports both approaches:
 * 1. Legacy: conversations.subtabs JSONB array
 * 2. Normalized: subtabs table with conversation_id FK and indexes
 * 
 * Toggle via FEATURE_FLAGS.USE_NORMALIZED_SUBTABS
 */
export class SubtabsService {
  private static instance: SubtabsService;

  static getInstance(): SubtabsService {
    if (!SubtabsService.instance) {
      SubtabsService.instance = new SubtabsService();
    }
    return SubtabsService.instance;
  }

  /**
   * Get all subtabs for a conversation
   */
  async getSubtabs(conversationId: string): Promise<SubTab[]> {
    // ✅ Production uses normalized subtabs table only
    return this.getSubtabsFromTable(conversationId);
  }

  /**
   * Set subtabs for a conversation (replaces all)
   * 
   * MIGRATION STRATEGY: During transition period, write to BOTH table AND JSONB
   * to ensure backwards compatibility while normalized table is being adopted
   */
  async setSubtabs(conversationId: string, subtabs: SubTab[]): Promise<boolean> {
    // ✅ Production uses normalized subtabs table only (no JSONB column in conversations)
    console.error(`🔄 [SubtabsService] Writing ${subtabs.length} subtabs to normalized table for conversation:`, conversationId);
    
    const tableSuccess = await this.setSubtabsInTable(conversationId, subtabs);
    console.error(`  ✅ Table write:`, tableSuccess ? 'SUCCESS' : 'FAILED');
    
    return tableSuccess;
  }

  /**
   * Add a single subtab to a conversation
   * 
   * MIGRATION STRATEGY: Write to BOTH table AND JSONB during transition
   */
  async addSubtab(conversationId: string, subtab: SubTab): Promise<SubTab | null> {
    // ✅ UNRELEASED GAMES CHECK: Block subtab creation for unreleased games
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('is_unreleased, title')
      .eq('id', conversationId)
      .single();
    
    if (convError) {
      console.error('Error checking conversation for unreleased status:', convError);
      return null;
    }
    
    if (conversation?.is_unreleased) {
            throw new Error('Subtabs cannot be created for unreleased games. This feature will be available once the game is released.');
    }
    
    // ✅ Production uses normalized subtabs table only
    const tableResult = await this.addSubtabToTable(conversationId, subtab);
    return tableResult;
  }

  /**
   * Update a subtab in a conversation
   * 
   * MIGRATION STRATEGY: Update in BOTH table AND JSONB during transition
   */
  async updateSubtab(
    conversationId: string,
    subtabId: string,
    updates: Partial<SubTab>
  ): Promise<boolean> {
    // ✅ Production uses normalized subtabs table only
    const tableSuccess = await this.updateSubtabInTable(subtabId, updates);
    return tableSuccess;
  }

  /**
   * Delete a subtab from a conversation
   */
  async deleteSubtab(conversationId: string, subtabId: string): Promise<boolean> {
    // ✅ Production uses normalized subtabs table only
    return this.deleteSubtabFromTable(subtabId);
  }

  // ============================================================================
  // NORMALIZED SUBTABS TABLE METHODS
  // ============================================================================

  /**
   * Get subtabs from normalized subtabs table
   */
  private async getSubtabsFromTable(conversationId: string): Promise<SubTab[]> {
    try {
      const { data, error } = await supabase
        .from('subtabs')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error getting subtabs from table:', error);
        return [];
      }

      return (data || []).map((subtab) => {
        const metadata = typeof subtab.metadata === 'object' && subtab.metadata !== null ? subtab.metadata as Record<string, unknown> : {};
        return {
          id: subtab.id,
          title: subtab.title,
          content: subtab.content || '',
          type: subtab.tab_type as SubTab['type'],
          isNew: (metadata.isNew as boolean) || false,
          status: (metadata.status as SubTab['status']) || 'loaded',
          instruction: metadata.instruction as string | undefined,
        };
      });
    } catch (error) {
      console.error('Error getting subtabs from table:', error);
      return [];
    }
  }

  /**
   * Set subtabs in normalized table (replaces all existing subtabs)
   */
  private async setSubtabsInTable(
    conversationId: string,
    subtabs: SubTab[]
  ): Promise<boolean> {
    try {
      // ✅ CRITICAL: Get auth_user_id from conversation FIRST to avoid trigger issues
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('auth_user_id')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation?.auth_user_id) {
        console.error('❌ [SubtabsService] Error getting conversation auth_user_id:', convError);
        console.error('❌ [SubtabsService] Conversation may not exist yet. ConversationId:', conversationId);
        return false;
      }

      const authUserId = conversation.auth_user_id;
      console.error(`🔄 [SubtabsService] Using auth_user_id: ${authUserId} for ${subtabs.length} subtabs`);

      // Delete existing subtabs for this conversation
      const { error: deleteError } = await supabase
        .from('subtabs')
        .delete()
        .eq('conversation_id', conversationId);

      if (deleteError) {
        console.error('Error deleting existing subtabs:', deleteError);
        return false;
      }

      // Insert new subtabs
      if (subtabs.length > 0) {
        const subtabsToInsert = subtabs.map((subtab, index) => {
          // ✅ Validate that type exists before mapping
          if (!subtab.type) {
            console.error(`⚠️ [SubtabsService] Subtab "${subtab.title}" has NULL type! Using fallback.`);
          }

          return {
            id: subtab.id,
            conversation_id: conversationId,
            game_id: null, // Made nullable in schema migration
            title: subtab.title || 'Untitled',
            content: subtab.content || '',
            tab_type: subtab.type || 'chat', // ✅ Fallback to 'chat' if type is missing
            order_index: index,
            auth_user_id: authUserId, // ✅ Explicitly set to avoid trigger race conditions
            metadata: {
              isNew: subtab.isNew,
              status: subtab.status,
              instruction: subtab.instruction,
            },
          };
        });

        console.error('🔄 [SubtabsService] Inserting subtabs:', subtabsToInsert.map(s => ({ title: s.title, tab_type: s.tab_type, has_auth_user_id: !!s.auth_user_id })));

        // Types not regenerated yet, but schema migration applied (game_id nullable)
        const { error: insertError } = await supabase
          .from('subtabs')
          .insert(subtabsToInsert);

        if (insertError) {
          console.error('❌ [SubtabsService] Error inserting subtabs:', insertError);
          console.error('❌ [SubtabsService] Failed subtabs data:', JSON.stringify(subtabsToInsert, null, 2));
          return false;
        }

        console.error('✅ [SubtabsService] Successfully inserted', subtabs.length, 'subtabs');
      }

      return true;
    } catch (error) {
      console.error('❌ [SubtabsService] Error setting subtabs in table:', error);
      return false;
    }
  }

  /**
   * Add a single subtab to the normalized table
   */
  private async addSubtabToTable(
    conversationId: string,
    subtab: SubTab
  ): Promise<SubTab | null> {
    try {
      // Get the conversation to find game_id
      const { data: conversation } = await supabase
        .from('conversations')
        .select('game_id')
        .eq('id', conversationId)
        .single();

      const gameId = conversation?.game_id || '';

      // Get current max order_index
      const { data: existingSubtabs } = await supabase
        .from('subtabs')
        .select('order_index')
        .eq('conversation_id', conversationId)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingSubtabs?.[0]?.order_index ?? -1;

      const { data, error } = await supabase
        .from('subtabs')
        .insert({
          id: subtab.id,
          conversation_id: conversationId,
          game_id: gameId,
          title: subtab.title,
          content: subtab.content,
          tab_type: subtab.type,
          order_index: nextOrderIndex + 1,
          metadata: {
            isNew: subtab.isNew,
            status: subtab.status,
            instruction: subtab.instruction,
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding subtab to table:', error);
        return null;
      }

      return {
        id: data.id,
        title: data.title,
        content: safeString(data.content),
        type: data.tab_type as SubTab['type'],
        isNew: typeof data.metadata === 'object' && data.metadata !== null && !Array.isArray(data.metadata) 
          ? (data.metadata as Record<string, unknown>).isNew as boolean || false
          : false,
        status: (typeof data.metadata === 'object' && data.metadata !== null && !Array.isArray(data.metadata)
          ? (data.metadata as Record<string, unknown>).status as SubTab['status']
          : undefined) || 'loaded',
        instruction: typeof data.metadata === 'object' && data.metadata !== null && !Array.isArray(data.metadata)
          ? (data.metadata as Record<string, unknown>).instruction as string | undefined
          : undefined,
      };
    } catch (error) {
      console.error('Error adding subtab to table:', error);
      return null;
    }
  }

  /**
   * Update a subtab in the normalized table
   */
  private async updateSubtabInTable(
    subtabId: string,
    updates: Partial<SubTab>
  ): Promise<boolean> {
    try {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.title !== undefined) {
        dbUpdates.title = updates.title;
      }
      if (updates.content !== undefined) {
        dbUpdates.content = updates.content;
      }
      if (updates.type !== undefined) {
        dbUpdates.tab_type = updates.type;
      }
      
      // Handle metadata updates
      if (updates.isNew !== undefined || updates.status !== undefined || updates.instruction !== undefined) {
        // Get current metadata
        const { data: current } = await supabase
          .from('subtabs')
          .select('metadata')
          .eq('id', subtabId)
          .single();

        const currentMetadata = typeof current?.metadata === 'object' && current?.metadata !== null 
          ? (current.metadata as Record<string, unknown>)
          : {};
        
        dbUpdates.metadata = {
          ...currentMetadata,
          ...(updates.isNew !== undefined && { isNew: updates.isNew }),
          ...(updates.status !== undefined && { status: updates.status }),
          ...(updates.instruction !== undefined && { instruction: updates.instruction }),
        };
      }

      const { error } = await supabase
        .from('subtabs')
        .update(dbUpdates)
        .eq('id', subtabId);

      if (error) {
        console.error('Error updating subtab in table:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating subtab in table:', error);
      return false;
    }
  }

  /**
   * Delete a subtab from the normalized table
   */
  private async deleteSubtabFromTable(subtabId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subtabs')
        .delete()
        .eq('id', subtabId);

      if (error) {
        console.error('Error deleting subtab from table:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting subtab from table:', error);
      return false;
    }
  }

  // ============================================================================
  // LEGACY JSONB METHODS
  // ============================================================================

  /**
   * Get subtabs from conversations.subtabs JSONB field
   */
  private async getSubtabsFromJsonb(conversationId: string): Promise<SubTab[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('subtabs')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error getting subtabs from JSONB:', error);
        return [];
      }

      return (data?.subtabs as unknown as SubTab[]) || [];
    } catch (error) {
      console.error('Error getting subtabs from JSONB:', error);
      return [];
    }
  }

  /**
   * Set subtabs in conversations.subtabs JSONB field
   */
  private async setSubtabsInJsonb(
    conversationId: string,
    subtabs: SubTab[]
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          subtabs: subtabs as unknown as never,
          subtabs_order: subtabs.map((tab) => tab.id) as unknown as never, // Fixed: Use snake_case column name
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error setting subtabs in JSONB:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error setting subtabs in JSONB:', error);
      return false;
    }
  }

  /**
   * Add a single subtab to conversations.subtabs JSONB array
   */
  private async addSubtabToJsonb(
    conversationId: string,
    subtab: SubTab
  ): Promise<SubTab | null> {
    try {
      // Get current subtabs
      const currentSubtabs = await this.getSubtabsFromJsonb(conversationId);
      
      // Add new subtab
      const updatedSubtabs = [...currentSubtabs, subtab];
      
      // Save back
      const success = await this.setSubtabsInJsonb(conversationId, updatedSubtabs);
      
      return success ? subtab : null;
    } catch (error) {
      console.error('Error adding subtab to JSONB:', error);
      return null;
    }
  }

  /**
   * Update a subtab in conversations.subtabs JSONB array
   */
  private async updateSubtabInJsonb(
    conversationId: string,
    subtabId: string,
    updates: Partial<SubTab>
  ): Promise<boolean> {
    try {
      // Get current subtabs
      const currentSubtabs = await this.getSubtabsFromJsonb(conversationId);
      
      // Find and update subtab
      const updatedSubtabs = currentSubtabs.map((subtab) =>
        subtab.id === subtabId ? { ...subtab, ...updates } : subtab
      );
      
      // Save back
      return await this.setSubtabsInJsonb(conversationId, updatedSubtabs);
    } catch (error) {
      console.error('Error updating subtab in JSONB:', error);
      return false;
    }
  }

  /**
   * Delete a subtab from conversations.subtabs JSONB array
   */
  private async deleteSubtabFromJsonb(
    conversationId: string,
    subtabId: string
  ): Promise<boolean> {
    try {
      // Get current subtabs
      const currentSubtabs = await this.getSubtabsFromJsonb(conversationId);
      
      // Filter out the subtab
      const updatedSubtabs = currentSubtabs.filter((subtab) => subtab.id !== subtabId);
      
      // Save back
      return await this.setSubtabsInJsonb(conversationId, updatedSubtabs);
    } catch (error) {
      console.error('Error deleting subtab from JSONB:', error);
      return false;
    }
  }

  // ============================================================================
  // MIGRATION UTILITIES
  // ============================================================================

  /**
   * Migrate subtabs from JSONB to normalized table for a specific conversation
   */
  async migrateConversationSubtabs(conversationId: string): Promise<boolean> {
    try {
      // Get subtabs from JSONB
      const subtabs = await this.getSubtabsFromJsonb(conversationId);

      if (subtabs.length === 0) {
        return true;
      }

      // Write to normalized table
      const success = await this.setSubtabsInTable(conversationId, subtabs);

      return success;
    } catch (error) {
      console.error('Error migrating subtabs:', error);
      return false;
    }
  }

  /**
   * Rollback: Copy subtabs from table back to JSONB for a specific conversation
   */
  async rollbackConversationSubtabs(conversationId: string): Promise<boolean> {
    try {
      // Get subtabs from table
      const subtabs = await this.getSubtabsFromTable(conversationId);

      if (subtabs.length === 0) {
        return true;
      }

      // Write to JSONB
      const success = await this.setSubtabsInJsonb(conversationId, subtabs);

      return success;
    } catch (error) {
      console.error('Error rolling back subtabs:', error);
      return false;
    }
  }

  /**
   * Batch migrate all conversations with subtabs
   */
  async migrateAllSubtabs(): Promise<{ success: number; failed: number }> {
    try {
      // Get all conversations with subtabs
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id, subtabs')
        .not('subtabs', 'is', null);

      if (error) {
        console.error('Error fetching conversations:', error);
        return { success: 0, failed: 0 };
      }

      let successCount = 0;
      let failedCount = 0;

      // Process all conversations in parallel for better performance
      const migrationPromises = (conversations || [])
        .filter(conv => conv.subtabs && Array.isArray(conv.subtabs) && conv.subtabs.length > 0)
        .map(conv => this.migrateConversationSubtabs(conv.id));

      const results = await Promise.allSettled(migrationPromises);

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          successCount++;
        } else {
          failedCount++;
        }
      });

      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error('Error in batch migration:', error);
      return { success: 0, failed: 0 };
    }
  }
}

// Export singleton instance
export const subtabsService = SubtabsService.getInstance();
