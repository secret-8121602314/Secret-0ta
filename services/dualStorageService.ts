import { SupabaseClient } from '@supabase/supabase-js';

export interface StorageConfig {
  useSupabase: boolean;
  useLocalStorage: boolean;
  fallbackToLocal: boolean;
}

export class DualStorageService {
  private supabase: SupabaseClient;
  private config: StorageConfig;
  
  constructor(supabase: SupabaseClient, config: StorageConfig = {
    useSupabase: true,
    useLocalStorage: true,
    fallbackToLocal: true
  }) {
    this.supabase = supabase;
    this.config = config;
  }

  // Update configuration
  updateConfig(config: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Get current user ID
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.warn('Failed to get user ID:', error);
      return null;
    }
  }

  // Generic set method - writes to both storages
  async set(key: string, value: any, category?: string): Promise<void> {
    const serializedValue = JSON.stringify(value);
    
    // Always write to localStorage (for backward compatibility)
    if (this.config.useLocalStorage) {
      try {
        localStorage.setItem(key, serializedValue);
      } catch (error) {
        console.warn('Failed to write to localStorage:', error);
      }
    }

    // Write to Supabase if enabled
    if (this.config.useSupabase) {
      try {
        const userId = await this.getCurrentUserId();
        if (userId) {
          if (category) {
            // Use users_new table preferences JSONB column
            await this.supabase
              .from('users_new')
              .upsert({
                auth_user_id: userId,
                preferences: { [category]: { [key]: serializedValue } }
              });
          } else {
            // Use users_new table app_state JSONB column
            await this.supabase
              .from('users_new')
              .upsert({
                auth_user_id: userId,
                app_state: { [key]: serializedValue }
              });
          }
        }
      } catch (error) {
        console.warn('Failed to write to Supabase:', error);
        
        // Fallback to localStorage if enabled
        if (this.config.fallbackToLocal && !this.config.useLocalStorage) {
          try {
            localStorage.setItem(key, serializedValue);
          } catch (localError) {
            console.warn('Failed to fallback to localStorage:', localError);
          }
        }
      }
    }
  }

  // Generic get method - reads from Supabase first, falls back to localStorage
  async get(key: string, category?: string): Promise<any | null> {
    // Try Supabase first if enabled
    if (this.config.useSupabase) {
      try {
        const userId = await this.getCurrentUserId();
        if (userId) {
          let result;
          
          if (category) {
            // Read from users_new table preferences JSONB column
            const { data } = await this.supabase
              .from('users_new')
              .select('preferences')
              .eq('auth_user_id', userId)
              .single();
            
            if (data?.preferences?.[category]?.[key]) {
              result = { value: data.preferences[category][key] };
            }
          } else {
            // Read from users_new table app_state JSONB column
            const { data } = await this.supabase
              .from('users_new')
              .select('app_state')
              .eq('auth_user_id', userId)
              .single();
            
            if (data?.app_state?.[key]) {
              result = { value: data.app_state[key] };
            }
          }

          if (result?.value) {
            try {
              return JSON.parse(result.value);
            } catch (parseError) {
              return result.value; // Return as-is if not JSON
            }
          }
        }
      } catch (error) {
        console.warn('Failed to read from Supabase:', error);
      }
    }

    // Fallback to localStorage
    if (this.config.useLocalStorage || this.config.fallbackToLocal) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            return JSON.parse(value);
          } catch (parseError) {
            return value; // Return as-is if not JSON
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
      }
    }

    return null;
  }

  // Remove from both storages
  async remove(key: string, category?: string): Promise<void> {
    // Remove from localStorage
    if (this.config.useLocalStorage) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    }

    // Remove from Supabase
    if (this.config.useSupabase) {
      try {
        const userId = await this.getCurrentUserId();
        if (userId) {
          if (category) {
            await this.supabase
              .from('user_preferences')
              .delete()
              .eq('user_id', userId)
              .eq('category', category)
              .eq('key', key);
          } else {
            await this.supabase
              .from('app_state')
              .delete()
              .eq('user_id', userId)
              .eq('key', key);
          }
        }
      } catch (error) {
        console.warn('Failed to remove from Supabase:', error);
      }
    }
  }

  // Check if key exists in either storage
  async has(key: string, category?: string): Promise<boolean> {
    const value = await this.get(key, category);
    return value !== null;
  }

  // Get all keys for a category
  async getKeysForCategory(category: string): Promise<string[]> {
    if (!this.config.useSupabase) {
      // Fallback to localStorage - scan all keys
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(category)) {
          keys.push(key);
        }
      }
      return keys;
    }

    try {
      const userId = await this.getCurrentUserId();
      if (userId) {
        const { data } = await this.supabase
          .from('user_preferences')
          .select('key')
          .eq('user_id', userId)
          .eq('category', category);
        
        return data?.map(item => item.key) || [];
      }
    } catch (error) {
      console.warn('Failed to get keys for category:', error);
    }

    return [];
  }

  // Clear all data for current user
  async clear(): Promise<void> {
    // Clear localStorage
    if (this.config.useLocalStorage) {
      try {
        localStorage.clear();
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }

    // Clear Supabase data
    if (this.config.useSupabase) {
      try {
        const userId = await this.getCurrentUserId();
        if (userId) {
          await this.supabase
            .from('user_preferences')
            .delete()
            .eq('user_id', userId);
          
          await this.supabase
            .from('app_state')
            .delete()
            .eq('user_id', userId);
        }
      } catch (error) {
        console.warn('Failed to clear Supabase data:', error);
      }
    }
  }

  // Sync localStorage to Supabase (for migration)
  async syncLocalToSupabase(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    if (!this.config.useSupabase) {
      return { success: false, synced: 0, errors: ['Supabase not enabled'] };
    }

    const userId = await this.getCurrentUserId();
    if (!userId) {
      return { success: false, synced: 0, errors: ['User not authenticated'] };
    }

    let synced = 0;
    const errors: string[] = [];

    try {
      // Get all localStorage keys
      const keys = Object.keys(localStorage);
      
      for (const key of keys) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            // Determine category based on key
            let category = 'general';
            if (key.includes('TTS') || key.includes('Voice')) category = 'tts';
            else if (key.includes('PWA') || key.includes('Install')) category = 'pwa';
            else if (key.includes('Feedback')) category = 'feedback';
            else if (key.includes('Usage') || key.includes('Count')) category = 'usage';
            else if (key.includes('Onboarding') || key.includes('Welcome')) category = 'onboarding';

            // Sync to appropriate table
            if (category === 'general') {
              await this.supabase
                .from('app_state')
                .upsert({
                  user_id: userId,
                  key,
                  value
                });
            } else {
              await this.supabase
                .from('user_preferences')
                .upsert({
                  user_id: userId,
                  category,
                  key,
                  value
                });
            }
            
            synced++;
          }
        } catch (error) {
          errors.push(`Failed to sync ${key}: ${error}`);
        }
      }

      return { success: synced > 0, synced, errors };
    } catch (error) {
      errors.push(`General sync error: ${error}`);
      return { success: false, synced, errors };
    }
  }
}
