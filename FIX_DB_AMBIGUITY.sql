-- Fix for "Could not choose the best candidate function" error (PGRST203)
-- This error occurs because Supabase RPC calls pass parameters as JSON, and Postgres
-- cannot distinguish between the TEXT and UUID overloads when a UUID-like string is passed.
-- Since the TEXT version can handle both UUID strings and custom IDs (like 'game-hub'),
-- the UUID-specific versions are redundant and cause ambiguity.

-- 1. Drop the UUID version of add_message
DROP FUNCTION IF EXISTS "public"."add_message"("p_conversation_id" "uuid", "p_role" "text", "p_content" "text", "p_image_url" "text", "p_metadata" "jsonb");

-- 2. Drop the UUID version of get_conversation_messages
DROP FUNCTION IF EXISTS "public"."get_conversation_messages"("p_conversation_id" "uuid");

-- 3. Drop the UUID version of migrate_messages_to_conversation
DROP FUNCTION IF EXISTS "public"."migrate_messages_to_conversation"("p_message_ids" "uuid"[], "p_target_conversation_id" "uuid");

-- Note: The TEXT versions of these functions will remain and handle all cases.
