-- ========================================
-- CHECK AND CREATE WAITLIST TABLE
-- This checks what tables exist and creates waitlist if needed
-- ========================================

-- First, let's see what tables actually exist in the public schema
SELECT 
    schemaname,
    tablename,
    'Table exists' as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check if waitlist table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'waitlist'
        ) THEN '✅ Waitlist table exists'
        ELSE '❌ Waitlist table does NOT exist'
    END as waitlist_status;

-- If waitlist doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'waitlist'
    ) THEN
        -- Create waitlist table for landing page email collection
        CREATE TABLE public.waitlist (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL UNIQUE,
            name TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            source TEXT DEFAULT 'landing_page',
            status TEXT DEFAULT 'pending'
        );
        
        -- Enable RLS
        ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
        
        -- Add RLS policies
        CREATE POLICY "Allow public waitlist signups" ON public.waitlist
            FOR INSERT WITH CHECK (true);
            
        CREATE POLICY "Allow users to view own waitlist entry" ON public.waitlist
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM auth.users 
                    WHERE auth.users.email = waitlist.email
                    AND auth.uid() = auth.users.id
                )
            );
            
        -- Add trigger for updated_at
        CREATE TRIGGER update_waitlist_updated_at
            BEFORE UPDATE ON public.waitlist
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
            
        RAISE NOTICE '✅ Waitlist table created successfully with RLS policies';
    ELSE
        RAISE NOTICE 'ℹ️ Waitlist table already exists';
    END IF;
END $$;

-- Verify the waitlist table structure
SELECT 
    'waitlist' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'waitlist'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'waitlist';

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'waitlist';

-- Final status
SELECT 
    'Waitlist table check complete' as status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = 'waitlist'
        ) THEN '✅ Waitlist table exists and is properly configured'
        ELSE '❌ Waitlist table creation failed'
    END as result,
    'Proceed with functions script next' as next_step;
