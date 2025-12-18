import { supabase } from '../lib/supabase';
import { User, Conversation, Game, TrialStatus, SubTab } from '../types';
import type { Json } from '../types/database';
import { USER_TIERS, TIER_LIMITS } from '../constants';
import { jsonToRecord, safeParseDate, safeBoolean, safeNumber, safeString, toJson } from '../utils/typeHelpers';
import { toastService } from './toastService';
import { mapUserData } from '../utils/userMapping';

// Helper to cast our custom types to Json for Supabase
const asJson = <T>(value: T): Json => value as unknown as Json;

export class SupabaseService {
  private static instance: SupabaseService;
  
  // ✅ PERFORMANCE: Batch and deduplicate conversation updates
  private updateQueue = new Map<string, { updates: Partial<Conversation>; timestamp: number }>();
  private updateTimer: NodeJS.Timeout | null = null;
  private readonly UPDATE_DEBOUNCE_MS = 300; // Batch updates within 300ms window
  private lastUpdateCache = new Map<string, { updates: string; timestamp: number }>();

  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // User operations
  async getUser(authUserId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.rpc('get_complete_user_data', {
        p_auth_user_id: authUserId
      });

      if (error) {
        console.error('Error getting user:', error);
        return null;
      }

      if (data && data.length > 0) {
        return mapUserData(data[0] as Record<string, unknown>);
      }

      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      toastService.error('Failed to load user data. Please try again.');
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          tier: updates.tier,
          has_used_trial: updates.hasUsedTrial,
          last_activity: updates.lastActivity,
          preferences: asJson(updates.preferences),
          app_state: asJson(updates.appState),
          profile_data: asJson(updates.profileData),
          onboarding_data: asJson(updates.onboardingData),
          behavior_data: asJson(updates.behaviorData),
          feedback_data: asJson(updates.feedbackData),
          usage_data: asJson(updates.usageData),
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', userId);

      if (error) {
        console.error('Error updating user:', error, { userId, updates });
        toastService.error('Failed to update user settings.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  async updateUsage(userId: string, usage: { textCount?: number; imageCount?: number; textLimit?: number; imageLimit?: number }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          text_count: usage.textCount,
          image_count: usage.imageCount,
          text_limit: usage.textLimit,
          image_limit: usage.imageLimit,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', userId);

      if (error) {
        console.error('Error updating usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating usage:', error, { userId });
      toastService.error('Failed to update usage data.');
      return false;
    }
  }

  // Conversation operations
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      // ✅ FIX: Query by auth_user_id directly (matches RLS policies)
      // ✅ RLS WORKAROUND: Try query without filter - RLS should auto-filter by auth.uid()
      // This bypasses potential issues with the auth_user_id column
      const { data: dataNoFilter, error: errorNoFilter } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            id,
            conversation_id,
            role,
            content,
            image_url,
            metadata,
            created_at
          ),
          subtabs (
            id,
            conversation_id,
            game_id,
            title,
            content,
            tab_type,
            order_index,
            metadata,
            created_at,
            updated_at
          )
        `)
        .order('updated_at', { ascending: false})
        .order('created_at', { foreignTable: 'messages', ascending: true });
      
            if (!errorNoFilter && dataNoFilter && dataNoFilter.length > 0) {
                return this.mapConversations(dataNoFilter);
      }
      
      // If unfiltered fails, try with explicit filter
            const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            id,
            conversation_id,
            role,
            content,
            image_url,
            metadata,
            created_at
          ),
          subtabs (
            id,
            conversation_id,
            game_id,
            title,
            content,
            tab_type,
            order_index,
            metadata,
            created_at,
            updated_at
          )
        `)
        .eq('auth_user_id', userId)
        .order('updated_at', { ascending: false})
        .order('created_at', { foreignTable: 'messages', ascending: true });

      if (error) {
        console.error('❌ [Supabase] Error getting conversations:', error);
        console.error('❌ [Supabase] Error details:', JSON.stringify(error));
        return [];
      }
      
            if (data.length === 0) {
        // 🔍 If we got 0 results, check session to verify auth context
        const { data: { session } } = await supabase.auth.getSession();
        console.error('🔍 [Supabase] Zero results diagnostic:', {
          requestedUserId: userId,
          sessionUserId: session?.user?.id,
          match: session?.user?.id === userId,
          message: 'RLS SELECT policy may be blocking reads'
        });
      }
      return this.mapConversations(data);
    } catch (error) {
      console.error('Error getting conversations:', error);
      toastService.error('Failed to load conversations. Please try again.');
      return [];
    }
  }
  
  private mapConversations(data: Array<Record<string, unknown>>): Conversation[] {
    return data.map(conv => {
      // Handle messages from the join
      const messages = conv.messages;
      
      const processedMessages = Array.isArray(messages) 
        ? messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            timestamp: safeParseDate(msg.created_at),
            imageUrl: safeString(msg.image_url, undefined),
            metadata: typeof msg.metadata === 'object' && msg.metadata !== null ? msg.metadata as Record<string, unknown> : undefined,
          }))
        : [];
      
      // Handle subtabs from the join
      const rawSubtabs = conv.subtabs;
      const processedSubtabs = Array.isArray(rawSubtabs) 
        ? rawSubtabs.map((subtab: any) => {
            const metadata = typeof subtab.metadata === 'object' && subtab.metadata !== null 
              ? subtab.metadata as Record<string, unknown> 
              : {};
            
            return {
              id: subtab.id,
              conversationId: subtab.conversation_id,
              gameId: subtab.game_id,
              title: subtab.title,
              content: subtab.content || '',
              type: subtab.tab_type as SubTab['type'],  // ✅ Map tab_type → type
              orderIndex: subtab.order_index,
              metadata: metadata,
              createdAt: safeParseDate(subtab.created_at),
              updatedAt: safeParseDate(subtab.updated_at),
              // Client-side fields
              isNew: (metadata.isNew as boolean) || false,
              status: (metadata.status as SubTab['status']) || 'loaded',  // ✅ Map metadata.status → status
              instruction: metadata.instruction as string | undefined,
            };
          })
        : [];
      
      // 🔍 DEBUG: Log subtab mapping to verify correct shape
      if (processedSubtabs.length > 0 && conv.id !== 'game-hub') {
        const sample = processedSubtabs[0];
        console.error('🔍 [Supabase] Subtab mapping verification:', {
          conversationId: conv.id,
          sampleSubtab: {
            hasType: 'type' in sample,
            hasStatus: 'status' in sample,
            type: sample.type,
            status: sample.status,
            title: sample.title
          }
        });
      }
      
      return {
        id: conv.id as string,
        authUserId: (conv.auth_user_id as string | null) ?? undefined,
        userId: (conv.user_id as string | null) ?? undefined,
        title: conv.title as string,
        messages: processedMessages,
        gameId: (conv.game_id as string | null) ?? undefined,
        gameTitle: (conv.game_title as string | null) ?? undefined,
        genre: (conv.genre as string | null) ?? undefined,
        subtabs: processedSubtabs,
        subtabsOrder: (conv.subtabs_order as string[]) || [],
        isActiveSession: conv.is_active_session as boolean | null,
        activeObjective: (conv.active_objective as string | null) ?? undefined,
        gameProgress: (() => {
          const dbValue = conv.game_progress;
          const mappedValue = (dbValue as number | null) ?? undefined;
          // 🔍 DEBUG: Log game_progress mapping for non-Game Hub conversations
          if (conv.id !== 'game-hub') {
            console.log('📊 [SupabaseService] Loading gameProgress for', conv.title, '- DB value:', dbValue, '→ Mapped:', mappedValue);
          }
          return mappedValue;
        })(),
        createdAt: safeParseDate(conv.created_at as string | null),
        updatedAt: safeParseDate(conv.updated_at as string | null),
        isActive: conv.is_active as boolean | null,
        isPinned: (conv.is_pinned as boolean | null) ?? undefined,
        pinnedAt: conv.pinned_at ? new Date(conv.pinned_at as string).getTime() : undefined,
        isGameHub: (conv.is_game_hub as boolean | null) ?? undefined,
        isUnreleased: (conv.is_unreleased as boolean | null) ?? undefined,
        contextSummary: (conv.context_summary as string | null) ?? undefined,
        lastSummarizedAt: conv.last_summarized_at ? new Date(conv.last_summarized_at as number).getTime() : undefined,
      };
    }) as Conversation[];
  }

  async createConversation(userId: string, conversation: Omit<Conversation, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string | null> {
    try {
      // ✅ Verify session is active
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.id !== userId) {
        console.error('❌ [Supabase] Session mismatch! RLS will block reads. Session:', session?.user?.id, 'vs userId:', userId);
        console.error('❌ [Supabase] Cannot create conversation without valid session - aborting to prevent RLS violation');
        return null;
      }
      
      // ✅ FIX: Use auth_user_id directly instead of RPC function
      // The RPC function get_user_id_from_auth_id was causing issues
      // Now we use auth_user_id (which references auth.users.id) directly
      // This matches the RLS policies which check auth_user_id = auth.uid()
      
      const insertData: Record<string, unknown> = {
        auth_user_id: userId, // ✅ Direct auth user ID
        title: conversation.title,
        // Note: messages, subtabs, subtabs_order are NOT in conversations table (removed in migration)
        // Messages are in separate messages table
        // Subtabs are in separate subtabs table
        game_id: conversation.gameId,
        game_title: conversation.gameTitle,
        genre: conversation.genre,
        is_active_session: conversation.isActiveSession,
        active_objective: conversation.activeObjective,
        game_progress: conversation.gameProgress,
        is_active: conversation.isActive,
        is_pinned: conversation.isPinned,
        pinned_at: conversation.pinnedAt ? new Date(conversation.pinnedAt).toISOString() : null,
        is_game_hub: conversation.isGameHub,
      };
      
      // ✅ CRITICAL: For Game Hub, use the provided ID to maintain consistency
      if (conversation.id) {
        insertData.id = conversation.id;
      }
      
      // ✅ FIX: Use UPSERT to handle duplicate Game Hub (409 Conflict)
      // If a conversation with this ID exists, update it instead of failing
      // Note: We cast insertData because the generated types may not include auth_user_id
       
            const { data, error } = await supabase
        .from('conversations')
        .upsert(insertData as any, { 
          onConflict: 'id',
          ignoreDuplicates: false // Update existing record
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ [Supabase] Error creating/updating conversation:', error);
        console.error('❌ [Supabase] Error details:', JSON.stringify(error));
        return null;
      }

            // ✅ Verify we can read it back immediately with full data
      const { data: verifyData, error: verifyError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', data.id)
        .single();
      
      if (verifyError) {
        console.error('⚠️ [Supabase] Cannot read back conversation after upsert!', verifyError.message);
        console.error('⚠️ [Supabase] This indicates RLS SELECT policy is blocking reads');
      } else {
                // 🔍 Check if this row would pass RLS
        const { data: { session } } = await supabase.auth.getSession();
        // Note: auth_user_id exists in actual DB but may not be in generated types
        const rowAuthUserId = (verifyData as unknown as { auth_user_id?: string }).auth_user_id;
        if (session?.user?.id !== rowAuthUserId) {
          console.error('🚨 [Supabase] AUTH_USER_ID MISMATCH!', {
            sessionUserId: session?.user?.id,
            rowAuthUserId: rowAuthUserId,
            match: false
          });
        }
        // else: IDs match as expected
      }
      
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<boolean> {
    try {
      // ✅ PERFORMANCE: Deduplicate identical updates within 1 second
      const updateKey = JSON.stringify(updates);
      const lastUpdate = this.lastUpdateCache.get(conversationId);
      if (lastUpdate && 
          Date.now() - lastUpdate.timestamp < 1000 &&
          lastUpdate.updates === updateKey) {
        return true; // Skip duplicate update
      }
      
      // Queue the update for batching
      const existing = this.updateQueue.get(conversationId);
      this.updateQueue.set(conversationId, {
        updates: { ...existing?.updates, ...updates }, // Merge updates
        timestamp: Date.now()
      });
      
      // Debounce batch execution
      if (this.updateTimer) clearTimeout(this.updateTimer);
      this.updateTimer = setTimeout(() => this.flushUpdateQueue(), this.UPDATE_DEBOUNCE_MS);
      
      return true;
    } catch (error) {
      console.error('Error queueing conversation update:', error, { conversationId });
      return false;
    }
  }
  
  /**
   * Flush queued updates to database (batched)
   */
  private async flushUpdateQueue(): Promise<void> {
    const updates = Array.from(this.updateQueue.entries());
    this.updateQueue.clear();
    
    if (updates.length === 0) return;
    
    // Execute all updates in parallel
    const results = await Promise.allSettled(
      updates.map(async ([conversationId, { updates: data }]) => {
        try {
          const { error } = await supabase
            .from('conversations')
            .update({
              title: data.title,
              game_id: data.gameId,
              game_title: data.gameTitle,
              genre: data.genre,
              is_active_session: data.isActiveSession,
              active_objective: data.activeObjective,
              game_progress: data.gameProgress,
              is_active: data.isActive,
              is_pinned: data.isPinned,
              pinned_at: data.pinnedAt ? new Date(data.pinnedAt).toISOString() : null,
              is_game_hub: data.isGameHub,
              is_unreleased: data.isUnreleased,
              context_summary: data.contextSummary,
              last_summarized_at: data.lastSummarizedAt ? data.lastSummarizedAt : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId);
          
          if (error) {
            console.error('Error updating conversation:', error);
            return false;
          }
          
          // Cache this update to prevent duplicates
          this.lastUpdateCache.set(conversationId, {
            updates: JSON.stringify(data),
            timestamp: Date.now()
          });
          
          return true;
        } catch (error) {
          console.error('Error updating conversation:', error, { conversationId });
          return false;
        }
      })
    );
    
    // Check for failures
    const failures = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value));
    if (failures.length > 0) {
      toastService.error('Some updates failed to save.');
    }
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('Error deleting conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error, { conversationId });
      toastService.error('Failed to delete conversation. Please try again.');
      return false;
    }
  }

  // Message operations
  async getGames(userId: string): Promise<Game[]> {
    try {
      // ✅ OPTIMIZED: Direct auth_user_id comparison (no JOIN needed)
      // RLS policy enforces ownership via games.auth_user_id = auth.uid()
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('auth_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting games:', error);
        return [];
      }

      return data.map(game => ({
        id: game.id,
        title: game.title,
        description: game.notes ?? undefined,
        genre: game.genre ?? undefined,
        platform: game.platform ?? undefined,
        releaseDate: '',
        rating: game.rating ?? undefined,
        imageUrl: game.cover_url ?? undefined,
        metadata: jsonToRecord(game.metadata),
        createdAt: safeParseDate(game.created_at),
        updatedAt: safeParseDate(game.updated_at),
      }));
    } catch (error) {
      console.error('Error getting games:', error);
      return [];
    }
  }

  async createGame(userId: string, game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      // ✅ OPTIMIZED: Use database function to resolve user_id in single operation
      const { data: userIdData, error: userIdError } = await supabase
        .rpc('get_user_id_from_auth_id', { p_auth_user_id: userId });

      if (userIdError || !userIdData) {
        console.error('Error resolving user ID:', userIdError);
        return null;
      }

      const { data, error } = await supabase
        .from('games')
        .insert({
          user_id: userIdData,
          auth_user_id: userId, // ✅ Store auth_user_id for direct RLS checks
          title: game.title,
          notes: game.description,
          genre: game.genre,
          platform: game.platform,
          rating: game.rating,
          cover_url: game.imageUrl,
          metadata: asJson(game.metadata),
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating game:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error creating game:', error);
      return null;
    }
  }

  // Trial operations
  async getTrialStatus(userId: string): Promise<TrialStatus | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('has_used_trial, trial_started_at, trial_expires_at')
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        console.error('Error getting trial status:', error);
        return null;
      }

      const now = Date.now();
      const trialExpiresAt = data.trial_expires_at ? new Date(data.trial_expires_at).getTime() : null;
      const isActive = trialExpiresAt ? now < trialExpiresAt : false;
      const daysRemaining = trialExpiresAt ? Math.ceil((trialExpiresAt - now) / (1000 * 60 * 60 * 24)) : 0;

      return {
        isEligible: !data.has_used_trial,
        hasUsed: safeBoolean(data.has_used_trial),
        isActive,
        expiresAt: trialExpiresAt || undefined,
        daysRemaining: isActive ? daysRemaining : undefined,
      };
    } catch (error) {
      console.error('Error getting trial status:', error);
      return null;
    }
  }

  async startTrial(userId: string): Promise<boolean> {
    try {
      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);

      const { error } = await supabase
        .from('users')
        .update({
          has_used_trial: true,
          trial_started_at: new Date().toISOString(),
          trial_expires_at: trialExpiresAt.toISOString(),
          tier: USER_TIERS.PRO,
          text_limit: TIER_LIMITS[USER_TIERS.PRO].text,
          image_limit: TIER_LIMITS[USER_TIERS.PRO].image,
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', userId);

      if (error) {
        console.error('Error starting trial:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error starting trial:', error);
      return false;
    }
  }

  // Usage operations
  async canMakeRequest(userId: string, requestType: 'text' | 'image'): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('text_count, image_count, text_limit, image_limit, tier')
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        console.error('Error checking usage:', error);
        return false;
      }

      if (requestType === 'text') {
        return safeNumber(data.text_count) < safeNumber(data.text_limit);
      } else {
        return safeNumber(data.image_count) < safeNumber(data.image_limit);
      }
    } catch (error) {
      console.error('Error checking usage:', error);
      return false;
    }
  }

  async incrementUsage(userId: string, requestType: 'text' | 'image'): Promise<boolean> {
    try {
      // First, get the current usage data
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('usage_data')
        .eq('auth_user_id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching user data:', fetchError);
        return false;
      }

      // Get current usage counts
      const currentUsage = jsonToRecord(userData?.usage_data) as { textCount?: number; imageCount?: number; totalRequests?: number };

      // Increment the appropriate counter
      const textCount = requestType === 'text' ? (currentUsage.textCount || 0) + 1 : (currentUsage.textCount || 0);
      const imageCount = requestType === 'image' ? (currentUsage.imageCount || 0) + 1 : (currentUsage.imageCount || 0);
      
      const updatedUsage = {
        textCount,
        imageCount,
        totalRequests: (currentUsage.totalRequests || 0) + 1,
      };

      // Update the usage_data JSONB field
      const { error } = await supabase
        .from('users')
        .update({
          usage_data: toJson(updatedUsage),
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', userId);

      if (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }

  async resetUsage(userId: string): Promise<boolean> {
    try {
      // Reset counters but preserve limits
      const resetUsage = {
        textCount: 0,
        imageCount: 0,
        totalRequests: 0,
        lastReset: Date.now()
      };

      const { error } = await supabase
        .from('users')
        .update({
          usage_data: toJson(resetUsage),
          updated_at: new Date().toISOString(),
        })
        .eq('auth_user_id', userId);

      if (error) {
        console.error('Error resetting usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error resetting usage:', error);
      return false;
    }
  }

  // ✅ Query-based usage tracking (replaces message-based limits)
  async recordQuery(authUserId: string, queryType: 'text' | 'image'): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('increment_user_usage', {
        p_auth_user_id: authUserId,
        p_query_type: queryType,
        p_increment: 1
      });

      if (error) {
        console.error('Error recording query:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error recording query:', error);
      return false;
    }
  }

  async getQueryUsage(authUserId: string): Promise<{ textCount: number; imageCount: number; textLimit: number; imageLimit: number; lastReset: Date } | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('text_count, image_count, text_limit, image_limit, last_reset')
        .eq('auth_user_id', authUserId)
        .single();

      if (error) {
        console.error('Error getting query usage:', error);
        return null;
      }

      return {
        textCount: data.text_count || 0,
        imageCount: data.image_count || 0,
        textLimit: data.text_limit || 20,
        imageLimit: data.image_limit || 15,
        lastReset: new Date(data.last_reset || Date.now())
      };
    } catch (error) {
      console.error('Error getting query usage:', error);
      return null;
    }
  }

  // Submit user feedback (bugs, feature requests, general feedback)
  async submitUserFeedback(
    authUserId: string, 
    feedbackType: 'bug' | 'feature' | 'general', 
    message: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          auth_user_id: authUserId,
          feedback_type: feedbackType,
          message: message,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error submitting user feedback:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error submitting user feedback:', error);
      return false;
    }
  }
}

export const supabaseService = SupabaseService.getInstance();
