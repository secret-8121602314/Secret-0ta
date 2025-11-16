-- Verify migration success

-- Check if game_hub_interactions table exists
SELECT 'game_hub_interactions table exists' as check_name, 
       EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'game_hub_interactions'
       ) as result;

-- Check if auth_user_id column exists on messages
SELECT 'messages.auth_user_id exists' as check_name,
       EXISTS (
         SELECT FROM information_schema.columns 
         WHERE table_name = 'messages' AND column_name = 'auth_user_id'
       ) as result;

-- Check if auth_user_id column exists on subtabs
SELECT 'subtabs.auth_user_id exists' as check_name,
       EXISTS (
         SELECT FROM information_schema.columns 
         WHERE table_name = 'subtabs' AND column_name = 'auth_user_id'
       ) as result;

-- Check if JSONB columns are dropped from conversations
SELECT 'conversations.messages dropped' as check_name,
       NOT EXISTS (
         SELECT FROM information_schema.columns 
         WHERE table_name = 'conversations' AND column_name = 'messages'
       ) as result;

SELECT 'conversations.subtabs dropped' as check_name,
       NOT EXISTS (
         SELECT FROM information_schema.columns 
         WHERE table_name = 'conversations' AND column_name = 'subtabs'
       ) as result;

-- Check if unused tables are dropped
SELECT 'api_usage table dropped' as check_name,
       NOT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'api_usage'
       ) as result;

-- Check if unreleased games validation trigger exists
SELECT 'unreleased games trigger exists' as check_name,
       EXISTS (
         SELECT FROM information_schema.triggers 
         WHERE trigger_name = 'validate_subtab_unreleased_trigger'
       ) as result;

-- Count total indexes on auth_user_id columns
SELECT 'auth_user_id indexes count' as check_name,
       COUNT(*) as result
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE '%auth_user_id%';
