-- FINAL WAITLIST POLICY CLEANUP
-- This script completely removes all existing waitlist policies and creates clean, single policies
-- to resolve the multiple permissive policies performance warning

-- Step 1: Check current state of all waitlist policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'waitlist'
ORDER BY policyname;

-- Step 2: Drop ALL possible waitlist policies (comprehensive cleanup)
-- This covers all the policy names we've seen across different migration files
DROP POLICY IF EXISTS "waitlist_select_policy" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_insert_policy" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can insert waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can insert to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow anonymous access to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow authenticated access to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow public access to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_anon_select" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_anon_insert" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_public_select" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_public_insert" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_unified_select" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_unified_insert" ON public.waitlist;

-- Step 3: Verify all policies are dropped
SELECT 
    COUNT(*) as remaining_policies,
    STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'waitlist';

-- Step 4: Create single, clean policies
-- Only create policies if none exist (defensive programming)
DO $$
BEGIN
    -- Check if any policies still exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'waitlist' 
        AND schemaname = 'public'
    ) THEN
        -- Create single SELECT policy
        CREATE POLICY "waitlist_read_all" ON public.waitlist
            FOR SELECT 
            USING (true);
            
        -- Create single INSERT policy  
        CREATE POLICY "waitlist_write_all" ON public.waitlist
            FOR INSERT 
            WITH CHECK (true);
            
        RAISE NOTICE 'Successfully created clean waitlist policies';
    ELSE
        RAISE NOTICE 'Policies still exist, skipping creation';
    END IF;
END $$;

-- Step 5: Grant necessary permissions
GRANT SELECT, INSERT ON public.waitlist TO anon;
GRANT SELECT, INSERT ON public.waitlist TO authenticated;
GRANT SELECT, INSERT ON public.waitlist TO authenticator;
GRANT SELECT, INSERT ON public.waitlist TO service_role;
GRANT SELECT, INSERT ON public.waitlist TO cli_login_postgres;
GRANT SELECT, INSERT ON public.waitlist TO dashboard_user;

-- Step 6: Final verification
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'waitlist'
ORDER BY policyname;

-- Step 7: Test the policies work
SELECT COUNT(*) as waitlist_count FROM public.waitlist;

-- Step 8: Verify we have exactly 2 policies
SELECT 
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'waitlist';

-- Expected result: policy_count should be 2, policy_names should be "waitlist_read_all, waitlist_write_all"
