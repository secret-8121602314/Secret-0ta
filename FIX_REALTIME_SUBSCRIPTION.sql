-- Fix Real-time Subscription for Conversations Table
-- Issue: Real-time subscription errors when listening to conversation updates
-- Root Cause: Table might not be enabled for realtime or missing replica identity

-- Step 1: Check if conversations table is in realtime publication
SELECT 
    schemaname, 
    tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'conversations';

-- Step 2: Enable realtime for conversations table if not already enabled
-- Note: This will succeed even if the table is already in the publication
DO $$
BEGIN
    -- Try to add the table to the publication
    -- If it's already there, this will fail silently
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
    EXCEPTION
        WHEN duplicate_object THEN
            -- Table is already in publication, that's fine
            NULL;
    END;
END $$;

-- Step 3: Ensure table has proper replica identity (required for UPDATE/DELETE events)
-- This allows Supabase to track which rows changed
ALTER TABLE conversations REPLICA IDENTITY FULL;

-- Step 4: Verify the setup
SELECT 
    ppt.schemaname, 
    ppt.tablename,
    CASE c.relreplident
        WHEN 'd' THEN 'DEFAULT'
        WHEN 'n' THEN 'NOTHING'
        WHEN 'f' THEN 'FULL'
        WHEN 'i' THEN 'INDEX'
    END as replica_identity
FROM pg_publication_tables ppt
JOIN pg_class c ON c.relname = ppt.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = ppt.schemaname
WHERE ppt.pubname = 'supabase_realtime' 
AND ppt.tablename = 'conversations';

-- Expected output:
-- - conversations should appear in supabase_realtime publication
-- - replica_identity should be 'FULL' for best compatibility

-- Additional check: Verify RLS policies allow SELECT for realtime
-- Realtime needs SELECT permission to send updates
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'conversations'
AND cmd IN ('SELECT', 'ALL');
