import { supabase } from '../lib/supabase';
import { User, AuthResult, AuthState, UserTier } from '../types';
import { TIER_LIMITS } from '../constants';

// ========================================
// OPTIMIZED AUTH SERVICE FOR SCALABILITY
// ========================================
// This service includes critical optimizations for 100K+ users:
// - User data caching to reduce database calls
// - Rate limiting to prevent abuse
// - Memory leak prevention
// - Optimized database queries

interface CachedUser {
  user: User;
  expires: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class OptimizedAuthService {
  private static instance: OptimizedAuthService;
  private authState: AuthState = {
    user: null,
    isLoading: true,
    error: null,
  };

  private listeners: ((state: AuthState) => void)[] = [];
  
  // ✅ SCALABILITY: User data caching
  private userCache = new Map<string, CachedUser>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // ✅ SCALABILITY: Rate limiting
  private rateLimiter = new Map<string, RateLimitEntry>();
  private readonly RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_ATTEMPTS_PER_WINDOW = 10;
  
  // ✅ SCALABILITY: Memory leak prevention
  private cleanupFunctions: (() => void)[] = [];
  private isDestroyed = false;

  static getInstance(): OptimizedAuthService {
    if (!OptimizedAuthService.instance) {
      OptimizedAuthService.instance = new OptimizedAuthService();
    }
    return OptimizedAuthService.instance;
  }

  constructor() {
    this.initializeAuth();
    this.setupCleanup();
  }

  private setupCleanup() {
    // ✅ SCALABILITY: Cleanup on page unload
    const cleanup = () => {
      if (!this.isDestroyed) {
        this.cleanup();
      }
    };
    
    window.addEventListener('beforeunload', cleanup);
    this.cleanupFunctions.push(() => {
      window.removeEventListener('beforeunload', cleanup);
    });
  }

  private async initializeAuth() {
    try {
      // Handle OAuth callback if we're on the callback URL
      if (window.location.pathname === '/auth/callback') {
        console.log('🔐 [OptimizedAuthService] OAuth callback detected, but AuthCallback component will handle it');
        return;
      }

      // Try Supabase auth if available
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await this.loadUserFromSupabase(session.user.id);
        } else {
          this.updateAuthState({ user: null, isLoading: false, error: null });
        }
      } catch (supabaseError) {
        // Fallback to local storage
        const localUser = localStorage.getItem('otakon_user');
        if (localUser) {
          try {
            const user = JSON.parse(localUser);
            this.updateAuthState({ user, isLoading: false, error: null });
          } catch (parseError) {
            this.updateAuthState({ user: null, isLoading: false, error: null });
          }
        } else {
          this.updateAuthState({ user: null, isLoading: false, error: null });
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.updateAuthState({ user: null, isLoading: false, error: null });
    }
  }

  // ✅ SCALABILITY: Check rate limit before operations
  private checkRateLimit(identifier: string): boolean {
    if (this.isDestroyed) return false;
    
    const now = Date.now();
    const attempt = this.rateLimiter.get(identifier);
    
    if (!attempt || now > attempt.resetTime) {
      this.rateLimiter.set(identifier, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW });
      return true;
    }
    
    if (attempt.count >= this.MAX_ATTEMPTS_PER_WINDOW) {
      return false;
    }
    
    attempt.count++;
    return true;
  }

  // ✅ SCALABILITY: Get user from cache first
  private getCachedUser(authUserId: string): User | null {
    if (this.isDestroyed) return null;
    
    const cached = this.userCache.get(authUserId);
    if (cached && cached.expires > Date.now()) {
      return cached.user;
    }
    
    // Remove expired cache
    if (cached) {
      this.userCache.delete(authUserId);
    }
    
    return null;
  }

  // ✅ SCALABILITY: Cache user data
  private setCachedUser(authUserId: string, user: User): void {
    if (this.isDestroyed) return;
    
    this.userCache.set(authUserId, {
      user,
      expires: Date.now() + this.CACHE_DURATION
    });
  }

  // ✅ SCALABILITY: Clear cache
  private clearCache(): void {
    this.userCache.clear();
  }

  async loadUserFromSupabase(authUserId: string) {
    try {
      // ✅ SCALABILITY: Check cache first
      const cachedUser = this.getCachedUser(authUserId);
      if (cachedUser) {
        console.log('🔐 [OptimizedAuthService] Using cached user data');
        this.updateAuthState({ user: cachedUser, isLoading: false, error: null });
        return;
      }

      console.log('🔐 [OptimizedAuthService] Loading user data from database for authUserId:', authUserId);
      
      // ✅ SCALABILITY: Use optimized RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_complete_user_data', {
        p_auth_user_id: authUserId
      });

      if (rpcError) {
        console.log('🔐 [OptimizedAuthService] RPC function failed, trying direct table query...', rpcError);
        
        // Fallback: Query the table directly with optimized query
        const { data: tableData, error: tableError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', authUserId)
          .is('deleted_at', null) // ✅ SCALABILITY: Add deleted_at check
          .single();

        if (tableError) {
          console.error('🔐 [OptimizedAuthService] Direct table query also failed:', tableError);
          this.updateAuthState({ user: null, isLoading: false, error: 'Failed to load user data' });
          return;
        }

        if (tableData) {
          console.log('🔐 [OptimizedAuthService] User found via direct table query');
          const user = this.transformUserData(tableData, authUserId);
          this.setCachedUser(authUserId, user);
          this.updateAuthState({ user, isLoading: false, error: null });
          return;
        }
      }

      // If RPC worked, use that data
      if (rpcData && rpcData.length > 0) {
        console.log('🔐 [OptimizedAuthService] User found via RPC function');
        const userData = rpcData[0];
        const user = this.transformUserDataFromRPC(userData, authUserId);
        this.setCachedUser(authUserId, user);
        this.updateAuthState({ user, isLoading: false, error: null });
      } else {
        // User not found - try to create manually
        console.log('🔐 [OptimizedAuthService] User not found, trying to create manually...');
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            console.log('🔐 [OptimizedAuthService] Creating user record for auth user:', authUser.email);
            await this.createUserRecord(authUser);
            // Try loading again after creation
            await this.loadUserFromSupabase(authUserId);
          } else {
            this.updateAuthState({ user: null, isLoading: false, error: 'User not found and could not create user record' });
          }
        } catch (createError) {
          console.error('🔐 [OptimizedAuthService] Failed to create user record manually:', createError);
          this.updateAuthState({ user: null, isLoading: false, error: 'User not found and could not create user record' });
        }
      }
    } catch (error) {
      console.error('Error loading user from Supabase:', error);
      this.updateAuthState({ user: null, isLoading: false, error: 'Failed to load user data' });
    }
  }

  // ✅ SCALABILITY: Transform user data from table query
  private transformUserData(tableData: any, authUserId: string): User {
    return {
      id: tableData.id,
      authUserId: tableData.auth_user_id || authUserId,
      email: this.extractOriginalEmail(tableData.email),
      tier: tableData.tier as UserTier,
      hasProfileSetup: tableData.has_profile_setup || false,
      hasSeenSplashScreens: tableData.has_seen_splash_screens || false,
      hasSeenHowToUse: tableData.has_seen_how_to_use || false,
      hasSeenFeaturesConnected: tableData.has_seen_features_connected || false,
      hasSeenProFeatures: tableData.has_seen_pro_features || false,
      pcConnected: tableData.pc_connected || false,
      pcConnectionSkipped: tableData.pc_connection_skipped || false,
      onboardingCompleted: tableData.onboarding_completed || false,
      hasWelcomeMessage: tableData.has_welcome_message || false,
      isNewUser: tableData.is_new_user || true,
      hasUsedTrial: tableData.has_used_trial || false,
      lastActivity: Date.now(),
      preferences: tableData.preferences || {},
      usage: {
        textCount: tableData.usage_data?.textCount || 0,
        imageCount: tableData.usage_data?.imageCount || 0,
        textLimit: TIER_LIMITS[tableData.tier as UserTier]?.text || 0,
        imageLimit: TIER_LIMITS[tableData.tier as UserTier]?.image || 0,
        totalRequests: tableData.usage_data?.totalRequests || 0,
        lastReset: tableData.usage_data?.lastReset || Date.now(),
        tier: tableData.tier as UserTier,
      },
      appState: tableData.app_state || {},
      profileData: tableData.profile_data || {},
      onboardingData: tableData.onboarding_data || {},
      behaviorData: tableData.behavior_data || {},
      feedbackData: tableData.feedback_data || {},
      usageData: tableData.usage_data || {},
      createdAt: tableData.created_at ? new Date(tableData.created_at).getTime() : Date.now(),
      updatedAt: tableData.updated_at ? new Date(tableData.updated_at).getTime() : Date.now(),
    };
  }

  // ✅ SCALABILITY: Transform user data from RPC query
  private transformUserDataFromRPC(userData: any, authUserId: string): User {
    return {
      id: userData.user_id,
      authUserId: userData.auth_user_id || authUserId,
      email: this.extractOriginalEmail(userData.email),
      tier: userData.tier as UserTier,
      hasProfileSetup: userData.has_profile_setup || false,
      hasSeenSplashScreens: userData.has_seen_splash_screens || false,
      hasSeenHowToUse: userData.has_seen_how_to_use || false,
      hasSeenFeaturesConnected: userData.has_seen_features_connected || false,
      hasSeenProFeatures: userData.has_seen_pro_features || false,
      pcConnected: userData.pc_connected || false,
      pcConnectionSkipped: userData.pc_connection_skipped || false,
      onboardingCompleted: userData.onboarding_completed || false,
      hasWelcomeMessage: userData.has_welcome_message || false,
      isNewUser: userData.is_new_user || true,
      hasUsedTrial: userData.has_used_trial || false,
      lastActivity: Date.now(),
      preferences: userData.preferences || {},
      usage: {
        textCount: userData.text_count || 0,
        imageCount: userData.image_count || 0,
        textLimit: TIER_LIMITS[userData.tier as UserTier]?.text || 0,
        imageLimit: TIER_LIMITS[userData.tier as UserTier]?.image || 0,
        totalRequests: 0,
        lastReset: Date.now(),
        tier: userData.tier as UserTier,
      },
      appState: userData.app_state || {},
      profileData: userData.profile_data || {},
      onboardingData: userData.onboarding_data || {},
      behaviorData: userData.behavior_data || {},
      feedbackData: userData.feedback_data || {},
      usageData: userData.usage_data || {},
      createdAt: userData.created_at ? new Date(userData.created_at).getTime() : Date.now(),
      updatedAt: userData.updated_at ? new Date(userData.updated_at).getTime() : Date.now(),
    };
  }

  // Helper function to extract original email from unique identifier
  private extractOriginalEmail(uniqueEmail: string): string {
    const oauthProviders = ['google', 'discord', 'github', 'facebook', 'twitter', 'apple'];
    const parts = uniqueEmail.split('_');
    
    if (parts.length > 1 && oauthProviders.includes(parts[0])) {
      return parts.slice(1).join('_');
    }
    
    return uniqueEmail;
  }

  private async createUserRecord(authUser: any): Promise<void> {
    try {
      console.log('🔐 [OptimizedAuthService] Creating user record for:', authUser.email);
      
      let provider = 'email';
      
      if (authUser.app_metadata?.provider) {
        provider = authUser.app_metadata.provider;
      } else if (authUser.app_metadata?.providers && authUser.app_metadata.providers.length > 0) {
        provider = authUser.app_metadata.providers[0];
      } else if (authUser.identities && authUser.identities.length > 0) {
        provider = authUser.identities[0].provider;
      } else if (authUser.user_metadata?.provider) {
        provider = authUser.user_metadata.provider;
      }
      
      let uniqueEmail;
      if (provider === 'email') {
        uniqueEmail = authUser.email;
      } else {
        uniqueEmail = `${provider}_${authUser.email}`;
      }
      
      const { error } = await supabase.rpc('create_user_record', {
        p_auth_user_id: authUser.id,
        p_email: uniqueEmail,
        p_full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'User',
        p_avatar_url: authUser.user_metadata?.avatar_url,
        p_is_developer: false,
        p_tier: 'free'
      });

      if (error) {
        console.error('🔐 [OptimizedAuthService] Error creating user record:', error);
        throw error;
      }
      
      console.log('🔐 [OptimizedAuthService] User record created successfully');
    } catch (error) {
      console.error('🔐 [OptimizedAuthService] Error creating user record:', error);
      throw error;
    }
  }

  private updateAuthState(newState: Partial<AuthState>) {
    if (this.isDestroyed) return;
    
    const previousState = { ...this.authState };
    this.authState = { ...this.authState, ...newState };
    
    // Only notify listeners if the state actually changed
    const hasChanged = JSON.stringify(previousState) !== JSON.stringify(this.authState);
    if (hasChanged) {
      this.listeners.forEach(listener => listener(this.authState));
    }
  }

  // ✅ SCALABILITY: Rate-limited sign in methods
  async signInWithGoogle(): Promise<AuthResult> {
    if (!this.checkRateLimit('google_signin')) {
      return { success: false, error: 'Too many sign-in attempts. Please wait before trying again.' };
    }

    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        this.updateAuthState({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async signInWithDiscord(): Promise<AuthResult> {
    if (!this.checkRateLimit('discord_signin')) {
      return { success: false, error: 'Too many sign-in attempts. Please wait before trying again.' };
    }

    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      if (window.location.pathname === '/auth/callback') {
        this.updateAuthState({ isLoading: false, error: null });
        return { success: false, error: 'Already on callback page' };
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        this.updateAuthState({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    if (!this.checkRateLimit(`email_signin_${email}`)) {
      return { success: false, error: 'Too many sign-in attempts. Please wait before trying again.' };
    }

    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.updateAuthState({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        await this.loadUserFromSupabase(data.user.id);
        return { success: true, user: this.authState.user || undefined };
      }

      return { success: false, error: 'No user data returned' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async signUpWithEmail(email: string, password: string): Promise<AuthResult> {
    if (!this.checkRateLimit(`email_signup_${email}`)) {
      return { success: false, error: 'Too many sign-up attempts. Please wait before trying again.' };
    }

    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        this.updateAuthState({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        if (!data.user.email_confirmed_at) {
          this.updateAuthState({ isLoading: false, error: null });
          return { 
            success: true, 
            user: undefined, 
            requiresConfirmation: true,
            message: 'Please check your email and click the confirmation link to complete your account setup.'
          };
        }
        
        await this.loadUserFromSupabase(data.user.id);
        return { success: true, user: this.authState.user || undefined };
      }

      return { success: false, error: 'No user data returned' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('🔐 [OptimizedAuthService] Starting sign out process...');
      
      // Clear all local storage
      localStorage.removeItem('otakon_auth_method');
      localStorage.removeItem('otakon_remember_me');
      localStorage.removeItem('otakon_remembered_email');
      localStorage.removeItem('otakon_discord_auth_attempt');
      localStorage.removeItem('otakon_app_state');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // ✅ SCALABILITY: Clear cache
      this.clearCache();
      
      // Clear auth state
      this.updateAuthState({ user: null, isLoading: false, error: null });
      
      console.log('🔐 [OptimizedAuthService] Sign out completed successfully');
    } catch (error) {
      console.error('🔐 [OptimizedAuthService] Sign out error:', error);
      this.updateAuthState({ user: null, isLoading: false, error: null });
    }
  }

  getCurrentUser(): User | null {
    return this.authState.user;
  }

  getAuthState(): AuthState {
    return this.authState;
  }

  async refreshUser(): Promise<void> {
    if (this.authState.user && !this.isDestroyed) {
      console.log('🔐 [OptimizedAuthService] Refreshing user data...');
      // Clear cache to force fresh data
      this.userCache.delete(this.authState.user.authUserId);
      await this.loadUserFromSupabase(this.authState.user.authUserId);
    }
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    if (this.isDestroyed) return () => {};
    
    this.listeners.push(listener);
    
    // Call listener immediately with current state
    listener(this.authState);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // ✅ SCALABILITY: Cleanup method to prevent memory leaks
  cleanup(): void {
    if (this.isDestroyed) return;
    
    console.log('🧹 [OptimizedAuthService] Cleaning up...');
    
    this.isDestroyed = true;
    
    // Clear cache
    this.clearCache();
    
    // Clear rate limiter
    this.rateLimiter.clear();
    
    // Clear listeners
    this.listeners.length = 0;
    
    // Run cleanup functions
    this.cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    this.cleanupFunctions.length = 0;
    
    console.log('🧹 [OptimizedAuthService] Cleanup completed');
  }
}

export const optimizedAuthService = OptimizedAuthService.getInstance();
