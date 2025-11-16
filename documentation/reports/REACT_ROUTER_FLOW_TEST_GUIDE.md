# React Router Flow Testing Guide

## Overview
This guide walks through testing the complete authentication and routing flow with React Router. All loaders now include detailed console logging with emojis to track the flow.

## Console Log Legend
- 🔐 **authLoader** - Authentication check
- ✅ **authLoader** - Session found
- ❌ **Error or auth failure**
- 👤 **User data loaded**
- 🎓 **Onboarding flow**
- 🎯 **Target route determined**
- 📍 **Redirect triggered**
- 🚀 **Main app access**
- ⏸️ **Onboarding blocking**

## Test Scenarios

### Test 1: Unauthenticated User Landing Flow
**Expected behavior:** User without session stays on landing page

**Steps:**
1. Open browser DevTools (F12) and go to Console tab
2. Clear all data/logout if needed: Open `Application` → `Storage` → Clear Site Data
3. Navigate to `http://localhost:5173/`
4. Expected console output:
   ```
   [Router authLoader] 🔐 Checking auth for path: /
   [Router authLoader] ❌ No session found, user not authenticated
   [LandingPageRoute] Component rendered, current URL: http://localhost:5173/
   ```

**Verification:**
- ✅ Landing page renders
- ✅ "Get Started" button visible
- ✅ Footer links (About, Privacy, Terms, Refund) work with modal URLs

---

### Test 2: Direct Access to Protected Routes (Unauthenticated)
**Expected behavior:** Unauthenticated user trying to access protected routes gets redirected to landing

**Steps:**
1. Open DevTools Console
2. Navigate directly to: `http://localhost:5173/app`
3. Expected console output:
   ```
   [Router authLoader] 🔐 Checking auth for path: /app
   [Router authLoader] ❌ No session found, user not authenticated
   [Router authLoader] 📍 Redirecting to landing page
   ```

**Verification:**
- ✅ Redirects to landing page (`/`)
- ✅ No app content visible
- ✅ Can click "Get Started" to login

---

### Test 3: Direct Access to Onboarding (Unauthenticated)
**Expected behavior:** Should redirect to landing page since not authenticated

**Steps:**
1. Navigate to: `http://localhost:5173/onboarding/welcome`
2. Expected console output:
   ```
   [Router authLoader] 🔐 Checking auth for path: /onboarding/welcome
   [Router authLoader] ❌ No session found, user not authenticated
   [Router authLoader] 📍 Redirecting to landing page
   ```

**Verification:**
- ✅ Redirects to landing page

---

### Test 4: Login Flow
**Expected behavior:** Complete OAuth flow and progress to onboarding

**Steps:**
1. On landing page, click "Get Started"
2. Navigate to login: `http://localhost:5173/login`
3. Console should show:
   ```
   [Router authLoader] 🔐 Checking auth for path: /login
   [Router authLoader] ❌ No session found, user not authenticated
   [LoginRoute] Component rendering...
   ```
4. Click "Sign in with Google" and complete OAuth
5. After successful OAuth, watch console for:
   ```
   [Router authLoader] 🔐 Checking auth for path: /auth/callback
   [Router authLoader] ✅ Session found for user: your.email@gmail.com
   [Router authLoader] 👤 Loaded user: your.email@gmail.com | Onboarding status: initial
   ```

**Verification:**
- ✅ OAuth popup appears
- ✅ Session is created in Supabase
- ✅ Redirects to `/onboarding/welcome` after login

---

### Test 5: Onboarding Sequence Flow
**Expected behavior:** User progresses through onboarding steps in correct order

**Steps:**

#### Step 5a: Initial Onboarding (Welcome)
1. After login, should be at `/onboarding/welcome`
2. Console output:
   ```
   [Router authLoader] ✅ Session found...
   [Router onboardingLoader] 🎓 Processing onboarding for: your.email@gmail.com | Status: initial
   [Router onboardingLoader] 🎯 Target route: /onboarding/welcome | Current path: /onboarding/welcome
   [Router onboardingLoader] ✅ Correct onboarding step, rendering
   [InitialOnboardingRoute] Component rendered
   ```
3. Click "Next" or "Continue" button
4. Expected redirect to `/onboarding/how-to-use`

**Verification:**
- ✅ Welcome splash screen renders
- ✅ Can proceed to next step

#### Step 5b: How-to-Use
1. At `/onboarding/how-to-use`
2. Console output:
   ```
   [Router onboardingLoader] 🎯 Target route: /onboarding/how-to-use | Current path: /onboarding/how-to-use
   [Router onboardingLoader] ✅ Correct onboarding step, rendering
   [HowToUseRoute] Component rendered
   ```
3. Skip or complete PC connection setup
4. Should redirect to `/onboarding/features`

**Verification:**
- ✅ Connection setup screen renders
- ✅ Skip button works

#### Step 5c: Features Tutorial
1. At `/onboarding/features`
2. Console output:
   ```
   [Router onboardingLoader] 🎯 Target route: /onboarding/features | Current path: /onboarding/features
   ```
3. Click "Next"
4. Redirects to `/onboarding/pro-features`

#### Step 5d: Pro Features
1. At `/onboarding/pro-features`
2. Can click "Skip" or "Upgrade"
3. Both should complete onboarding and redirect to `/app`

**Final console output:**
```
[Router authLoader] ✅ Session found...
[Router appLoader] 🚀 Attempting to access /app | User: your.email@gmail.com | Onboarding: complete
[Router appLoader] ✅ Onboarding complete, loading main app
[MainAppRoute] Component rendered
```

---

### Test 6: Accessing Onboarding Step Out of Order
**Expected behavior:** Should redirect to correct onboarding step based on status

**Steps:**
1. Complete onboarding up to "How-to-Use" step
2. Try to skip ahead: Navigate directly to `http://localhost:5173/onboarding/pro-features`
3. Expected console:
   ```
   [Router onboardingLoader] 🎓 Processing onboarding for: your.email@gmail.com | Status: how-to-use
   [Router onboardingLoader] 🎯 Target route: /onboarding/how-to-use | Current path: /onboarding/pro-features
   [Router onboardingLoader] 📍 Redirecting from /onboarding/pro-features to /onboarding/how-to-use
   ```

**Verification:**
- ✅ Redirects to correct current step
- ✅ Cannot skip ahead

---

### Test 7: Completed Onboarding - Access Main App
**Expected behavior:** User with completed onboarding can access main app directly

**Steps:**
1. After completing full onboarding, you're at `/app`
2. Try navigating to `/onboarding/welcome` while onboarding is complete
3. Expected console:
   ```
   [Router onboardingLoader] 🎓 Processing onboarding for: your.email@gmail.com | Status: complete
   [Router onboardingLoader] ✅ Onboarding complete, redirecting to /app
   ```

**Verification:**
- ✅ Redirects back to `/app`
- ✅ Cannot go back to onboarding once complete

---

### Test 8: Logout and Re-login Flow
**Expected behavior:** After logout, session is cleared and user returns to landing

**Steps:**
1. In main app, click logout button
2. Console should show:
   ```
   [Router authLoader] 🔐 Checking auth for path: /
   [Router authLoader] ❌ No session found, user not authenticated
   [LandingPageRoute] Component rendered
   ```

**Verification:**
- ✅ Logs out successfully
- ✅ Session is cleared
- ✅ Returns to landing page
- ✅ Can login again and restart onboarding

---

### Test 9: Modal URL Persistence Through Navigation
**Expected behavior:** Modal URLs are preserved during navigation

**Steps:**
1. On landing page, click "About" link in footer
2. URL changes to `/?modal=about`
3. Refresh page (Ctrl+R)
4. Expected console + behavior:
   ```
   [LandingPageRoute] Component rendered, current URL: http://localhost:5173/?modal=about
   [LandingPageRoute] Modal from URL: about
   ```
5. AboutModal should open immediately after page loads

**Verification:**
- ✅ Modal opens from URL parameter
- ✅ URL persists across refresh
- ✅ Browser back button closes modal and removes query param

---

### Test 10: Invalid URLs
**Expected behavior:** Invalid URLs redirect to appropriate page

**Steps:**
1. Navigate to `http://localhost:5173/invalid-route`
2. Expected console:
   ```
   [Router] Catch-all route matched, redirecting to /
   ```

**Verification:**
- ✅ Redirects to landing page

---

## Debugging Tips

### Check Session Status
In browser console:
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
```

### Check User Data
In browser console:
```javascript
const { data: userData } = await supabase
  .from('users')
  .select('*')
  .eq('auth_user_id', session.user.id)
  .single();
console.log('User data:', userData);
```

### Check Onboarding Status
In browser console:
```javascript
const appState = userData.app_state;
console.log('Onboarding status:', appState?.onboardingStatus);
```

### Monitor All Router Logs
Filter console by "Router":
1. DevTools Console
2. Type "Router" in the search box
3. All routing logs will be highlighted

---

## Common Issues & Solutions

### Issue: "Stays on landing page after login"
- **Check:** Look for 🎯 and 📍 logs in authLoader
- **Solution:** Make sure onboarding status is set correctly in database. Check that `app_state.onboardingStatus` is one of: `initial`, `how-to-use`, `features-connected`, `pro-features`, `complete`

### Issue: "Cannot access /app even after onboarding"
- **Check:** Look for ⏸️ logs in appLoader
- **Solution:** Ensure `app_state.onboardingStatus = 'complete'` in database for your user

### Issue: "Redirects to wrong onboarding step"
- **Check:** Look for 🎯 logs showing target route
- **Solution:** Check that `onboardingStatus` in `app_state` matches the route

### Issue: "Can't logout"
- **Check:** Console for any errors
- **Solution:** Clear browser storage and refresh

---

## Performance Notes

- **authLoader:** Runs on every route change, fetches user data from Supabase
- **onboardingLoader:** Runs on all `/onboarding/*` routes
- **appLoader:** Runs on `/app` routes
- Each loader can add 100-300ms latency depending on network

**Optimization opportunities for future:**
- Cache user data in context to avoid repeated fetches
- Add caching strategy in loaders
- Prefetch user data on landing page

