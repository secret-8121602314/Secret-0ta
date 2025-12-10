# PWA Critical Bug Fixes - Logout & Black Screen Issues

## 🐛 Bugs Fixed

### Bug 1: Logout in PWA doesn't navigate to login screen
**Symptom**: After clicking logout in the settings menu within installed PWA, the user appears logged out (settings menu changes from "Start Pro Trial" to "Upgrade to Pro"), but the app doesn't navigate back to the login screen. User remains stuck on the chat screen.

**Root Cause**: 
- During logout, `confirmLogout()` in `App.tsx` correctly set:
  - `onboardingStatus = 'login'`
  - `authState.user = null`
  - `authState.isLoading = false`
- However, `isInitializing` was never set to `false`
- In `AppRouter.tsx`, the loading screen check runs BEFORE the login screen check:
  ```tsx
  const shouldShowLoading = (isInitializing || authState.isLoading) && ...
  if (shouldShowLoading) return <AppLoadingScreen />;
  ```
- Because `isInitializing` remained `true`, the loading screen showed indefinitely instead of the login screen

**Fix Applied**:
1. Added `setIsInitializing(false)` in `confirmLogout()` before setting other state
2. This ensures the login screen condition can be met in AppRouter

### Bug 2: Black screen when reopening PWA after closing
**Symptom**: After logging out in PWA, when you close and reopen the app, you get a permanent black screen. The screen is actually the fallback "Something went wrong" message from AppRouter (appears black due to dark theme), but no matter what you do - close, reopen, clear cache - the black screen persists.

**Root Cause**:
- When PWA is reopened after being closed, the visibility change handler checks the session
- If no session exists (user was logged out), it sets `onboardingStatus = 'login'` 
- However, it didn't set `isInitializing = false`
- The loading screen shows indefinitely, OR if the timeout triggers, the state doesn't match any condition in AppRouter, causing the fallback "Something went wrong" screen to render

**Fix Applied**:
1. Added `setIsInitializing(false)` in the PWA visibility handler when no session is found
2. Added `setIsInitializing(false)` in session check error handler
3. Added `setIsInitializing(false)` in session expired handler
4. Added defensive fallback condition in `AppRouter.tsx`:
   ```tsx
   // If user is logged out, always show login screen
   if (!authState.user && !authState.isLoading && appState.view === 'app') {
     return <LoginSplashScreen ... />;
   }
   ```

### Bug 3: Auto-logout causing black screen
**Symptom**: If the app runs for a period and logs you out automatically (session timeout), you get stuck in a black screen.

**Root Cause**: Same as Bug 2 - session expiry handlers didn't set `isInitializing = false`

**Fix Applied**: Same as Bug 2 - added `setIsInitializing(false)` to all session timeout/expiry handlers

## 📝 Changes Made

### File: `src/App.tsx`

#### Change 1: Fixed `confirmLogout()` function
**Location**: Line ~510-565
```typescript
const confirmLogout = async () => {
  // ... existing logout logic ...
  
  // ✅ PWA FIX: Set all state synchronously to ensure login screen renders
  setIsInitializing(false); // 🔥 NEW: Critical addition
  setAppState((prev: AppState) => ({
    ...prev,
    view: 'app',
    onboardingStatus: 'login'
  }));
  setAuthState({ user: null, isLoading: false, error: null });
  
  console.log('🎯 [App] Logout completed, state set to: isInitializing=false, view=app, onboardingStatus=login');
  // ... rest of function ...
};
```

#### Change 2: Fixed PWA visibility change handler
**Location**: Line ~375
```typescript
if (!session) {
  console.log('📱 [PWA] No session found after background, showing login');
  setIsInitializing(false); // 🔥 NEW: Critical addition
  setAuthState({ user: null, isLoading: false, error: null });
  setAppState(prev => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
}
```

#### Change 3: Fixed session check error handler
**Location**: Line ~364
```typescript
if (error) {
  console.error('📱 [PWA] Session check error:', error);
  setAuthState(prev => ({ ...prev, isLoading: true }));
  setTimeout(() => {
    setIsInitializing(false); // 🔥 NEW: Critical addition
    setAuthState({ user: null, isLoading: false, error: null });
    setAppState(prev => ({ ...prev, view: 'app', onboardingStatus: 'login' }));
  }, 500);
  return;
}
```

#### Change 4: Fixed session expired handler
**Location**: Line ~315
```typescript
const handleSessionExpired = (event: Event) => {
  // ... existing logic ...
  setTimeout(() => {
    setIsInitializing(false); // 🔥 NEW: Critical addition
    setAuthState({ user: null, isLoading: false, error: null });
    setAppState((prev: AppState) => ({
      ...prev,
      view: 'app',
      onboardingStatus: 'login'
    }));
  }, 1500);
};
```

### File: `src/components/AppRouter.tsx`

#### Change 5: Added defensive fallback for logged-out users
**Location**: After line ~149 (after loading check, before authState.user check)
```typescript
// ✅ PWA FIX: Defensive check - if user is logged out, always show login screen
// This prevents black screen when states get out of sync
if (!authState.user && !authState.isLoading && appState.view === 'app') {
  console.log('🎯 [AppRouter] No user detected, forcing LoginSplashScreen render', {
    onboardingStatus: appState.onboardingStatus,
    view: appState.view,
    hasUser: !!authState.user,
    isLoading: authState.isLoading
  });
  return (
    <LoginSplashScreen
      onComplete={handleLoginComplete}
      onBackToLanding={handleBackToLanding}
      onSetAppState={() => {}}
    />
  );
}
```

## 🧪 Testing Checklist

### Test 1: Basic Logout Flow in PWA
- [ ] Install PWA
- [ ] Login with Account A
- [ ] Click settings → Logout
- [ ] **Expected**: Should immediately show login screen
- [ ] **Bug if**: Stays on chat screen or shows loading screen

### Test 2: Login with Different Account
- [ ] Install PWA and login with Account A
- [ ] Logout successfully
- [ ] Login with Account B
- [ ] Logout from Account B
- [ ] **Expected**: Should show login screen after logout
- [ ] **Bug if**: Stuck on chat screen

### Test 3: Close and Reopen After Logout
- [ ] Install PWA and login
- [ ] Logout from settings
- [ ] **Verify**: Login screen appears
- [ ] Close the PWA completely
- [ ] Reopen the PWA
- [ ] **Expected**: Login screen appears
- [ ] **Bug if**: Black screen or "Something went wrong"

### Test 4: Close Without Logout
- [ ] Install PWA and login
- [ ] Close the PWA WITHOUT logging out
- [ ] Wait 1 minute
- [ ] Reopen the PWA
- [ ] **Expected**: Should show main app (user still logged in) OR login screen if session expired
- [ ] **Bug if**: Black screen

### Test 5: Session Timeout
- [ ] Install PWA and login
- [ ] Leave app running for extended period (if session timeout is configured)
- [ ] **Expected**: Session expires, login screen appears
- [ ] **Bug if**: Black screen or stays on chat screen

### Test 6: Background/Foreground Cycling
- [ ] Install PWA and login
- [ ] Switch to another app (PWA goes to background)
- [ ] Wait 30+ seconds
- [ ] Switch back to PWA
- [ ] **Expected**: Either stays logged in OR shows login if session expired
- [ ] **Bug if**: Black screen

### Test 7: Clear Cache After Logout
- [ ] Install PWA and login
- [ ] Logout
- [ ] Open browser settings
- [ ] Clear cache/storage for the PWA
- [ ] Reopen PWA
- [ ] **Expected**: Login screen appears
- [ ] **Bug if**: Black screen

## 🔍 Debug Log Markers

When testing, look for these console logs to understand the flow:

### Successful Logout Flow:
```
🎯 [App] Starting logout process...
🧹 [App] Cleaning up DOM styles before logout...
🎯 [App] Dispatched otakon:user-logout event
🎯 [App] Logout completed, state set to: isInitializing=false, view=app, onboardingStatus=login
🎯 [AppRouter] Rendering LoginSplashScreen
```

### Successful PWA Reopen Flow:
```
📱 [PWA] App became visible, background duration: XXXX ms
📱 [PWA] Long background detected, refreshing auth state...
📱 [PWA] No session found after background, showing login
🎯 [AppRouter] Rendering LoginSplashScreen
```

### Defensive Fallback Trigger:
```
🎯 [AppRouter] No user detected, forcing LoginSplashScreen render
```

## 🚨 Important Notes

1. **PWA vs Mobile Browser**: These bugs ONLY occur in installed PWA, not in mobile browser. This is because PWA has different lifecycle events and session persistence behavior.

2. **State Management**: The key issue was that `isInitializing` is checked in AppRouter BEFORE checking `onboardingStatus`. If `isInitializing` is true, the loading screen shows and blocks the login screen from rendering.

3. **Defensive Programming**: The new fallback condition in AppRouter (`!authState.user && !authState.isLoading && appState.view === 'app'`) acts as a safety net. Even if something goes wrong with state management, this will force the login screen to show instead of a black screen.

4. **Mobile Browser Works Fine**: Mobile browsers don't have these issues because they don't persist state the same way PWAs do. When you close a mobile browser tab and reopen, it does a fresh page load.

## 📊 Impact Analysis

### Before Fix:
- ❌ Logout in PWA: User stuck on chat screen
- ❌ Reopen PWA after logout: Permanent black screen
- ❌ Auto-logout: Black screen
- ⚠️ Only fix: Uninstall and reinstall PWA

### After Fix:
- ✅ Logout in PWA: Immediate navigation to login screen
- ✅ Reopen PWA after logout: Login screen appears
- ✅ Auto-logout: Login screen appears
- ✅ Graceful handling of all logout scenarios

## 🎯 Related Files

- `src/App.tsx` - Main app state management and logout handler
- `src/components/AppRouter.tsx` - Routing logic and screen rendering
- `src/components/MainApp.tsx` - Settings menu and logout trigger
- `src/components/ui/SettingsContextMenu.tsx` - Logout button in settings

## 📚 Additional Context

### PWA Lifecycle
PWAs have three main states:
1. **Active**: App is open and visible
2. **Background**: App is minimized but still running
3. **Terminated**: App is closed and needs to reload

When a PWA is reopened from terminated state, it goes through:
1. Service worker activation
2. App initialization (App.tsx useEffect)
3. Auth state check
4. Visibility change event (if coming from background)

The bug occurred because the visibility change event would detect no session and set `onboardingStatus='login'`, but `isInitializing` remained `true`, preventing the login screen from rendering.

### Why Mobile Browser Works
In mobile browser:
- Each navigation is a full page reload
- No PWA lifecycle events
- Session check happens on page load, not on visibility change
- `isInitializing` is always set to `false` after auth check completes

In PWA:
- App stays loaded even when closed
- Visibility change events fire when reopened
- Session must be re-validated
- `isInitializing` can get stuck if not managed properly
