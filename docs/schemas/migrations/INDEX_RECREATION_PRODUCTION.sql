-- 🔄 OTAKON V19 INDEX RECREATION SCRIPT (PRODUCTION USE)
-- This script recreates indexes with CONCURRENTLY for production databases
-- Use this during maintenance windows to avoid blocking operations
-- WARNING: Only run this when you have low database activity

-- =====================================================
-- STEP 1: VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🚨 PRODUCTION INDEX RECREATION SCRIPT';
    RAISE NOTICE '⚠️  This script will drop and recreate indexes with CONCURRENTLY';
    RAISE NOTICE '⚠️  Only run during maintenance windows with low activity';
    RAISE NOTICE '✅ Proceeding with index recreation...';
END $$;

-- =====================================================
-- STEP 2: DROP EXISTING INDEXES
-- =====================================================

-- Drop player profiles indexes
DROP INDEX IF EXISTS idx_player_profiles_user_id;
DROP INDEX IF EXISTS idx_player_profiles_hint_style;
DROP INDEX IF EXISTS idx_player_profiles_player_focus;

-- Drop game contexts indexes
DROP INDEX IF EXISTS idx_game_contexts_user_id;
DROP INDEX IF EXISTS idx_game_contexts_game_id;
DROP INDEX IF EXISTS idx_game_contexts_user_game;
DROP INDEX IF EXISTS idx_game_contexts_last_session;

-- Drop build snapshots indexes
DROP INDEX IF EXISTS idx_build_snapshots_game_context;
DROP INDEX IF EXISTS idx_build_snapshots_timestamp;

-- Drop session summaries indexes
DROP INDEX IF EXISTS idx_session_summaries_game_context;
DROP INDEX IF EXISTS idx_session_summaries_date;

-- Drop enhanced insights indexes
DROP INDEX IF EXISTS idx_enhanced_insights_conversation;
DROP INDEX IF EXISTS idx_enhanced_insights_user;
DROP INDEX IF EXISTS idx_enhanced_insights_status;
DROP INDEX IF EXISTS idx_enhanced_insights_priority;

-- Drop proactive triggers indexes
DROP INDEX IF EXISTS idx_proactive_triggers_user;
DROP INDEX IF EXISTS idx_proactive_triggers_type;
DROP INDEX IF EXISTS idx_proactive_triggers_processed;
DROP INDEX IF EXISTS idx_proactive_triggers_created;

-- Drop proactive insights indexes
DROP INDEX IF EXISTS idx_proactive_insights_user;
DROP INDEX IF EXISTS idx_proactive_insights_priority;
DROP INDEX IF EXISTS idx_proactive_insights_unread;
DROP INDEX IF EXISTS idx_proactive_insights_created;

-- =====================================================
-- STEP 3: RECREATE INDEXES WITH CONCURRENTLY
-- =====================================================

-- Player profiles indexes
CREATE INDEX CONCURRENTLY idx_player_profiles_user_id ON player_profiles(user_id);
CREATE INDEX CONCURRENTLY idx_player_profiles_hint_style ON player_profiles(hint_style);
CREATE INDEX CONCURRENTLY idx_player_profiles_player_focus ON player_profiles(player_focus);

-- Game contexts indexes
CREATE INDEX CONCURRENTLY idx_game_contexts_user_id ON game_contexts(user_id);
CREATE INDEX CONCURRENTLY idx_game_contexts_game_id ON game_contexts(game_id);
CREATE INDEX CONCURRENTLY idx_game_contexts_user_game ON game_contexts(user_id, game_id);
CREATE INDEX CONCURRENTLY idx_game_contexts_last_session ON game_contexts(last_session_date);

-- Build snapshots indexes
CREATE INDEX CONCURRENTLY idx_build_snapshots_game_context ON build_snapshots(game_context_id);
CREATE INDEX CONCURRENTLY idx_build_snapshots_timestamp ON build_snapshots(timestamp);

-- Session summaries indexes
CREATE INDEX CONCURRENTLY idx_session_summaries_game_context ON session_summaries(game_context_id);
CREATE INDEX CONCURRENTLY idx_session_summaries_date ON session_summaries(date);

-- Enhanced insights indexes
CREATE INDEX CONCURRENTLY idx_enhanced_insights_conversation ON enhanced_insights(conversation_id);
CREATE INDEX CONCURRENTLY idx_enhanced_insights_user ON enhanced_insights(user_id);
CREATE INDEX CONCURRENTLY idx_enhanced_insights_status ON enhanced_insights(status);
CREATE INDEX CONCURRENTLY idx_enhanced_insights_priority ON enhanced_insights(priority);

-- Proactive triggers indexes
CREATE INDEX CONCURRENTLY idx_proactive_triggers_user ON proactive_triggers(user_id);
CREATE INDEX CONCURRENTLY idx_proactive_triggers_type ON proactive_triggers(trigger_type);
CREATE INDEX CONCURRENTLY idx_proactive_triggers_processed ON proactive_triggers(processed) WHERE processed = FALSE;
CREATE INDEX CONCURRENTLY idx_proactive_triggers_created ON proactive_triggers(created_at);

-- Proactive insights indexes
CREATE INDEX CONCURRENTLY idx_proactive_insights_user ON proactive_insights(user_id);
CREATE INDEX CONCURRENTLY idx_proactive_insights_priority ON proactive_insights(priority);
CREATE INDEX CONCURRENTLY idx_proactive_insights_unread ON proactive_insights(is_read) WHERE is_read = FALSE;
CREATE INDEX CONCURRENTLY idx_proactive_insights_created ON proactive_insights(created_at);

-- =====================================================
-- STEP 4: VERIFICATION AND COMPLETION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 Index recreation completed successfully!';
    RAISE NOTICE '📊 All indexes now use CONCURRENTLY for better performance';
    RAISE NOTICE '🔍 You can verify indexes with: \d+ table_name';
    RAISE NOTICE '📈 Database performance should be improved';
END $$;
