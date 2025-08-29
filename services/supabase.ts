import { createClient } from '@supabase/supabase-js';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { tierService } from './tierService';
import { LocalStorageReplacer } from './silentMigrationService';

// Environment variables for Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Initialize silent migration service
export const localStorageReplacer = new LocalStorageReplacer(supabase);

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
    loading: true,
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
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.updateAuthState({ error, loading: false });
        return;
      }

      this.updateAuthState({ 
        user: session?.user ?? null, 
        session, 
        loading: false 
      });

      // If user already has a session, start migration
      if (session?.user) {
        console.log('Existing session found, checking if migration is needed...');
        // The migration service will automatically check and migrate if needed
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        this.updateAuthState({ 
          user: session?.user ?? null, 
          session, 
          loading: false 
        });

        // Automatically assign free tier to new users
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            await tierService.assignFreeTier(session.user.id);
            
            // Start silent migration of localStorage data to Supabase
            console.log('Starting silent migration of localStorage data...');
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
    this.authState = { ...this.authState, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
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
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        this.updateAuthState({ error, loading: false });
        return { success: false, error };
      }

      // For OAuth, we don't need to wait for the redirect
      // The user will be redirected to the callback URL
      return { success: true, data };
    } catch (error) {
      const authError = error as AuthError;
      this.updateAuthState({ error: authError, loading: false });
      return { success: false, error: authError };
    }
  }

  async signInWithDiscord() {
    try {
      this.updateAuthState({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
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

  async signOut() {
    try {
      this.updateAuthState({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        this.updateAuthState({ error, loading: false });
        return { success: false, error };
      }

      this.updateAuthState({ user: null, session: null, loading: false });
      return { success: true };
    } catch (error) {
      const authError = error as AuthError;
      this.updateAuthState({ error: authError, loading: false });
      return { success: false, error: authError };
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
}

export const authService = AuthService.getInstance();

// Default export for direct usage
export default supabase;
