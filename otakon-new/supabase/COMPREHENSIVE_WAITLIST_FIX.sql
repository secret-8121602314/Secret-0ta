-- Comprehensive fix for waitlist RLS policies
-- This script ensures the waitlist table is accessible to anonymous users

-- First, let's check the current state
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'waitlist';

-- Drop ALL existing waitlist policies to start fresh
DROP POLICY IF EXISTS "waitlist_select_policy" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_insert_policy" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can insert waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow anonymous access to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow authenticated access to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_anon_select" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_anon_insert" ON public.waitlist;

-- Temporarily disable RLS to test
ALTER TABLE public.waitlist DISABLE ROW LEVEL SECURITY;

-- Test if we can access the table without RLS
SELECT COUNT(*) as waitlist_count FROM public.waitlist;

-- Re-enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Create very permissive policies for anonymous access
CREATE POLICY "waitlist_public_select" ON public.waitlist
    FOR SELECT 
    USING (true);

CREATE POLICY "waitlist_public_insert" ON public.waitlist
    FOR INSERT 
    WITH CHECK (true);

-- Grant explicit permissions to anon role
GRANT SELECT, INSERT ON public.waitlist TO anon;
GRANT SELECT, INSERT ON public.waitlist TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'waitlist';

-- Test the access again
SELECT COUNT(*) as waitlist_count FROM public.waitlist;
