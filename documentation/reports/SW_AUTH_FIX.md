# Service Worker Auth Fix - v1.3.1

## Problem Fixed
The Service Worker was intercepting Supabase authentication requests and returning `undefined` instead of proper Response objects, causing the error:
```
Uncaught (in promise) TypeError: Failed to convert value to 'Response'
```

## Changes Made

### 1. **sw.js - Critical Auth Bypass**
- Added explicit checks to NEVER intercept Supabase requests:
  - All `supabase.co` and `supabase.net` domains
  - All `/auth/`, `/rest/v1/`, `/storage/v1/` paths
  - Chrome extensions and localhost/dev server requests
- Added proper early returns to let auth requests bypass SW completely
- Fixed all code paths to return valid Response objects
- Added proper error handling with 503/408 status codes

### 2. **sw.js - Proper Response Handling**
- Every fetch handler now explicitly returns a Response or early returns
- Added fallback error responses instead of undefined
- Cache-first strategy only applies to same-origin static assets
- POST/PUT/DELETE and external origins bypass SW completely

### 3. **index.html - Forced SW Update**
- Updated to v1.3.1
- Automatically deletes old v1.3.0 caches on load
- Unregisters old broken SW before registering new one
- Auto-reloads when new SW is available (no user prompt needed)

## Testing Steps

### Step 1: Clear Everything (One-Time)
```powershell
# In browser DevTools Console:
# 1. Go to Application tab
# 2. Clear Storage -> Clear site data
# 3. OR run this in console:
navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()));
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
```

### Step 2: Restart Dev Server
```powershell
# Stop current server (Ctrl+C)
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Start fresh
npm run dev
```

### Step 3: Hard Refresh Browser
- Open http://localhost:5173
- Press `Ctrl + Shift + R` (hard refresh)
- Check console for: `✅ SW v1.3.1 registered`

### Step 4: Test Auth Login
1. Click Sign In
2. Enter credentials
3. Should complete without SW errors
4. Check console - should NOT see:
   - "FetchEvent resulted in a network error"
   - "Failed to convert value to 'Response'"

### Step 5: Verify SW Is Not Intercepting Auth
```javascript
// In DevTools Console, check what SW is intercepting:
navigator.serviceWorker.controller
// Should see: null OR ServiceWorker object

// Check active caches:
caches.keys()
// Should see: otakon-v1.3.1-* (NOT v1.3.0)
```

## Expected Console Output

✅ **Good:**
```
Deleting old cache: otakon-v1.3.0-pwa-fixes
Unregistered old SW
✅ SW v1.3.1 registered: ServiceWorkerRegistration
SW registered: ServiceWorkerRegistration
Service Worker installing...
Opened new cache: otakon-v1.3.1-auth-fix
Service Worker activating...
```

❌ **Bad (Fixed):**
```
The FetchEvent for "<URL>" resulted in a network error response
Uncaught (in promise) TypeError: Failed to convert value to 'Response'
```

## What The Fix Does

### Before (Broken):
```javascript
// Old code had implicit undefined returns
self.addEventListener('fetch', (event) => {
  if (isAuthRequest) {
    event.respondWith(handleAuth()) // Might return undefined!
  } else if (isApiRequest) {
    event.respondWith(handleApi())  // Might return undefined!
  }
  // Falls through with no response! ❌
});
```

### After (Fixed):
```javascript
self.addEventListener('fetch', (event) => {
  // Auth requests BYPASS completely
  if (isSupabaseRequest) {
    return; // Let browser handle it directly ✅
  }
  
  if (isApiRequest) {
    event.respondWith(handleApi());
    return; // Explicit exit ✅
  }
  
  // All paths return valid Response or return early ✅
});
```

## Why This Works

1. **Auth Bypass**: Supabase requests never touch the SW, avoiding interference
2. **Explicit Returns**: Every code path either calls `event.respondWith()` OR returns early
3. **Proper Fallbacks**: Network errors return proper 408/503 Response objects, not undefined
4. **Cache Isolation**: Only same-origin GET requests for static assets use cache
5. **Clean Update**: Old broken SW is force-cleared before new one installs

## Rollback (If Needed)

If this causes issues:
```powershell
# Disable SW completely:
# In index.html, comment out the entire <script> block with SW registration

# Clear everything:
# DevTools > Application > Clear Storage > Clear site data
```

## Production Deployment

When deploying to GitHub Pages:
1. The new SW will auto-update all users
2. Old caches automatically cleared
3. Auth will work immediately after reload
4. No user action required

## Technical Details

**Service Worker Lifecycle:**
1. Old SW v1.3.0 unregistered on page load
2. Old caches (v1.3.0) deleted
3. New SW v1.3.1 registers
4. New SW installs (caches static assets)
5. New SW activates (takes control)
6. New SW skips waiting on update
7. Page auto-reloads to use new SW

**Supabase Request Detection:**
- Hostname contains `supabase.co` or `supabase.net`
- Path contains `/auth/`, `/rest/v1/`, `/storage/v1/`
- These bypass SW completely (browser handles directly)

**Cache Strategy:**
- HTML: Network-first (always fresh)
- Static assets (same-origin): Cache-first
- API calls: Network-first with cache fallback
- Auth/External: No interception (direct to network)

