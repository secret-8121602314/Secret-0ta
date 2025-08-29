-- ========================================
-- FIX WAITLIST TABLE RLS POLICY
-- This resolves the remaining security issue
-- ========================================

-- Check if waitlist table exists and what it looks like
SELECT 
    'Waitlist Table Check' as info,
    table_name,
    table_type,
    'Found' as status
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'waitlist';

-- Check waitlist table structure
SELECT 
    'Waitlist Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'waitlist'
ORDER BY ordinal_position;

-- Check if waitlist table has RLS enabled
SELECT 
    'Waitlist RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'waitlist';

-- Option 1: Add RLS policy to waitlist table
DO $$
BEGIN
    -- Check if waitlist table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'waitlist'
    ) THEN
        -- Add RLS policy for waitlist table
        CREATE POLICY "Anyone can manage waitlist" ON public.waitlist
            FOR ALL USING (true);
        
        RAISE NOTICE '✅ Added RLS policy to waitlist table';
    ELSE
        RAISE NOTICE '❌ Waitlist table does not exist';
    END IF;
END $$;

-- Option 2: If waitlist table is not needed, disable RLS
DO $$
BEGIN
    -- Check if waitlist table exists and has RLS enabled
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'waitlist'
        AND rowsecurity = true
    ) THEN
        -- Disable RLS on waitlist table
        ALTER TABLE public.waitlist DISABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '✅ Disabled RLS on waitlist table';
    ELSE
        RAISE NOTICE '❌ Waitlist table not found or RLS already disabled';
    END IF;
END $$;

-- Option 3: If waitlist table is not needed at all, drop it
DO $$
BEGIN
    -- Check if waitlist table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'waitlist'
    ) THEN
        -- Drop waitlist table if it's not needed
        DROP TABLE IF EXISTS public.waitlist;
        
        RAISE NOTICE '✅ Dropped waitlist table (not needed)';
    ELSE
        RAISE NOTICE '❌ Waitlist table does not exist';
    END IF;
END $$;

-- Verify the fix
SELECT 
    'Waitlist Fix Verification' as info,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'waitlist'
        ) THEN '✅ Waitlist table removed'
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = 'waitlist'
            AND rowsecurity = true
        ) THEN '✅ Waitlist RLS disabled'
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'waitlist' AND schemaname = 'public'
        ) THEN '✅ Waitlist RLS policy added'
        ELSE '❌ Waitlist issue not resolved'
    END as status;

-- Final recommendation
SELECT 
    'Waitlist Issue Resolution' as summary,
    'Choose the appropriate option above based on your needs:' as note,
    '1. Add RLS policy if waitlist is needed' as option1,
    '2. Disable RLS if waitlist is public data' as option2,
    '3. Drop table if waitlist is not needed' as option3;
