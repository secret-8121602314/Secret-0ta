-- Query to get current production schema structure
-- Run this in Supabase SQL Editor to see what's actually in production

-- 1. Check which tables have auth_user_id column
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('user_id', 'auth_user_id')
ORDER BY table_name, column_name;

-- 2. Get detailed column info for key tables
SELECT 
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('conversations', 'messages', 'subtabs', 'game_hub_interactions', 
                     'user_sessions', 'user_analytics', 'onboarding_progress', 'api_usage')
ORDER BY table_name, ordinal_position;

-- 3. Check RLS policies on these tables
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
  AND tablename IN ('conversations', 'messages', 'subtabs', 'game_hub_interactions',
                    'user_sessions', 'user_analytics', 'onboarding_progress')
ORDER BY tablename, policyname;

-- 4. Check triggers on tables
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('conversations', 'messages', 'subtabs', 'game_hub_interactions')
ORDER BY event_object_table, trigger_name;

-- 5. List all public tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
