#!/bin/bash

# Comprehensive fix for Supabase 406 errors and missing user records
echo "🔧 Applying comprehensive Supabase fixes..."

# Check if we have the database password
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "❌ SUPABASE_DB_PASSWORD environment variable not set"
    echo "Please set it with: export SUPABASE_DB_PASSWORD='your_password'"
    exit 1
fi

# Database connection string
DB_URL="postgresql://postgres.qajcxgkqloumogioomiz:${SUPABASE_DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

echo "📊 Checking current user status..."

# Check if user exists in auth.users
psql "$DB_URL" -c "
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';
"

echo "📊 Checking if user exists in public.users..."

# Check if user exists in public.users
psql "$DB_URL" -c "
SELECT 
    auth_user_id,
    email,
    name,
    user_type,
    tier,
    created_at
FROM public.users 
WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';
"

echo "🔧 Creating missing user record..."

# Insert the missing user record
psql "$DB_URL" -c "
INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    user_type,
    tier,
    app_state,
    preferences,
    created_at,
    updated_at
) VALUES (
    '996d53ca-3a2c-40d4-9a9d-23f224bd4c30',
    'mdamkhan@gmail.com',
    'Amaan',
    'user',
    'free',
    '{
        \"onboardingComplete\": false,
        \"profileSetupCompleted\": false,
        \"hasSeenSplashScreens\": false,
        \"welcomeMessageShown\": false,
        \"firstWelcomeShown\": false,
        \"hasConversations\": false,
        \"hasInteractedWithChat\": false,
        \"lastSessionDate\": \"\",
        \"lastWelcomeTime\": \"\",
        \"appClosedTime\": \"\",
        \"firstRunCompleted\": false,
        \"hasConnectedBefore\": false,
        \"installDismissed\": false,
        \"showSplashAfterLogin\": false,
        \"lastSuggestedPromptsShown\": \"\",
        \"conversations\": [],
        \"conversationsOrder\": [],
        \"activeConversation\": \"\"
    }'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (auth_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();
"

echo "🔧 Fixing onboarding_funnel table..."

# Fix onboarding_funnel table
psql "$DB_URL" -c "
DO \$\$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'onboarding_funnel' 
        AND column_name = 'drop_off_reason'
    ) THEN
        ALTER TABLE public.onboarding_funnel 
        ADD COLUMN drop_off_reason TEXT;
        
        RAISE NOTICE 'Added drop_off_reason column to onboarding_funnel table';
    ELSE
        RAISE NOTICE 'drop_off_reason column already exists in onboarding_funnel table';
    END IF;
END \$\$;
"

echo "🔧 Ensuring RLS policies are correct..."

# Ensure RLS policies exist
psql "$DB_URL" -c "
-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO \$\$
BEGIN
    -- Policy for SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can view own data'
    ) THEN
        CREATE POLICY 'Users can view own data' ON public.users
            FOR SELECT USING (auth_user_id = auth.uid());
    END IF;
    
    -- Policy for INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can insert own data'
    ) THEN
        CREATE POLICY 'Users can insert own data' ON public.users
            FOR INSERT WITH CHECK (auth_user_id = auth.uid());
    END IF;
    
    -- Policy for UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can update own data'
    ) THEN
        CREATE POLICY 'Users can update own data' ON public.users
            FOR UPDATE USING (auth_user_id = auth.uid());
    END IF;
    
    -- Policy for DELETE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can delete own data'
    ) THEN
        CREATE POLICY 'Users can delete own data' ON public.users
            FOR DELETE USING (auth_user_id = auth.uid());
    END IF;
END \$\$;
"

echo "✅ Testing the fix..."

# Test the query that was failing
psql "$DB_URL" -c "
SELECT 
    auth_user_id,
    email,
    name,
    user_type,
    tier
FROM public.users 
WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';
"

echo "🎉 Fix completed! The 406 errors should now be resolved."
echo "Please refresh your browser to test the fix."
