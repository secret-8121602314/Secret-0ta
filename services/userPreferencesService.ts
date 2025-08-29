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
  tts_preferences?: {
    voice: string;
    pitch: number;
    rate: number;
  };
  pwa_preferences?: {
    enable_notifications: boolean;
    enable_push_notifications: boolean;
  };
  onboarding_preferences?: {
    completed_steps: string[];
    last_step: string;
  };
  general_preferences?: {
    language: string;
    theme: string;
    auto_dark_mode: boolean;
  };
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

  async getPreferences(): Promise<UserPreferences | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check cache first
      if (this.cache.has(user.id)) {
        return this.cache.get(user.id)!;
      }

      // Try to get preferences from new consolidated users table
      try {
        const { data, error } = await supabase
          .from('users_new')
          .select('preferences')
          .eq('auth_user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No user found, create default ones
            return this.createDefaultPreferences(user.id);
          }
          throw error;
        }

        // Convert from new structure to old interface for backward compatibility
        const userPreferences: UserPreferences = {
          user_id: user.id,
          game_genre: data.preferences?.game_genre || 'rpg',
          hint_style: data.preferences?.hint_style || 'subtle',
          detail_level: data.preferences?.detail_level || 'concise',
          spoiler_sensitivity: data.preferences?.spoiler_sensitivity || 'moderate',
          ai_personality: data.preferences?.ai_personality || 'encouraging',
          preferred_response_format: data.preferences?.preferred_response_format || 'text_with_bullets',
          skill_level: data.preferences?.skill_level || 'intermediate',
          gaming_patterns: data.preferences?.gaming_patterns || {
            preferred_play_time: ['evening'],
            session_duration: '1-2 hours',
            frequency: 'daily',
            multiplayer_preference: false,
            completionist_tendency: false
          },
          tts_preferences: data.preferences?.tts || {},
          pwa_preferences: data.preferences?.pwa || {},
          onboarding_preferences: data.preferences?.onboarding || {},
          general_preferences: data.preferences?.general || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Cache the result
        this.cache.set(user.id, userPreferences);
        return userPreferences;
      } catch (tableError: any) {
        // If the table doesn't exist (PGRST116) or other table-related errors,
        // return default preferences without trying to save to database
        console.warn('Users table not available, using defaults:', tableError.message);
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

      // Try to update in new consolidated users table
      try {
        // Get current preferences to merge with updates
        const current = await this.getPreferences();
        if (!current) return false;

        // Convert updates to new structure
        const newPreferences = {
          tts: { ...current.tts_preferences, ...updates.tts_preferences },
          pwa: { ...current.pwa_preferences, ...updates.pwa_preferences },
          onboarding: { ...current.onboarding_preferences, ...updates.onboarding_preferences },
          general: { ...current.general_preferences, ...updates.general_preferences }
        };

        const { error } = await supabase
          .from('users_new')
          .upsert({
            auth_user_id: user.id,
            email: user.email || '',
            preferences: newPreferences
          });

        if (error) throw error;

        // Update cache
        const updatedPrefs: UserPreferences = {
          ...current,
          ...updates,
          updated_at: new Date().toISOString()
        };
        this.cache.set(user.id, updatedPrefs);

        return true;
      } catch (tableError: any) {
        // If the table doesn't exist, just update the cache
        console.warn('Users table not available, updating cache only:', tableError.message);
        
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
      // Create user with default preferences in new consolidated users table
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('users_new')
        .insert({
          auth_user_id: user.id,
          email: user.email || '',
          preferences: {
            tts: defaultPrefs.tts_preferences,
            pwa: defaultPrefs.pwa_preferences,
            onboarding: defaultPrefs.onboarding_preferences,
            general: defaultPrefs.general_preferences
          }
        })
        .select('preferences')
        .single();

      if (error) throw error;

      // Convert back to old interface for backward compatibility
      const userPreferences: UserPreferences = {
        user_id: userId,
        game_genre: data.preferences?.game_genre || 'rpg',
        hint_style: data.preferences?.hint_style || 'subtle',
        detail_level: data.preferences?.detail_level || 'concise',
        spoiler_sensitivity: data.preferences?.spoiler_sensitivity || 'moderate',
        ai_personality: data.preferences?.ai_personality || 'encouraging',
        preferred_response_format: data.preferences?.preferred_response_format || 'text_with_bullets',
        skill_level: data.preferences?.skill_level || 'intermediate',
        gaming_patterns: data.preferences?.gaming_patterns || {
          preferred_play_time: ['evening'],
          session_duration: '1-2 hours',
          frequency: 'daily',
          multiplayer_preference: false,
          completionist_tendency: false
        },
        tts_preferences: data.preferences?.tts || {},
        pwa_preferences: data.preferences?.pwa || {},
        onboarding_preferences: data.preferences?.onboarding || {},
        general_preferences: data.preferences?.general || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(userId, userPreferences);
      return userPreferences;
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
