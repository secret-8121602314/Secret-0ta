# Database Functions Deployment Guide

## Issue
The logs show `404` errors for database functions:
```
Failed to load resource: the server responded with a status of 404 ()
Could not find the function public.save_conversation(...) in the schema cache
```

## Solution
You need to deploy the database functions to your Supabase instance.

## Steps to Fix

### 1. Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)

### 2. Run the Essential Functions
1. Copy the contents of `essential_functions.sql` 
2. Paste it into the SQL Editor
3. Click **Run** to execute the script

### 3. Verify Functions are Created
After running the script, you should see:
- `save_conversation` function created
- `load_conversations` function created  
- `update_welcome_message_shown` function created
- `should_show_welcome_message` function created

### 4. Test the Fix
1. Refresh your app
2. Check the browser console - you should no longer see `404` errors
3. Conversations should now save and load properly

## Alternative: Use Supabase CLI
If you have Supabase CLI installed:
```bash
supabase db reset
# or
supabase db push
```

## What This Fixes
- ✅ Conversations will save to database
- ✅ Welcome messages will persist after refresh
- ✅ No more 404 errors in console
- ✅ Proper conversation loading from database

## Files to Deploy
- `essential_functions.sql` - Contains the core database functions needed
