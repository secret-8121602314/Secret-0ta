import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toastService } from '../services/toastService';
import type { ExtendedNavigator } from '../types/enhanced';

export interface NetworkStatus {
  isOnline: boolean;
  lastOnlineAt: number | null;
  lastOfflineAt: number | null;
  connectionType: string | null;
}

/**
 * Hook to monitor network status and handle reconnection
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    lastOnlineAt: navigator.onLine ? Date.now() : null,
    lastOfflineAt: null,
    connectionType: null,
  });

  useEffect(() => {
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3;

    const updateConnectionType = () => {
      const nav = navigator as ExtendedNavigator;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
      
      if (connection) {
        setStatus(prev => ({
          ...prev,
          connectionType: connection.effectiveType || null
        }));
      }
    };

    const handleOnline = async () => {
            const now = Date.now();
      
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        lastOnlineAt: now,
      }));

      updateConnectionType();
      
      // Refresh session when network comes back
      try {
                const { error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('❌ [NetworkStatus] Failed to refresh session:', error);
          reconnectAttempts++;
          
          if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
            toastService.warning(`Reconnecting... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
            
            // Retry after delay
            setTimeout(async () => {
              const { error: retryError } = await supabase.auth.refreshSession();
              if (!retryError) {
                reconnectAttempts = 0;
                toastService.success('Connection restored');
              }
            }, 2000 * reconnectAttempts);
          } else {
            toastService.error('Could not restore connection. Please refresh the page.');
          }
        } else {
                    reconnectAttempts = 0;
          
          // Notify user of successful reconnection
          if (status.lastOfflineAt && (now - status.lastOfflineAt) > 5000) {
            toastService.success('Back online! Connection restored.');
          }
          
          // Dispatch custom event for other components
          window.dispatchEvent(new CustomEvent('otakon:network-restored', {
            detail: { timestamp: now }
          }));
        }
      } catch (err) {
        console.error('❌ [NetworkStatus] Error refreshing session:', err);
        toastService.error('Connection issue. Please try refreshing.');
      }
    };

    const handleOffline = () => {
            const now = Date.now();
      
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        lastOfflineAt: now,
      }));
      
      toastService.warning('You are offline. Some features may be unavailable.');
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('otakon:network-lost', {
        detail: { timestamp: now }
      }));
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection type changes
    const nav = navigator as ExtendedNavigator;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', updateConnectionType);
      updateConnectionType();
    }

    // Check connection status periodically
    const intervalId = setInterval(() => {
      if (!navigator.onLine && status.isOnline) {
        handleOffline();
      } else if (navigator.onLine && !status.isOnline) {
        handleOnline();
      }
    }, 30000); // Check every 30 seconds

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateConnectionType);
      }
      clearInterval(intervalId);
    };
  }, [status.lastOfflineAt, status.isOnline]);

  return status;
};
