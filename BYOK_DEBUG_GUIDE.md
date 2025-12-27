# BYOK (Bring Your Own Key) Debug Guide

## Issue
User reports that after entering a Gemini API key and clicking "Save & Activate":
- The key is tested successfully
- But after page reload, the UI still shows the input form instead of "Key Active" state
- `user.usesCustomGeminiKey` appears to still be `false`

## What Was Fixed

### 1. Better Error Handling
**File:** `src/services/apiKeyService.ts`
- Added `.select()` to the update query to get returned data
- Added explicit error messages for database errors
- Added validation that data was actually returned
- Added console logging for successful saves
- **Clear localStorage cache** after successful save to force refresh

### 2. UI Error Feedback  
**File:** `src/components/modals/SettingsModal.tsx`
- Added explicit error message display to user
- Only reset `isSavingKey` state on error (not in finally block)
- This prevents the button from being re-enabled while reload is happening

## Debugging Steps

### 1. Check Browser Console
When you click "Save & Activate", you should see:
```
[ApiKeyService] Testing API key...
[ApiKeyService] ✅ API key saved successfully: { userId: ..., authUserId: ..., usesCustomKey: true }
```

If you see errors, they will tell you what failed.

### 2. Check Network Tab
Open DevTools → Network tab and look for:
- Request to Supabase `/rest/v1/users?auth_user_id=eq.xxx`
- Method: PATCH
- Status: Should be 200 OK
- Response should include updated data with `uses_custom_gemini_key: true`

### 3. Check Database Directly (Supabase Dashboard)
1. Go to your Supabase project
2. Navigate to Table Editor → users table
3. Find your user record (search by email)
4. Check these columns:
   - `uses_custom_gemini_key` - should be `true`
   - `gemini_api_key_encrypted` - should contain your key
   - `custom_key_verified_at` - should have a timestamp
   - `had_custom_key_before` - should be `true`

### 4. Check RLS Policies (if database shows old values)
If the database still shows `uses_custom_gemini_key = false`, it means the UPDATE query is being blocked by RLS policy.

Run this in SQL Editor:
```sql
-- Check if policy exists
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
AND policyname = 'Users can update own profile';

-- Test if current user can update their own record
SELECT auth.uid(); -- Note this ID
UPDATE users 
SET uses_custom_gemini_key = true 
WHERE auth_user_id = auth.uid()
RETURNING *;
```

### 5. Check for Migration Issues
Make sure the BYOK migration was applied:
```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
  'uses_custom_gemini_key',
  'gemini_api_key_encrypted',
  'custom_key_verified_at',
  'had_custom_key_before'
);
```

Should return 4 rows.

### 6. Check User Object After Reload
After the page reloads, open console and type:
```javascript
// Get the current user
JSON.parse(localStorage.getItem('otakon_user'))
```

Check the `usesCustomGeminiKey` field. If it's false, the issue is in the user data fetching.

## Common Issues & Solutions

### Issue: "Failed to save API key to database"
**Cause:** RLS policy blocking the update
**Solution:** 
1. Verify RLS policy exists (see step 4 above)
2. Run migration `20251216_fix_users_update_policy.sql` if needed

### Issue: Database shows updated but UI doesn't
**Cause:** Cached user data not being refreshed
**Solution:** Already fixed - localStorage is now cleared after save

### Issue: "User record not found or update failed"
**Cause:** The update didn't find matching user
**Solution:** 
1. Check `user.authUserId` matches the logged-in user's ID
2. Verify there's a user record with that `auth_user_id`

### Issue: Page reload happens but user data is old
**Cause:** `authService` loading cached data
**Solution:** The fix clears both caches:
- `otakon_user` (main cache)
- `otakon_user_cache_{authUserId}` (user-specific cache)

## Test Manually

1. **Clear localStorage** completely:
```javascript
localStorage.clear()
```

2. **Login again** and go to Settings → API Keys

3. **Enter a test key** (or real key): `AIzaSy...`

4. **Click "Test Key"** - should say "✅ API key is valid!"

5. **Click "Save & Activate"**
   - Should see "Testing your API key..." toast
   - Should see "✅ Custom API key saved! You now have unlimited queries." toast
   - Should see "🔄 Custom key saved! Reloading..." toast
   - Page reloads after 1.5 seconds

6. **After reload**, go back to Settings → API Keys
   - Should see green "🔑 Custom Key Active" box
   - Should NOT see the input form

## Still Not Working?

If after all this it still doesn't work:

1. **Export debug info:**
```javascript
console.log('User:', JSON.parse(localStorage.getItem('otakon_user')));
console.log('Auth UID:', (await supabase.auth.getUser()).data.user?.id);
```

2. **Check Supabase logs:** Go to Supabase Dashboard → Logs → look for errors

3. **Share the console output** and any errors you see
