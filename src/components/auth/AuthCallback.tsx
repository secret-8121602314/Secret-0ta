import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { authService } from '../../services/authService';

interface AuthCallbackProps {
  onAuthSuccess: () => void;
  onAuthError: (error: string) => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ onAuthSuccess, onAuthError }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const hasProcessedRef = useRef(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  useEffect(() => {
    // Prevent multiple processing using ref (more reliable than state)
    if (hasProcessedRef.current) {
      console.log('🔐 [AuthCallback] Already processed, skipping...');
      return;
    }
    
    hasProcessedRef.current = true;
    
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 [AuthCallback] Handling OAuth callback...');
        console.log('🔐 [AuthCallback] Current URL:', window.location.href);
        console.log('🔐 [AuthCallback] URL search params:', window.location.search);
        console.log('🔐 [AuthCallback] URL hash:', window.location.hash);

        // 🛡️ SESSION PROTECTION: Check if already logged in before processing OAuth
        const existingSession = await supabase.auth.getSession();
        const hasOAuthCode = window.location.search.includes('code') || window.location.hash.includes('access_token');
        
        if (existingSession.data.session && !hasOAuthCode) {
          console.log('🔐 [AuthCallback] Already logged in, skipping OAuth processing:', existingSession.data.session.user.email);
          setStatus('success');
          onAuthSuccess();
          return;
        }
        
        // If we have an existing session AND OAuth code, user is trying to login again
        if (existingSession.data.session && hasOAuthCode) {
          console.warn('⚠️ [AuthCallback] Session conflict detected: already logged in but new OAuth detected');
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            console.log('🔐 [AuthCallback] Preserving existing session, clearing OAuth URL');
            const basePath = window.location.hostname === 'localhost' ? '/' : '/Otagon/';
            window.history.replaceState({}, document.title, basePath);
            setStatus('success');
            onAuthSuccess();
            return;
          }
        }

        // Check for OAuth errors in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const oauthError = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        const errorCode = urlParams.get('error_code') || hashParams.get('error_code');
        
        console.log('🔐 [AuthCallback] OAuth parameters:', {
          oauthError,
          errorDescription,
          errorCode,
          urlParams: Object.fromEntries(urlParams.entries()),
          hashParams: Object.fromEntries(hashParams.entries())
        });
        
        if (oauthError) {
          console.error('🔐 [AuthCallback] OAuth error detected:', { oauthError, errorDescription, errorCode });
          let errorMessage = 'Authentication failed';
          
          // Handle email confirmation errors
          if (oauthError === 'access_denied' && errorCode === 'otp_expired') {
            errorMessage = 'Email confirmation link has expired. Please request a new confirmation email.';
          } else if (oauthError === 'access_denied' && errorDescription?.includes('Email link is invalid')) {
            errorMessage = 'Email confirmation link is invalid. Please request a new confirmation email.';
          } else if (oauthError === 'access_denied' && errorDescription?.includes('expired')) {
            errorMessage = 'Email confirmation link has expired. Please request a new confirmation email.';
          }
          // Handle OAuth errors
          else if (oauthError === 'server_error') {
            errorMessage = 'Authentication server error. This may be due to Supabase configuration. Please try again.';
          } else if (oauthError === 'access_denied') {
            errorMessage = 'Authentication was cancelled. Please try again.';
          } else if (oauthError === 'invalid_request') {
            errorMessage = 'Invalid authentication request. Please check configuration.';
          } else if (oauthError === 'unauthorized_client') {
            errorMessage = 'Authentication client is not authorized. Please check Supabase configuration.';
          } else if (oauthError === 'unsupported_response_type') {
            errorMessage = 'Authentication response type not supported. Please check Supabase configuration.';
          } else if (oauthError === 'invalid_scope') {
            errorMessage = 'Authentication scope is invalid. Please check Supabase configuration.';
          } else if (errorDescription) {
            errorMessage = decodeURIComponent(errorDescription);
          }
          
          setError(errorMessage);
          setStatus('error');
          onAuthError(errorMessage);
          return;
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔐 [AuthCallback] Auth state change:', { event, session });
          
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('🔐 [AuthCallback] User signed in:', session.user.email);
            console.log('🔐 [AuthCallback] User metadata:', session.user.user_metadata);
            console.log('🔐 [AuthCallback] App metadata:', session.user.app_metadata);
            console.log('🔐 [AuthCallback] User identities:', session.user.identities);
            
            // Detect the OAuth provider
            const provider = session.user.app_metadata?.provider || 
                           session.user.app_metadata?.providers?.[0] || 
                           session.user.identities?.[0]?.provider || 
                           'unknown';
            console.log('🔐 [AuthCallback] Detected provider:', provider);
            
            // Wait for database trigger to create user record
            console.log('🔐 [AuthCallback] Waiting for database trigger to create user record...');
            await new Promise(resolve => setTimeout(resolve, 1500)); // Increased wait time for Discord
            
            // Load user data through AuthService
            try {
              await authService.loadUserFromSupabase(session.user.id);
              console.log('🔐 [AuthCallback] User data loaded successfully');
              
              // User is authenticated, notify parent component
              setStatus('success');
              onAuthSuccess();
            } catch (loadError) {
              console.error('🔐 [AuthCallback] Error loading user data:', loadError);
              setError('Failed to load user data. Please try again.');
              setStatus('error');
              onAuthError('Failed to load user data');
            }
            
            // Unsubscribe from auth state changes
            subscription.unsubscribe();
          } else if (event === 'SIGNED_OUT') {
            console.log('🔐 [AuthCallback] User signed out');
            setError('Authentication failed');
            setStatus('error');
            onAuthError('Authentication failed');
            subscription.unsubscribe();
          }
        });
        
        // Store subscription in ref for cleanup
        subscriptionRef.current = subscription;
        
        // Also try to get the current session
        const { data, error } = await supabase.auth.getSession();
        console.log('🔐 [AuthCallback] Current session:', { data, error });
        
        if (error) {
          console.error('🔐 [AuthCallback] Auth callback error:', error);
          setError(error.message);
          setStatus('error');
          onAuthError(error.message);
          subscription.unsubscribe();
          return;
        }

        if (data.session?.user) {
          console.log('🔐 [AuthCallback] User already authenticated:', data.session.user.email);
          
          // Wait for database trigger to create user record
          console.log('🔐 [AuthCallback] Waiting for database trigger to create user record...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Load user data through AuthService
          await authService.loadUserFromSupabase(data.session.user.id);
          
          // User is authenticated, notify parent component
          setStatus('success');
          onAuthSuccess();
          subscription.unsubscribe();
        } else {
          console.log('🔐 [AuthCallback] No session found, waiting for auth state change...');
          console.log('🔐 [AuthCallback] URL search params:', window.location.search);
          
          // Try to handle OAuth callback manually if there are URL parameters
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          
          if (urlParams.has('code') || urlParams.has('error') || hashParams.has('access_token')) {
            console.log('🔐 [AuthCallback] OAuth parameters found, trying manual handling...');
            
            // Wait a bit for the OAuth process to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try to get session again
            const retrySession = await supabase.auth.getSession();
            console.log('🔐 [AuthCallback] Retry session after manual handling:', retrySession);
            
            if (retrySession.data.session?.user) {
              console.log('🔐 [AuthCallback] User authenticated after retry:', retrySession.data.session.user.email);
              
              // Wait for database trigger to create user record
              console.log('🔐 [AuthCallback] Waiting for database trigger to create user record...');
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Load user data through AuthService
              await authService.loadUserFromSupabase(retrySession.data.session.user.id);
              
              // User is authenticated, notify parent component
              setStatus('success');
              onAuthSuccess();
              subscription.unsubscribe();
              return;
            }
          }
          
          // Set a timeout to handle cases where auth state change doesn't fire
          setTimeout(() => {
            if (status === 'loading') {
              console.log('🔐 [AuthCallback] Timeout waiting for auth state change');
              setError('Authentication timeout');
              setStatus('error');
              onAuthError('Authentication timeout');
              subscription.unsubscribe();
            }
          }, 10000); // 10 second timeout
        }
      } catch (error) {
        console.error('🔐 [AuthCallback] Auth callback error:', error);
        const errorMessage = 'An unexpected error occurred';
        setError(errorMessage);
        setStatus('error');
        onAuthError(errorMessage);
      }
    };

    handleAuthCallback();
    
    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  if (status === 'loading') {
    return (
      <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D4D] mx-auto mb-4"></div>
          <p className="text-[#CFCFCF] text-lg">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Authentication Error</h2>
          <p className="text-[#CFCFCF] mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                // Clear the URL parameters and redirect to login
                const basePath = window.location.hostname === 'localhost' ? '/' : '/Otagon/';
                window.history.replaceState({}, document.title, basePath);
                onAuthError('User cancelled authentication');
              }}
              className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Return to Login
            </button>
            {error && error.includes('Email confirmation link') && (
              <button
                onClick={() => {
                  // Clear the URL parameters and redirect to login with a flag to show resend option
                  const basePath = window.location.hostname === 'localhost' ? '/' : '/Otagon/';
                  window.history.replaceState({}, document.title, basePath);
                  onAuthError('Email confirmation expired - show resend option');
                }}
                className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Request New Confirmation Email
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] flex items-center justify-center">
      <div className="text-center">
        <div className="text-green-500 text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Authentication Successful</h2>
        <p className="text-[#CFCFCF]">Redirecting to the app...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
