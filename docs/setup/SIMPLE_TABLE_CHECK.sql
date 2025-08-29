-- ========================================
-- SIMPLE TABLE STRUCTURE CHECK
-- Just the essential info we need
-- ========================================

-- Check user_profiles table
SELECT 'user_profiles' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check games table  
SELECT 'games' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'games'
ORDER BY ordinal_position;

-- Check conversations table
SELECT 'conversations' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversations'
ORDER BY ordinal_position;

-- Check chat_messages table
SELECT 'chat_messages' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'chat_messages'
ORDER BY ordinal_position;

-- Check diary_tasks table
SELECT 'diary_tasks' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'diary_tasks'
ORDER BY ordinal_position;

-- Check diary_favorites table
SELECT 'diary_favorites' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'diary_favorites'
ORDER BY ordinal_position;
