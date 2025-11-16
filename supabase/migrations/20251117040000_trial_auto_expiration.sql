-- ============================================================================
-- TRIAL AUTO-EXPIRATION SYSTEM
-- ============================================================================
-- This migration adds a database function and cron job to automatically
-- expire 14-day free trials and revert users back to free tier.
--
-- Features:
-- 1. expire_trials() function - checks and expires trials
-- 2. pg_cron job - runs daily at midnight UTC
-- 3. One-time use enforcement via has_used_trial flag
-- ============================================================================

-- Create function to expire trials
CREATE OR REPLACE FUNCTION expire_trials()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- Update users whose trial has expired
  UPDATE users
  SET 
    tier = 'free',
    text_limit = 55,
    image_limit = 25,
    updated_at = NOW()
  WHERE 
    trial_expires_at < NOW()
    AND tier = 'pro'
    AND has_used_trial = true
    AND trial_started_at IS NOT NULL;
  
  -- Get count of affected rows
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Log the expiration
  RAISE NOTICE 'Expired % trial(s) at %', affected_rows, NOW();
  
  -- Return the count
  RETURN QUERY SELECT affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to function
COMMENT ON FUNCTION expire_trials() IS 'Automatically expires 14-day free trials and reverts users to free tier. Runs daily via pg_cron.';

-- ============================================================================
-- CRON JOB SETUP (requires pg_cron extension)
-- ============================================================================
-- Note: pg_cron must be enabled in Supabase dashboard under Database > Extensions
-- This job runs every day at midnight UTC (00:00)

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the trial expiration job
-- Runs daily at midnight UTC
SELECT cron.schedule(
  'expire-trials-daily',           -- Job name
  '0 0 * * *',                      -- Cron schedule: At 00:00 every day
  'SELECT expire_trials();'         -- SQL command to run
);

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- View all scheduled cron jobs
-- SELECT * FROM cron.job;

-- View cron job run history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Manually test the expiration function
-- SELECT expire_trials();

-- Check users with active trials
-- SELECT 
--   auth_user_id,
--   email,
--   tier,
--   trial_started_at,
--   trial_expires_at,
--   has_used_trial,
--   CASE 
--     WHEN trial_expires_at < NOW() THEN 'EXPIRED'
--     WHEN trial_expires_at > NOW() THEN 'ACTIVE'
--     ELSE 'NO TRIAL'
--   END as trial_status,
--   EXTRACT(DAY FROM (trial_expires_at - NOW())) as days_remaining
-- FROM users
-- WHERE has_used_trial = true
-- ORDER BY trial_expires_at DESC;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To unschedule the cron job:
-- SELECT cron.unschedule('expire-trials-daily');

-- To drop the function:
-- DROP FUNCTION IF EXISTS expire_trials() CASCADE;
