import { useEffect, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isPWAMode } from '../utils/pwaDetection';
import { authService } from '../services/authService';

const PWA_BACKGROUND_THRESHOLD = 30000; // 30 seconds

// Track when app went to background
let appVisibilityTimestamp = Date.now();

interface PWALifecycleProviderProps {
  children: ReactNode;
}

/**
 * PWA Lifecycle Provider
 * Handles PWA-specific lifecycle events like:
 * - Visibility changes (app coming back from background)
 * - Page restoration from bfcache
 * - Just logged out flag detection
 * - Black screen prevention
 */
export function PWALifecycleProvider({ children }: PWALifecycleProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleVisibilityChange = useCallback(async () => {
    if (document.visibilityState === 'visible') {
      const backgroundDuration = Date.now() - appVisibilityTimestamp;
      console.log('📱 [PWA-Router] App became visible, background duration:', backgroundDuration, 'ms');

      // ✅ PWA BLACK SCREEN FIX: Force DOM repaint on visibility change
      // This prevents black screen when app is opened after being completely closed
      if (isPWAMode()) {
        console.log('📱 [PWA-Router] Forcing DOM repaint to prevent black screen');
        document.body.style.display = 'none';
        void document.body.offsetHeight; // Force reflow
        document.body.style.display = '';
      }

      // ✅ PWA CRITICAL FIX: Check if we just logged out
      const justLoggedOut = localStorage.getItem('otakon_just_logged_out');
      if (justLoggedOut) {
        const logoutTimestamp = parseInt(justLoggedOut);
        const timeSinceLogout = Date.now() - logoutTimestamp;
        
        // Only process recent logouts (< 5 seconds)
        if (timeSinceLogout < 5000) {
          console.log('📱 [PWA-Router] Recent logout detected on visibility change, clearing and showing login');
          localStorage.removeItem('otakon_just_logged_out');
          localStorage.removeItem('otakon_logout_instance');
          navigate('/earlyaccess', { replace: true });
          return;
        } else {
          // Clean up stale flag
          console.log('📱 [PWA-Router] Stale logout flag on visibility change, cleaning up');
          localStorage.removeItem('otakon_just_logged_out');
          localStorage.removeItem('otakon_logout_instance');
        }
      }

      // Only check auth if app was in background for more than threshold
      if (isPWAMode() && backgroundDuration > PWA_BACKGROUND_THRESHOLD) {
        console.log('📱 [PWA-Router] Long background detected, validating session...');

        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('📱 [PWA-Router] Session check error:', error);
            navigate('/earlyaccess', { replace: true });
            return;
          }

          if (!session) {
            console.log('📱 [PWA-Router] No session found after background, showing login');
            navigate('/earlyaccess', { replace: true });
          } else {
            console.log('📱 [PWA-Router] Session valid, refreshing user data');
            // Refresh user data to ensure latest state
            await authService.refreshUser().catch(err => {
              console.warn('📱 [PWA-Router] User refresh failed, but session is valid:', err);
            });
          }
        } catch (error) {
          console.error('📱 [PWA-Router] Visibility change auth check error:', error);
          navigate('/earlyaccess', { replace: true });
        }
      }
    } else {
      // App going to background - record timestamp
      appVisibilityTimestamp = Date.now();
      console.log('📱 [PWA-Router] App going to background');
    }
  }, [navigate]);

  // ✅ PWA FIX: pageshow event for bfcache restoration
  const handlePageShow = useCallback((event: PageTransitionEvent) => {
    if (event.persisted) {
      console.log('📱 [PWA-Router] Page restored from bfcache');
      // Reset timestamp to trigger auth check
      appVisibilityTimestamp = Date.now() - PWA_BACKGROUND_THRESHOLD - 1;
      // Trigger visibilitychange event instead of calling function directly
      document.dispatchEvent(new Event('visibilitychange'));
    }
  }, []);

  // Check for just_logged_out flag on mount (handles PWA reload)
  useEffect(() => {
    const justLoggedOut = localStorage.getItem('otakon_just_logged_out');
    const logoutInstance = localStorage.getItem('otakon_logout_instance');
    const isPWA = isPWAMode();
    
    if (justLoggedOut) {
      const logoutTimestamp = parseInt(justLoggedOut);
      const timeSinceLogout = Date.now() - logoutTimestamp;
      
      console.log('📱 [PWA-Router] Just logged out flag on mount:', {
        isPWA,
        logoutInstance,
        timeSinceLogout,
        timestamp: logoutTimestamp
      });
      
      // ✅ BLACK SCREEN FIX: Only process if logout is recent (< 5 seconds) to prevent stale flags
      if (timeSinceLogout < 5000) {
        console.log('📱 [PWA-Router] Recent logout detected, clearing and navigating to login');
        localStorage.removeItem('otakon_just_logged_out');
        localStorage.removeItem('otakon_logout_instance');
        
        // ✅ CRITICAL FIX: Also clear any stale session data to prevent black screen
        sessionStorage.clear();
        
        // ✅ CRITICAL FIX: If we're not at login page, navigate immediately
        if (location.pathname !== '/earlyaccess' && location.pathname !== '/') {
          console.log('📱 [PWA-Router] Not on login page, navigating now');
          navigate('/earlyaccess', { replace: true });
        } else {
          // We're already on the login page, just ensure auth state is clear
          console.log('📱 [PWA-Router] Already on login page after logout');
          // Force a state update by dispatching a custom event
          window.dispatchEvent(new CustomEvent('otakon:force-login-view'));
        }
      } else {
        // Stale logout flag - clean it up but don't navigate
        console.log('📱 [PWA-Router] Stale logout flag detected (', timeSinceLogout, 'ms old), cleaning up');
        localStorage.removeItem('otakon_just_logged_out');
        localStorage.removeItem('otakon_logout_instance');
      }
    }
  }, [navigate, location.pathname]);

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [handleVisibilityChange, handlePageShow]);

  // Listen for service worker messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleServiceWorkerMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'AUTH_CACHE_CLEARED') {
          console.log('📱 [PWA-Router] Service worker cleared auth cache');
        }
      };

      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, []);

  return <>{children}</>;
}

export default PWALifecycleProvider;
