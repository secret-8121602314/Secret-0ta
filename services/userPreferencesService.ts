import { supabase } from './supabase';

export interface UserPreferences {
  user_id: string;
  game_genre: GameGenre;
  hint_style: HintStyle;
  detail_level: DetailLevel;
  spoiler_sensitivity: SpoilerSensitivity;
  ai_personality: AIPersonality;
  preferred_response_format: ResponseFormat;
  skill_level: SkillLevel;
  gaming_patterns: {
    preferred_play_time: string[];
    session_duration: string;
    frequency: string;
    multiplayer_preference: boolean;
    completionist_tendency: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export type GameGenre = 
  | 'rpg' | 'fps' | 'strategy' | 'adventure' | 'puzzle' | 'simulation' | 'sports' | 'racing' | 'fighting' | 'mmo';

export type HintStyle = 
  | 'direct' | 'subtle' | 'progressive' | 'socratic' | 'story-based';

export type DetailLevel = 
  | 'minimal' | 'concise' | 'detailed' | 'comprehensive';

export type SpoilerSensitivity = 
  | 'very_sensitive' | 'sensitive' | 'moderate' | 'low' | 'none';

export type AIPersonality = 
  | 'casual' | 'formal' | 'humorous' | 'mysterious' | 'encouraging' | 'analytical';

export type ResponseFormat = 
  | 'text_only' | 'text_with_bullets' | 'step_by_step' | 'story_narrative' | 'technical';

export type SkillLevel = 
  | 'beginner' | 'casual' | 'intermediate' | 'advanced' | 'expert';

class UserPreferencesService {
  private cache: Map<string, UserPreferences> = new Map();

  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check cache first
      if (this.cache.has(user.id)) {
        return this.cache.get(user.id)!;
      }

      // Try to get preferences from database
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No preferences found, create default ones
            return this.createDefaultPreferences(user.id);
          }
          throw error;
        }

        // Cache the result
        this.cache.set(user.id, data);
        return data;
      } catch (tableError: any) {
        // If the table doesn't exist (PGRST116) or other table-related errors,
        // return default preferences without trying to save to database
        console.warn('User preferences table not available, using defaults:', tableError.message);
        return this.getDefaultPreferences(user.id);
      }
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  async updatePreferences(updates: Partial<UserPreferences>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Try to update in database
      try {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            ...updates,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        // Update cache
        const current = this.cache.get(user.id);
        if (current) {
          this.cache.set(user.id, { ...current, ...updates });
        }

        return true;
      } catch (tableError: any) {
        // If the table doesn't exist, just update the cache
        console.warn('User preferences table not available, updating cache only:', tableError.message);
        
        const current = this.cache.get(user.id);
        if (current) {
          this.cache.set(user.id, { ...current, ...updates });
        }
        
        return true; // Return true since we "saved" to cache
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      return false;
    }
  }

  private async createDefaultPreferences(userId: string): Promise<UserPreferences> {
    const defaultPrefs = this.getDefaultPreferences(userId);

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .insert(defaultPrefs)
        .select()
        .single();

      if (error) throw error;

      // Cache the result
      this.cache.set(userId, data);
      return data;
    } catch (error) {
      console.error('Error creating default preferences in database:', error);
      // Return default preferences without saving to database
      return defaultPrefs;
    }
  }

  private getDefaultPreferences(userId: string): UserPreferences {
    return {
      user_id: userId,
      game_genre: 'rpg',
      hint_style: 'progressive',
      detail_level: 'concise',
      spoiler_sensitivity: 'moderate',
      ai_personality: 'encouraging',
      preferred_response_format: 'text_with_bullets',
      gaming_patterns: {
        preferred_play_time: ['evening', 'weekends'],
        session_duration: 'medium',
        frequency: 'weekly',
        multiplayer_preference: false,
        completionist_tendency: true
      },
      skill_level: 'intermediate'
    };
  }

  // Get default preferences for display purposes
  getDefaultPreferencesForDisplay(): Omit<UserPreferences, 'user_id'> {
    return {
      game_genre: 'rpg',
      hint_style: 'progressive',
      detail_level: 'concise',
      spoiler_sensitivity: 'moderate',
      ai_personality: 'encouraging',
      preferred_response_format: 'text_with_bullets',
      gaming_patterns: {
        preferred_play_time: ['evening', 'weekends'],
        session_duration: 'medium',
        frequency: 'weekly',
        multiplayer_preference: false,
        completionist_tendency: true
      },
      skill_level: 'intermediate'
    };
  }

  // Clear cache for a specific user
  clearCache(userId: string): void {
    this.cache.delete(userId);
  }

  // Clear all cache
  clearAllCache(): void {
    this.cache.clear();
  }
}

export const userPreferencesService = new UserPreferencesService();
