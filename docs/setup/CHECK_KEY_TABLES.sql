-- ========================================
-- CHECK KEY TABLES STRUCTURE
-- Focus on tables that commonly have RLS issues
-- ========================================

-- Check user_profiles table (usually has 'id' column)
SELECT 
    '🔑 user_profiles' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check games table (might have 'owner_id' or 'user_id')
SELECT 
    '🎮 games' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'games'
ORDER BY ordinal_position;

-- Check conversations table (usually has 'user_id')
SELECT 
    '💬 conversations' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'conversations'
ORDER BY ordinal_position;

-- Check chat_messages table (usually has 'user_id')
SELECT 
    '💭 chat_messages' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chat_messages'
ORDER BY ordinal_position;

-- Check diary_tasks table (usually has 'user_id')
SELECT 
    '📝 diary_tasks' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'diary_tasks'
ORDER BY ordinal_position;

-- Check diary_favorites table (usually has 'user_id')
SELECT 
    '⭐ diary_favorites' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'diary_favorites'
ORDER BY ordinal_position;

-- Check user_preferences table (usually has 'user_id')
SELECT 
    '⚙️ user_preferences' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Check player_profiles table (might be the same as user_profiles)
SELECT 
    '👤 player_profiles' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'player_profiles'
ORDER BY ordinal_position;

-- Check game_contexts table (might have 'user_id' or 'player_id')
SELECT 
    '🎯 game_contexts' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'game_contexts'
ORDER BY ordinal_position;

-- Summary of what we're looking for
SELECT 
    '🔍 LOOKING FOR:' as search_header,
    'user_id, owner_id, player_id, or similar columns' as target_columns,
    'to create proper RLS policies' as purpose;
