-- Fix RLS policies for waitlist table to allow anonymous access
-- This script fixes the 401 authentication errors when accessing waitlist data

-- First, let's check the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'waitlist';

-- Drop all existing waitlist policies
DROP POLICY IF EXISTS "waitlist_select_policy" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_insert_policy" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can insert waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow anonymous access to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow authenticated access to waitlist" ON public.waitlist;

-- Create new policies that explicitly allow anonymous access
CREATE POLICY "waitlist_anon_select" ON public.waitlist
    FOR SELECT 
    TO anon, authenticated
    USING (true);

CREATE POLICY "waitlist_anon_insert" ON public.waitlist
    FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- Verify the policies were created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'waitlist';

-- Test the policies by checking if anonymous users can access the table
-- This should return the count without authentication errors
SELECT COUNT(*) as waitlist_count FROM public.waitlist;
