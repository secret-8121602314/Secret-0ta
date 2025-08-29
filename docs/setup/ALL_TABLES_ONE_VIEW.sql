-- ========================================
-- ALL KEY TABLES IN ONE VIEW
-- This shows all tables together so you can see everything
-- ========================================

-- Show all key tables structure in one unified view
SELECT 
    'user_profiles' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles'

UNION ALL

SELECT 
    'games' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'games'

UNION ALL

SELECT 
    'conversations' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversations'

UNION ALL

SELECT 
    'chat_messages' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'chat_messages'

UNION ALL

SELECT 
    'diary_tasks' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'diary_tasks'

UNION ALL

SELECT 
    'diary_favorites' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'diary_favorites'

UNION ALL

SELECT 
    'user_preferences' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_preferences'

UNION ALL

SELECT 
    'game_contexts' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'game_contexts'

ORDER BY table_name, column_name;
