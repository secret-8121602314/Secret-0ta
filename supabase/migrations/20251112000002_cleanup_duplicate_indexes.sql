-- Cleanup Duplicate Indexes Migration
-- Created: 2025-11-12
-- Purpose: Remove duplicate indexes found by Supabase linter

-- ============================================================================
-- CURRENT DUPLICATES IN DATABASE:
-- ============================================================================
-- app_cache table has:
--   - idx_cache_expires_at (original)
--   - idx_app_cache_expires_at (duplicate) ← DROP THIS
--
-- messages table has:
--   - idx_messages_conversation_created (original compound: conversation_id + created_at DESC)
--   - idx_messages_conversation_timestamp (duplicate compound: conversation_id + created_at DESC) ← DROP THIS
--   - idx_messages_conversation (different compound: conversation_id + created_at ASC) ← KEEP (different sort order)
--   - idx_messages_conversation_id (new simple index) ← KEEP (useful for simple lookups)
--
-- subtabs table has:
--   - idx_subtabs_game (original compound: game_id + order_index) ← KEEP
--   - idx_subtabs_game_id (duplicate simple: game_id only) ← DROP THIS
--   - idx_subtabs_game_order (duplicate compound: game_id + order_index) ← DROP THIS

-- ============================================================================
-- DROP DUPLICATE INDEXES:
-- ============================================================================

-- app_cache: Remove idx_app_cache_expires_at (duplicates idx_cache_expires_at)
DROP INDEX IF EXISTS public.idx_app_cache_expires_at;

-- messages: Remove idx_messages_conversation_timestamp (duplicates idx_messages_conversation_created)
DROP INDEX IF EXISTS public.idx_messages_conversation_timestamp;

-- subtabs: Remove both game_id duplicates (idx_subtabs_game already covers both cases)
DROP INDEX IF EXISTS public.idx_subtabs_game_id;
DROP INDEX IF EXISTS public.idx_subtabs_game_order;

-- ============================================================================
-- FINAL INDEX SUMMARY (after cleanup):
-- ============================================================================
-- app_cache:
--   ✅ idx_cache_expires_at (expires_at)
--   ✅ idx_cache_type (cache_type)
--   ✅ idx_cache_user_id (user_id)
--   ✅ idx_app_cache_key (key) - NEW
--   ✅ idx_app_cache_user_id (user_id WHERE user_id IS NOT NULL) - NEW
--
-- messages:
--   ✅ idx_messages_conversation (conversation_id + created_at ASC)
--   ✅ idx_messages_conversation_created (conversation_id + created_at DESC)
--   ✅ idx_messages_conversation_id (conversation_id) - NEW
--
-- subtabs:
--   ✅ idx_subtabs_conversation_id (conversation_id)
--   ✅ idx_subtabs_conversation_order (conversation_id + order_index)
--   ✅ idx_subtabs_game (game_id + order_index)
--   ✅ idx_subtabs_type (tab_type)
--
-- conversations:
--   ✅ idx_conversations_user_id (user_id) - Already existed
--
-- games:
--   ✅ idx_games_user_id (user_id) - Already existed
-- ============================================================================

-- Verify cleanup completed
DO $$
BEGIN
  RAISE NOTICE 'Duplicate indexes cleaned up successfully!';
  RAISE NOTICE 'Run: SELECT * FROM pg_indexes WHERE schemaname = ''public'' ORDER BY tablename, indexname;';
  RAISE NOTICE 'to verify remaining indexes.';
END $$;
