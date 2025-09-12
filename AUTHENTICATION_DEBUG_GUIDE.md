# 🔍 Authentication Debugging Guide

## Current Issues:
- ❌ Emails not getting added to Supabase
- ❌ Authentication flow going back to landing page
- ❌ Not sure if authentication happened

## 🚨 Immediate Debugging Steps:

### Step 1: Check Supabase Database
Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Check if any users exist in auth.users table
SELECT id, email, created_at, email_confirmed_at, last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- Check if any users exist in public.users table
SELECT auth_user_id, email, tier, created_at, updated_at
FROM public.users 
ORDER BY created_at DESC
LIMIT 10;

-- Check if the trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### Step 2: Check Browser Console
1. Open your app: `http://localhost:5173`
2. Open browser console (F12)
3. Look for these logs:
   - `🔐 Validating existing session...`
   - `🔐 Session validated successfully`
   - `✅ User authenticated, checking onboarding status...`
   - `🔍 Auth Debug:` (with user data)

### Step 3: Check Authentication State
In browser console, run:
```javascript
console.log('Auth state:', window.authService?.getAuthState());
console.log('Current user:', window.authService?.getCurrentUserId());
console.log('Auth method:', localStorage.getItem('otakonAuthMethod'));
console.log('Skipped landing:', localStorage.getItem('otakonSkippedLanding'));
```

### Step 4: Test Fresh Authentication
1. Clear all data:
```javascript
localStorage.clear();
location.reload();
```

2. Try signing in with Google/Discord
3. Check if user gets created in Supabase

## 🔧 Common Issues and Solutions:

### Issue 1: No users in auth.users table
**Cause:** Authentication providers not configured
**Solution:** 
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google and Discord providers
3. Add OAuth app credentials

### Issue 2: Users in auth.users but not in public.users
**Cause:** Trigger not working or RLS policies blocking insert
**Solution:**
1. Check if trigger exists (run SQL above)
2. Check RLS policies
3. Manually create user record if needed

### Issue 3: Authentication going back to landing page
**Cause:** User data not loading (406 errors) or landing page preference not set
**Solution:**
1. Fix user data loading (run QUICK_SUPABASE_FIX.sql)
2. Set landing page preference:
```javascript
localStorage.setItem('otakonSkippedLanding', 'true');
location.reload();
```

## 🧪 Quick Tests:

### Test 1: Check if user exists
```sql
SELECT * FROM public.users WHERE email = 'your-email@example.com';
```

### Test 2: Check auth users
```sql
SELECT * FROM auth.users WHERE email = 'your-email@example.com';
```

### Test 3: Test OAuth flow
1. Clear localStorage
2. Try Google/Discord sign-in
3. Check if redirect works
4. Check if user gets created

## 🎯 Expected Flow:

1. **User clicks sign-in** → OAuth redirect
2. **OAuth completes** → User redirected back
3. **Trigger fires** → User record created in public.users
4. **App loads** → User data loads successfully
5. **Landing page shows** → User can proceed to app

## 📞 If Still Having Issues:

1. **Check Supabase logs** in dashboard
2. **Verify environment variables** are correct
3. **Test with incognito mode** to avoid cache issues
4. **Check network tab** for failed requests
5. **Verify OAuth redirect URLs** are configured

## 🚀 Next Steps:

1. Run the debugging SQL first
2. Check browser console logs
3. Test authentication flow
4. Fix any issues found
5. Configure OAuth providers if needed
