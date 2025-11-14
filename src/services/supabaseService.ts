import { supabase } from '../lib/supabase';
import { User, Conversation, Game, UserTier, TrialStatus } from '../types';
import { USER_TIERS, TIER_LIMITS } from '../constants';
import { jsonToRecord, safeParseDate, safeBoolean, safeNumber, toJson } from '../utils/typeHelpers';

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
        const userData = data[0];
        return {
          id: userData.id,
          authUserId: userData.auth_user_id,
          email: userData.email,
          tier: userData.tier as UserTier,
          hasProfileSetup: false,
          hasSeenSplashScreens: false,
          hasSeenHowToUse: false,
          hasSeenFeaturesConnected: false,
          hasSeenProFeatures: false,
          pcConnected: false,
          pcConnectionSkipped: false,
          onboardingCompleted: false,
          hasWelcomeMessage: false,
          isNewUser: true,
          hasUsedTrial: userData.has_used_trial,
          lastActivity: Date.now(),
          // ✅ Query-based usage limits (top-level)
          textCount: userData.text_count || 0,
          imageCount: userData.image_count || 0,
          textLimit: userData.text_limit || 55,
          imageLimit: userData.image_limit || 25,
          totalRequests: userData.total_requests || 0,
          lastReset: userData.last_reset ? new Date(userData.last_reset).getTime() : Date.now(),
          preferences: jsonToRecord(userData.preferences),
          // Legacy nested usage object
          usage: {
            textCount: userData.text_count,
            imageCount: userData.image_count,
            textLimit: userData.text_limit,
            imageLimit: userData.image_limit,
            totalRequests: 0,
            lastReset: Date.now(),
            tier: userData.tier as UserTier,
          },
          appState: jsonToRecord(userData.app_state),
          profileData: jsonToRecord(userData.profile_data),
          onboardingData: {},
          behaviorData: {},
          feedbackData: {},
          usageData: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user:', error);
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
        console.error('Error updating user:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  async updateUsage(userId: string, usage: any): Promise<boolean> {
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
      console.error('Error updating usage:', error);
      return false;
    }
  }

  // Conversation operations
  /**
   * Get or create Game Hub conversation using database RPC function
   * This ensures only one Game Hub exists per user
   */
  async getOrCreateGameHub(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_or_create_game_hub', { p_user_id: userId });

      if (error) {
        console.error('Error getting/creating Game Hub:', error);
        return null;
      }

      return data; // Returns UUID of Game Hub conversation
    } catch (error) {
      console.error('Error calling get_or_create_game_hub:', error);
      return null;
    }
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      // ✅ FIX: Query by auth_user_id directly (matches RLS policies)
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('auth_user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error getting conversations:', error);
        return [];
      }

      // 🔍 DEBUG: Log what we're getting from Supabase
      if (process.env.NODE_ENV === 'development' && data.length > 0) {
        const sample = data[0];
        const messages = sample.messages as any;
        const subtabs = sample.subtabs as any;
        console.error('🔍 [Supabase] Sample conversation from DB:', {
          id: sample.id,
          title: sample.title,
          messageCount: Array.isArray(messages) ? messages.length : 0,
          hasMessagesField: 'messages' in sample,
          messagesType: typeof messages,
          subtabCount: Array.isArray(subtabs) ? subtabs.length : 0
        });
      }

      return data.map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: Array.isArray(conv.messages) ? conv.messages as unknown[] : [],
        gameId: conv.game_id ?? undefined,
        gameTitle: conv.game_title ?? undefined,
        genre: conv.genre ?? undefined,
        subtabs: Array.isArray(conv.subtabs) ? conv.subtabs as unknown[] : [],
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
      })) as Conversation[];
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  async createConversation(userId: string, conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      // ✅ FIX: Use auth_user_id directly instead of RPC function
      // The RPC function get_user_id_from_auth_id was causing issues
      // Now we use auth_user_id (which references auth.users.id) directly
      // This matches the RLS policies which check auth_user_id = auth.uid()
      
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          auth_user_id: userId, // ✅ Direct auth user ID
          title: conversation.title,
          messages: conversation.messages,
          game_id: conversation.gameId,
          game_title: conversation.gameTitle,
          genre: conversation.genre,
          subtabs: conversation.subtabs || [],
          subtabs_order: conversation.subtabsOrder || [],
          is_active_session: conversation.isActiveSession,
          active_objective: conversation.activeObjective,
          game_progress: conversation.gameProgress,
          is_active: conversation.isActive,
          is_pinned: conversation.isPinned,
          pinned_at: conversation.pinnedAt ? new Date(conversation.pinnedAt).toISOString() : null,
          is_game_hub: conversation.isGameHub,
        } as any) // ⚠️ Temporary: auth_user_id not in types yet, regenerate after SQL fix
        .select('id')
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
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
          messages: updates.messages ? toJson(updates.messages) : undefined,
          game_id: updates.gameId,
          game_title: updates.gameTitle,
          genre: updates.genre,
          subtabs: updates.subtabs ? toJson(updates.subtabs) : undefined,
          subtabs_order: updates.subtabsOrder,
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
      console.error('Error updating conversation:', error);
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
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  // Game operations
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
