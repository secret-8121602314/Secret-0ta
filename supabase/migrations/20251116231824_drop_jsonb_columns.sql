-- =============================================
-- DROP JSONB COLUMNS MIGRATION
-- Created: 2025-11-16
-- Purpose: Complete migration to normalized tables by dropping
--          legacy JSONB columns from conversations table
-- Prerequisites: 
--   - USE_NORMALIZED_MESSAGES=true
--   - USE_NORMALIZED_SUBTABS=true
--   - All data verified in normalized tables
-- =============================================

-- Verify normalized tables exist and have data before dropping JSONB
DO $$
DECLARE
  messages_count INTEGER;
  subtabs_count INTEGER;
  conversations_with_jsonb_messages INTEGER;
  conversations_with_jsonb_subtabs INTEGER;
BEGIN
  -- Count rows in normalized tables
  SELECT COUNT(*) INTO messages_count FROM messages;
  SELECT COUNT(*) INTO subtabs_count FROM subtabs;
  
  -- Count conversations with JSONB data
  SELECT COUNT(*) INTO conversations_with_jsonb_messages 
  FROM conversations 
  WHERE messages IS NOT NULL AND jsonb_array_length(messages) > 0;
  
  SELECT COUNT(*) INTO conversations_with_jsonb_subtabs 
  FROM conversations 
  WHERE subtabs IS NOT NULL AND jsonb_array_length(subtabs) > 0;
  
  RAISE NOTICE 'Pre-migration verification:';
  RAISE NOTICE '  - messages table rows: %', messages_count;
  RAISE NOTICE '  - subtabs table rows: %', subtabs_count;
  RAISE NOTICE '  - conversations with JSONB messages: %', conversations_with_jsonb_messages;
  RAISE NOTICE '  - conversations with JSONB subtabs: %', conversations_with_jsonb_subtabs;
  
  -- Safety check: warn if JSONB has data but normalized tables are empty
  IF (conversations_with_jsonb_messages > 0 AND messages_count = 0) THEN
    RAISE WARNING 'JSONB messages exist but normalized messages table is empty!';
  END IF;
  
  IF (conversations_with_jsonb_subtabs > 0 AND subtabs_count = 0) THEN
    RAISE WARNING 'JSONB subtabs exist but normalized subtabs table is empty!';
  END IF;
END $$;

-- =============================================
-- DROP LEGACY JSONB COLUMNS
-- =============================================

-- Drop messages JSONB column
ALTER TABLE conversations DROP COLUMN IF EXISTS messages;

-- Drop subtabs JSONB column
ALTER TABLE conversations DROP COLUMN IF EXISTS subtabs;

-- Drop subtabs_order column (now stored as order_index in subtabs table)
ALTER TABLE conversations DROP COLUMN IF EXISTS subtabs_order;

-- =============================================
-- VERIFY CLEANUP
-- =============================================

DO $$
BEGIN
  -- Verify columns are dropped
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'messages'
  ) THEN
    RAISE NOTICE '✅ conversations.messages column dropped successfully';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'subtabs'
  ) THEN
    RAISE NOTICE '✅ conversations.subtabs column dropped successfully';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversations' AND column_name = 'subtabs_order'
  ) THEN
    RAISE NOTICE '✅ conversations.subtabs_order column dropped successfully';
  END IF;
  
  RAISE NOTICE 'Migration to normalized tables complete!';
END $$;
