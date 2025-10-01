import { supabase } from '../lib/supabase';
import { User, Conversation, Game, UserTier, TrialStatus } from '../types';
import { USER_TIERS, TIER_LIMITS } from '../constants';

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
          id: userData.user_id,
          authUserId: userData.user_id,
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
          preferences: userData.preferences || {},
          usage: {
            textCount: userData.text_count,
            imageCount: userData.image_count,
            textLimit: userData.text_limit,
            imageLimit: userData.image_limit,
            totalRequests: 0,
            lastReset: Date.now(),
            tier: userData.tier as UserTier,
          },
          appState: userData.app_state || {},
          profileData: userData.profile_data || {},
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
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('auth_user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error getting conversations:', error);
        return [];
      }

      return data.map(conv => ({
        id: conv.conversation_id,
        title: conv.title,
        messages: conv.messages || [],
        gameId: conv.game_id,
        gameTitle: conv.game_title,
        createdAt: new Date(conv.created_at).getTime(),
        updatedAt: new Date(conv.updated_at).getTime(),
        isActive: conv.is_active,
      }));
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  async createConversation(userId: string, conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: conversation.title,
          messages: conversation.messages,
          game_id: conversation.gameId,
          game_title: conversation.gameTitle,
          is_active: conversation.isActive,
        })
        .select('conversation_id')
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        return null;
      }

      return data.conversation_id;
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
          messages: updates.messages,
          game_id: updates.gameId,
          game_title: updates.gameTitle,
          is_active: updates.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversationId);

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
        .eq('conversation_id', conversationId);

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
        id: game.game_id,
        title: game.title,
        description: game.description,
        genre: game.genre,
        platform: game.platform,
        releaseDate: game.release_date,
        rating: game.rating,
        imageUrl: game.image_url,
        metadata: game.metadata || {},
        createdAt: new Date(game.created_at).getTime(),
        updatedAt: new Date(game.updated_at).getTime(),
      }));
    } catch (error) {
      console.error('Error getting games:', error);
      return [];
    }
  }

  async createGame(userId: string, game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('games')
        .insert({
          user_id: userId,
          title: game.title,
          description: game.description,
          genre: game.genre,
          platform: game.platform,
          release_date: game.releaseDate,
          rating: game.rating,
          image_url: game.imageUrl,
          metadata: game.metadata,
        })
        .select('game_id')
        .single();

      if (error) {
        console.error('Error creating game:', error);
        return null;
      }

      return data.game_id;
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
        hasUsed: data.has_used_trial,
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
        return data.text_count < data.text_limit;
      } else {
        return data.image_count < data.image_limit;
      }
    } catch (error) {
      console.error('Error checking usage:', error);
      return false;
    }
  }

  async incrementUsage(userId: string, requestType: 'text' | 'image'): Promise<boolean> {
    try {
      const field = requestType === 'text' ? 'text_count' : 'image_count';
      
      const { error } = await supabase
        .from('users')
        .update({
          [field]: supabase.rpc('increment_usage', { field_name: field }),
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
      const { error } = await supabase
        .from('users')
        .update({
          text_count: 0,
          image_count: 0,
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
}

export const supabaseService = SupabaseService.getInstance();
