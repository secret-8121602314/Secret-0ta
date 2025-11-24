# Logout Deep Dive Analysis & Fix

**Date:** November 24, 2025  
**Issue:** In PWA mode, logging out shows landing page instead of login page

## Root Cause Analysis

### The Bug
When a user logs out in PWA mode, they see the landing page instead of the login page. The issue was in how localStorage flags are managed during logout.

### Logout Flow (Before Fix)

1. **User clicks logout** → `handleLogout()` → shows confirmation dialog
2. **User confirms** → `confirmLogout()` executes:
   ```typescript
   // Saved only otakon_welcome_shown
   const welcomeShown = localStorage.getItem('otakon_welcome_shown');
   
   // ❌ This clears ALL otakon_* keys including otagon_has_logged_in
   await authService.signOut();
   
   // Restored only otakon_welcome_shown
   // ❌ FORGOT to restore otagon_has_logged_in!
   ```

3. **Auth subscription fires** (user is now null):
   ```typescript
   const isPWA = isPWAMode(); // true in PWA
   
   // This check uses hasEverLoggedIn (in-memory state)
   setAppState({
     view: (hasEverLoggedIn || isPWA) ? 'app' : 'landing',
     onboardingStatus: (hasEverLoggedIn || isPWA) ? 'login' : 'initial'
   });
   ```
   
   During the **same session**, `hasEverLoggedIn` is still `true` in memory, so login page shows correctly.

4. **BUT on page refresh or next app load:**
   ```typescript
   // ❌ hasEverLoggedIn initializes from localStorage
   const [hasEverLoggedIn, setHasEverLoggedIn] = useState(() => {
     return localStorage.getItem('otagon_has_logged_in') === 'true';
   });
   // Returns FALSE because signOut() deleted it!
   ```
   
   Now relies solely on `isPWA` check. If there's any timing issue or PWA detection fails, shows landing page.

### Why authService.signOut() Clears Everything

```typescript
// authService.ts - signOut() method
async signOut(): Promise<void> {
  // Clears Supabase session
  await supabase.auth.signOut();
  
  // Removes ALL Supabase localStorage keys (sb-*)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('sb-')) {
      keysToRemove.push(key);
    }
  }
  
  // ❌ Removes ALL app-specific keys including otagon_has_logged_in
  localStorage.removeItem('otakon_auth_method');
  localStorage.removeItem('otakon_has_used_app');
  localStorage.removeItem('otakon_user');
  // ... and many more including our critical flag!
}
```

## The Fix

### Changes Made

#### 1. Preserve `otagon_has_logged_in` During Logout
**File:** `src/App.tsx` - `confirmLogout()` function

```typescript
const confirmLogout = async () => {
  // Preserve flags that should persist across logout
  const welcomeShown = localStorage.getItem('otakon_welcome_shown');
  const hasLoggedIn = localStorage.getItem('otagon_has_logged_in'); // ✅ Save this
  
  await authService.signOut(); // This clears everything
  
  // Restore persistent flags
  if (welcomeShown) {
    localStorage.setItem('otakon_welcome_shown', welcomeShown);
  }
  if (hasLoggedIn) {
    localStorage.setItem('otagon_has_logged_in', hasLoggedIn); // ✅ Restore this
  }
  
  setAppState({
    view: 'app',
    onboardingStatus: 'login'
  });
};
```

#### 2. Enhanced Debug Logging

Added comprehensive console logs to track logout flow:

**In confirmLogout():**
- Initial state (view, onboardingStatus, hasEverLoggedIn, isPWA)
- Flags being preserved
- Flags restored after signOut
- Final state after logout

**In auth subscription (processAuthState):**
- When no user detected
- hasEverLoggedIn value
- isPWA detection result
- Calculated view and onboardingStatus

**In AppRouter:**
- When rendering LandingPage
- When rendering LoginSplashScreen
- Current app state values

## How It Works Now

### Logout Flow (After Fix)

1. **User logs out** → `confirmLogout()` saves `otagon_has_logged_in`
2. **authService.signOut()** clears localStorage
3. **Restore critical flags** including `otagon_has_logged_in`
4. **Set state** to `view: 'app'` and `onboardingStatus: 'login'`
5. **Auth subscription fires** and sees user is null
6. **Checks conditions:**
   - `hasEverLoggedIn` = true (in memory)
   - `isPWA` = true (in PWA mode)
   - Result: `view: 'app'`, `onboardingStatus: 'login'`
7. **AppRouter renders** `LoginSplashScreen` ✅

### On Page Refresh After Logout

1. **App initializes** - `hasEverLoggedIn` loads from localStorage
2. **localStorage has `otagon_has_logged_in: 'true'`** (preserved during logout)
3. **hasEverLoggedIn = true** ✅
4. **Auth subscription processes null user:**
   - `hasEverLoggedIn` = true
   - OR `isPWA` = true (double protection)
   - Result: Shows login page ✅

## Testing Checklist

### Test Scenarios

- [ ] **Normal logout in browser**
  - Should show login page
  - After page refresh, should still show login page

- [ ] **Logout in PWA mode (iOS)**
  - Should show login page immediately
  - After closing and reopening PWA, should show login page
  
- [ ] **Logout in PWA mode (Android)**
  - Should show login page immediately
  - After closing and reopening PWA, should show login page

- [ ] **First-time user (never logged in)**
  - Should show landing page on first visit
  - `otagon_has_logged_in` should not exist

- [ ] **Check console logs**
  - Verify logout flow logs appear
  - Verify `otagon_has_logged_in` is preserved
  - Verify correct view/onboardingStatus decisions

### Debug Commands

Check localStorage in browser console:
```javascript
// Check if flag is preserved
localStorage.getItem('otagon_has_logged_in')

// Check all otakon flags
Object.keys(localStorage).filter(k => k.startsWith('otakon'))

// Check PWA mode
window.matchMedia('(display-mode: standalone)').matches
```

## Additional Notes

### Why This Bug Was Hard to Catch

1. **Worked during same session** - The in-memory `hasEverLoggedIn` state was correct during logout
2. **PWA detection usually works** - The fallback `isPWA` check masked the issue most of the time
3. **Only visible on refresh** - Bug only manifested after page reload/PWA relaunch

### Future Improvements

Consider creating a dedicated service for managing persistent flags:
```typescript
// persistentFlagsService.ts
const PERSISTENT_FLAGS = [
  'otakon_welcome_shown',
  'otagon_has_logged_in',
  // Add more as needed
];

export const preserveFlagsBeforeSignOut = () => {
  const preserved = {};
  PERSISTENT_FLAGS.forEach(key => {
    preserved[key] = localStorage.getItem(key);
  });
  return preserved;
};

export const restoreFlagsAfterSignOut = (preserved) => {
  Object.entries(preserved).forEach(([key, value]) => {
    if (value) localStorage.setItem(key, value);
  });
};
```

### Related Files

- `src/App.tsx` - Main logout logic and auth subscription
- `src/services/authService.ts` - signOut() method that clears localStorage
- `src/components/AppRouter.tsx` - Routing logic for login vs landing page
- `src/utils/pwaDetection.ts` - PWA mode detection utilities

## Verification

After deploying, verify the fix by:

1. Login to the PWA
2. Check console: "otagon_has_logged_in" should be "true"
3. Logout
4. Check console logs for proper flow
5. Verify login page appears
6. Close and reopen PWA
7. Verify login page still appears (not landing page)

---

**Status:** ✅ Fixed
**Priority:** P0 (Critical UX issue for PWA users)
