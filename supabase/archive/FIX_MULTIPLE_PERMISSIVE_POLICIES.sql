-- Fix Multiple Permissive Policies on Waitlist Table
-- This script consolidates all waitlist policies into a single optimized policy
-- to resolve the performance warning about multiple permissive policies

-- First, let's check the current state of all waitlist policies
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

-- Drop ALL existing waitlist policies to eliminate conflicts
-- This ensures we start with a clean slate
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

-- Create a single, optimized policy for SELECT operations
-- This policy allows all users (anonymous, authenticated, etc.) to read from waitlist
CREATE POLICY "waitlist_unified_select" ON public.waitlist
    FOR SELECT 
    USING (true);

-- Create a single, optimized policy for INSERT operations  
-- This policy allows all users (anonymous, authenticated, etc.) to insert into waitlist
CREATE POLICY "waitlist_unified_insert" ON public.waitlist
    FOR INSERT 
    WITH CHECK (true);

-- Grant explicit permissions to ensure all roles can access the table
GRANT SELECT, INSERT ON public.waitlist TO anon;
GRANT SELECT, INSERT ON public.waitlist TO authenticated;
GRANT SELECT, INSERT ON public.waitlist TO authenticator;
GRANT SELECT, INSERT ON public.waitlist TO service_role;

-- Verify that we now have only 2 policies (one for SELECT, one for INSERT)
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

-- Test that the policies work correctly
-- This should return the count without any authentication errors
SELECT COUNT(*) as waitlist_count FROM public.waitlist;

-- Verify that we can insert into the waitlist (this will be rolled back)
-- This is just to test the INSERT policy works
BEGIN;
INSERT INTO public.waitlist (email, created_at) 
VALUES ('test@example.com', NOW());
ROLLBACK;

-- Final verification: Check that we have exactly 2 policies
SELECT 
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'waitlist';
