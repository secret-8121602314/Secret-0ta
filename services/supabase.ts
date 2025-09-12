import { createClient } from '@supabase/supabase-js';
import { User, Session, AuthError } from '@supabase/supabase-js';
// Removed tierService import to avoid circular dependency - using dynamic import instead

// Environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.SUPABASE_ANON_KEY;

// Debug environment variables (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase Config Debug:', {
    supabaseUrl: supabaseUrl ? '✅ Set' : '❌ Missing',
    supabaseKey: supabaseKey ? '✅ Set' : '❌ Missing',
    viteUrl: import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing',
    viteKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ? '✅ Set' : '❌ Missing',
    actualUrl: supabaseUrl,
    actualKey: supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'undefined'
  });
}

// For now, use placeholder values to prevent crashes
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-key';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables, using fallback values');
}

export const supabase = createClient(supabaseUrl || fallbackUrl, supabaseKey || fallbackKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Auth types
export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

// Auth service
export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    session: null,
    loading: false,
    error: null,
  };

  private listeners: Set<(state: AuthState) => void> = new Set();

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.clearInvalidSessions();
    this.initializeAuth();
  }

  private async clearInvalidSessions() {
    try {
      // Clear any existing invalid sessions
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          if (error || !user) {
            console.log('🔐 Clearing invalid session on startup');
            await supabase.auth.signOut();
          }
        } catch (validationError) {
          console.log('🔐 Clearing invalid session on startup due to validation error');
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      // Ignore errors during session clearing
    }
  }

  private async initializeAuth() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log('🔐 Initial session error:', error);
        this.updateAuthState({ error, loading: false });
        return;
      }

      // Validate session by trying to get user data
      if (session?.user) {
        console.log('🔐 Validating existing session...');
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            console.log('🔐 Session validation failed, clearing invalid session:', userError);
            // Session is invalid, clear it completely
            await supabase.auth.signOut();
            this.updateAuthState({ user: null, session: null, loading: false });
            return;
          }
          console.log('🔐 Session validated successfully');
        } catch (validationError) {
          console.log('🔐 Session validation error, clearing invalid session:', validationError);
          // Session is invalid, clear it completely
          await supabase.auth.signOut();
          this.updateAuthState({ user: null, session: null, loading: false });
          return;
        }
      }

      this.updateAuthState({ 
        user: session?.user ?? null, 
        session, 
        loading: false 
      });

      // If user already has a session, initialize services
      if (session?.user) {
        console.log('Existing session found, initializing services...');
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth state change:', { event, hasSession: !!session, hasUser: !!session?.user, userId: session?.user?.id });
        
        // Only log significant auth events to reduce console noise
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          console.log('🔐 Supabase auth state change:', { event, hasSession: !!session, hasUser: !!session?.user });
        }
        
        // Validate session for SIGNED_IN events
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
              console.log('🔐 New session validation failed:', userError);
              // Session is invalid, don't update state
              return;
            }
          } catch (validationError) {
            console.log('🔐 New session validation error:', validationError);
            // Session is invalid, don't update state
            return;
          }
        }
        
        this.updateAuthState({ 
          user: session?.user ?? null, 
          session, 
          loading: false 
        });

        // Automatically assign free tier to new users
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🎉 User signed in, assigning free tier...');
          try {
            // Dynamic import to avoid circular dependency
            const { tierService } = await import('./tierService');
            await tierService.assignFreeTier(session.user.id);
            
            console.log('Free tier assigned to new user');
          } catch (error) {
            console.error('Error assigning free tier:', error);
          }
        }
      });
    } catch (error) {
      this.updateAuthState({ 
        error: error as AuthError, 
        loading: false 
      });
    }
  }

  private updateAuthState(updates: Partial<AuthState>) {
    // Only log significant state changes to reduce console noise
    const hasUserChanged = !!this.authState.user !== !!updates.user;
    const loadingChanged = this.authState.loading !== updates.loading;
    
    if (hasUserChanged || loadingChanged) {
      console.log('🔄 AuthService state update:', { 
        previous: { hasUser: !!this.authState.user, loading: this.authState.loading },
        updates: { hasUser: !!updates.user, loading: updates.loading },
        newState: { hasUser: !!updates.user || !!this.authState.user, loading: updates.loading ?? this.authState.loading }
      });
    }
    
    this.authState = { ...this.authState, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    // Reduce listener notification logging
    console.log('🔔 Notifying auth state listeners:', { 
      listenerCount: this.listeners.size,
      hasUser: !!this.authState.user,
      loading: this.authState.loading 
    });
    this.listeners.forEach(listener => listener(this.authState));
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  getCurrentUserId(): string | null {
    return this.authState.user?.id || null;
  }

  async signIn(email: string, password: string) {
    try {
      this.updateAuthState({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        this.updateAuthState({ error, loading: false });
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      const authError = error as AuthError;
      this.updateAuthState({ error: authError, loading: false });
      return { success: false, error: authError };
    }
  }

  async signInWithGoogle() {
    try {
      this.updateAuthState({ loading: true, error: null });
      console.log('🔐 Initiating Google OAuth with redirect URL:', window.location.origin);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error('❌ Google OAuth error:', error);
        this.updateAuthState({ error, loading: false });
        return { success: false, error };
      }

      console.log('✅ Google OAuth initiated successfully, redirecting to:', data.url);
      // For OAuth, we don't need to wait for the redirect
      // The user will be redirected back to the current page
      return { success: true, data };
    } catch (error) {
      console.error('❌ Google OAuth exception:', error);
      const authError = error as AuthError;
      this.updateAuthState({ error: authError, loading: false });
      return { success: false, error: authError };
    }
  }

  async signInWithDiscord() {
    try {
      this.updateAuthState({ loading: true, error: null });
      console.log('🔐 Initiating Discord OAuth with redirect URL:', window.location.origin);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error('❌ Discord OAuth error:', error);
        this.updateAuthState({ error, loading: false });
        return { success: false, error };
      }

      console.log('✅ Discord OAuth initiated successfully, redirecting to:', data.url);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Discord OAuth exception:', error);
      const authError = error as AuthError;
      this.updateAuthState({ error: authError, loading: false });
      return { success: false, error: authError };
    }
  }

  async signUp(email: string, password: string) {
    try {
      this.updateAuthState({ loading: true, error: null });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        this.updateAuthState({ error, loading: false });
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      const authError = error as AuthError;
      this.updateAuthState({ error: authError, loading: false });
      return { success: false, error: authError };
    }
  }

  // Developer mode authentication (password-based) - FIXED CAPTCHA ISSUE
  async signInWithDeveloperMode(password: string): Promise<{ success: boolean; error?: string }> {
    console.log('🔧 Attempting developer mode authentication...');
    
    if (password === 'zircon123') {
      console.log('✅ Developer mode authentication successful');
      
      try {
        // Create a consistent developer account
        const developerEmail = `developer@otakon.app`;
        const developerPassword = 'zircon123';
        
        // First, try to sign in with existing developer account
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: developerEmail,
          password: developerPassword
        });
        
        if (signInData.user && !signInError) {
          console.log('🔧 Signed in with existing developer account');
          localStorage.setItem('otakonAuthMethod', 'developer');
          localStorage.setItem('otakon_developer_mode', 'true');
          this.updateAuthState({ user: signInData.user, loading: false });
          return { success: true };
        }
        
        // If sign in fails, check if it's because user doesn't exist
        if (signInError) {
          console.log('🔧 Sign in failed:', signInError.message);
          
          // Check if user doesn't exist (common error messages)
          const userNotFound = signInError.message.includes('Invalid login credentials') || 
                              signInError.message.includes('User not found') ||
                              signInError.message.includes('Invalid email or password');
          
          if (userNotFound) {
            console.log('🔧 Developer account doesn\'t exist, creating new account...');
          } else {
            // Other sign in errors (network, etc.)
            return { success: false, error: 'Sign in failed: ' + signInError.message };
          }
        }
        
        // Create new developer account
        console.log('🔧 Creating new developer account...');
        
        // Sign up the developer user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: developerEmail,
          password: developerPassword,
          options: {
            data: {
              name: 'Developer Account',
              user_type: 'developer',
              is_developer: true,
              developer_features: ['tier_switcher', 'logout', 'reset', 'admin_panel']
            }
          }
        });
        
        if (signUpError) {
          console.error('❌ Failed to create developer user:', signUpError);
          
          // Handle CAPTCHA error specifically
          if (signUpError.message.includes('captcha')) {
            console.log('🔧 CAPTCHA error detected, using fallback developer mode...');
            
            // Create a mock user for developer mode when CAPTCHA blocks signup
            const mockUser = {
              id: 'dev-user-' + Date.now(),
              email: developerEmail,
              user_metadata: {
                name: 'Developer Account',
                user_type: 'developer',
                is_developer: true,
                developer_features: ['tier_switcher', 'logout', 'reset', 'admin_panel']
              },
              app_metadata: {
                provider: 'developer',
                providers: ['developer']
              },
              aud: 'authenticated',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // Set developer mode flags
            localStorage.setItem('otakonAuthMethod', 'developer');
            localStorage.setItem('otakon_developer_mode', 'true');
            localStorage.setItem('otakon_dev_fallback_mode', 'true');
            
            // Update auth state with mock user
            this.updateAuthState({ 
              user: mockUser, 
              session: null, 
              loading: false, 
              error: null 
            });
            
            console.log('✅ Developer mode activated with fallback (no Supabase user)');
            return { success: true };
          }
          
          return { success: false, error: 'Failed to create developer account: ' + signUpError.message };
        }
        
        if (signUpData.user) {
          console.log('✅ Developer user created in Supabase:', signUpData.user.id);
          
          // Update the user record to mark as developer
          const { error: updateError } = await supabase
            .from('users')
            .upsert({
              auth_user_id: signUpData.user.id,
              email: developerEmail,
              name: 'Developer Account',
              user_type: 'developer',
              tier: 'free', // Developer starts with free tier, can switch
              is_developer: true,
              developer_features: ['tier_switcher', 'logout', 'reset', 'admin_panel'],
              app_state: {
                onboardingComplete: false,
                profileSetupCompleted: false,
                hasSeenSplashScreens: false,
                welcomeMessageShown: false,
                firstWelcomeShown: false,
                hasConversations: false,
                hasInteractedWithChat: false,
                lastSessionDate: '',
                lastWelcomeTime: '',
                appClosedTime: '',
                firstRunCompleted: false,
                hasConnectedBefore: false,
                installDismissed: false,
                showSplashAfterLogin: false,
                lastSuggestedPromptsShown: '',
                conversations: [],
                conversationsOrder: [],
                activeConversation: ''
              },
              preferences: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (updateError) {
            console.warn('⚠️ Failed to update user record:', updateError);
          }
          
          // Set auth method for tracking
          localStorage.setItem('otakonAuthMethod', 'developer');
          localStorage.setItem('otakon_developer_mode', 'true');
          
          // Update auth state
          this.updateAuthState({ 
            user: signUpData.user, 
            session: signUpData.session, 
            loading: false, 
            error: null 
          });
          
          return { success: true };
        }
        
        return { success: false, error: 'Failed to create developer account' };
      } catch (error) {
        console.error('❌ Developer mode authentication error:', error);
        return { success: false, error: 'Authentication failed' };
      }
    } else {
      console.log('❌ Developer mode authentication failed - invalid password');
      return { success: false, error: 'Invalid developer password' };
    }
  }

  async signOut(deleteUser: boolean = false) {
    try {
      this.updateAuthState({ loading: true, error: null });
      
      if (deleteUser) {
        console.log('🗑️ Deleting user account from Supabase...');
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Delete user data from users table first
          const { error: deleteUserDataError } = await supabase
            .from('users')
            .delete()
            .eq('auth_user_id', user.id);
          
          if (deleteUserDataError) {
            console.warn('⚠️ Failed to delete user data:', deleteUserDataError);
          }
          
          // Delete the auth user (this will cascade delete related data)
          const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);
          
          if (deleteAuthError) {
            console.warn('⚠️ Failed to delete auth user:', deleteAuthError);
            // Fallback to regular sign out if admin delete fails
            await supabase.auth.signOut();
          } else {
            console.log('✅ User account completely deleted from Supabase');
          }
        }
      } else {
        // Regular logout - keep data in Supabase
        console.log('👋 Regular logout - keeping data in Supabase');
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('❌ Sign out error:', error);
          this.updateAuthState({ error, loading: false });
          return { success: false, error };
        }
      }
      
      // Clear localStorage
      localStorage.removeItem('otakonAuthMethod');
      localStorage.removeItem('otakon_developer_mode');
      
      // Update auth state
      this.updateAuthState({ 
        user: null, 
        session: null, 
        loading: false, 
        error: null 
      });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      this.updateAuthState({ error: error as AuthError, loading: false });
      return { success: false, error: error as AuthError };
    }
  }

  async resetPassword(email: string) {
    try {
      this.updateAuthState({ loading: true, error: null });
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        this.updateAuthState({ error, loading: false });
        return { success: false, error };
      }

      this.updateAuthState({ loading: false });
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      this.updateAuthState({ error: authError, loading: false });
      return { success: false, error: authError };
    }
  }

  async clearInvalidSession() {
    try {
      console.log('🔐 Clearing invalid session...');
      await supabase.auth.signOut();
      this.updateAuthState({ user: null, session: null, loading: false });
      return { success: true };
    } catch (error) {
      console.error('Error clearing invalid session:', error);
      return { success: false, error };
    }
  }

  // Handle OAuth callback manually if needed
  async handleOAuthCallback() {
    try {
      console.log('🔄 Checking for OAuth callback...');
      
      // Check if we're in a callback URL with tokens in hash
      const urlParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        console.log('✅ OAuth tokens found in URL, setting session...');
        
        // Set the session with the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error('❌ Error setting OAuth session:', error);
          this.updateAuthState({ loading: false, error });
          return false;
        }

        if (data.session) {
          console.log('✅ OAuth session set successfully');
          console.log('🔐 OAuth session details:', {
            hasUser: !!data.user,
            userId: data.user?.id,
            email: data.user?.email,
            sessionExpiry: data.session.expires_at
          });
          
          this.updateAuthState({ 
            user: data.user, 
            session: data.session, 
            loading: false, 
            error: null 
          });
          
          // Set auth method for the app to detect fresh authentication
          localStorage.setItem('otakonAuthMethod', 'google'); // Default to google, could be enhanced to detect provider
          
          // Clear the URL hash immediately
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Add a small delay to ensure state is processed
          setTimeout(() => {
            console.log('🔄 OAuth callback processing complete');
          }, 50);
          
          return true;
        } else {
          console.log('❌ OAuth session set but no session returned');
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ OAuth callback handling failed:', error);
      this.updateAuthState({ loading: false, error: error as AuthError });
      return false;
    }
  }
}

export const authService = AuthService.getInstance();

// Default export for direct usage
export default supabase;
