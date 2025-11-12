import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://qajcxgkqloumogioomiz.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GoW6G_umt1lFF-KPbbm-Ow_D2PYxPLw';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Re-export Database type for convenience
export type { Database } from '../types/database';

// Legacy Database types (kept for backward compatibility)
// NOTE: Use generated types from src/types/database.ts instead
export interface LegacyDatabase {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_user_id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          tier: 'free' | 'pro' | 'vanguard_pro';
          has_profile_setup: boolean;
          has_seen_splash_screens: boolean;
          has_welcome_message: boolean;
          is_new_user: boolean;
          has_used_trial: boolean;
          trial_started_at: string | null;
          trial_expires_at: string | null;
          last_activity: string;
          preferences: Record<string, any>;
          usage: Record<string, any>;
          app_state: Record<string, any>;
          profile_data: Record<string, any>;
          onboarding_data: Record<string, any>;
          behavior_data: Record<string, any>;
          feedback_data: Record<string, any>;
          usage_data: Record<string, any>;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          tier?: 'free' | 'pro' | 'vanguard_pro';
          has_profile_setup?: boolean;
          has_seen_splash_screens?: boolean;
          has_welcome_message?: boolean;
          is_new_user?: boolean;
          has_used_trial?: boolean;
          trial_started_at?: string | null;
          trial_expires_at?: string | null;
          last_activity?: string;
          preferences?: Record<string, any>;
          usage?: Record<string, any>;
          app_state?: Record<string, any>;
          profile_data?: Record<string, any>;
          onboarding_data?: Record<string, any>;
          behavior_data?: Record<string, any>;
          feedback_data?: Record<string, any>;
          usage_data?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          tier?: 'free' | 'pro' | 'vanguard_pro';
          has_profile_setup?: boolean;
          has_seen_splash_screens?: boolean;
          has_welcome_message?: boolean;
          is_new_user?: boolean;
          has_used_trial?: boolean;
          trial_started_at?: string | null;
          trial_expires_at?: string | null;
          last_activity?: string;
          preferences?: Record<string, any>;
          usage?: Record<string, any>;
          app_state?: Record<string, any>;
          profile_data?: Record<string, any>;
          onboarding_data?: Record<string, any>;
          behavior_data?: Record<string, any>;
          feedback_data?: Record<string, any>;
          usage_data?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          game_id: string | null;
          title: string;
          messages: Record<string, any>[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          game_id?: string | null;
          title: string;
          messages?: Record<string, any>[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string | null;
          title?: string;
          messages?: Record<string, any>[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          genre: string | null;
          platform: string | null;
          release_date: string | null;
          rating: number | null;
          image_url: string | null;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description?: string | null;
          genre?: string | null;
          platform?: string | null;
          release_date?: string | null;
          rating?: number | null;
          image_url?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          genre?: string | null;
          platform?: string | null;
          release_date?: string | null;
          rating?: number | null;
          image_url?: string | null;
          metadata?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          source?: string;
          created_at?: string;
        };
      };
      user_usage: {
        Row: {
          id: string;
          user_id: string;
          text_count: number;
          image_count: number;
          text_limit: number;
          image_limit: number;
          total_requests: number;
          last_reset: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text_count?: number;
          image_count?: number;
          text_limit?: number;
          image_limit?: number;
          total_requests?: number;
          last_reset?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text_count?: number;
          image_count?: number;
          text_limit?: number;
          image_limit?: number;
          total_requests?: number;
          last_reset?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      check_and_expire_trials: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      create_user_record: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      update_user_usage: {
        Args: {
          p_user_id: string;
          p_text_count?: number;
          p_image_count?: number;
        };
        Returns: undefined;
      };
      get_user_tier_limits: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          text_limit: number;
          image_limit: number;
        }[];
      };
      start_free_trial: {
        Args: {
          p_user_id: string;
        };
        Returns: boolean;
      };
      save_conversation: {
        Args: {
          p_conversation_id: string;
          p_user_id: string;
          p_title: string;
          p_messages: Record<string, any>;
          p_game_id?: string;
        };
        Returns: undefined;
      };
      load_conversations: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          id: string;
          title: string;
          messages: Record<string, any>;
          game_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        }[];
      };
      get_complete_user_data: {
        Args: {
          p_auth_user_id: string;
        };
        Returns: {
          user_id: string;
          email: string;
          tier: string;
          has_used_trial: boolean;
          trial_expires_at: string | null;
          text_count: number;
          image_count: number;
          text_limit: number;
          image_limit: number;
          preferences: Record<string, any>;
          app_state: Record<string, any>;
          profile_data: Record<string, any>;
        }[];
      };
    };
  };
}
