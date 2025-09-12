# 🔧 Supabase Configuration Guide

This guide will help you configure your Supabase project to fix the authentication and database issues.

## 🚨 Current Issues
- ❌ Redirect URLs not configured in Supabase dashboard
- ❌ OAuth providers not set up
- ❌ RLS policies causing 406 errors
- ❌ Missing user records in database

## 📋 Step-by-Step Configuration

### 1. 🔗 Configure Redirect URLs

**Go to Supabase Dashboard → Authentication → URL Configuration**

**Site URL:**
```
http://localhost:5173
```

**Additional Redirect URLs:**
```
http://localhost:5173/**
https://yourdomain.com/**
```

### 2. 🔐 Set Up OAuth Providers

**Go to Supabase Dashboard → Authentication → Providers**

#### Google OAuth Setup:
1. **Enable Google provider**
2. **Client ID:** Get from Google Cloud Console
3. **Client Secret:** Get from Google Cloud Console
4. **Redirect URL:** `https://qajcxgkqloumogioomiz.supabase.co/auth/v1/callback`

#### Discord OAuth Setup:
1. **Enable Discord provider**
2. **Client ID:** Get from Discord Developer Portal
3. **Client Secret:** Get from Discord Developer Portal
4. **Redirect URL:** `https://qajcxgkqloumogioomiz.supabase.co/auth/v1/callback`

### 3. 🗄️ Fix Database Issues

**Run the following SQL in Supabase Dashboard → SQL Editor:**

```sql
-- 1. Create user record for current authenticated user
INSERT INTO public.users (auth_user_id, email, tier, profile_data, preferences, app_state)
VALUES (
    '996d53ca-3a2c-40d4-9a9d-23f224bd4c30',
    'mdamkhan@gmail.com',
    'free',
    '{}',
    '{}',
    '{"onboardingComplete": false, "profileSetupCompleted": false, "hasSeenSplashScreens": false}'
) ON CONFLICT (auth_user_id) DO NOTHING;

-- 2. Fix RLS policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = auth_user_id::uuid);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = auth_user_id::uuid);

CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id::uuid);

-- 3. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Test the fix
SELECT * FROM public.users WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';
```

### 4. 🧪 Test Authentication Flow

After configuration:

1. **Refresh your app** (`http://localhost:5173`)
2. **Check browser console** for authentication logs
3. **Test OAuth sign-in** (Google/Discord buttons)
4. **Verify user data loads** (no more 406 errors)

## 🔍 Verification Steps

### Check Redirect URLs:
- ✅ Site URL: `http://localhost:5173`
- ✅ Additional URLs: `http://localhost:5173/**`

### Check OAuth Providers:
- ✅ Google: Enabled with proper credentials
- ✅ Discord: Enabled with proper credentials

### Check Database:
- ✅ User record exists for `mdamkhan@gmail.com`
- ✅ RLS policies allow user access
- ✅ No 406 errors in console

## 🚀 Quick Fix Commands

### Reset Landing Page Preference:
```javascript
// In browser console
localStorage.removeItem('otakonSkippedLanding');
location.reload();
```

### Show Landing Page:
```javascript
// In browser console
window.showLandingPage();
```

### Check Authentication Status:
```javascript
// In browser console
console.log('Auth state:', window.authService?.getAuthState());
```

## 📞 Support

If you encounter issues:
1. Check Supabase dashboard logs
2. Verify environment variables
3. Test with browser console commands
4. Check network tab for API errors

## 🎯 Expected Results

After configuration:
- ✅ Landing page shows properly
- ✅ OAuth sign-in works
- ✅ User data loads without 406 errors
- ✅ Authentication flow completes successfully
