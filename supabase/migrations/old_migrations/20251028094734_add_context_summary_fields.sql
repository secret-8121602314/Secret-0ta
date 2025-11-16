-- Migration: Add context summary fields to conversations table
-- Date: October 28, 2025
-- Purpose: Enable context preservation across long conversations
-- Part of: Phase 0 Critical Fixes

-- Add context_summary column to store AI-generated conversation summaries
-- Max 500 words, text-only (no base64 image URLs)
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS context_summary TEXT;

-- Add last_summarized_at column to track when summary was last updated
-- Used to determine when to regenerate summary
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS last_summarized_at BIGINT;

-- Create index on last_summarized_at for efficient querying
CREATE INDEX IF NOT EXISTS idx_conversations_last_summarized 
ON conversations(last_summarized_at);

-- Add comment for documentation
COMMENT ON COLUMN conversations.context_summary IS 
'AI-generated summary of conversation history (max 500 words, text-only). Used for context injection in prompts.';

COMMENT ON COLUMN conversations.last_summarized_at IS 
'Unix timestamp (milliseconds) of when context_summary was last updated. Used to determine staleness.';
