# PWA Critical Fixes Required

## Analysis Summary
Comprehensive review of PWA functionality including login, logout, session management, redirects, and offline capabilities.

---

## 🚨 CRITICAL ISSUES FOUND

### 1. **Missing Auth State Listener in Main App** ⚠️
**Issue**: No global auth state change listener to handle token refreshes in PWA mode
**Impact**: Sessions may expire without proper refresh, causing unexpected logouts
**Location**: `src/lib/supabase.ts` and `src/App.tsx`

### 2. **PWA Mode Detection Issues** ⚠️
**Issue**: Multiple inconsistent checks for PWA standalone mode
**Impact**: App behavior differs between PWA and browser mode
**Locations**: 
- `src/App.tsx` (line 156)
- `src/utils/sessionManager.ts` (line 237)
- `src/components/splash/PWAInstallBanner.tsx` (line 23)

### 3. **Service Worker Registration Only in Production** ⚠️
**Issue**: Service worker disabled for localhost, making PWA testing impossible
**Impact**: Cannot test PWA features during development
**Location**: `index.html` (lines 58-80)

### 4. **No Session Recovery on Network Reconnection** ⚠️
**Issue**: No automatic session refresh when network comes back online
**Impact**: Users may lose session after network interruptions
**Location**: Missing implementation

### 5. **OAuth Redirect Issues in PWA Mode** ⚠️
**Issue**: OAuth redirects may not work properly in standalone PWA mode
**Impact**: Users cannot login with Google/Discord from installed PWA
**Location**: `src/services/authService.ts` redirect URL handling

### 6. **No PWA-Specific Session Persistence** ⚠️
**Issue**: Service worker doesn't cache authentication state for offline
**Impact**: App may not work offline even with valid session
**Location**: `public/sw.js`

### 7. **Missing TOKEN_REFRESHED Handler** ⚠️
**Issue**: No handler for Supabase TOKEN_REFRESHED event
**Impact**: Token refresh events not processed, may cause auth issues
**Location**: Missing in auth flow

---

## 🔧 FIXES TO IMPLEMENT

### Fix 1: Add Global Auth State Listener
**File**: `src/lib/supabase.ts`

Add after client creation:
```typescript
// Global auth state listener for PWA session management
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 [Supabase] Auth event:', event);
    
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session?.access_token) {
        // Store session timestamp for PWA mode
        localStorage.setItem('otakon_session_refreshed', Date.now().toString());
        
        // Notify app of session refresh
        window.dispatchEvent(new CustomEvent('otakon:session-refreshed', {
          detail: { session }
        }));
      }
    } else if (event === 'SIGNED_OUT') {
      // Clear all session data
      localStorage.removeItem('otakon_session_refreshed');
      
      // Notify app of signout
      window.dispatchEvent(new CustomEvent('otakon:signed-out'));
    }
  });
}
```

### Fix 2: Unified PWA Detection Utility
**File**: `src/utils/pwaDetection.ts` (NEW FILE)

```typescript
/**
 * Utility for consistent PWA mode detection
 */
export const isPWAMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const isIOSPWA = (): boolean => {
  return (window.navigator as any).standalone === true;
};

export const isAndroidPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         document.referrer.includes('android-app://');
};

export const getPWADisplayMode = (): 'standalone' | 'browser' | 'fullscreen' | 'minimal-ui' => {
  if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
  if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
  return 'browser';
};
```

### Fix 3: Enable Service Worker in Development
**File**: `index.html`

Replace lines 58-80 with:
```html
<script>
  // Service Worker Registration for both Dev and Production
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swPath = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
        ? '/sw.js'
        : '/Otagon/sw.js';
      
      navigator.serviceWorker.register(swPath)
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, show update notification
                  if (confirm('New version available! Reload to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
</script>
```

### Fix 4: Network Reconnection Handler
**File**: `src/hooks/useNetworkStatus.ts` (NEW FILE)

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnline, setLastOnline] = useState<number | null>(null);

  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 Network reconnected');
      setIsOnline(true);
      setLastOnline(Date.now());
      
      // Refresh session when network comes back
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Failed to refresh session:', error);
        } else {
          console.log('✅ Session refreshed on reconnection');
        }
      } catch (err) {
        console.error('Error refreshing session:', err);
      }
    };

    const handleOffline = () => {
      console.log('🌐 Network disconnected');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, lastOnline };
};
```

### Fix 5: PWA-Aware OAuth Redirects
**File**: `src/services/authService.ts`

Update `getCallbackUrl()` method:
```typescript
private getCallbackUrl(): string {
  const origin = window.location.origin;
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Check if running in PWA mode
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;
  
  const callback = isDev ? '/auth/callback' : '/Otagon/auth/callback';
  
  // For PWA, ensure we use the full URL
  if (isPWA) {
    return `${origin}${callback}`;
  }
  
  return `${origin}${callback}`;
}
```

### Fix 6: Service Worker Session Caching
**File**: `public/sw.js`

Add after cache definitions:
```javascript
// Cache authentication state for offline mode
const AUTH_CACHE = 'otakon-auth-v1';

// Handle auth state messages from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_AUTH_STATE') {
    const authState = event.data.payload;
    
    caches.open(AUTH_CACHE).then(cache => {
      cache.put('/auth-state', new Response(JSON.stringify(authState), {
        headers: { 'Content-Type': 'application/json' }
      }));
    });
  } else if (event.data && event.data.type === 'CLEAR_AUTH_CACHE') {
    caches.delete(AUTH_CACHE);
  }
});

// Provide cached auth state on offline
async function getCachedAuthState() {
  try {
    const cache = await caches.open(AUTH_CACHE);
    const response = await cache.match('/auth-state');
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to get cached auth state:', error);
  }
  return null;
}
```

### Fix 7: Add TOKEN_REFRESHED Handler
**File**: `src/App.tsx`

Add useEffect for auth events:
```typescript
useEffect(() => {
  // Listen for auth events from Supabase
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('🔐 [App] Auth event:', event);
      
      if (event === 'TOKEN_REFRESHED' && session) {
        console.log('🔐 [App] Token refreshed, updating user data');
        if (authState.user) {
          await authService.refreshUser();
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🔐 [App] User signed out');
        setAuthState({ user: null, isLoading: false, error: null });
      }
    }
  );
  
  return () => {
    subscription.unsubscribe();
  };
}, [authState.user]);
```

---

## 📋 IMPLEMENTATION CHECKLIST

- [ ] Add global auth state listener in supabase.ts
- [ ] Create unified PWA detection utility
- [ ] Enable service worker in development mode
- [ ] Implement network reconnection handler
- [ ] Update OAuth redirect handling for PWA mode
- [ ] Add service worker session caching
- [ ] Add TOKEN_REFRESHED handler in App.tsx
- [ ] Update all PWA detection checks to use utility
- [ ] Test login/logout in PWA mode
- [ ] Test OAuth flows in PWA mode
- [ ] Test offline session persistence
- [ ] Test network reconnection session refresh
- [ ] Test app updates in PWA mode

---

## 🧪 TESTING PLAN

### 1. PWA Installation
- [ ] Install app from Chrome (Android/Desktop)
- [ ] Install app from Safari (iOS)
- [ ] Verify manifest.json loads correctly
- [ ] Verify icons display properly

### 2. Authentication in PWA
- [ ] Login with Google from PWA
- [ ] Login with Discord from PWA
- [ ] Login with Email from PWA
- [ ] Verify session persists on app close/reopen
- [ ] Verify automatic token refresh works
- [ ] Logout and verify complete cleanup

### 3. Offline Capabilities
- [ ] Load app offline with valid session
- [ ] Verify cached content displays
- [ ] Test network reconnection session refresh
- [ ] Verify offline indicators show correctly

### 4. Cross-Tab Behavior
- [ ] Open PWA and browser tab simultaneously
- [ ] Logout from one, verify other updates
- [ ] Login from one, verify other updates
- [ ] Close one, verify other continues

### 5. App Updates
- [ ] Deploy new version
- [ ] Verify update notification shows
- [ ] Accept update and verify reload
- [ ] Dismiss update and verify continues

---

## 🎯 PRIORITY ORDER

1. **CRITICAL** - Fix 1: Global auth state listener
2. **CRITICAL** - Fix 7: TOKEN_REFRESHED handler
3. **HIGH** - Fix 4: Network reconnection handler
4. **HIGH** - Fix 2: Unified PWA detection
5. **MEDIUM** - Fix 3: Enable SW in dev mode
6. **MEDIUM** - Fix 5: PWA-aware OAuth redirects
7. **LOW** - Fix 6: Service worker session caching

---

## 📝 NOTES

- All fixes are backward compatible
- No breaking changes to existing functionality
- Service worker version should be bumped after fixes
- Test thoroughly before production deployment
- Consider adding PWA-specific analytics events
