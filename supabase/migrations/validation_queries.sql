-- validation_queries.sql
-- Run these BEFORE migration to verify data integrity
-- Expected: All CHECK queries return 0 (except total count)

\echo '=================================================='
\echo '        DATABASE MIGRATION VALIDATION'
\echo '        Date: 2024-11-16'
\echo '        Target: public.messages table'
\echo '=================================================='
\echo ''

-- ============================================================
-- MESSAGES TABLE VALIDATION
-- ============================================================
\echo '=== MESSAGES TABLE VALIDATION ==='
\echo ''

\echo 'Check 1: Messages with NULL conversation_id'
SELECT 
  COUNT(*) as null_conversation_id_count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM messages 
WHERE conversation_id IS NULL;
\echo ''

\echo 'Check 2: Orphaned messages (conversation deleted)'
SELECT 
  COUNT(*) as orphaned_messages_count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM messages m 
LEFT JOIN conversations c ON m.conversation_id = c.id 
WHERE c.id IS NULL;
\echo ''

\echo 'Check 3: Total messages to backfill'
SELECT 
  COUNT(*) as total_messages,
  'Estimated time: ' || ROUND(COUNT(*) / 1000.0, 2) || ' seconds' as estimate
FROM messages;
\echo ''

-- ============================================================
-- CONVERSATIONS TABLE VALIDATION
-- ============================================================
\echo '=== CONVERSATIONS TABLE VALIDATION ==='
\echo ''

\echo 'Check 4: Conversations with NULL auth_user_id'
SELECT 
  COUNT(*) as null_auth_user_id_count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM conversations 
WHERE auth_user_id IS NULL;
\echo ''

\echo 'Check 5: Invalid auth_user_id references'
SELECT 
  COUNT(*) as invalid_references,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM conversations c
LEFT JOIN auth.users u ON c.auth_user_id = u.id
WHERE c.auth_user_id IS NOT NULL AND u.id IS NULL;
\echo ''

-- ============================================================
-- RLS POLICY VALIDATION
-- ============================================================
\echo '=== RLS POLICY VALIDATION ==='
\echo ''

\echo 'Check 6: Current RLS policies on messages'
SELECT 
  policyname,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_check
FROM pg_policies 
WHERE tablename = 'messages' 
ORDER BY policyname;
\echo ''

-- ============================================================
-- FUNCTION VALIDATION
-- ============================================================
\echo '=== FUNCTION VALIDATION ==='
\echo ''

\echo 'Check 7: add_message function signature'
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as parameters
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'add_message';
\echo ''

-- ============================================================
-- SAMPLE DATA VALIDATION
-- ============================================================
\echo '=== SAMPLE DATA VALIDATION ==='
\echo ''

\echo 'Check 8: Sample messages with their conversation auth_user_id'
SELECT 
  m.id as message_id,
  m.conversation_id,
  c.auth_user_id as conversation_auth_user_id,
  m.role,
  LEFT(m.content, 50) as content_preview
FROM messages m
JOIN conversations c ON m.conversation_id = c.id
ORDER BY m.created_at DESC
LIMIT 5;
\echo ''

-- ============================================================
-- SUMMARY
-- ============================================================
\echo '=================================================='
\echo '             VALIDATION COMPLETE'
\echo '=================================================='
\echo ''
\echo 'Review results above. All FAIL statuses must be'
\echo 'resolved before proceeding with migration.'
\echo ''
\echo 'Expected results:'
\echo '  Check 1-2, 4-5: COUNT = 0 (✅ PASS)'
\echo '  Check 3: Shows total messages'
\echo '  Check 6: Lists 4 current RLS policies'
\echo '  Check 7: Shows add_message parameters'
\echo '  Check 8: Shows 5 sample messages'
\echo ''
