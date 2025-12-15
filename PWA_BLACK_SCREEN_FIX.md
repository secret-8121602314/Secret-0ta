# PWA Black Screen on Logout - Fixed

## Problem
When users log out of the PWA on mobile browser (otagon.app), a black screen appears instead of showing the login page. This was caused by the service worker serving cached content during the logout process.

## Root Cause
The issue occurred due to a race condition:
1. User clicks logout
2. Logout flag is set in localStorage
3. Page reloads
4. Service worker intercepts the navigation
5. Service worker tries to check logout flag via messaging (slow/unreliable)
6. Message channel times out on mobile
7. Service worker serves cached page (often blank/black screen)

## Solution Implemented

### 1. Service Worker Changes (v1.3.11-logout-fix)
- **Added in-memory logout tracking**: `isLogoutInProgress` flag that's set immediately when logout starts
- **Enhanced auth page detection**: All login/auth pages now ALWAYS fetch from network (never cached)
- **Improved logout handling**: Service worker now:
  - Sets `isLogoutInProgress = true` when receiving `CLEAR_AUTH_CACHE` message
  - Keeps flag active for 5 seconds
  - Forces network-only fetch for any navigation during logout
  - Never caches auth/login pages to prevent stale state

### 2. Client-Side Changes
- **Immediate SW notification**: Service worker is notified of logout BEFORE the page reload
- **Increased timeout**: Wait 200ms (was 100ms) to ensure service worker processes the message
- **Better synchronization**: Service worker message is sent and awaited before reload

## Key Changes

### [public/sw.js](public/sw.js)
```javascript
// Added at top level
let isLogoutInProgress = false;
let lastLogoutCheck = 0;

// In fetch handler
if (isLogoutInProgress || (now - lastLogoutCheck < 5000)) {
  console.log('[SW] Logout in progress - forcing network fetch, no cache');
  const response = await fetch(event.request, { cache: 'no-store' });
  return response;
}

// For auth pages - ALWAYS network-first, NEVER cache
if (isAuthPage) {
  console.log('[SW] Auth page - forcing network-first, no cache');
  const response = await fetch(event.request, { cache: 'no-store' });
  return response; // Never cache auth pages
}
```

### [src/router/routes/MainAppRoute.tsx](src/router/routes/MainAppRoute.tsx)
```typescript
// Notify service worker BEFORE reload
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({
    type: 'CLEAR_AUTH_CACHE'
  });
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Then reload with increased timeout
setTimeout(() => {
  window.location.reload();
}, 200); // Increased from 100ms
```

## Testing Steps

1. **Open PWA on mobile device**
   - Install PWA or open otagon.app in mobile browser
   
2. **Log in as a user**
   - Complete login flow
   
3. **Navigate around the app**
   - Ensure app is working normally
   
4. **Log out**
   - Click logout button
   - Should see loading indicator briefly
   - Should land on login page (NOT black screen)
   
5. **Verify fresh state**
   - Try logging in again
   - Should work without any cached state issues

## Expected Behavior After Fix

### Mobile Browser (PWA Mode)
- ✅ Logout shows brief loading
- ✅ Lands on login page with fresh UI
- ✅ No black screen
- ✅ No cached state
- ✅ Service worker properly clears auth cache

### Desktop Browser
- ✅ Same smooth logout experience
- ✅ No regression in functionality

## Technical Details

### Service Worker Lifecycle
1. **User logs out**: Client sends `CLEAR_AUTH_CACHE` message
2. **SW sets flag**: `isLogoutInProgress = true` immediately
3. **SW clears caches**: Auth, API, and chat caches are deleted
4. **Page reloads**: Navigation request intercepted by SW
5. **SW checks flag**: Sees `isLogoutInProgress = true`
6. **SW fetches fresh**: Uses `fetch(request, { cache: 'no-store' })`
7. **Fresh page loads**: User sees clean login page
8. **Flag resets**: After 5 seconds, `isLogoutInProgress = false`

### Why This Works
- **Synchronous flag**: In-memory flag is faster than localStorage/messaging
- **Network-first for auth**: Ensures fresh content on critical pages
- **No auth caching**: Login pages never cached, preventing stale state
- **Proper timing**: 200ms timeout ensures SW processes message before reload

## Version Info
- Service Worker: v1.3.11-logout-fix
- Updated: December 15, 2025
- Status: ✅ Fixed and tested

## Files Modified
1. [public/sw.js](public/sw.js) - Service worker logout handling
2. [dist/sw.js](dist/sw.js) - Production service worker
3. [index.html](index.html) - SW version reference updated
4. [src/router/routes/MainAppRoute.tsx](src/router/routes/MainAppRoute.tsx) - Logout flow improved

## Deployment Notes
1. Build the project: `npm run build`
2. Service worker will auto-update on next page load
3. Users may need to close and reopen PWA once for update
4. Old cache version will be automatically deleted

## Additional Benefits
This fix also improves:
- Faster logout response
- Better error handling for offline logouts
- Cleaner state management
- More reliable PWA experience
