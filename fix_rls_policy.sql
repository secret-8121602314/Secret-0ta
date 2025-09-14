-- Alternative Fix: Modify RLS Policy to Allow Trigger Inserts
-- Run this in your Supabase SQL Editor

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- Create a more permissive policy that allows the trigger to insert
CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (
        -- Allow if the user is inserting their own data
        (select auth.uid()) = auth_user_id
        OR
        -- Allow if this is a trigger insertion (auth_user_id matches the current auth user)
        auth_user_id = (select auth.uid())
        OR
        -- Allow if this is a system insertion (for triggers)
        current_setting('role') = 'service_role'
    );

-- Alternative: Create a separate policy for system inserts
CREATE POLICY "System can insert users" ON public.users
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role'
        OR
        -- Allow trigger inserts by checking if the auth user exists
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth_user_id)
    );

-- Test the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public';

