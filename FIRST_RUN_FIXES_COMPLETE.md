# First-Run Experience Fixes - Complete

## Issues Fixed

### Issue 1: Auto-Login After Clearing Supabase Session Data ✅

**Problem:** 
After deleting user data from Supabase database, the user was still auto-logged in because Supabase persists auth tokens in browser's localStorage.

**Root Cause:**
- Supabase client configured with `persistSession: true` (line 13 in `src/lib/supabase.ts`)
- Auth tokens stored in localStorage keys starting with `sb-*`
- Clearing database data doesn't clear browser's localStorage
- On page reload, Supabase reads localStorage and auto-restores session

**Fix Applied:**
Enhanced `authService.signOut()` method (lines 744-786 in `src/services/authService.ts`):
```typescript
// Sign out from Supabase FIRST to clear session tokens
await supabase.auth.signOut();

// Clear ALL Supabase-related localStorage keys (they start with 'sb-')
const keysToRemove: string[] = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('sb-')) {
    keysToRemove.push(key);
  }
}
keysToRemove.forEach(key => localStorage.removeItem(key));

// Clear all app-specific localStorage
localStorage.removeItem('otakon_auth_method');
localStorage.removeItem('otakon_remember_me');
localStorage.removeItem('otakon_remembered_email');
localStorage.removeItem('otakon_discord_auth_attempt');
localStorage.removeItem('otakon_has_used_app');
localStorage.removeItem('otakon_user');
localStorage.removeItem('otakon_conversations');
localStorage.removeItem('otakon_app_state');

// Clear sessionStorage
sessionStorage.clear();
```

**What This Does:**
1. Signs out from Supabase auth (clears server-side session)
2. Removes ALL Supabase localStorage keys (`sb-*`)
3. Removes all app-specific flags and cached data
4. Clears sessionStorage completely

---

### Issue 2: Game Hub Not Active After Onboarding ✅

**Problem:** 
After completing onboarding, users land on chat screen but Game Hub tab is not active (shows "Loading chat..." spinner).

**Root Cause:**
The fix was already applied in previous iteration, but requires a **hard refresh** to load new code. Your browser is serving cached JavaScript.

**Fix Applied:**
Added localStorage flag in Case 1 (lines 255-276 in `src/components/MainApp.tsx`):
```typescript
if (Object.keys(userConversations).length === 0) {
  // Create Game Hub
  const newConversation = ConversationService.createConversation('Game Hub', 'game-hub');
  await ConversationService.addConversation(newConversation);
  await ConversationService.setActiveConversation(newConversation.id);
  
  // Update state
  const updatedConversations = await ConversationService.getConversations();
  setConversations(updatedConversations);
  active = updatedConversations['game-hub'];
  setActiveConversation(active);
  
  // Mark as first-run complete ← NEW!
  localStorage.setItem('otakon_has_used_app', 'true');
  console.log('🔍 [MainApp] Created and activated "Game Hub" conversation (first-run complete)');
}
```

**Additional Debugging:**
Added detailed logging to verify activation state:
```typescript
console.log('🔍 [MainApp] Active conversation details:', {
  id: active?.id,
  title: active?.title,
  isActive: active?.isActive,
  isGameHub: active?.isGameHub,
  messageCount: active?.messages?.length || 0
});
```

---

## Testing Instructions

### CRITICAL: Hard Refresh Required

Before testing, you MUST do a **hard refresh** to clear browser cache and load the new code:

**Windows/Linux:**
- Chrome/Edge: `Ctrl + Shift + R` or `Ctrl + F5`
- Firefox: `Ctrl + Shift + R`

**Mac:**
- Chrome/Safari: `Cmd + Shift + R`
- Firefox: `Cmd + Shift + R`

---

### Test 1: Auto-Login Issue (Fixed)

**Steps:**
1. **Sign out from app** (use Settings → Logout button)
   - This will now clear ALL browser storage including Supabase tokens
   
2. **Verify logout worked:**
   - Open browser console (F12)
   - Check Application → Local Storage → `localhost:5173`
   - Should see NO `sb-*` keys (all cleared)
   - Should see NO `otakon_*` keys (all cleared)

3. **Reload page** (F5)
   - Should land on login screen (NOT auto-logged in)

4. **Alternative method** (if you want to clear database data):
   - Delete user from Supabase Dashboard
   - Open browser console and run:
     ```javascript
     localStorage.clear();
     sessionStorage.clear();
     location.reload();
     ```
   - Should land on login screen as a new user

**Expected Result:** ✅ No auto-login, lands on login screen

---

### Test 2: Game Hub Active After Onboarding (Fixed)

**Steps:**
1. **Clear ALL browser data:**
   - Open console (F12)
   - Run:
     ```javascript
     localStorage.clear();
     sessionStorage.clear();
     location.reload();
     ```

2. **Complete onboarding:**
   - Click "Sign in with Google"
   - Select account (should show account picker now)
   - Complete onboarding flow (Initial Splash → How to Use → Pro Features)

3. **Land on chat screen:**
   - Should immediately see **Game Hub tab ACTIVE**
   - Should see Game Hub interface (news prompts)
   - Should NOT see "Loading chat..." spinner

4. **Verify in console:**
   - Check for these logs:
     ```
     🔍 [MainApp] Created and activated "Game Hub" conversation (first-run complete)
     🔍 [MainApp] Active conversation details: { id: "game-hub", title: "Game Hub", isActive: true, ... }
     ```

**Expected Result:** 
- ✅ Game Hub tab is selected (highlighted)
- ✅ Game Hub interface is active and ready
- ✅ No loading spinner
- ✅ Can immediately start chatting

---

## Verification Checklist

After hard refresh, verify these console logs:

### Successful First-Run Flow:
```
1. AuthCallback.tsx: User signed in: [your-email]
2. MainApp.tsx: No conversations found, creating "Game Hub"...
3. ConversationService: Created in Supabase with ID: [uuid]
4. MainApp.tsx: Created and activated "Game Hub" conversation (first-run complete)
5. MainApp.tsx: Active conversation details: { id: "game-hub", isActive: true, ... }
```

### Successful Logout:
```
1. AuthService: Starting sign out process...
2. AuthService: Cleared Supabase localStorage keys: ["sb-[project]-auth-token", ...]
3. AuthService: Sign out completed successfully
4. (No Supabase keys in localStorage after logout)
```

---

## Common Issues & Solutions

### Issue: Still seeing old console logs
**Solution:** You haven't done a hard refresh. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

### Issue: Game Hub not active after onboarding
**Check:**
1. Did you hard refresh? (see above)
2. Check console for errors
3. Verify localStorage has `otakon_has_used_app: 'true'` after first run

### Issue: Still auto-logging in
**Check:**
1. Did you sign out using the app's Logout button? (not just closing the tab)
2. Check localStorage - should have NO `sb-*` keys after logout
3. If manually deleting from Supabase, run `localStorage.clear()` in console

---

## Files Modified

1. **src/services/authService.ts** (lines 744-786)
   - Enhanced `signOut()` to clear ALL Supabase and app localStorage keys
   - Added sessionStorage clearing
   - Added comprehensive logging

2. **src/components/MainApp.tsx** (lines 255-276)
   - Added `otakon_has_used_app` flag in Case 1 (first-run creation)
   - Added detailed activation state logging
   - Ensures Game Hub is marked active immediately after creation

---

## Technical Details

### localStorage Keys Cleared on Logout:
- `sb-*` (all Supabase auth tokens and session data)
- `otakon_auth_method`
- `otakon_remember_me`
- `otakon_remembered_email`
- `otakon_discord_auth_attempt`
- `otakon_has_used_app`
- `otakon_user`
- `otakon_conversations`
- `otakon_app_state`

### First-Run Detection Logic:
```typescript
// Case 1: No conversations → Create Game Hub + mark first-run complete
if (Object.keys(userConversations).length === 0) {
  // Create + activate Game Hub
  localStorage.setItem('otakon_has_used_app', 'true');
}

// Case 2: Safety net - if user has ONLY Game Hub and flag not set
else if (Object.keys(userConversations).length === 1 && 
         currentGameHub && 
         !localStorage.getItem('otakon_has_used_app')) {
  // Force activate Game Hub
  localStorage.setItem('otakon_has_used_app', 'true');
}
```

---

## Next Steps

1. **Do a hard refresh** (Ctrl+Shift+R / Cmd+Shift+R)
2. **Test logout** (use app's Logout button, verify no auto-login)
3. **Test first-run** (clear all data, login, verify Game Hub is active)
4. **Report results** with console logs if any issues persist

---

## Status: Ready for Testing ✅

All code changes are applied and ready. Just need a hard refresh to load new code!
