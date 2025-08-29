-- ========================================
-- SHOW TABLE STRUCTURE CLEARLY
-- This makes the table structure very visible
-- ========================================

-- Clear, simple table structure display
SELECT 
    '🔍 TABLE STRUCTURE CHECK' as header,
    'Run this first to see what columns exist' as instruction;

-- Check user_profiles table
SELECT 
    '📋 user_profiles' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check user_preferences table
SELECT 
    '📋 user_preferences' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Check games table
SELECT 
    '📋 games' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'games'
ORDER BY ordinal_position;

-- Check game_contexts table
SELECT 
    '📋 game_contexts' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'game_contexts'
ORDER BY ordinal_position;

-- Check conversations table
SELECT 
    '📋 conversations' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'conversations'
ORDER BY ordinal_position;

-- Check chat_messages table
SELECT 
    '📋 chat_messages' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chat_messages'
ORDER BY ordinal_position;

-- Check diary_tasks table
SELECT 
    '📋 diary_tasks' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'diary_tasks'
ORDER BY ordinal_position;

-- Check diary_favorites table
SELECT 
    '📋 diary_favorites' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'diary_favorites'
ORDER BY ordinal_position;

-- Summary of what we found
SELECT 
    '📊 SUMMARY' as summary_header,
    COUNT(*) as total_tables,
    'tables found in public schema' as description
FROM pg_tables 
WHERE schemaname = 'public';

-- List all table names
SELECT 
    '📋 All Tables:' as table_list_header,
    tablename as table_name
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
