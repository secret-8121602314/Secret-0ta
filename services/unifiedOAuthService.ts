// ========================================
// 🔐 UNIFIED OAUTH CALLBACK SERVICE
// ========================================
// Centralized OAuth callback handling to prevent race conditions
// and ensure consistent behavior across all authentication flows

import { supabase } from './supabase';
import { authService } from './supabase';

export interface OAuthCallbackResult {
  success: boolean;
  error?: string;
  user?: any;
  session?: any;
}

export interface OAuthCallbackOptions {
  onSuccess?: (user: any, session: any) => void;
  onError?: (error: string) => void;
  redirectToSplash?: boolean;
}

class UnifiedOAuthService {
  private static instance: UnifiedOAuthService;
  private isProcessingCallback = false;
  private callbackQueue: Array<() => Promise<void>> = [];

  private constructor() {}

  static getInstance(): UnifiedOAuthService {
    if (!UnifiedOAuthService.instance) {
      UnifiedOAuthService.instance = new UnifiedOAuthService();
    }
    return UnifiedOAuthService.instance;
  }

  /**
   * Main OAuth callback handler - called only once per app load
   * Prevents race conditions by queuing multiple calls
   */
  async handleOAuthCallback(options: OAuthCallbackOptions = {}): Promise<OAuthCallbackResult> {
    // If already processing, queue this call
    if (this.isProcessingCallback) {
      return new Promise((resolve) => {
        this.callbackQueue.push(async () => {
          const result = await this.processOAuthCallback(options);
          resolve(result);
        });
      });
    }

    return this.processOAuthCallback(options);
  }

  private async processOAuthCallback(options: OAuthCallbackOptions): Promise<OAuthCallbackResult> {
    this.isProcessingCallback = true;
    
    try {
      console.log('🔐 [UnifiedOAuth] Processing OAuth callback...');
      
      // Check if we're in an OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const hasOAuthParams = urlParams.has('code') || urlParams.has('error') || 
                           hashParams.has('access_token') || hashParams.has('error');
      
      if (!hasOAuthParams) {
        console.log('🔐 [UnifiedOAuth] No OAuth parameters found');
        return { success: false, error: 'No OAuth parameters found' };
      }

      console.log('🔐 [UnifiedOAuth] OAuth parameters detected, processing...');
      
      // Wait for Supabase to process the OAuth response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('🔐 [UnifiedOAuth] Session error:', error);
        this.cleanupOAuthParams();
        
        if (options.onError) {
          options.onError(error.message);
        }
        
        return { success: false, error: error.message };
      }

      if (session?.user) {
        console.log('🔐 [UnifiedOAuth] OAuth callback successful', { userId: session.user.id });
        
        // Clean up URL parameters
        this.cleanupOAuthParams();
        
        // Call success callback
        if (options.onSuccess) {
          options.onSuccess(session.user, session);
        }
        
        return { 
          success: true, 
          user: session.user, 
          session 
        };
      }

      // Check if we're in the middle of an OAuth flow
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('🔐 [UnifiedOAuth] User error:', userError);
        this.cleanupOAuthParams();
        
        const errorMessage = 'Authentication failed. Please try again.';
        if (options.onError) {
          options.onError(errorMessage);
        }
        
        return { success: false, error: errorMessage };
      }

      if (user) {
        console.log('🔐 [UnifiedOAuth] User authenticated:', user);
        this.cleanupOAuthParams();
        
        if (options.onSuccess) {
          options.onSuccess(user, null);
        }
        
        return { 
          success: true, 
          user 
        };
      }

      // Try to get the OAuth error from URL parameters
      const oauthError = urlParams.get('error') || hashParams.get('error');
      if (oauthError) {
        console.error('🔐 [UnifiedOAuth] OAuth error from URL:', oauthError);
        this.cleanupOAuthParams();
        
        const errorMessage = `OAuth error: ${oauthError}`;
        if (options.onError) {
          options.onError(errorMessage);
        }
        
        return { success: false, error: errorMessage };
      }

      // No session or user found
      const errorMessage = 'No authentication session found. Please try signing in again.';
      this.cleanupOAuthParams();
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      return { success: false, error: errorMessage };
      
    } catch (error) {
      console.error('🔐 [UnifiedOAuth] Unexpected error during OAuth callback:', error);
      this.cleanupOAuthParams();
      
      const errorMessage = 'An unexpected error occurred during authentication.';
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      return { success: false, error: errorMessage };
    } finally {
      this.isProcessingCallback = false;
      
      // Process queued callbacks
      if (this.callbackQueue.length > 0) {
        const nextCallback = this.callbackQueue.shift();
        if (nextCallback) {
          nextCallback();
        }
      }
    }
  }

  private cleanupOAuthParams(): void {
    try {
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('🔐 [UnifiedOAuth] OAuth parameters cleaned from URL');
    } catch (error) {
      console.warn('🔐 [UnifiedOAuth] Failed to clean URL parameters:', error);
    }
  }

  /**
   * Check if we're currently in an OAuth callback
   */
  isOAuthCallback(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    return urlParams.has('code') || urlParams.has('error') || 
           hashParams.has('access_token') || hashParams.has('error');
  }

  /**
   * Reset the callback processing state (for testing)
   */
  reset(): void {
    this.isProcessingCallback = false;
    this.callbackQueue = [];
  }
}

// Export singleton instance
export const unifiedOAuthService = UnifiedOAuthService.getInstance();
