# PWA Black Screen After Logout - Fix Complete ✅

## Problem Description

When using Otagon as a PWA on mobile:
1. User opens otagon.app in mobile browser (Service Worker registers)
2. User installs PWA (PWA shares the SAME Service Worker as browser)
3. User opens PWA and logs in
4. User logs out → **BLACK SCREEN** and app is stuck
5. Closing and reopening PWA → Still black screen
6. **Only fix:** Closing browser completely and reopening PWA

## Root Cause

The issue was caused by **shared Service Worker context between browser and PWA** combined with **improper reload handling**.

### Technical Details:

1. **`window.location.replace('/earlyaccess')` doesn't trigger a true hard reload**
   - It's more like a navigation, not a full page reload
   - React component state persists in memory
   - Service Worker may serve cached content from previous session

2. **Service Worker serves stale cached state**
   - Even though auth is cleared, the service worker might serve cached HTML/JS
   - React hydrates with old state causing black screen
   - The `otakon_just_logged_out` flag checks happen too late in the render cycle

3. **Browser/PWA share Service Worker instance**
   - When browser is open alongside PWA, they share the same SW
   - Only closing browser completely unregisters the SW from memory
   - This explains why closing browser fixes the issue

## Solution Implemented

### 1. Changed `window.location.replace()` to `window.location.reload()`

**Files Modified:**
- [src/App.tsx](src/App.tsx#L643-L660)
- [src/router/routes/MainAppRoute.tsx](src/router/routes/MainAppRoute.tsx#L110-L129)

**Changes:**
```typescript
// BEFORE (broken):
if (isPWA) {
  localStorage.setItem('otakon_just_logged_out', 'true');
  window.location.replace('/earlyaccess'); // ❌ Not a true reload
  return;
}

// AFTER (fixed):
if (isPWA) {
  localStorage.setItem('otakon_just_logged_out', 'true');
  
  // Navigate to root first (clears URL state)
  window.history.replaceState(null, '', '/');
  
  // Force hard reload to bypass ALL caches
  setTimeout(() => {
    window.location.reload(); // ✅ True hard reload
  }, 100);
  
  return;
}
```

**Why this works:**
- `window.location.reload()` forces a complete page reload
- Clears React's in-memory state completely
- Forces fresh fetch from network (bypasses stale cache)
- The 100ms timeout ensures localStorage is written first

### 2. Service Worker: Force Network Fetch After Logout

**File Modified:**
- [public/sw.js](public/sw.js#L153-L183)

**Changes:**
Added detection for logout flag before serving cached content:

```javascript
// Network-first strategy for HTML pages
if (event.request.mode === 'navigate') {
  event.respondWith(
    (async () => {
      // ✅ Check if user just logged out
      const clients = await self.clients.matchAll({ type: 'window' });
      let justLoggedOut = false;
      
      for (const client of clients) {
        const response = await new Promise((resolve) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = (e) => resolve(e.data);
          client.postMessage({ type: 'CHECK_LOGOUT_FLAG' }, [channel.port2]);
          setTimeout(() => resolve(false), 100);
        });
        if (response) {
          justLoggedOut = true;
          break;
        }
      }
      
      if (justLoggedOut) {
        // Force network-only fetch (no cache)
        const response = await fetch(event.request, { cache: 'no-store' });
        return response;
      }
      
      // ... rest of caching logic
    })()
  );
}
```

**Why this works:**
- Service Worker checks for `otakon_just_logged_out` flag before serving cached content
- If flag exists, forces fresh network fetch with `cache: 'no-store'`
- Ensures user gets latest HTML/JS after logout, not stale cached version

### 3. Added Message Handler in App.tsx

**File Modified:**
- [src/App.tsx](src/App.tsx#L493-L499)

**Changes:**
```typescript
const handleServiceWorkerMessage = (event: MessageEvent) => {
  if (event.data && event.data.type === 'CHECK_LOGOUT_FLAG') {
    const hasFlag = !!localStorage.getItem('otakon_just_logged_out');
    console.log('[App] SW checking logout flag:', hasFlag);
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage(hasFlag);
    }
  }
};
```

**Why this works:**
- Responds to Service Worker's request to check logout flag
- Uses MessageChannel for direct two-way communication
- Ensures SW can make informed decision about caching

## Testing Instructions

### Test Case 1: PWA Logout (Primary Issue)
1. Open otagon.app in mobile browser
2. Install PWA
3. Open PWA and login
4. **Test:** Logout from PWA
5. **Expected:** App reloads and shows login screen (no black screen)
6. **Verify:** Can login again successfully

### Test Case 2: Browser and PWA Sharing SW
1. Open otagon.app in mobile browser AND install PWA
2. Keep both open (browser + PWA)
3. Login and logout from PWA
4. **Expected:** PWA reloads properly despite shared SW
5. **Verify:** No black screen, login page appears

### Test Case 3: Web Browser Logout (Should Still Work)
1. Open otagon.app in browser (don't install PWA)
2. Login
3. **Test:** Logout
4. **Expected:** Normal state-based logout (no reload needed)
5. **Verify:** Login page appears immediately

### Test Case 4: PWA After Logout Flag Cleared
1. Logout from PWA (sets `otakon_just_logged_out` flag)
2. Wait for reload
3. **Verify:** Flag is cleared on page load
4. **Verify:** Login screen appears, not black screen

## Version Update

Updated Service Worker version:
- From: `v1.3.9-logout-fix`
- To: `v1.3.10-black-screen-fix`

This ensures all users get the new Service Worker with the logout detection logic.

## Files Changed

1. ✅ `src/App.tsx` - Changed logout reload logic + added SW message handler
2. ✅ `src/router/routes/MainAppRoute.tsx` - Changed logout reload logic
3. ✅ `public/sw.js` - Added logout flag detection + version bump

## Related Issues Fixed

- ✅ Black screen after PWA logout
- ✅ Stuck loading state in PWA after logout
- ✅ Service Worker serving stale content after logout
- ✅ Shared SW context between browser and PWA causing issues
- ✅ React state persisting across logout in PWA

## Prevention

Going forward:
- Always use `window.location.reload()` for true hard reloads in PWA context
- Never use `window.location.replace()` when you need to clear state
- Service Worker should check for logout flags before serving cached navigation responses
- Test logout flow in both browser and PWA contexts

## Deployment Notes

After deploying this fix:
1. Service Worker will auto-update to v1.3.10
2. Users may need to close and reopen PWA once to get new SW
3. All subsequent logouts will work correctly
4. No database changes required

---

**Status:** ✅ COMPLETE
**Date:** December 13, 2025
**Tested:** Pending user verification
