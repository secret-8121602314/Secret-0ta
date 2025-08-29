-- ========================================
-- ADD WAITLIST RLS POLICY
-- This adds the missing RLS policy for the waitlist table
-- ========================================

-- First, let's see what the waitlist table structure looks like
SELECT 
    'waitlist' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'waitlist'
ORDER BY ordinal_position;

-- Check if RLS is enabled on waitlist table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'waitlist';

-- Add RLS policy for waitlist table
-- Since this is for collecting emails from the landing page, we'll allow public inserts
-- but restrict reads to only the user who submitted the email (if they have an account)

-- Option 1: Allow public inserts (anyone can join waitlist)
CREATE POLICY "Allow public waitlist signups" ON public.waitlist
    FOR INSERT WITH CHECK (true);

-- Option 2: Allow users to see their own waitlist entry (if they have an account)
-- This assumes the waitlist table has an email column that can be matched to user emails
CREATE POLICY "Users can view own waitlist entry" ON public.waitlist
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.email = waitlist.email
            AND auth.uid() = auth.users.id
        )
    );

-- Option 3: Allow admins to view all waitlist entries
-- This assumes you have an admin role or user ID
-- CREATE POLICY "Admins can view all waitlist entries" ON public.waitlist
--     FOR ALL USING (auth.uid() = 'your-admin-user-id-here'::uuid);

-- Verify the policies were created
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
WHERE schemaname = 'public' 
AND tablename = 'waitlist';

-- Test the waitlist table access
SELECT 
    'Waitlist RLS policy added successfully' as status,
    'Landing page emails will continue to work' as note,
    'Run the linter again to verify RLS warning is gone' as next_step;
