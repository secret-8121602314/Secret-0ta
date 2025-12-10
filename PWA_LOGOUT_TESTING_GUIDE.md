# PWA Logout Testing Guide

## Quick Test Steps

### Test 1: Basic PWA Logout (30 seconds)
1. Install PWA on your phone
2. Login with any account
3. Go to Settings → Click Logout
4. ✅ **Expected:** App reloads automatically and shows login screen
5. ✅ **Expected:** No chat screen visible, no black screen

**If this fails:** Check console for errors with 🔐 or 🎯 emoji

---

### Test 2: Account Switching (1 minute)
1. Login with Account A in PWA
2. Logout (app reloads)
3. Login with Account B
4. ✅ **Expected:** See Account B's conversations only
5. Check Settings menu
6. ✅ **Expected:** Shows "Upgrade to Pro" (not "Start Pro Trial") if Account B never had trial
7. Logout again
8. Login with Account A
9. ✅ **Expected:** See Account A's conversations

**If conversations mix:** Check console for "🔒 Conversation caches cleared"

---

### Test 3: PWA Close and Reopen After Logout (45 seconds)
1. Login in PWA
2. Logout (app reloads to login screen)
3. **Close the PWA app completely** (swipe away from recent apps)
4. Wait 5 seconds
5. **Reopen the PWA**
6. ✅ **Expected:** Login screen appears immediately (within 2-3 seconds)
7. ✅ **Expected:** No black screen at any point
8. ✅ **Expected:** No infinite loading spinner

**If black screen appears:** This was the main bug - check if fix was applied correctly

---

### Test 4: Background and Return (1 minute)
1. Login in PWA
2. Switch to another app for 30 seconds
3. Return to PWA
4. ✅ **Expected:** App still logged in and working
5. Now logout
6. Switch to another app for 10 seconds
7. Return to PWA
8. ✅ **Expected:** Login screen shows (not black screen)

---

### Test 5: Mobile Browser (Not PWA) - Baseline Test (30 seconds)
1. Open app in Chrome/Safari (not installed PWA)
2. Login
3. Logout
4. ✅ **Expected:** Login screen shows immediately (no reload)
5. Login again
6. ✅ **Expected:** Works normally

**Purpose:** Verify web browser still works as expected

---

## What To Look For

### ✅ **Success Indicators:**
- Login screen appears within 2-3 seconds after logout or reopen
- No black screen at any point
- Settings menu shows correct trial status for each account
- Conversations don't mix between accounts
- Console shows "🎯 [App] Logout completed" messages

### ❌ **Failure Indicators:**
- Black screen for >5 seconds
- App stuck with loading spinner
- Still see chat screen after logout
- Account B sees Account A's conversations
- Settings menu shows wrong trial status
- Console shows errors with "race condition" or "auth state"

---

## Console Log Guide

**Good logs to see:**
```
🎯 [App] Starting logout process...
🧹 [App] SessionStorage cleared to prevent state restoration
🎯 [App] Dispatched otakon:user-logout event
🔐 [AuthService] Auth state cleared immediately
🔒 [AuthService] Conversation caches cleared - no data leakage
📱 [PWA] Forcing full reload after logout to clear state
```

**After reopen:**
```
📱 [PWA] Just logged out flag detected, clearing and showing login
```

**Bad logs (indicate bugs):**
```
🔐 [App] SIGNED_OUT event ignored - logout already in progress  ❌ Should not appear
⏰ [App] Initialization timeout reached  ❌ Should not happen on logout
```

---

## Quick Debug Commands

**If stuck in black screen:**
Open Chrome DevTools → Console → Run:
```javascript
localStorage.getItem('otakon_just_logged_out')  // Should be 'true' or null
localStorage.getItem('sb-') // Should be no keys starting with 'sb-'
sessionStorage.length  // Should be 0 after logout
```

**Force recovery from black screen:**
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## Edge Cases to Test (Optional)

1. **Logout during network offline:** Should still work
2. **Logout with pending messages:** Should cancel and clear
3. **Multiple rapid logouts:** Should handle gracefully
4. **Logout while file uploading:** Should cancel upload

---

## Performance Benchmarks

- **Logout to reload:** <500ms
- **Reopen to login screen:** <3 seconds
- **Account switch:** <2 seconds
- **No memory leaks:** Check Chrome DevTools Memory tab

---

## Summary

The critical test is **Test 3** - PWA close and reopen after logout. This was the main bug causing black screens. All other tests verify the fix didn't break anything else.

**Total testing time:** ~5 minutes for all core tests
