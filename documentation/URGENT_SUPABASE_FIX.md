# 🚨 URGENT: Fix Missing Supabase Functions

## Problem
Your app is showing **404 errors** for Supabase database functions because the functions have **wrong signatures** or are **missing entirely**.

## Error Messages
```
Failed to load resource: the server responded with a status of 404 ()
Could not find the function public.save_conversation(...) in the schema cache
Could not find the function public.update_welcome_message_shown(...) in the schema cache
```

## Root Cause
The migrations you have deployed have **different function signatures** than what your app code is calling:

### What Your App Calls:
- `save_conversation(p_context, p_conversation_id, p_force_overwrite, p_game_id, p_insights, p_is_pinned, p_messages, p_title, p_user_id)`
- `update_welcome_message_shown(p_user_id, p_message_type)`
- `should_show_welcome_message(p_user_id)`

### What You Have Deployed:
- `update_welcome_message_shown(p_type)` ❌ Wrong signature
- `should_show_welcome_message()` ❌ Wrong signature
- `save_conversation` ❌ Missing entirely

## 🚀 IMMEDIATE FIX

### Step 1: Deploy the Correct Functions
1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste** the contents of `supabase/migrations/20250119_fix_missing_functions.sql`
4. **Click Run** to execute

### Step 2: Verify Functions Are Created
After running the migration, you should see these functions created:
- ✅ `public.save_conversation(JSONB, TEXT, BOOLEAN, TEXT, JSONB, BOOLEAN, JSONB, TEXT, UUID)`
- ✅ `public.load_conversations(UUID)`
- ✅ `public.update_welcome_message_shown(UUID, TEXT)`
- ✅ `public.should_show_welcome_message(UUID)`

### Step 3: Test the Fix
1. **Refresh your app**
2. **Check browser console** - 404 errors should be gone
3. **Try logging in** - conversations should save properly
4. **Welcome messages** should appear only once

## 🔧 Additional Fixes Applied

### Fixed Duplicate Welcome Messages
- **Removed** redundant welcome message logic from `useChat.ts`
- **Centralized** welcome message handling in `App.tsx`
- **Fixed** `InitialSplashScreen.tsx` method call error

### Fixed Function Call Errors
- **Corrected** `authService.getCurrentUser()` → `authService.getCurrentUserId()`
- **Updated** function signatures to match app expectations

## 📋 What This Fixes

### ✅ Database Functions
- Conversations will save to Supabase
- Welcome messages will persist after refresh
- No more 404 errors in console
- Proper conversation loading from database

### ✅ User Experience
- Single welcome message for new users
- No duplicate messages appearing
- Smooth authentication flow
- Proper onboarding progression

### ✅ Error Resolution
- Fixed `getCurrentUser is not a function` error
- Resolved Supabase function signature mismatches
- Eliminated duplicate welcome message creation

## 🧪 Testing Checklist

After deploying the migration:

- [ ] **Login works** without console errors
- [ ] **Conversations save** to database
- [ ] **Welcome message appears** only once
- [ ] **No 404 errors** in browser console
- [ ] **Profile setup** completes successfully
- [ ] **Onboarding flow** works smoothly

## 📁 Files Modified

1. **`supabase/migrations/20250119_fix_missing_functions.sql`** - New migration with correct function signatures
2. **`hooks/useChat.ts`** - Removed duplicate welcome message logic
3. **`components/InitialSplashScreen.tsx`** - Fixed method call error

## 🚨 If Issues Persist

If you still see errors after deploying the migration:

1. **Check Supabase Dashboard** → Database → Functions to verify functions exist
2. **Check function permissions** are granted to `authenticated` role
3. **Verify user table structure** matches function expectations
4. **Check RLS policies** allow function execution

---

**Status**: Ready for deployment  
**Priority**: CRITICAL - App is non-functional without these fixes  
**Estimated Fix Time**: 5 minutes
