import { useEffect, useState, useCallback, useRef } from 'react';
import type { ExtendedNavigator, WakeLockSentinel } from '../types/enhanced';

/**
 * Custom hook to manage Screen Wake Lock API
 * Prevents device from sleeping while app is active
 * 
 * @param enabled - Whether wake lock should be active
 * @returns Object with wake lock state and control methods
 */
export function useWakeLock(enabled: boolean = true) {
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shouldReacquire = useRef(true);

  // Check if Wake Lock API is supported
  useEffect(() => {
    const nav = navigator as ExtendedNavigator;
    const supported = 'wakeLock' in nav;
    setIsSupported(supported);
    
    if (!supported) {
      console.warn('⚠️ [WakeLock] Wake Lock API not supported on this device');
    }
    
    return () => {
      // Cleanup on unmount
      shouldReacquire.current = false;
      if (wakeLock) {
        wakeLock.release().catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, [wakeLock]);

  // Request wake lock
  const requestWakeLock = useCallback(async () => {
    const nav = navigator as ExtendedNavigator;
    
    if (!nav.wakeLock) {
      setError('Wake Lock API not available');
      return false;
    }

    try {
      // Release existing lock if any
      if (wakeLock) {
        await wakeLock.release().catch(() => {
          // Ignore release errors
        });
      }

      const lock = await nav.wakeLock.request('screen');
      setWakeLock(lock);
      setError(null);
      console.log('🔒 [WakeLock] Screen wake lock acquired - device will not sleep');

      // Handle wake lock release (e.g., when user switches tabs)
      const handleRelease = async () => {
        console.log('🔓 [WakeLock] Wake lock released, will try to reacquire');
        setWakeLock(null);
        
        // Try to reacquire after a short delay if page is still visible and we should reacquire
        if (shouldReacquire.current && document.visibilityState === 'visible') {
          setTimeout(async () => {
            if (shouldReacquire.current && document.visibilityState === 'visible' && nav.wakeLock) {
              console.log('🔒 [WakeLock] Auto-reacquiring wake lock after release');
              try {
                const newLock = await nav.wakeLock.request('screen');
                setWakeLock(newLock);
                newLock.addEventListener('release', handleRelease);
              } catch (err) {
                console.error('❌ [WakeLock] Failed to reacquire:', err);
              }
            }
          }, 100);
        }
      };
      
      lock.addEventListener('release', handleRelease);

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to acquire wake lock';
      setError(errorMsg);
      console.error('❌ [WakeLock] Failed to acquire wake lock:', err);
      return false;
    }
  }, [wakeLock]);

  // Release wake lock
  const releaseWakeLock = useCallback(async () => {
    if (!wakeLock) {
      return;
    }

    try {
      await wakeLock.release();
      setWakeLock(null);
      setError(null);
      console.log('🔓 [WakeLock] Wake lock manually released');
    } catch (err) {
      console.error('❌ [WakeLock] Failed to release wake lock:', err);
    }
  }, [wakeLock]);

  // Auto-request/release based on enabled prop
  useEffect(() => {
    if (!isSupported) {
      return;
    }

    if (enabled && !wakeLock) {
      requestWakeLock();
    } else if (!enabled && wakeLock) {
      releaseWakeLock();
    }
  }, [enabled, isSupported, wakeLock, requestWakeLock, releaseWakeLock]);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    if (!isSupported || !enabled) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 [WakeLock] Page visible again, reacquiring wake lock');
        // Always request wake lock when page becomes visible, even if we think we have one
        requestWakeLock();
      }
    };

    // Also handle focus events for better reliability
    const handleFocus = () => {
      if (!wakeLock) {
        console.log('📱 [WakeLock] Window focused, reacquiring wake lock');
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isSupported, enabled, wakeLock, requestWakeLock]);
  
  // Periodic check to ensure wake lock is still active (every 30 seconds)
  useEffect(() => {
    if (!isSupported || !enabled) {
      return;
    }

    const intervalId = setInterval(() => {
      if (!wakeLock && document.visibilityState === 'visible') {
        console.log('📱 [WakeLock] Periodic check - wake lock lost, reacquiring');
        requestWakeLock();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, [isSupported, enabled, wakeLock, requestWakeLock]);

  return {
    isActive: wakeLock !== null,
    isSupported,
    error,
    requestWakeLock,
    releaseWakeLock,
  };
}
