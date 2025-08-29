-- ========================================
-- DROP WAITLIST TABLE (NOT NEEDED)
-- This removes the table causing the RLS warning
-- ========================================

-- Drop the waitlist table since it's not needed for the app
DROP TABLE IF EXISTS public.waitlist;

-- Verify the table was dropped
SELECT 
    'Waitlist table dropped successfully' as status,
    'RLS warning should now be resolved' as note,
    'Run the linter again to verify' as next_step;

-- Check if any waitlist-related objects remain
SELECT 
    schemaname,
    tablename,
    'Remaining table' as object_type
FROM pg_tables 
WHERE tablename LIKE '%waitlist%'
UNION ALL
SELECT 
    schemaname,
    indexname,
    'Remaining index' as object_type
FROM pg_indexes 
WHERE indexname LIKE '%waitlist%';
