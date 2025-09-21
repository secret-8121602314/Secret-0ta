import { supabase } from './supabase';
import { AuthError, User, Session } from '@supabase/supabase-js';

// ========================================
// 🚀 FIXED AUTHENTICATION SERVICE
// ========================================
// This fixes all authentication issues with:
// - Simplified state management
// - Robust error handling
// - Secure developer mode
// - Comprehensive logging

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export interface AuthService {
  getAuthState(): AuthState;
  getCurrentUserId(): string | null;
  subscribe(callback: (state: AuthState) => void): () => void;
  signInWithGoogle(): Promise<{ success: boolean; error?: string }>;
  signInWithDiscord(): Promise<{ success: boolean; error?: string }>;
  signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }>;
  signUp(email: string, password: string): Promise<{ success: boolean; error?: string }>;
  signInWithDeveloperMode(password: string): Promise<{ success: boolean; error?: string }>;
  signOut(): Promise<{ success: boolean; error?: string }>;
  handleOAuthCallback(): Promise<boolean>;
}

class FixedAuthService implements AuthService {
  private static instance: FixedAuthService;
  private authState: AuthState = {
    user: null,
    session: null,
    loading: true,
    error: null
  };
  private subscribers: Set<(state: AuthState) => void> = new Set();
  private isInitialized = false;

  // Secure developer mode configuration
  private readonly DEV_PASSWORDS = [
    'zircon123',
    'otakon-dev-2024',
    'dev-mode-secure'
  ];
  private readonly MAX_DEV_ATTEMPTS = 3;
  private readonly DEV_SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private devAttempts = 0;
  private devSessionStart: number | null = null;

  static getInstance(): FixedAuthService {
    if (!FixedAuthService.instance) {
      FixedAuthService.instance = new FixedAuthService();
    }
    return FixedAuthService.instance;
  }

  constructor() {
    this.initializeAuth();
  }

  private log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`🔐 [${timestamp}] ${message}`, data || '');
    
    // Send to analytics/monitoring service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'auth_log', {
        event_category: 'authentication',
        event_label: message,
        value: 1
      });
    }
  }

  private error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`🔐 [${timestamp}] ERROR: ${message}`, error || '');
    
    // Send to error reporting service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'auth_error', {
        event_category: 'authentication',
        event_label: message,
        value: 1
      });
    }
  }

  private updateAuthState(newState: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...newState };
    this.subscribers.forEach(callback => {
      try {
        callback(this.authState);
      } catch (error) {
        this.error('Subscriber callback error', error);
      }
    });
  }

  private async initializeAuth(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.log('Initializing authentication service...');
      
      // Check for existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.error('Failed to get initial session', error);
        this.updateAuthState({ error, loading: false });
        return;
      }

      // Validate session if exists
      if (session?.user) {
        this.log('Validating existing session...');
        const isValid = await this.validateSession(session);
        
        if (isValid) {
          this.log('Session validated successfully');
          this.updateAuthState({ 
            user: session.user, 
            session, 
            loading: false 
          });
        } else {
          this.log('Session validation failed, clearing session');
          await this.clearInvalidSession();
        }
      } else {
        this.log('No existing session found');
        this.updateAuthState({ 
          user: null, 
          session: null, 
          loading: false 
        });
      }

      // Set up auth state change listener
      this.setupAuthStateListener();
      
      this.isInitialized = true;
      this.log('Authentication service initialized successfully');
      
    } catch (error) {
      this.error('Failed to initialize authentication service', error);
      this.updateAuthState({ 
        error: error as AuthError, 
        loading: false 
      });
    }
  }

  private async validateSession(session: Session): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return !error && !!user;
    } catch (error) {
      this.error('Session validation error', error);
      return false;
    }
  }

  private async clearInvalidSession(): Promise<void> {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      this.updateAuthState({ 
        user: null, 
        session: null, 
        loading: false 
      });
    } catch (error) {
      this.error('Failed to clear invalid session', error);
    }
  }

  private setupAuthStateListener(): void {
    supabase.auth.onAuthStateChange(async (event, session) => {
      this.log(`Auth state change: ${event}`, { 
        hasSession: !!session, 
        hasUser: !!session?.user 
      });

      try {
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              this.log('User signed in successfully', { userId: session.user.id });
              await this.handleUserSignIn(session.user);
            }
            break;
            
          case 'SIGNED_OUT':
            this.log('User signed out');
            this.updateAuthState({ 
              user: null, 
              session: null, 
              loading: false 
            });
            break;
            
          case 'TOKEN_REFRESHED':
            this.log('Token refreshed successfully');
            break;
            
          case 'USER_UPDATED':
            this.log('User updated');
            break;
            
          case 'PASSWORD_RECOVERY':
            this.log('Password recovery initiated');
            break;
        }

        this.updateAuthState({ 
          user: session?.user ?? null, 
          session, 
          loading: false 
        });

      } catch (error) {
        this.error('Auth state change handler error', error);
        this.updateAuthState({ 
          error: error as AuthError, 
          loading: false 
        });
      }
    });
  }

  private async handleUserSignIn(user: User): Promise<void> {
    try {
      // Assign free tier to new users
      this.log('Assigning free tier to new user...');
      const { tierService } = await import('./tierService');
      await tierService.assignFreeTier(user.id);
      this.log('Free tier assigned successfully');
      
    } catch (error) {
      this.error('Failed to assign free tier', error);
      // Don't throw - this shouldn't block the sign-in process
    }
  }

  // Public API methods
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  getCurrentUserId(): string | null {
    return this.authState.user?.id || null;
  }

  subscribe(callback: (state: AuthState) => void): () => void {
    this.subscribers.add(callback);
    
    // Call immediately with current state
    try {
      callback(this.authState);
    } catch (error) {
      this.error('Initial subscriber callback error', error);
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      this.log('Initiating Google OAuth...');
      this.updateAuthState({ loading: true, error: null });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        this.error('Google OAuth error', error);
        this.updateAuthState({ loading: false, error });
        return { success: false, error: error.message };
      }

      this.log('Google OAuth initiated successfully');
      return { success: true };
      
    } catch (error) {
      this.error('Google OAuth exception', error);
      this.updateAuthState({ loading: false, error: error as AuthError });
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signInWithDiscord(): Promise<{ success: boolean; error?: string }> {
    try {
      this.log('Initiating Discord OAuth...');
      this.updateAuthState({ loading: true, error: null });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        this.error('Discord OAuth error', error);
        this.updateAuthState({ loading: false, error });
        return { success: false, error: error.message };
      }

      this.log('Discord OAuth initiated successfully');
      return { success: true };
      
    } catch (error) {
      this.error('Discord OAuth exception', error);
      this.updateAuthState({ loading: false, error: error as AuthError });
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.log('Signing in with email...');
      this.updateAuthState({ loading: true, error: null });
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.error('Email sign-in error', error);
        this.updateAuthState({ loading: false, error });
        return { success: false, error: error.message };
      }

      this.log('Email sign-in successful');
      return { success: true };
      
    } catch (error) {
      this.error('Email sign-in exception', error);
      this.updateAuthState({ loading: false, error: error as AuthError });
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.log('Signing up with email...');
      this.updateAuthState({ loading: true, error: null });
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        this.error('Email sign-up error', error);
        this.updateAuthState({ loading: false, error });
        return { success: false, error: error.message };
      }

      this.log('Email sign-up successful');
      return { success: true };
      
    } catch (error) {
      this.error('Email sign-up exception', error);
      this.updateAuthState({ loading: false, error: error as AuthError });
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signInWithDeveloperMode(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.log('Attempting developer mode authentication...');
      
      // Check if too many attempts
      if (this.devAttempts >= this.MAX_DEV_ATTEMPTS) {
        this.error('Too many developer mode attempts');
        return { success: false, error: 'Too many failed attempts. Please try again later.' };
      }

      // Check if password is valid
      if (!this.DEV_PASSWORDS.includes(password)) {
        this.devAttempts++;
        this.error(`Invalid developer password (attempt ${this.devAttempts}/${this.MAX_DEV_ATTEMPTS})`);
        return { success: false, error: 'Invalid developer password' };
      }

      // Check if session is still valid
      if (this.devSessionStart && Date.now() - this.devSessionStart > this.DEV_SESSION_TIMEOUT) {
        this.log('Developer session expired, resetting');
        this.devSessionStart = null;
        this.devAttempts = 0;
      }

      this.log('Developer mode authentication successful');
      this.devAttempts = 0;
      this.devSessionStart = Date.now();
      
      // Create mock user for developer mode
      const mockUser: User = {
        id: 'dev-user-' + Date.now(),
        email: 'developer@otakon.app',
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
      localStorage.setItem('otakon_dev_session_start', this.devSessionStart.toString());

      // Initialize developer mode data
      await this.initializeDeveloperModeData();

      // Update auth state
      this.updateAuthState({ 
        user: mockUser, 
        session: null, 
        loading: false, 
        error: null 
      });

      this.log('Developer mode initialized successfully');
      return { success: true };
      
    } catch (error) {
      this.error('Developer mode authentication error', error);
      return { success: false, error: 'Developer mode initialization failed' };
    }
  }

  private async initializeDeveloperModeData(): Promise<void> {
    try {
      const developerData = {
        profile_data: {
          hint_style: 'balanced',
          player_focus: 'story',
          preferred_tone: 'friendly',
          spoiler_tolerance: 'low',
          is_first_time: true,
          created_at: Date.now(),
          last_updated: Date.now()
        },
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: true,
          auto_save: true,
          developer_mode: true
        },
        usage_data: {
          textCount: 0,
          imageCount: 0,
          totalRequests: 0,
          lastReset: Date.now()
        },
        app_state: {
          onboardingComplete: true,
          profileSetupCompleted: true,
          hasSeenSplashScreens: true,
          welcomeMessageShown: false,
          firstWelcomeShown: false,
          hasConversations: false,
          hasInteractedWithChat: false,
          lastSessionDate: new Date().toISOString(),
          lastWelcomeTime: '',
          appClosedTime: '',
          firstRunCompleted: true,
          hasConnectedBefore: false,
          installDismissed: false,
          showSplashAfterLogin: false,
          lastSuggestedPromptsShown: '',
          conversations: [],
          conversationsOrder: [],
          activeConversation: ''
        },
        behavior_data: {
          sessionCount: 1,
          totalTimeSpent: 0,
          lastActivity: Date.now(),
          featureUsage: {}
        },
        feedback_data: {
          ratings: [],
          suggestions: [],
          bugReports: []
        },
        onboarding_data: {
          stepsCompleted: ['initial', 'profile_setup', 'complete'],
          currentStep: 'complete',
          completedAt: Date.now()
        }
      };

      // Store in localStorage with proper structure
      Object.entries(developerData).forEach(([key, value]) => {
        localStorage.setItem(`otakon_dev_${key}`, JSON.stringify(value));
      });

      this.log('Developer mode data initialized');
      
    } catch (error) {
      this.error('Failed to initialize developer mode data', error);
      throw error;
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      this.log('Signing out...');
      this.updateAuthState({ loading: true, error: null });

      // Clear developer mode if active
      if (localStorage.getItem('otakonAuthMethod') === 'developer') {
        this.log('Clearing developer mode...');
        localStorage.removeItem('otakonAuthMethod');
        localStorage.removeItem('otakon_developer_mode');
        localStorage.removeItem('otakon_dev_session_start');
        
        // Clear developer mode data
        const keys = Object.keys(localStorage).filter(key => key.startsWith('otakon_dev_'));
        keys.forEach(key => localStorage.removeItem(key));
        
        this.devSessionStart = null;
        this.devAttempts = 0;
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'local' });

      if (error) {
        this.error('Sign out error', error);
        this.updateAuthState({ loading: false, error });
        return { success: false, error: error.message };
      }

      this.log('Sign out successful');
      this.updateAuthState({ 
        user: null, 
        session: null, 
        loading: false 
      });

      return { success: true };
      
    } catch (error) {
      this.error('Sign out exception', error);
      this.updateAuthState({ loading: false, error: error as AuthError });
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async handleOAuthCallback(): Promise<boolean> {
    try {
      this.log('Handling OAuth callback...');
      
      // Check if we're in an OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const hasOAuthParams = urlParams.has('code') || urlParams.has('error') || 
                           hashParams.has('access_token') || hashParams.has('error');
      
      if (!hasOAuthParams) {
        this.log('No OAuth parameters found');
        return false;
      }

      this.log('OAuth parameters detected, processing...');
      
      // Let Supabase handle the callback
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        this.error('OAuth callback error', error);
        return false;
      }

      if (data.session) {
        this.log('OAuth callback successful', { userId: data.session.user.id });
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        return true;
      }

      this.log('OAuth callback completed but no session found');
      return false;
      
    } catch (error) {
      this.error('OAuth callback exception', error);
      return false;
    }
  }
}

// Export singleton instance
export const fixedAuthService = FixedAuthService.getInstance();

// Export types
// Export conflicts resolved - types exported from main service files
