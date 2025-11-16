-- =============================================
-- CONSOLIDATED SCHEMA OPTIMIZATION MIGRATION
-- Created: 2025-11-16
-- Purpose: Game Hub interactions tracking, RLS performance optimization, 
--          unreleased games subtabs blocking, unused table cleanup
-- =============================================

-- =============================================
-- PART 1: CREATE GAME HUB INTERACTIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS game_hub_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Query Details
  query_text text NOT NULL,
  query_timestamp timestamptz DEFAULT now() NOT NULL,
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Response Details
  response_text text,
  response_timestamp timestamptz,
  response_message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  
  -- Game Detection (from OTAKON tags)
  detected_game text,
  detection_confidence text CHECK (detection_confidence IN ('high', 'low')),
  detected_genre text,
  game_status text CHECK (game_status IN ('released', 'unreleased')),
  
  -- User Action
  tab_created boolean DEFAULT false,
  tab_created_at timestamptz,
  created_conversation_id text REFERENCES conversations(id) ON DELETE SET NULL,
  
  -- Metadata
  ai_model text DEFAULT 'gemini-2.5-flash-preview-09-2025',
  tokens_used integer,
  query_type text CHECK (query_type IN ('general', 'game_specific', 'recommendation')),
  
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for game_hub_interactions
CREATE INDEX IF NOT EXISTS idx_game_hub_interactions_auth_user_id ON game_hub_interactions(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_game_hub_interactions_detected_game ON game_hub_interactions(detected_game);
CREATE INDEX IF NOT EXISTS idx_game_hub_interactions_created_at ON game_hub_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_hub_interactions_query_type ON game_hub_interactions(query_type);

-- RLS for game_hub_interactions
ALTER TABLE game_hub_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own game hub interactions"
ON game_hub_interactions FOR SELECT
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own game hub interactions"
ON game_hub_interactions FOR INSERT
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own game hub interactions"
ON game_hub_interactions FOR UPDATE
USING (auth_user_id = auth.uid());

-- =============================================
-- PART 2: OPTIMIZE RLS PERFORMANCE - ADD auth_user_id TO messages
-- =============================================

-- Add auth_user_id column to messages table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill auth_user_id from conversations (safety measure even if no data)
UPDATE messages m
SET auth_user_id = c.auth_user_id
FROM conversations c
WHERE m.conversation_id = c.id
  AND m.auth_user_id IS NULL;

-- Create index for RLS performance
CREATE INDEX IF NOT EXISTS idx_messages_auth_user_id ON messages(auth_user_id);

-- Create trigger to auto-populate auth_user_id on INSERT
CREATE OR REPLACE FUNCTION messages_set_auth_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get auth_user_id from the conversation
  SELECT auth_user_id INTO NEW.auth_user_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS messages_set_auth_user_id_trigger ON messages;
CREATE TRIGGER messages_set_auth_user_id_trigger
  BEFORE INSERT ON messages
  FOR EACH ROW
  WHEN (NEW.auth_user_id IS NULL)
  EXECUTE FUNCTION messages_set_auth_user_id();

-- Update RLS policies to use auth_user_id directly (drop old policies first)
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON messages;

-- Create optimized RLS policies
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own messages"
ON messages FOR INSERT
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own messages"
ON messages FOR UPDATE
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can delete own messages"
ON messages FOR DELETE
USING (auth_user_id = auth.uid());

-- =============================================
-- PART 3: OPTIMIZE RLS PERFORMANCE - ADD auth_user_id TO subtabs
-- =============================================

-- Add auth_user_id column to subtabs table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subtabs' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE subtabs ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill auth_user_id from conversations (safety measure even if no data)
UPDATE subtabs s
SET auth_user_id = c.auth_user_id
FROM conversations c
WHERE s.conversation_id = c.id
  AND s.auth_user_id IS NULL;

-- Create index for RLS performance
CREATE INDEX IF NOT EXISTS idx_subtabs_auth_user_id ON subtabs(auth_user_id);

-- Create trigger to auto-populate auth_user_id on INSERT
CREATE OR REPLACE FUNCTION subtabs_set_auth_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get auth_user_id from the conversation
  SELECT auth_user_id INTO NEW.auth_user_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS subtabs_set_auth_user_id_trigger ON subtabs;
CREATE TRIGGER subtabs_set_auth_user_id_trigger
  BEFORE INSERT ON subtabs
  FOR EACH ROW
  WHEN (NEW.auth_user_id IS NULL)
  EXECUTE FUNCTION subtabs_set_auth_user_id();

-- Update RLS policies to use auth_user_id directly (drop old policies first)
DROP POLICY IF EXISTS "subtabs_select_policy" ON subtabs;
DROP POLICY IF EXISTS "subtabs_insert_policy" ON subtabs;
DROP POLICY IF EXISTS "subtabs_update_policy" ON subtabs;
DROP POLICY IF EXISTS "subtabs_delete_policy" ON subtabs;

-- Create optimized RLS policies
CREATE POLICY "Users can view own subtabs"
ON subtabs FOR SELECT
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can insert own subtabs"
ON subtabs FOR INSERT
WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update own subtabs"
ON subtabs FOR UPDATE
USING (auth_user_id = auth.uid());

CREATE POLICY "Users can delete own subtabs"
ON subtabs FOR DELETE
USING (auth_user_id = auth.uid());

-- =============================================
-- PART 4: BLOCK SUBTABS FOR UNRELEASED GAMES
-- =============================================

-- Create validation function for unreleased games (triggers work, CHECK constraints with subqueries don't)
CREATE OR REPLACE FUNCTION validate_subtab_for_unreleased()
RETURNS TRIGGER AS $$
DECLARE
  is_unreleased_game boolean;
BEGIN
  -- Check if conversation is for unreleased game
  SELECT is_unreleased INTO is_unreleased_game
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  IF is_unreleased_game = true THEN
    RAISE EXCEPTION 'Subtabs cannot be created for unreleased games'
      USING HINT = 'Unreleased games do not support subtabs feature';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_subtab_unreleased_trigger ON subtabs;
CREATE TRIGGER validate_subtab_unreleased_trigger
  BEFORE INSERT OR UPDATE ON subtabs
  FOR EACH ROW
  EXECUTE FUNCTION validate_subtab_for_unreleased();

-- =============================================
-- PART 5: ENHANCE API USAGE AND USER SESSIONS TRACKING
-- =============================================

-- Keep api_usage and user_sessions tables - needed for analytics
-- Drop only game_insights (genuinely unused)
DROP TABLE IF EXISTS game_insights CASCADE;

-- Add auth_user_id to api_usage for direct RLS performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_usage' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE api_usage ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill auth_user_id from users table
UPDATE api_usage a
SET auth_user_id = u.auth_user_id
FROM users u
WHERE a.user_id = u.id
  AND a.auth_user_id IS NULL;

-- Add model and endpoint tracking to api_usage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_usage' AND column_name = 'ai_model'
  ) THEN
    ALTER TABLE api_usage ADD COLUMN ai_model text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'api_usage' AND column_name = 'endpoint'
  ) THEN
    ALTER TABLE api_usage ADD COLUMN endpoint text;
  END IF;
END $$;

-- Add auth_user_id to user_sessions for direct RLS performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill auth_user_id from users table
UPDATE user_sessions s
SET auth_user_id = u.auth_user_id
FROM users u
WHERE s.user_id = u.id
  AND s.auth_user_id IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_usage_auth_user_id ON api_usage(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_auth_user_id ON user_sessions(auth_user_id);

-- Note: onboarding_progress and user_analytics are kept - they ARE used by onboardingService.ts

-- =============================================
-- PART 6: UPDATE TIMESTAMPS
-- =============================================

-- Add updated_at triggers for new table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_game_hub_interactions_updated_at ON game_hub_interactions;
CREATE TRIGGER update_game_hub_interactions_updated_at
  BEFORE UPDATE ON game_hub_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- VERIFICATION QUERIES (for testing)
-- =============================================

-- Verify game_hub_interactions table
COMMENT ON TABLE game_hub_interactions IS 'Tracks all Game Hub queries and responses with game detection metadata';

-- Verify auth_user_id columns exist
COMMENT ON COLUMN messages.auth_user_id IS 'Denormalized auth.users.id for RLS performance optimization';
COMMENT ON COLUMN subtabs.auth_user_id IS 'Denormalized auth.users.id for RLS performance optimization';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Schema optimization migration completed successfully';
  RAISE NOTICE 'Created: game_hub_interactions table';
  RAISE NOTICE 'Optimized: messages and subtabs RLS policies';
  RAISE NOTICE 'Enhanced: api_usage and user_sessions with auth_user_id';
  RAISE NOTICE 'Added: unreleased games subtabs constraint';
  RAISE NOTICE 'Dropped: game_insights table only';
END $$;
