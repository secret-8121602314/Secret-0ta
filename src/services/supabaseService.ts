import { supabase } from '../lib/supabase';
import { User, Conversation, Game, UserTier, TrialStatus } from '../types';
import { USER_TIERS, TIER_LIMITS } from '../constants';
import { jsonToRecord, safeParseDate, safeBoolean, safeNumber, toJson, safeString } from '../utils/typeHelpers';
import { toastService } from './toastService';
import { mapUserData } from '../utils/userMapping';

export class SupabaseService {
  private static instance: SupabaseService;

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
          preferences: updates.preferences,
          app_state: updates.appState,
          profile_data: updates.profileData,
          onboarding_data: updates.onboardingData,
          behavior_data: updates.behaviorData,
          feedback_data: updates.feedbackData,
          usage_data: updates.usageData,
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
            // 🔍 DIAGNOSTIC: Test if Game Hub exists with direct .single() query
      const { data: gameHubTest, error: gameHubError } = await supabase
        .from('conversations')
        .select('id, title, auth_user_id')
        .eq('id', 'game-hub')
        .maybeSingle();
      
      if (gameHubTest) {
        console.log('✅ [Supabase] Game Hub exists via .single():', gameHubTest);
      } else if (gameHubError) {
        console.log('❌ [Supabase] Game Hub .single() error:', gameHubError.message);
      } else {
              }
      
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
    // 🔍 DEBUG: Log what we're getting from Supabase
    console.error('🔍 [Supabase] mapConversations called with', data.length, 'conversations');
    
    if (data.length > 0) {
      const sample = data[0];
      const messages = sample.messages as import('../types').ChatMessage[];
      const subtabs = sample.subtabs as import('../types').SubTab[];
      console.error('🔍 [Supabase] Sample conversation from DB:', {
        id: sample.id,
        title: sample.title,
        messageCount: Array.isArray(messages) ? messages.length : 0,
        hasMessagesField: 'messages' in sample,
        messagesType: typeof messages,
        messagesIsNull: messages === null,
        messagesIsUndefined: messages === undefined,
        subtabCount: Array.isArray(subtabs) ? subtabs.length : 0,
        messagesRaw: messages, // 🔍 Let's see the actual data
        firstMessage: Array.isArray(messages) && messages.length > 0 ? messages[0] : null
      });
    }

    return data.map(conv => {
      // Handle messages from the join
      const messages = conv.messages;
      
      console.error('🔍 [Supabase] Processing conversation:', {
        id: conv.id,
        title: conv.title,
        rawMessages: messages,
        hasMessages: !!messages,
        isArray: Array.isArray(messages),
        isNull: messages === null,
        isUndefined: messages === undefined,
        messagesType: typeof messages,
        messagesLength: Array.isArray(messages) ? messages.length : 'N/A'
      });
      
      const processedMessages = Array.isArray(messages) 
        ? messages.map((msg: any) => {
            const processed = {
              id: msg.id,
              role: msg.role as 'user' | 'assistant' | 'system',
              content: msg.content,
              timestamp: safeParseDate(msg.created_at),
              imageUrl: safeString(msg.image_url, undefined),
              metadata: typeof msg.metadata === 'object' && msg.metadata !== null ? msg.metadata as Record<string, unknown> : undefined,
            };
            console.error('🔍 [Supabase] Processed message:', { id: processed.id, role: processed.role, contentLength: processed.content?.length });
            return processed;
          })
        : [];
      
      console.error('🔍 [Supabase] Final processed messages for', conv.id, ':', processedMessages.length);
      
      // Handle subtabs from the join
      const subtabs = conv.subtabs;
      const processedSubtabs = Array.isArray(subtabs) ? subtabs as unknown[] : [];
      
      return {
        id: conv.id,
        authUserId: conv.auth_user_id ?? undefined,
        userId: conv.user_id ?? undefined,
        title: conv.title,
        messages: processedMessages,
        gameId: conv.game_id ?? undefined,
        gameTitle: conv.game_title ?? undefined,
        genre: conv.genre ?? undefined,
        subtabs: processedSubtabs,
        subtabsOrder: conv.subtabs_order || [],
        isActiveSession: conv.is_active_session,
        activeObjective: conv.active_objective ?? undefined,
        gameProgress: conv.game_progress ?? undefined,
        createdAt: safeParseDate(conv.created_at),
        updatedAt: safeParseDate(conv.updated_at),
        isActive: conv.is_active,
        isPinned: conv.is_pinned ?? undefined,
        pinnedAt: conv.pinned_at ? new Date(conv.pinned_at).getTime() : undefined,
        isGameHub: conv.is_game_hub ?? undefined,
        isUnreleased: conv.is_unreleased ?? undefined,
        contextSummary: conv.context_summary ?? undefined,
        lastSummarizedAt: conv.last_summarized_at ? new Date(conv.last_summarized_at).getTime() : undefined,
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
            const { data, error } = await supabase
        .from('conversations')
        .upsert(insertData, { 
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
        if (session?.user?.id !== verifyData.auth_user_id) {
          console.error('🚨 [Supabase] AUTH_USER_ID MISMATCH!', {
            sessionUserId: session?.user?.id,
            rowAuthUserId: verifyData.auth_user_id,
            match: false
          });
        } else {
                  }
      }
      
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({
          title: updates.title,
          // Note: messages, subtabs, subtabs_order are NOT in conversations table
          game_id: updates.gameId,
          game_title: updates.gameTitle,
          genre: updates.genre,
          is_active_session: updates.isActiveSession,
          active_objective: updates.activeObjective,
          game_progress: updates.gameProgress,
          is_active: updates.isActive,
          is_pinned: updates.isPinned,
          pinned_at: updates.pinnedAt ? new Date(updates.pinnedAt).toISOString() : null,
          is_game_hub: updates.isGameHub,
          is_unreleased: updates.isUnreleased,
          context_summary: updates.contextSummary,
          last_summarized_at: updates.lastSummarizedAt ? updates.lastSummarizedAt : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating conversation:', error, { conversationId });
      toastService.error('Failed to update conversation.');
      return false;
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
          metadata: game.metadata,
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
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 14);

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
        textLimit: data.text_limit || 55,
        imageLimit: data.image_limit || 25,
        lastReset: new Date(data.last_reset || Date.now())
      };
    } catch (error) {
      console.error('Error getting query usage:', error);
      return null;
    }
  }
}

export const supabaseService = SupabaseService.getInstance();
