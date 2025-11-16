-- Enable real-time updates for conversations table
-- This allows the frontend to receive push notifications when conversations are updated
-- Replaces the polling mechanism with efficient real-time subscriptions

-- Add conversations table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Verify real-time is enabled
COMMENT ON TABLE conversations IS 'Real-time enabled for conversation updates including subtabs';
