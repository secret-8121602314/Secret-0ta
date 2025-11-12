# Critical Database Fixes - Run Immediately

## Issues Found:
1. Missing RPC function `get_user_id_from_auth_id` (404 errors)
2. Type mismatch: `subtabs.conversation_id` is UUID but `conversations.id` is TEXT
3. Conversations not persisting to Supabase (400 errors on writes)

## How to Fix:

### Step 1: Run the migration files in Supabase SQL Editor

Go to Supabase Dashboard → SQL Editor → New Query

#### Migration 1: Add User ID Lookup Function
Copy and paste the entire contents of:
`supabase/migrations/20251104000000_add_user_id_lookup_function.sql`

Click **Run**

#### Migration 2: Fix Conversation ID Type
Copy and paste the entire contents of:
`supabase/migrations/20251104000001_fix_conversation_id_type.sql`

Click **Run**

### Step 2: Verify the fixes

Run this query to check:
```sql
-- Check if function exists
SELECT proname, proargtypes, prosrc 
FROM pg_proc 
WHERE proname = 'get_user_id_from_auth_id';

-- Check subtabs table structure
\d public.subtabs;

-- Check if conversation_id is now TEXT
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subtabs' 
AND column_name = 'conversation_id';
```

Expected results:
- Function `get_user_id_from_auth_id` should exist
- `subtabs.conversation_id` should be `text` type (not `uuid`)

### Step 3: Test the application

1. Refresh the browser
2. Clear localStorage: `localStorage.clear()`
3. Log in again
4. You should see:
   - "Game Hub" tab active and selected
   - No 404 errors for `get_user_id_from_auth_id`
   - No 400 errors when creating conversations
   - Game tabs should create successfully

## Why These Fixes Are Needed:

### Issue 1: Missing RPC Function
**Error**: `Failed to load resource: the server responded with a status of 404`
**Location**: `qajcxgkqloumogioomiz.supabase.co/rest/v1/rpc/get_user_id_from_auth_id`

**Why**: The client tries to resolve the internal `user_id` from the auth `user_id`, but the RPC function doesn't exist in the database.

**Fix**: Create the function that looks up `users.id` from `users.auth_user_id`.

### Issue 2: Type Mismatch
**Error**: `400 Bad Request` when writing to `subtabs` table
**Log**: `🔄 [SubtabsService] Writing 5 subtabs to BOTH table AND JSONB for conversation: game-cyberpunk-2077`
**Error**: `✅ Table write: FAILED`

**Why**: 
- `conversations.id` is `TEXT` (to support custom IDs like 'game-hub', 'game-cyberpunk-2077')
- `subtabs.conversation_id` was created as `UUID`
- Foreign key constraint fails because types don't match

**Fix**: Change `subtabs.conversation_id` from UUID to TEXT.

### Issue 3: Conversations Not Persisting
**Log**: `🔍 [ConversationService] Loaded 0 conversations from Supabase`

**Why**: Without the RPC function, the `user_id` cannot be resolved, so conversations can't be written to or read from Supabase. They only exist in localStorage.

**Fix**: After fixing issues #1 and #2, conversations will persist correctly.

## After Running These Fixes:

✅ Game Hub will be selected by default after onboarding
✅ Conversations will persist to Supabase
✅ Game tabs will create successfully with subtabs
✅ No more 404 or 400 errors

## Rollback (if needed):

If something goes wrong, you can rollback:

```sql
-- Rollback Migration 2
ALTER TABLE public.subtabs 
ALTER COLUMN conversation_id TYPE uuid USING conversation_id::uuid;

-- Rollback Migration 1
DROP FUNCTION IF EXISTS public.get_user_id_from_auth_id(uuid);
```
