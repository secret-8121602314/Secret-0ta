import { SupabaseClient } from '@supabase/supabase-js';

export class SilentMigrationService {
  private supabase: SupabaseClient;
  private isInitialized = false;
  private migrationComplete = false;
  private isMigrating = false;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Initialize the service - call this once when app starts
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Check if user is authenticated (including existing sessions)
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        // Start silent migration in background for existing users
        this.startSilentMigration();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('Silent migration initialization failed:', error);
    }
  }

  // Start migration in background without user knowing
  private async startSilentMigration(): Promise<void> {
    if (this.isMigrating) return;
    
    try {
      this.isMigrating = true;
      
      // Check if migration is already needed
      if (await this.isMigrationNeeded()) {
        console.log('Starting silent migration of localStorage data...');
        // Migrate all localStorage data to Supabase
        await this.migrateAllData();
        this.migrationComplete = true;
        console.log('Silent migration completed successfully');
      } else {
        console.log('No migration needed - data already in Supabase');
        this.migrationComplete = true;
      }
    } catch (error) {
      console.warn('Silent migration failed:', error);
    } finally {
      this.isMigrating = false;
    }
  }

  // Migrate all localStorage data
  private async migrateAllData(): Promise<void> {
    const userId = await this.getCurrentUserId();
    if (!userId) return;

    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          await this.migrateKey(key, value, userId);
        }
      } catch (error) {
        console.warn(`Failed to migrate key ${key}:`, error);
      }
    }
  }

  // Migrate a single key
  private async migrateKey(key: string, value: string, userId: string): Promise<void> {
    try {
      // Determine category and table based on key
      const { category, table } = this.categorizeKey(key);
      
      if (table === 'user_preferences') {
        // Store in users_new table preferences JSONB column
        await this.supabase
          .from('users_new')
          .upsert({
            auth_user_id: userId,
            preferences: { [category]: { [key]: value } }
          });
      } else if (table === 'app_state') {
        // Store in users_new table app_state JSONB column
        await this.supabase
          .from('users_new')
          .upsert({
            auth_user_id: userId,
            app_state: { [key]: value }
          });
      } else if (table === 'user_analytics') {
        // Store in analytics_new table
        await this.supabase
          .from('analytics_new')
          .insert({
            user_id: userId,
            category,
            event_type: 'localStorage_migration',
            data: { [key]: value }
          });
      }
    } catch (error) {
      console.warn(`Failed to migrate key ${key}:`, error);
    }
  }

  // Categorize localStorage keys
  private categorizeKey(key: string): { category: string; table: string } {
    // TTS and Voice settings
    if (key.includes('TTS') || key.includes('Voice') || key.includes('Speech')) {
      return { category: 'tts', table: 'user_preferences' };
    }
    
    // PWA settings
    if (key.includes('PWA') || key.includes('Install') || key.includes('HandsFree')) {
      return { category: 'pwa', table: 'user_preferences' };
    }
    
    // Feedback and analytics
    if (key.includes('Feedback') || key.includes('Analytics')) {
      return { category: 'feedback', table: 'user_analytics' };
    }
    
    // Usage tracking
    if (key.includes('Usage') || key.includes('Count') || key.includes('Tier')) {
      return { category: 'usage', table: 'user_analytics' };
    }
    
    // Onboarding and app state
    if (key.includes('Onboarding') || key.includes('Welcome') || key.includes('Profile') || key.includes('Connected')) {
      return { category: 'onboarding', table: 'user_preferences' };
    }
    
    // Daily goals and sessions
    if (key.includes('Goals') || key.includes('Streaks') || key.includes('Session')) {
      return { category: 'sessions', table: 'user_analytics' };
    }
    
    // Default to app state
    return { category: 'general', table: 'app_state' };
  }

  // Get current user ID
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      return null;
    }
  }

  // Check if migration is complete
  isMigrationComplete(): boolean {
    return this.migrationComplete;
  }

  // Public method to manually trigger migration (useful for testing)
  async triggerMigration(): Promise<void> {
    if (this.isMigrating) {
      console.log('Migration already in progress');
      return;
    }
    
    console.log('Manually triggering migration...');
    await this.startSilentMigration();
  }

  // Check migration status and return details
  async getMigrationStatus(): Promise<{
    isNeeded: boolean;
    isComplete: boolean;
    hasLocalData: boolean;
    hasSupabaseData: boolean;
    localDataCount: number;
  }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return {
          isNeeded: false,
          isComplete: false,
          hasLocalData: false,
          hasSupabaseData: false,
          localDataCount: 0
        };
      }

      const localDataCount = Object.keys(localStorage).length;
      const hasLocalData = localDataCount > 0;

      // Check if we already have data in Supabase
      const { data: userData } = await this.supabase
        .from('users_new')
        .select('preferences, app_state')
        .eq('auth_user_id', userId)
        .limit(1);

      const hasSupabaseData = userData && (userData[0]?.preferences || userData[0]?.app_state);
      const isNeeded = hasLocalData && !hasSupabaseData;

      return {
        isNeeded,
        isComplete: this.migrationComplete,
        hasLocalData,
        hasSupabaseData,
        localDataCount
      };
    } catch (error) {
      console.warn('Failed to get migration status:', error);
      return {
        isNeeded: false,
        isComplete: false,
        hasLocalData: false,
        hasSupabaseData: false,
        localDataCount: 0
      };
    }
  }

  // Check if migration is actually needed
  private async isMigrationNeeded(): Promise<boolean> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      // Check if we already have data in Supabase
      const { data: userData } = await this.supabase
        .from('users_new')
        .select('preferences, app_state')
        .eq('auth_user_id', userId)
        .limit(1);

      const hasSupabaseData = userData && (userData[0]?.preferences || userData[0]?.app_state);
      
      // If we have localStorage data but no Supabase data, migration is needed
      const hasLocalData = Object.keys(localStorage).length > 0;
      return hasLocalData && !hasSupabaseData;
    } catch (error) {
      console.warn('Failed to check migration status:', error);
      // If we can't check, assume migration is needed
      return true;
    }
  }
}

// Global localStorage replacement functions
export class LocalStorageReplacer {
  private supabase: SupabaseClient;
  private migrationService: SilentMigrationService;
  private useSupabase = false;
  
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.migrationService = new SilentMigrationService(supabase);
    
    // Initialize migration service
    this.migrationService.initialize();
    
    // Check if we should use Supabase (after migration is complete)
    this.checkMigrationStatus();
  }

  // Check if migration is complete and switch to Supabase
  private async checkMigrationStatus(): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        // Check if we have data in Supabase
        const { data: userData } = await this.supabase
          .from('users_new')
          .select('preferences, app_state')
          .eq('auth_user_id', user.id)
          .limit(1);
        
        if (userData && (userData[0]?.preferences || userData[0]?.app_state)) {
          this.useSupabase = true;
          console.log('Switched to Supabase storage');
        }
      }
    } catch (error) {
      console.warn('Failed to check migration status:', error);
    }
  }

  // Replace localStorage.setItem
  async setItem(key: string, value: string): Promise<void> {
    // Always write to localStorage for backward compatibility
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Failed to write to localStorage:', error);
    }

    // Also write to Supabase if migration is complete
    if (this.useSupabase) {
      try {
        const userId = await this.getCurrentUserId();
        if (userId) {
          const { category, table } = this.categorizeKey(key);
          
          if (table === 'user_preferences') {
            // Update preferences in users_new table
            await this.supabase
              .from('users_new')
              .upsert({
                auth_user_id: userId,
                preferences: { [category]: { [key]: value } }
              });
          } else if (table === 'app_state') {
            // Update app_state in users_new table
            await this.supabase
              .from('users_new')
              .upsert({
                auth_user_id: userId,
                app_state: { [key]: value }
              });
          }
        }
      } catch (error) {
        console.warn('Failed to write to Supabase:', error);
      }
    }
  }

  // Replace localStorage.getItem
  async getItem(key: string): Promise<string | null> {
    // Try Supabase first if migration is complete
    if (this.useSupabase) {
      try {
        const userId = await this.getCurrentUserId();
        if (userId) {
          const { category, table } = this.categorizeKey(key);
          
          let result;
          if (table === 'user_preferences') {
            const { data } = await this.supabase
              .from('users_new')
              .select('preferences')
              .eq('auth_user_id', userId)
              .single();
            
            if (data?.preferences?.[category]?.[key]) {
              result = { value: data.preferences[category][key] };
            }
          } else if (table === 'app_state') {
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
            return result.value;
          }
        }
      } catch (error) {
        console.warn('Failed to read from Supabase:', error);
      }
    }

    // Fallback to localStorage
    return localStorage.getItem(key);
  }

  // Replace localStorage.removeItem
  async removeItem(key: string): Promise<void> {
    // Remove from localStorage
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }

    // Also remove from Supabase if migration is complete
    if (this.useSupabase) {
      try {
        const userId = await this.getCurrentUserId();
        if (userId) {
          const { category, table } = this.categorizeKey(key);
          
          if (table === 'user_preferences') {
            await this.supabase
              .from('user_preferences')
              .delete()
              .eq('user_id', userId)
              .eq('category', category)
              .eq('key', key);
          } else if (table === 'app_state') {
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

  // Replace localStorage.clear
  async clear(): Promise<void> {
    // Clear localStorage
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }

    // Also clear Supabase if migration is complete
    if (this.useSupabase) {
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
        console.warn('Failed to clear Supabase:', error);
      }
    }
  }

  // Helper methods
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      return null;
    }
  }

  private categorizeKey(key: string): { category: string; table: string } {
    if (key.includes('TTS') || key.includes('Voice') || key.includes('Speech')) {
      return { category: 'tts', table: 'user_preferences' };
    }
    if (key.includes('PWA') || key.includes('Install') || key.includes('HandsFree')) {
      return { category: 'pwa', table: 'user_preferences' };
    }
    if (key.includes('Feedback') || key.includes('Analytics')) {
      return { category: 'feedback', table: 'user_analytics' };
    }
    if (key.includes('Usage') || key.includes('Count') || key.includes('Tier')) {
      return { category: 'usage', table: 'user_analytics' };
    }
    if (key.includes('Onboarding') || key.includes('Welcome') || key.includes('Profile')) {
      return { category: 'onboarding', table: 'user_preferences' };
    }
    if (key.includes('Goals') || key.includes('Streaks') || key.includes('Session')) {
      return { category: 'sessions', table: 'user_analytics' };
    }
    return { category: 'general', table: 'app_state' };
  }
}
