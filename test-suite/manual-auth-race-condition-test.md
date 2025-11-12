# Manual Test Suite: P0.1 Race Condition Fix

**Test Date:** October 24, 2025  
**Tester:** _____________  
**Build Version:** 1.0.0  
**Environment:** □ Staging  □ Production

---

## Pre-Test Setup

### 1. Test User Accounts Needed
Create the following test accounts if they don't exist:

```
Test User 1 (Valid):
- Email: test-race-condition@otakon.ai
- Password: TestPass123!

Test User 2 (Invalid):
- Email: invalid-test@otakon.ai
- Password: WrongPassword123!
```

### 2. Browser Setup
- Use Chrome/Edge with DevTools open
- Clear browser cache and localStorage
- Open Network tab to monitor requests
- Open Console tab to check for errors

### 3. Starting Point
- Navigate to: https://your-app-url.com
- You should see the login/landing screen

---

## Test Cases

### ✅ TEST 1: Successful Sign-In (Primary Fix Validation)

**Purpose:** Verify `onComplete()` is called AFTER authentication completes

**Steps:**
1. Navigate to login screen
2. Enter valid credentials:
   - Email: `test-race-condition@otakon.ai`
   - Password: `TestPass123!`
3. Check "Remember me" checkbox
4. Open DevTools Console
5. Click "Sign In" button
6. **Watch carefully for:**
   - Loading spinner appears immediately
   - No flash/flicker between login and app screens
   - No redirect back to login screen

**Expected Results:**
- ✅ Loading spinner shows during authentication
- ✅ User navigates directly to app after auth completes
- ✅ No infinite loop (stays on app screen)
- ✅ No flash effect (smooth transition)
- ✅ Console shows no errors
- ✅ localStorage contains remembered email

**Actual Results:**
- [ ] PASS  [ ] FAIL
- Notes: _________________________________

**Timing Check:**
- Time from click to navigation: _______ seconds (should be 1-3 seconds)
- Did you see login screen flash? [ ] YES  [ ] NO

---

### ✅ TEST 2: Failed Sign-In (Error Handling)

**Purpose:** Verify failed auth doesn't call `onComplete()`

**Steps:**
1. Navigate to login screen
2. Enter invalid credentials:
   - Email: `invalid-test@otakon.ai`
   - Password: `WrongPassword123!`
3. Click "Sign In" button
4. **Watch for:**
   - Error message appears
   - User stays on login screen
   - No navigation to app

**Expected Results:**
- ✅ Error message: "Authentication failed. Please try again."
- ✅ User remains on login screen
- ✅ No navigation to app screen
- ✅ Can retry sign-in without reload

**Actual Results:**
- [ ] PASS  [ ] FAIL
- Error message shown: _________________________________

---

### ✅ TEST 3: Network Interruption

**Purpose:** Verify race condition doesn't occur on network errors

**Steps:**
1. Navigate to login screen
2. Open DevTools → Network tab
3. Enable "Offline" mode (or throttle to "Offline")
4. Enter valid credentials
5. Click "Sign In"
6. **Watch for:**
   - Request fails
   - Error message appears
   - No navigation attempted

**Expected Results:**
- ✅ Network request fails (visible in Network tab)
- ✅ Error message displayed
- ✅ User stays on login screen
- ✅ No race condition or crash

**Actual Results:**
- [ ] PASS  [ ] FAIL
- Notes: _________________________________

---

### ✅ TEST 4: Slow Network (Race Condition Stress Test)

**Purpose:** Verify fix works even with slow network

**Steps:**
1. Navigate to login screen
2. Open DevTools → Network tab
3. Set throttling to "Slow 3G"
4. Enter valid credentials
5. Click "Sign In"
6. **Watch carefully for:**
   - Loading spinner shows for extended time
   - No premature navigation
   - Navigation only after auth completes

**Expected Results:**
- ✅ Loading spinner visible for 3-10 seconds
- ✅ No navigation until auth completes
- ✅ Smooth transition to app after long wait
- ✅ No flash or redirect back to login

**Actual Results:**
- [ ] PASS  [ ] FAIL
- Loading time: _______ seconds
- Did navigation wait for auth? [ ] YES  [ ] NO

---

### ✅ TEST 5: Remember Me Functionality

**Purpose:** Verify remember me works with the fix

**Steps:**
1. Navigate to login screen
2. Enter valid credentials
3. Check "Remember me" checkbox
4. Click "Sign In"
5. After successful login, check localStorage:
   - Open DevTools → Application → Local Storage
   - Look for `otakon_remember_me` and `otakon_remembered_email`
6. Sign out
7. Navigate back to login screen
8. **Verify:**
   - Email field pre-filled
   - Remember me checkbox checked

**Expected Results:**
- ✅ localStorage contains `otakon_remember_me = "true"`
- ✅ localStorage contains `otakon_remembered_email = "test-race-condition@otakon.ai"`
- ✅ Email pre-filled on return to login
- ✅ Remember me checkbox pre-checked

**Actual Results:**
- [ ] PASS  [ ] FAIL
- localStorage values: _________________________________

---

### ✅ TEST 6: Sign-Up Flow (Unchanged Behavior)

**Purpose:** Verify sign-up flow still works correctly

**Steps:**
1. Navigate to sign-up screen
2. Enter new email: `test-signup-[timestamp]@otakon.ai`
3. Enter password: `TestPass123!`
4. Click "Sign Up"
5. **Watch for:**
   - Success modal appears
   - No immediate navigation
   - Modal message about email confirmation

**Expected Results:**
- ✅ Success modal displays
- ✅ Message: "Please check your email and click the confirmation link..."
- ✅ No navigation to app (stays on sign-up screen with modal)
- ✅ Modal can be dismissed

**Actual Results:**
- [ ] PASS  [ ] FAIL
- Modal message: _________________________________

---

### ✅ TEST 7: Multiple Rapid Sign-In Attempts

**Purpose:** Verify no race condition with rapid clicks

**Steps:**
1. Navigate to login screen
2. Enter valid credentials
3. Click "Sign In" button **3 times rapidly** (spam-click)
4. **Watch for:**
   - Only one auth request sent
   - No duplicate navigation
   - Clean single transition

**Expected Results:**
- ✅ Only ONE network request in DevTools
- ✅ Single navigation to app
- ✅ No errors or crashes
- ✅ Loading state prevents multiple clicks

**Actual Results:**
- [ ] PASS  [ ] FAIL
- Number of requests: _______
- Notes: _________________________________

---

### ✅ TEST 8: Browser Back Button After Login

**Purpose:** Verify race condition doesn't occur on back navigation

**Steps:**
1. Successfully sign in (from TEST 1)
2. Wait for app to load fully
3. Click browser back button
4. **Watch for:**
   - App handles back navigation gracefully
   - No return to login screen (if app design prevents it)
   - OR proper return to login with sign-out

**Expected Results:**
- ✅ Back button handled appropriately
- ✅ No race condition or error
- ✅ No infinite loop

**Actual Results:**
- [ ] PASS  [ ] FAIL
- Behavior: _________________________________

---

## Regression Tests (Ensure Nothing Broke)

### ✅ TEST 9: OAuth Sign-In (Google/Social)

**Purpose:** Verify OAuth flow still works

**Steps:**
1. Navigate to login screen
2. Click "Sign in with Google" (or other OAuth provider)
3. Complete OAuth flow
4. **Watch for:**
   - OAuth popup/redirect works
   - User navigates to app after auth

**Expected Results:**
- ✅ OAuth flow completes
- ✅ User navigates to app
- ✅ No errors

**Actual Results:**
- [ ] PASS  [ ] FAIL  [ ] SKIP (if no OAuth configured)
- Notes: _________________________________

---

### ✅ TEST 10: Session Persistence

**Purpose:** Verify existing session still works

**Steps:**
1. Sign in successfully
2. Close browser completely
3. Reopen browser
4. Navigate to app URL
5. **Watch for:**
   - User still logged in (session persisted)
   - No redirect to login screen

**Expected Results:**
- ✅ User remains logged in
- ✅ App loads normally
- ✅ No auth errors

**Actual Results:**
- [ ] PASS  [ ] FAIL
- Notes: _________________________________

---

## Performance Validation

### ✅ TEST 11: Console Error Check

**Purpose:** Ensure no new errors introduced

**Steps:**
1. Open DevTools → Console
2. Clear console
3. Perform TEST 1 (successful sign-in)
4. Review console for errors

**Expected Results:**
- ✅ No TypeScript errors
- ✅ No React errors
- ✅ No authentication errors
- ✅ Only info/debug logs (if any)

**Actual Results:**
- [ ] PASS  [ ] FAIL
- Errors found: _________________________________

---

### ✅ TEST 12: Network Request Analysis

**Purpose:** Verify proper request ordering

**Steps:**
1. Open DevTools → Network tab
2. Clear network log
3. Perform sign-in
4. Review request order:
   - `signInWithEmail` or auth request
   - Subsequent app data requests

**Expected Results:**
- ✅ Auth request completes BEFORE app data requests
- ✅ No duplicate auth requests
- ✅ Proper HTTP status codes (200 for success)

**Actual Results:**
- [ ] PASS  [ ] FAIL
- Request order: _________________________________

---

## Test Summary

**Total Tests:** 12  
**Passed:** _______  
**Failed:** _______  
**Skipped:** _______

**Overall Result:** □ PASS  □ FAIL

---

## Critical Issues Found

**Issue #1:**
- Description: _________________________________
- Severity: □ CRITICAL  □ HIGH  □ MEDIUM  □ LOW
- Steps to reproduce: _________________________________

**Issue #2:**
- Description: _________________________________
- Severity: □ CRITICAL  □ HIGH  □ MEDIUM  □ LOW
- Steps to reproduce: _________________________________

---

## Sign-Off

**Tester Name:** _____________  
**Date:** _____________  
**Time Spent:** _______ minutes

**Recommendation:**
- □ Approve for production deployment
- □ Minor issues found, can deploy with monitoring
- □ Major issues found, requires fixes before deployment
- □ Critical issues found, DO NOT DEPLOY

**Notes:**
_________________________________
_________________________________
_________________________________

---

## Automated Test Script (Optional)

If you want to run automated tests later, you can use this Playwright script:

```typescript
// Save as: test-suite/auth-race-condition.spec.ts
import { test, expect } from '@playwright/test';

test.describe('P0.1 Race Condition Fix', () => {
  test('should not navigate before auth completes', async ({ page }) => {
    await page.goto('https://your-app-url.com');
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'test-race-condition@otakon.ai');
    await page.fill('input[type="password"]', 'TestPass123!');
    
    // Track navigation attempts
    let navigationCount = 0;
    page.on('framenavigated', () => navigationCount++);
    
    // Click sign in
    await page.click('button:has-text("Sign In")');
    
    // Wait for auth to complete
    await page.waitForURL('**/app', { timeout: 5000 });
    
    // Should only navigate once (to app)
    expect(navigationCount).toBe(1);
  });
  
  test('should stay on login screen on auth failure', async ({ page }) => {
    await page.goto('https://your-app-url.com');
    
    // Invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'WrongPassword');
    
    // Click sign in
    await page.click('button:has-text("Sign In")');
    
    // Wait for error
    await page.waitForSelector('text=Authentication failed', { timeout: 5000 });
    
    // Should still be on login screen
    expect(page.url()).toContain('login');
  });
});
```

To install Playwright:
```bash
npm install -D @playwright/test
npx playwright install
npm run test:e2e
```
