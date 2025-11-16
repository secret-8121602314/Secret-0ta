# PWA Testing Quick Reference

## 🧪 Quick Test Scenarios

### 1. Test Login in PWA Mode

#### Chrome Desktop
```bash
# Install PWA:
1. Open https://readmet3xt.github.io/otakon-cursor/Otagon/
2. Click browser menu (⋮)
3. Click "Install Otagon"
4. Launch from desktop/start menu
5. Test Google login
6. Test Discord login
7. Close and reopen - verify still logged in
```

#### Chrome Android
```bash
# Install PWA:
1. Open app URL in Chrome
2. Tap "Add to Home screen" from menu
3. Launch from home screen
4. Test Google login
5. Test Discord login
6. Close completely and reopen
7. Verify session persists
```

#### Safari iOS
```bash
# Install PWA:
1. Open app URL in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Launch from home screen
5. Test Google login
6. Test Discord login
7. Force close app
8. Reopen - verify session persists
```

---

### 2. Test Network Reconnection

```bash
# Test Steps:
1. Login to app (browser or PWA)
2. Open DevTools > Network tab
3. Enable "Offline" mode
4. Wait 5 seconds
5. Disable "Offline" mode
6. Verify toast shows "Back online!"
7. Verify app continues working
8. Check console for session refresh
```

**Expected Console Output:**
```
🌐 [NetworkStatus] Network reconnected
🔐 [NetworkStatus] Refreshing session after reconnection...
✅ [NetworkStatus] Session refreshed successfully
```

---

### 3. Test Token Refresh

```bash
# Test Steps:
1. Login to app
2. Open DevTools > Application > Storage > Local Storage
3. Find key starting with "sb-"
4. Note the "expires_at" timestamp
5. Wait until token expires (or manually trigger)
6. Perform any action (send message)
7. Check console for token refresh
8. Verify app continues working
```

**Expected Console Output:**
```
🔐 [Supabase] Global auth event: TOKEN_REFRESHED
✅ [Supabase] Session refreshed/established
🔐 [App] Token refreshed, updating user data
```

---

### 4. Test Cross-Tab Behavior

```bash
# Test Steps:
1. Open app in Tab A
2. Login in Tab A
3. Open app in Tab B (new tab)
4. Verify Tab B shows logged in
5. Logout from Tab A
6. Check Tab B - should also logout
7. Login in Tab B
8. Check Tab A - should show logged in
```

---

### 5. Test PWA Update

```bash
# Test Steps (requires deployment):
1. Install PWA from version 1
2. Deploy version 2 with changes
3. Reload PWA
4. Verify update prompt appears
5. Accept update
6. Verify app reloads
7. Verify new version is active
```

---

### 6. Test OAuth in PWA

```bash
# Chrome Desktop PWA:
1. Install and launch PWA
2. Click "Sign in with Google"
3. Complete Google OAuth
4. Verify redirect back to PWA
5. Verify logged in
6. Close PWA
7. Reopen - verify still logged in

# Repeat for Discord:
1. Logout from Google
2. Click "Sign in with Discord"
3. Complete Discord OAuth
4. Verify redirect back to PWA
5. Verify logged in
```

---

### 7. Test Service Worker Cache

```bash
# Test Steps:
1. Login to app (PWA or browser)
2. Open DevTools > Application > Service Workers
3. Verify service worker registered
4. Go to Cache Storage
5. Verify these caches exist:
   - otakon-v1.3.0-pwa-fixes
   - otakon-chat-v1.3.0
   - otakon-static-v1.3.0
   - otakon-api-v1.3.0
   - otakon-auth-v1.3.0
6. Enable offline mode
7. Reload app
8. Verify cached content loads
```

---

## 🔍 Debugging Tools

### Check PWA Mode
```javascript
// In DevTools Console:
window.matchMedia('(display-mode: standalone)').matches
// Returns: true if PWA, false if browser
```

### Check Auth State
```javascript
// In DevTools Console:
localStorage.getItem('otakon_session_refreshed')
localStorage.getItem('otakon_last_session_check')
// Should show timestamps if logged in
```

### Check Service Worker
```javascript
// In DevTools Console:
navigator.serviceWorker.controller
// Should show ServiceWorker object if active

navigator.serviceWorker.getRegistrations()
// Should show array with registration
```

### Trigger Session Refresh
```javascript
// In DevTools Console:
import { supabase } from './lib/supabase'
supabase.auth.refreshSession()
// Manually trigger token refresh
```

---

## 🐛 Common Issues & Solutions

### Issue: "Service Worker registration failed"
**Solution**: Check that sw.js exists in public folder

### Issue: "OAuth redirect loops in PWA"
**Solution**: Clear browser cache and reinstall PWA

### Issue: "Session not persisting"
**Solution**: 
1. Check localStorage for "sb-*" keys
2. Verify Supabase URL/key in .env.local
3. Check browser console for errors

### Issue: "Network reconnection not working"
**Solution**:
1. Verify online/offline events firing
2. Check useNetworkStatus hook is imported
3. Verify Supabase client has autoRefreshToken: true

### Issue: "Token refresh not happening"
**Solution**:
1. Check console for "TOKEN_REFRESHED" event
2. Verify global auth listener in supabase.ts
3. Check token expiry time in localStorage

---

## 📊 Performance Checks

### Page Load Speed
```bash
# Lighthouse Audit:
1. Open DevTools
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Click "Generate report"
5. Verify score > 90
```

### Service Worker Performance
```bash
# Check SW startup time:
1. DevTools > Application > Service Workers
2. Click "Update"
3. Note "Installing" to "Activated" time
4. Should be < 2 seconds
```

### Auth Flow Speed
```bash
# Time the full auth flow:
1. Start timer
2. Click login button
3. Complete OAuth
4. Note when app loads
5. Should be < 5 seconds total
```

---

## ✅ Validation Checklist

Before marking as complete, verify:

**Authentication**
- [ ] Google OAuth works in browser
- [ ] Google OAuth works in PWA
- [ ] Discord OAuth works in browser
- [ ] Discord OAuth works in PWA
- [ ] Email login works
- [ ] Session persists on reload
- [ ] Logout clears all data

**PWA Features**
- [ ] App installs correctly
- [ ] Manifest loads without errors
- [ ] Icons display properly
- [ ] Standalone mode detected
- [ ] Service worker registers

**Session Management**
- [ ] Token auto-refreshes
- [ ] Network reconnection works
- [ ] Offline mode works
- [ ] Cross-tab sync works
- [ ] Auth cache persists

**User Experience**
- [ ] No console errors
- [ ] Toast notifications work
- [ ] Loading states show
- [ ] Error messages clear
- [ ] Smooth transitions

---

## 🚀 Production Deployment

### Pre-Deployment
```bash
1. Run all tests above
2. Check no console errors
3. Verify service worker version bumped
4. Test in incognito mode
5. Test on mobile devices
```

### Post-Deployment
```bash
1. Monitor error logs for 1 hour
2. Check Supabase auth logs
3. Verify SW registration succeeds
4. Check user feedback
5. Monitor analytics for issues
```

### Rollback Triggers
Roll back if:
- Auth failures > 5%
- SW registration failures > 10%
- Token refresh failures > 2%
- User complaints > 3 in first hour

---

## 📞 Support Information

If issues persist:
1. Check `PWA_CRITICAL_FIXES.md` for detailed info
2. Review `PWA_IMPLEMENTATION_COMPLETE.md` for changes
3. Check browser console for errors
4. Verify Supabase dashboard for auth logs
5. Test in incognito/private mode to rule out cache issues
