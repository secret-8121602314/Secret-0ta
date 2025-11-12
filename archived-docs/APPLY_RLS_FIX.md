# URGENT: Apply RLS Fix for Subtabs

## Problem
Subtabs INSERT operations are failing with:
```
new row violates row-level security policy for table "subtabs"
```

## Root Cause
The existing RLS policies on the `subtabs` table are checking `conversations.user_id = auth.uid()`, but:
- `conversations.user_id` is the internal UUID from the `users` table
- `auth.uid()` returns the auth_user_id (authentication UUID)
- These don't match, so the policy blocks all inserts

## Solution
Execute the following SQL in your Supabase SQL Editor:

```sql
-- Drop all existing subtabs policies
DROP POLICY IF EXISTS "Users can insert subtabs to their conversations" ON subtabs;
DROP POLICY IF EXISTS "Users can view subtabs from their conversations" ON subtabs;
DROP POLICY IF EXISTS "Users can update subtabs in their conversations" ON subtabs;
DROP POLICY IF EXISTS "Users can delete subtabs from their conversations" ON subtabs;

-- Create new policies that properly handle the user_id lookup
CREATE POLICY "Users can insert subtabs to their conversations" ON subtabs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.id = conversation_id 
      AND u.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view subtabs from their conversations" ON subtabs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.id = conversation_id 
      AND u.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update subtabs in their conversations" ON subtabs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.id = conversation_id 
      AND u.auth_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete subtabs from their conversations" ON subtabs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.id = conversation_id 
      AND u.auth_user_id = (SELECT auth.uid())
    )
  );

-- Verify RLS is enabled
ALTER TABLE subtabs ENABLE ROW LEVEL SECURITY;
```

## Steps
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL above
4. Click "Run"
5. Refresh your application

## Expected Result
- ✅ Subtabs will insert successfully
- ✅ RLS will still protect user data
- ✅ Game tabs will create properly
