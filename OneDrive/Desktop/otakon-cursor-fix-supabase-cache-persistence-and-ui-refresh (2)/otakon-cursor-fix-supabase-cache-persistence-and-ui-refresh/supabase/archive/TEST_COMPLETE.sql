-- ========================================
-- COMPLETE AUTHENTICATION TEST SCRIPT
-- ========================================
-- Run this to verify all authentication functions and schema are working
-- This is the comprehensive test for the complete master schema

-- Test 1: Check if all functions exist
DO $$
DECLARE
    function_count integer;
    expected_functions text[] := ARRAY[
        'get_complete_user_data',
        'create_user_record', 
        'handle_new_user',
        'update_user_app_state',
        'update_user_onboarding_status',
        'get_user_onboarding_status',
        'update_user_profile_data',
        'get_user_profile_data',
        'update_updated_at_column'
    ];
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = ANY(expected_functions);
    
    IF function_count = array_length(expected_functions, 1) THEN
        RAISE NOTICE '✅ All % authentication functions exist', function_count;
    ELSE
        RAISE NOTICE '❌ Only % out of % functions exist', function_count, array_length(expected_functions, 1);
    END IF;
END;
$$;

-- Test 2: Check if all tables exist
DO $$
DECLARE
    table_count integer;
    expected_tables text[] := ARRAY[
        'users', 
        'onboarding_progress', 
        'games', 
        'conversations', 
        'api_usage', 
        'user_analytics',
        'user_sessions',
        'waitlist'
    ];
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = ANY(expected_tables);
    
    IF table_count = array_length(expected_tables, 1) THEN
        RAISE NOTICE '✅ All % tables exist', table_count;
    ELSE
        RAISE NOTICE '❌ Only % out of % tables exist', table_count, array_length(expected_tables, 1);
    END IF;
END;
$$;

-- Test 3: Check if triggers exist
DO $$
DECLARE
    trigger_count integer;
    expected_triggers text[] := ARRAY[
        'on_auth_user_created', 
        'update_users_updated_at', 
        'update_games_updated_at', 
        'update_conversations_updated_at'
    ];
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public' 
    AND trigger_name = ANY(expected_triggers);
    
    IF trigger_count = array_length(expected_triggers, 1) THEN
        RAISE NOTICE '✅ All % triggers exist', trigger_count;
    ELSE
        RAISE NOTICE '❌ Only % out of % triggers exist', trigger_count, array_length(expected_triggers, 1);
    END IF;
END;
$$;

-- Test 4: Check if RLS is enabled on all tables
DO $$
DECLARE
    rls_count integer;
    expected_tables text[] := ARRAY[
        'users', 
        'onboarding_progress', 
        'games', 
        'conversations', 
        'api_usage', 
        'user_analytics',
        'user_sessions',
        'waitlist'
    ];
BEGIN
    SELECT COUNT(*) INTO rls_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
    AND c.relname = ANY(expected_tables)
    AND c.relrowsecurity = true;
    
    IF rls_count = array_length(expected_tables, 1) THEN
        RAISE NOTICE '✅ RLS enabled on all % tables', rls_count;
    ELSE
        RAISE NOTICE '❌ RLS enabled on only % out of % tables', rls_count, array_length(expected_tables, 1);
    END IF;
END;
$$;

-- Test 5: Test the get_complete_user_data function (should not error)
DO $$
BEGIN
    -- This should not error even if no users exist
    PERFORM public.get_complete_user_data('00000000-0000-0000-0000-000000000000'::uuid);
    RAISE NOTICE '✅ get_complete_user_data function works (returns empty result for non-existent user)';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ get_complete_user_data function error: %', SQLERRM;
END;
$$;

-- Test 6: Test the create_user_record function (should not error)
DO $$
BEGIN
    -- This should not error
    PERFORM public.create_user_record(
        '00000000-0000-0000-0000-000000000000'::uuid,
        'test@example.com',
        'Test User',
        NULL,
        false,
        'free'
    );
    RAISE NOTICE '✅ create_user_record function works';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ create_user_record function error: %', SQLERRM;
END;
$$;

-- Test 7: Test the update_user_app_state function (should not error)
DO $$
BEGIN
    -- This should not error (user doesn't exist, but function should work)
    PERFORM public.update_user_app_state(
        '00000000-0000-0000-0000-000000000000'::uuid,
        'test_field',
        '{"test": "value"}'::jsonb
    );
    RAISE NOTICE '✅ update_user_app_state function works';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ update_user_app_state function error: %', SQLERRM;
END;
$$;

-- Test 8: Test the get_user_onboarding_status function (should not error)
DO $$
BEGIN
    -- This should not error (user doesn't exist, but function should work)
    PERFORM public.get_user_onboarding_status('00000000-0000-0000-0000-000000000000'::uuid);
    RAISE NOTICE '✅ get_user_onboarding_status function works';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ get_user_onboarding_status function error: %', SQLERRM;
END;
$$;

-- Test 9: Check if all indexes exist
DO $$
DECLARE
    index_count integer;
    expected_indexes text[] := ARRAY[
        'idx_users_auth_user_id',
        'idx_users_email',
        'idx_users_tier',
        'idx_users_created_at',
        'idx_onboarding_progress_user_id',
        'idx_onboarding_progress_step',
        'idx_games_user_id',
        'idx_games_title',
        'idx_games_genre',
        'idx_conversations_user_id',
        'idx_conversations_game_id',
        'idx_conversations_created_at',
        'idx_api_usage_user_id',
        'idx_api_usage_created_at',
        'idx_user_analytics_user_id',
        'idx_user_analytics_event_type',
        'idx_user_analytics_created_at',
        'idx_user_sessions_user_id',
        'idx_user_sessions_token',
        'idx_user_sessions_expires_at',
        'idx_waitlist_email',
        'idx_waitlist_status'
    ];
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname = ANY(expected_indexes);
    
    IF index_count = array_length(expected_indexes, 1) THEN
        RAISE NOTICE '✅ All % indexes exist', index_count;
    ELSE
        RAISE NOTICE '❌ Only % out of % indexes exist', index_count, array_length(expected_indexes, 1);
    END IF;
END;
$$;

-- Test 10: Check if all policies exist
DO $$
DECLARE
    policy_count integer;
    expected_policies text[] := ARRAY[
        'Users can view own data',
        'Users can update own data',
        'Users can insert own data',
        'Users can view own onboarding progress',
        'Users can insert own onboarding progress',
        'Users can view own games',
        'Users can insert own games',
        'Users can update own games',
        'Users can delete own games',
        'Users can view own conversations',
        'Users can insert own conversations',
        'Users can update own conversations',
        'Users can delete own conversations',
        'Users can view own API usage',
        'Users can insert own API usage',
        'Users can view own analytics',
        'Users can insert own analytics',
        'Users can view own sessions',
        'Users can insert own sessions',
        'Users can update own sessions',
        'Users can delete own sessions',
        'Anyone can view waitlist',
        'Anyone can insert to waitlist'
    ];
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND policyname = ANY(expected_policies);
    
    IF policy_count = array_length(expected_policies, 1) THEN
        RAISE NOTICE '✅ All % RLS policies exist', policy_count;
    ELSE
        RAISE NOTICE '❌ Only % out of % policies exist', policy_count, array_length(expected_policies, 1);
    END IF;
END;
$$;

-- Final verification
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'COMPLETE AUTHENTICATION TEST FINISHED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'If you see all ✅ messages above, your complete schema is ready!';
    RAISE NOTICE 'You can now test the actual authentication flow in your app.';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Run MASTER_SCHEMA_COMPLETE.sql in Supabase SQL Editor';
    RAISE NOTICE '2. Run this test script to verify everything works';
    RAISE NOTICE '3. Test authentication in your app (Google, Discord, Email)';
    RAISE NOTICE '4. Check that users are created in both auth.users and public.users';
    RAISE NOTICE '5. Verify redirect to initial splash screen works';
    RAISE NOTICE '========================================';
END;
$$;
