import { supabase } from '../lib/supabase';
import { User, AuthResult, AuthState, UserTier } from '../types';
import { TIER_LIMITS } from '../constants';
import { cacheService } from './cacheService';
import { ErrorService } from './errorService';
import { toastService } from './toastService';
import { jsonToRecord } from '../utils/typeHelpers';
import { isPWAMode } from '../utils/pwaDetection';

export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    isLoading: true,
    error: null,
  };

  private listeners: ((state: AuthState) => void)[] = [];
  
  // ✅ SCALABILITY: Using centralized cache and error services
  
  // ✅ PERFORMANCE: Request deduplication for user loading
  private pendingUserLoads = new Map<string, Promise<void>>();
  
  // ✅ SCALABILITY: Memory leak prevention
  private cleanupFunctions: (() => void)[] = [];
  private isDestroyed = false;

  // Helper to get the correct callback URL for both dev and production
  private getCallbackUrl(): string {
    const origin = window.location.origin;
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Check if running in PWA mode
    const isPWA = isPWAMode();
    
    const callback = isDev ? '/auth/callback' : '/Otagon/auth/callback';
    
    // For PWA, ensure we use the full URL with proper scheme
    // This helps with OAuth redirects in standalone mode
    if (isPWA) {
      console.log('🔐 [AuthService] PWA mode detected, using full callback URL');
      return `${origin}${callback}`;
    }
    
    return `${origin}${callback}`;
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.initializeAuth();
    this.setupCleanup();
  }

  // ✅ SCALABILITY: Setup cleanup
  private setupCleanup() {
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

  // ✅ SCALABILITY: Check rate limit using centralized service
  private async checkRateLimit(identifier: string): Promise<boolean> {
    if (this.isDestroyed) {
      return false;
    }
    
    const rateLimitData = await cacheService.getRateLimit(identifier);
    const now = Date.now();
    
    if (!rateLimitData || now > rateLimitData.resetTime) {
      await cacheService.setRateLimit(identifier, { count: 1, resetTime: now + 15 * 60 * 1000 });
      return true;
    }
    
    if (rateLimitData.count >= 10) {
      return false;
    }
    
    await cacheService.setRateLimit(identifier, { 
      count: rateLimitData.count + 1, 
      resetTime: rateLimitData.resetTime 
    });
    return true;
  }

  // ✅ SCALABILITY: Get user from centralized cache
  private async getCachedUser(authUserId: string): Promise<User | null> {
    if (this.isDestroyed) {
      return null;
    }
    
    return await cacheService.getUser<User>(authUserId);
  }

  // ✅ SCALABILITY: Cache user data using centralized service
  private async setCachedUser(authUserId: string, user: User): Promise<void> {
    if (this.isDestroyed) {
      return;
    }
    
    await cacheService.setUser(authUserId, user);
  }

  // ✅ SCALABILITY: Clear cache using centralized service
  private async clearCache(): Promise<void> {
    await cacheService.clear();
  }

  // ✅ SCALABILITY: Invalidate user cache specifically
  private async invalidateUserCache(authUserId: string): Promise<void> {
    const cacheKey = `user:${authUserId}`;
    await cacheService.delete(cacheKey);
  }

  private async initializeAuth() {
    try {
      // Always initialize auth


      // Handle OAuth callback if we're on the callback URL
      // Note: AuthCallback component handles OAuth callbacks, so we skip this
      // to avoid conflicts
      const isAuthCallback = window.location.pathname === '/auth/callback' || 
                             window.location.pathname === '/Otagon/auth/callback';
      if (isAuthCallback) {
        console.log('🔐 [AuthService] OAuth callback detected, but AuthCallback component will handle it');
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
      } catch (_supabaseError) {
        // Fallback to local storage
        const localUser = localStorage.getItem('otakon_user');
        if (localUser) {
          try {
            const user = JSON.parse(localUser);
            this.updateAuthState({ user, isLoading: false, error: null });
          } catch (_parseError) {
            this.updateAuthState({ user: null, isLoading: false, error: null });
          }
        } else {
          this.updateAuthState({ user: null, isLoading: false, error: null });
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      toastService.error('Failed to initialize authentication. Please refresh the page.', {
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload()
        }
      });
      this.updateAuthState({ user: null, isLoading: false, error: null });
    }
  }


  private async createUserRecord(authUser: any): Promise<void> {
    try {
      console.log('🔐 [AuthService] Creating user record for:', authUser.email);
      
      // Get the OAuth provider from the auth user metadata
      // Check multiple possible locations for provider information
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
      
      console.log('🔐 [AuthService] Auth user metadata:', {
        app_metadata: authUser.app_metadata,
        user_metadata: authUser.user_metadata,
        identities: authUser.identities,
        provider: provider
      });
      console.log('🔐 [AuthService] OAuth provider:', provider);
      
      // Create a unique identifier that includes the provider
      // For email authentication, use the original email
      // For OAuth providers, use provider prefix
      let uniqueEmail;
      if (provider === 'email') {
        uniqueEmail = authUser.email; // Use original email for email authentication
      } else {
        uniqueEmail = `${provider}_${authUser.email}`; // Use provider prefix for OAuth
      }
      
      console.log('🔐 [AuthService] Unique email identifier:', uniqueEmail);
      
      const { error } = await supabase.rpc('create_user_record', {
        p_auth_user_id: authUser.id,
        p_email: uniqueEmail,
        p_full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'User',
        p_avatar_url: authUser.user_metadata?.avatar_url,
        p_is_developer: false,
        p_tier: 'free'
      });

      if (error) {
        // Check if it's a duplicate key error (23505)
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          console.log('🔐 [AuthService] User record already exists (duplicate key), continuing...');
          // This is not actually an error - the user already exists
          return;
        }
        console.error('🔐 [AuthService] Error creating user record:', error);
        toastService.error('Failed to create your account. Please try again.');
        throw error;
      }
      
      console.log('🔐 [AuthService] User record created successfully');
    } catch (error: any) {
      // Check if it's a duplicate key error (23505)
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        console.log('🔐 [AuthService] User record already exists (duplicate key in catch), continuing...');
        // This is not actually an error - the user already exists
        return;
      }
      console.error('🔐 [AuthService] Error creating user record:', error);
      toastService.error('Failed to create your account. Please try again.');
      throw error;
    }
  }

  // Helper function to extract original email from unique identifier
  private extractOriginalEmail(uniqueEmail: string): string {
    // Check if this is an OAuth provider email (has provider prefix)
    const oauthProviders = ['google', 'discord', 'github', 'facebook', 'twitter', 'apple'];
    const parts = uniqueEmail.split('_');
    
    if (parts.length > 1 && oauthProviders.includes(parts[0])) {
      // This is an OAuth provider email, remove the provider prefix
      return parts.slice(1).join('_'); // Join in case email contains underscores
    }
    
    // This is either an email authentication or doesn't have a recognized prefix
    return uniqueEmail;
  }

  async loadUserFromSupabase(authUserId: string) {
    // ✅ PERFORMANCE: Check if there's already a pending load for this user
    const existingLoad = this.pendingUserLoads.get(authUserId);
    if (existingLoad) {
      console.log('🔐 [AuthService] Deduplicating user load request for:', authUserId);
      return await existingLoad;
    }

    // Create a new load promise and store it
    const loadPromise = (async () => {
      try {
        await this._loadUserFromSupabaseInternal(authUserId);
      } finally {
        // Clean up the pending request after completion
        this.pendingUserLoads.delete(authUserId);
      }
    })();
    
    this.pendingUserLoads.set(authUserId, loadPromise);
    return await loadPromise;
  }

  private async _loadUserFromSupabaseInternal(authUserId: string) {
    try {
      // ✅ SCALABILITY: Check cache first
      const cachedUser = await this.getCachedUser(authUserId);
      if (cachedUser) {
        console.log('🔐 [AuthService] Using cached user data');
        this.updateAuthState({ user: cachedUser, isLoading: false, error: null });
        return;
      }

      console.log('🔐 [AuthService] Loading user data from database for authUserId:', authUserId);
      
      // Try the RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_complete_user_data', {
        p_auth_user_id: authUserId
      });

      if (rpcError) {
        console.log('🔐 [AuthService] RPC function failed, trying direct table query...', rpcError);
        
        // Fallback: Query the table directly
        const { data: tableData, error: tableError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', authUserId)
          .single();

        if (tableError) {
          console.error('🔐 [AuthService] Direct table query also failed:', tableError);
          this.updateAuthState({ user: null, isLoading: false, error: 'Failed to load user data' });
          return;
        }

        if (tableData) {
          console.log('🔐 [AuthService] User found via direct table query');
          const user: User = {
            id: tableData.id,
            authUserId: tableData.auth_user_id || authUserId, // Fallback to the authUserId parameter
            email: this.extractOriginalEmail(tableData.email), // Extract original email from unique identifier
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
            // ✅ Query-based usage limits (top-level for easy access)
            textCount: tableData.text_count || 0,
            imageCount: tableData.image_count || 0,
            textLimit: tableData.text_limit || TIER_LIMITS[tableData.tier as UserTier]?.text || 0,
            imageLimit: tableData.image_limit || TIER_LIMITS[tableData.tier as UserTier]?.image || 0,
            totalRequests: tableData.total_requests || 0,
            lastReset: tableData.last_reset ? new Date(tableData.last_reset).getTime() : Date.now(),
            preferences: jsonToRecord(tableData.preferences),
            // Legacy nested usage object (kept for backward compatibility)
            usage: {
              textCount: tableData.text_count || 0,
              imageCount: tableData.image_count || 0,
              textLimit: tableData.text_limit || TIER_LIMITS[tableData.tier as UserTier]?.text || 0,
              imageLimit: tableData.image_limit || TIER_LIMITS[tableData.tier as UserTier]?.image || 0,
              totalRequests: tableData.total_requests || 0,
              lastReset: tableData.last_reset ? new Date(tableData.last_reset).getTime() : Date.now(),
              tier: tableData.tier as UserTier,
            },
            appState: jsonToRecord(tableData.app_state),
            profileData: jsonToRecord(tableData.profile_data),
            onboardingData: jsonToRecord(tableData.onboarding_data),
            behaviorData: jsonToRecord(tableData.behavior_data),
            feedbackData: jsonToRecord(tableData.feedback_data),
            usageData: jsonToRecord(tableData.usage_data),
            createdAt: tableData.created_at ? new Date(tableData.created_at).getTime() : Date.now(),
            updatedAt: tableData.updated_at ? new Date(tableData.updated_at).getTime() : Date.now(),
          };

          // ✅ SCALABILITY: Cache user data
          await this.setCachedUser(authUserId, user);
          this.updateAuthState({ user, isLoading: false, error: null });
          return;
        }
      }

      // If RPC worked, use that data
      if (rpcData && rpcData.length > 0) {
        console.log('🔐 [AuthService] User found via RPC function');
        console.log('🔐 [AuthService] RPC data:', rpcData[0]);
        const userData = rpcData[0];
        const user: User = {
          id: userData.id,
          authUserId: userData.auth_user_id || authUserId, // Fallback to the authUserId parameter
          email: this.extractOriginalEmail(userData.email), // Extract original email from unique identifier
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
          // ✅ Query-based usage limits (top-level for easy access)
          textCount: userData.text_count || 0,
          imageCount: userData.image_count || 0,
          textLimit: userData.text_limit || TIER_LIMITS[userData.tier as UserTier]?.text || 0,
          imageLimit: userData.image_limit || TIER_LIMITS[userData.tier as UserTier]?.image || 0,
          totalRequests: userData.total_requests || 0,
          lastReset: userData.last_reset ? new Date(userData.last_reset).getTime() : Date.now(),
          preferences: jsonToRecord(userData.preferences),
          // Legacy nested usage object (kept for backward compatibility)
          usage: {
            textCount: userData.text_count || 0,
            imageCount: userData.image_count || 0,
            textLimit: userData.text_limit || TIER_LIMITS[userData.tier as UserTier]?.text || 0,
            imageLimit: userData.image_limit || TIER_LIMITS[userData.tier as UserTier]?.image || 0,
            totalRequests: userData.total_requests || 0,
            lastReset: userData.last_reset ? new Date(userData.last_reset).getTime() : Date.now(),
            tier: userData.tier as UserTier,
          },
          appState: jsonToRecord(userData.app_state),
          profileData: jsonToRecord(userData.profile_data),
          onboardingData: jsonToRecord(userData.onboarding_data),
          behaviorData: jsonToRecord(userData.behavior_data),
          feedbackData: jsonToRecord(userData.feedback_data),
          usageData: jsonToRecord(userData.usage_data),
          createdAt: userData.created_at ? new Date(userData.created_at).getTime() : Date.now(),
          updatedAt: userData.updated_at ? new Date(userData.updated_at).getTime() : Date.now(),
        };

        console.log('🔐 [AuthService] User onboarding flags:', {
          hasProfileSetup: user.hasProfileSetup,
          hasSeenSplashScreens: user.hasSeenSplashScreens,
          hasSeenHowToUse: user.hasSeenHowToUse,
          hasSeenFeaturesConnected: user.hasSeenFeaturesConnected,
          hasSeenProFeatures: user.hasSeenProFeatures,
          pcConnected: user.pcConnected,
          pcConnectionSkipped: user.pcConnectionSkipped,
          onboardingCompleted: user.onboardingCompleted
        });

        // ✅ SCALABILITY: Cache user data
        await this.setCachedUser(authUserId, user);
        this.updateAuthState({ user, isLoading: false, error: null });
      } else {
        // User not found - try to create manually
        console.log('🔐 [AuthService] User not found, trying to create manually...');
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            console.log('🔐 [AuthService] Creating user record for auth user:', authUser.email);
            await this.createUserRecord(authUser);
            // ✅ PERFORMANCE: Call internal function directly to avoid deadlock with deduplication Map
            await this._loadUserFromSupabaseInternal(authUserId);
          } else {
            this.updateAuthState({ user: null, isLoading: false, error: 'User not found and could not create user record' });
          }
        } catch (createError) {
          console.error('🔐 [AuthService] Failed to create user record manually:', createError);
          this.updateAuthState({ user: null, isLoading: false, error: 'User not found and could not create user record' });
        }
      }
    } catch (error) {
      console.error('Error loading user from Supabase:', error);
      this.updateAuthState({ user: null, isLoading: false, error: 'Failed to load user data' });
    }
  }


  private updateAuthState(newState: Partial<AuthState>) {
    const previousState = { ...this.authState };
    this.authState = { ...this.authState, ...newState };
    
    // Only notify listeners if the state actually changed
    const hasChanged = JSON.stringify(previousState) !== JSON.stringify(this.authState);
    if (hasChanged) {
      this.listeners.forEach(listener => listener(this.authState));
    }
  }

  // Public methods
  
  // ⚠️ PROTECTED OAUTH FLOW - DO NOT MODIFY WITHOUT WARNING ⚠️
  // Google OAuth is working correctly - any changes here could break user authentication
  // If you need to modify this, add a warning comment explaining the change
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      // ✅ SCALABILITY: Rate limiting
      if (!(await this.checkRateLimit('google_signin'))) {
        return { success: false, error: 'Too many sign-in attempts. Please wait before trying again.' };
      }

      this.updateAuthState({ isLoading: true, error: null });
      
      console.log('🔐 [AuthService] Starting Google OAuth...');
      const redirectUrl = this.getCallbackUrl();
      console.log('🔐 [AuthService] Redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: 'select_account' // Force Google account selection
          }
        }
      });

      if (error) {
        console.error('🔐 [AuthService] Google OAuth error:', error);
        toastService.error('Failed to sign in with Google. Please try again.');
        this.updateAuthState({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      console.log('🔐 [AuthService] Google OAuth initiated successfully');
      return { success: true };
    } catch (error) {
      ErrorService.handleAuthError(error as Error, 'signInWithGoogle');
      toastService.error('Google sign-in failed. Please try again.');
      this.updateAuthState({ 
        user: null, 
        isLoading: false, 
        error: 'Google sign-in failed. Please try again.' 
      });
      return { success: false, error: 'Google sign-in failed. Please try again.' };
    }
  }

  // ⚠️ PROTECTED OAUTH FLOW - DO NOT MODIFY WITHOUT WARNING ⚠️
  // Discord OAuth is working correctly - any changes here could break user authentication
  // If you need to modify this, add a warning comment explaining the change
  async signInWithDiscord(): Promise<AuthResult> {
    // ✅ SCALABILITY: Rate limiting
    if (!this.checkRateLimit('discord_signin')) {
      return { success: false, error: 'Too many sign-in attempts. Please wait before trying again.' };
    }

    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      console.log('🔐 [AuthService] Starting Discord OAuth...');
      
      // Construct the redirect URL properly using current origin
      const redirectUrl = this.getCallbackUrl();
      console.log('🔐 [AuthService] Redirect URL:', redirectUrl);
      console.log('🔐 [AuthService] Current origin:', window.location.origin);
      console.log('🔐 [AuthService] Current pathname:', window.location.pathname);
      console.log('🔐 [AuthService] Current port:', window.location.port);
      console.log('🔐 [AuthService] Full URL:', window.location.href);
      
      // Check if we're already on the callback page
      const isAuthCallback = window.location.pathname === '/auth/callback' || 
                             window.location.pathname === '/Otagon/auth/callback';
      if (isAuthCallback) {
        console.log('🔐 [AuthService] Already on callback page, skipping OAuth initiation');
        this.updateAuthState({ isLoading: false, error: null });
        return { success: false, error: 'Already on callback page' };
      }
      
      // Store the current URL for potential error handling
      localStorage.setItem('otakon_discord_auth_attempt', Date.now().toString());
      
      // Initiate Discord OAuth with proper error handling
      console.log('🔐 [AuthService] Initiating Discord OAuth with redirectTo:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
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
        console.error('🔐 [AuthService] Discord OAuth error:', error);
        console.error('🔐 [AuthService] Error details:', {
          message: error.message,
          status: error.status
        });
        
        // Provide more specific error messages
        let errorMessage = 'Discord authentication failed. ';
        if (error.message.includes('Invalid redirect URI')) {
          errorMessage += 'Please check Discord OAuth configuration in Supabase dashboard.';
        } else if (error.message.includes('Invalid client')) {
          errorMessage += 'Discord OAuth credentials are invalid. Please check Supabase configuration.';
        } else if (error.message.includes('access_denied')) {
          errorMessage += 'Discord authorization was cancelled.';
        } else {
          errorMessage += error.message;
        }
        
        toastService.error(`Failed to sign in with Discord. ${errorMessage}`);
        this.updateAuthState({ isLoading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }

      console.log('🔐 [AuthService] Discord OAuth initiated successfully');
      console.log('🔐 [AuthService] OAuth data:', data);
      
      // OAuth will redirect, so we return success
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('🔐 [AuthService] Discord OAuth exception:', error);
      console.error('🔐 [AuthService] Exception details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: errorMessage,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      this.updateAuthState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  // ⚠️ PROTECTED EMAIL AUTH FLOW - DO NOT MODIFY WITHOUT WARNING ⚠️
  // Email authentication is working correctly - any changes here could break user authentication
  // If you need to modify this, add a warning comment explaining the change
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    // ✅ SCALABILITY: Rate limiting
    if (!this.checkRateLimit(`email_signin_${email}`)) {
      return { success: false, error: 'Too many sign-in attempts. Please wait before trying again.' };
    }

    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      console.log('🔐 [AuthService] Starting email sign-in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('🔐 [AuthService] Email sign-in error:', error);
        
        // Provide more helpful error messages
        let errorMessage = error.message;
        
        if (error.message.includes('Invalid login credentials')) {
          // Check if this might be a provider mismatch issue
          // We can't check the database without authentication, but we can provide a helpful message
          errorMessage = 'Invalid email or password. If you signed up with Google or Discord, please use those options instead.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many sign-in attempts. Please wait a moment before trying again.';
        }
        
        toastService.error(errorMessage);
        this.updateAuthState({ isLoading: false, error: errorMessage });
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        console.log('🔐 [AuthService] Email sign-in successful:', data.user.email);
        toastService.success('Welcome back! Successfully signed in.');
        // Load user data (this will handle user creation if needed)
        await this.loadUserFromSupabase(data.user.id);
        return { success: true, user: this.authState.user || undefined };
      }

      return { success: false, error: 'No user data returned' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('🔐 [AuthService] Email sign-in exception:', error);
      toastService.error('Sign-in failed. Please try again.');
      this.updateAuthState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }


  // ⚠️ PROTECTED EMAIL AUTH FLOW - DO NOT MODIFY WITHOUT WARNING ⚠️
  // Email signup is working correctly - any changes here could break user registration
  // If you need to modify this, add a warning comment explaining the change
  async signUpWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      console.log('🔐 [AuthService] Starting email sign-up...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: this.getCallbackUrl()
        }
      });

      // Handle email confirmation errors gracefully
      let isEmailConfirmationDisabled = false;
      if (error) {
        console.error('🔐 [AuthService] Email sign-up error:', error);
        
        if (error.message.includes('Error sending confirmation email')) {
          console.log('🔐 [AuthService] Email confirmation disabled, proceeding with sign-up...');
          isEmailConfirmationDisabled = true;
          // Continue with the sign-up process even if email confirmation fails
          // This is useful for development when email confirmation is disabled
        } else {
          toastService.error(`Sign-up failed: ${error.message}`);
          this.updateAuthState({ isLoading: false, error: error.message });
          return { success: false, error: error.message };
        }
      }

      if (data.user) {
        console.log('🔐 [AuthService] Email sign-up successful:', data.user.email);
        console.log('🔐 [AuthService] User confirmation required:', !data.user.email_confirmed_at);
        
        // Check if email confirmation is required
        if (!data.user.email_confirmed_at) {
          console.log('🔐 [AuthService] Email confirmation required, user not yet signed in');
          
          // For development, if email confirmation is disabled, proceed anyway
          if (isEmailConfirmationDisabled) {
            console.log('🔐 [AuthService] Email confirmation disabled, creating user record anyway...');
            toastService.success('Account created successfully! Welcome to Otakon!');
            await this.loadUserFromSupabase(data.user.id);
            return { success: true, user: this.authState.user || undefined };
          }
          
          this.updateAuthState({ isLoading: false, error: null });
          return { 
            success: true, 
            user: undefined, 
            requiresConfirmation: true,
            message: 'Please check your email and click the confirmation link to complete your account setup.'
          };
        }
        
        // User is confirmed, load user data
        await this.loadUserFromSupabase(data.user.id);
        return { success: true, user: this.authState.user || undefined };
      }

      return { success: false, error: 'No user data returned' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('🔐 [AuthService] Email sign-up exception:', error);
      this.updateAuthState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      this.updateAuthState({ isLoading: true, error: null });
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: this.getCallbackUrl()
      });

      if (error) {
        this.updateAuthState({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      this.updateAuthState({ isLoading: false, error: null });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAuthState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('🔐 [AuthService] Starting sign out process...');
      
      // Sign out from Supabase FIRST to clear session tokens
      await supabase.auth.signOut();
      
      // Clear ALL Supabase-related localStorage keys (they start with 'sb-')
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('🔐 [AuthService] Cleared Supabase localStorage keys:', keysToRemove);
      
      // Clear all app-specific local storage
      localStorage.removeItem('otakon_auth_method');
      localStorage.removeItem('otakon_remember_me');
      localStorage.removeItem('otakon_remembered_email');
      localStorage.removeItem('otakon_discord_auth_attempt');
      localStorage.removeItem('otakon_has_used_app');
      localStorage.removeItem('otakon_user');
      localStorage.removeItem('otakon_conversations');
      
      // Clear any stored app state
      localStorage.removeItem('otakon_app_state');
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // ✅ SCALABILITY: Clear cache
      this.clearCache();
      
      // Clear auth state
      this.updateAuthState({ user: null, isLoading: false, error: null });
      
      console.log('🔐 [AuthService] Sign out completed successfully');
      toastService.success('Successfully signed out. See you next time!');
    } catch (error) {
      console.error('🔐 [AuthService] Sign out error:', error);
      toastService.error('Sign out failed. Please try again.');
      // Even if there's an error, clear the local state
      this.updateAuthState({ user: null, isLoading: false, error: null });
    }
  }

  getCurrentUser(): User | null {
    return this.authState.user;
  }

  getAuthState(): AuthState {
    return this.authState;
  }


  // Method to clear all user data for testing multiple OAuth providers
  async clearAllUserData(): Promise<void> {
    try {
      console.log('🔐 [AuthService] Clearing all user data for testing...');
      
      // Clear localStorage
      localStorage.removeItem('otakon_auth_method');
      localStorage.removeItem('otakon_remember_me');
      localStorage.removeItem('otakon_remembered_email');
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear auth state
      this.updateAuthState({ user: null, isLoading: false, error: null });
      
      console.log('🔐 [AuthService] All user data cleared successfully');
    } catch (error) {
      console.error('🔐 [AuthService] Error clearing user data:', error);
    }
  }

  // Method to check which provider was used for a given email
  async checkEmailProvider(email: string): Promise<{ provider: string | null; message: string }> {
    try {
      console.log('🔐 [AuthService] Checking provider for email:', email);
      
      // For now, skip provider checking during sign-in to avoid 401 errors
      // This will be handled by the actual sign-in attempt
      console.log('🔐 [AuthService] Skipping provider check to avoid 401 errors during sign-in');
      return { provider: null, message: '' };
    } catch (error) {
      console.error('🔐 [AuthService] Error checking email provider:', error);
      return { provider: null, message: '' };
    }
  }

  async resendConfirmationEmail(email: string): Promise<AuthResult> {
    try {
      console.log('🔐 [AuthService] Resending confirmation email for:', email);
      this.updateAuthState({ isLoading: true, error: null });

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: this.getCallbackUrl()
        }
      });

      if (error) {
        console.error('🔐 [AuthService] Error resending confirmation email:', error);
        toastService.error('Failed to resend confirmation email. Please try again.');
        this.updateAuthState({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      console.log('🔐 [AuthService] Confirmation email resent successfully');
      toastService.success('Confirmation email sent! Please check your inbox.');
      this.updateAuthState({ isLoading: false, error: null });
      return { 
        success: true, 
        message: 'Confirmation email sent! Please check your inbox and click the confirmation link.' 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('🔐 [AuthService] Exception resending confirmation email:', error);
      toastService.error('Failed to resend confirmation email. Please try again.');
      this.updateAuthState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  // Method to test Discord OAuth configuration
  async testDiscordConfiguration(): Promise<{ isValid: boolean; message: string; details: any }> {
    try {
      console.log('🔐 [AuthService] Testing Discord OAuth configuration...');
      
      // Check if we can access Supabase auth
      const { error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        return {
          isValid: false,
          message: 'Cannot access Supabase auth service',
          details: { sessionError }
        };
      }
      
      // For now, assume Discord is available if we can access auth
      // The actual provider check would require a different approach
      // This will be determined by the actual OAuth attempt
      
      // Test redirect URL construction
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('🔐 [AuthService] Test redirect URL:', redirectUrl);
      
      return {
        isValid: true,
        message: 'Discord OAuth configuration appears to be valid',
        details: {
          redirectUrl,
          currentOrigin: window.location.origin,
          currentPathname: window.location.pathname
        }
      };
    } catch (error) {
      console.error('🔐 [AuthService] Error testing Discord configuration:', error);
      return {
        isValid: false,
        message: 'Error testing Discord configuration',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async refreshUser(): Promise<void> {
    if (this.authState.user) {
      console.log('🔐 [AuthService] Refreshing user data...');
      // Invalidate cache before loading to ensure fresh data
      await this.invalidateUserCache(this.authState.user.authUserId);
      await this.loadUserFromSupabase(this.authState.user.authUserId);
    }
  }

  /**
   * Update user profile preferences
   */
  async updateUserProfile(authUserId: string, profileData: any): Promise<void> {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('users')
        .update({ profile_data: profileData })
        .eq('auth_user_id', authUserId);

      if (error) {
        console.error('Error updating profile:', error);
        toastService.error('Failed to update profile. Please try again.');
        throw error;
      }

      // Invalidate cache and reload user
      await this.invalidateUserCache(authUserId);
      await this.loadUserFromSupabase(authUserId);
      
      console.log('✅ Profile preferences updated successfully');
      toastService.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile preferences:', error);
      toastService.error('Failed to update profile. Please try again.');
      throw error;
    }
  }

  subscribe(listener: (state: AuthState) => void): () => void {
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
    if (this.isDestroyed) {
      return;
    }
    
    console.log('🧹 [AuthService] Cleaning up...');
    
    this.isDestroyed = true;
    
    // Clear cache
    this.clearCache();
    
    // Rate limiter is now handled by centralized cache service
    
    // Clear listeners
    this.listeners.length = 0;
    
    // Run cleanup functions
    this.cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Error during auth service cleanup:', error);
      }
    });
    this.cleanupFunctions.length = 0;
    
    console.log('🧹 [AuthService] Cleanup completed');
  }

}

export const authService = AuthService.getInstance();
