-- Migration: Monthly Usage Reset Function
-- Description: Resets text_count, image_count, and total_requests on the 1st of each month
-- Date: 2025-10-21

-- ============================================================================
-- FUNCTION: reset_monthly_usage
-- ============================================================================
-- Resets query usage for all users whose last_reset was in a previous month
-- This function should be called manually or via pg_cron on the 1st of each month
-- ============================================================================

CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS TABLE(
  users_reset INTEGER,
  reset_timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_users_reset INTEGER := 0;
  v_reset_timestamp TIMESTAMPTZ := NOW();
BEGIN
  -- Reset usage for users whose last_reset is in a previous month
  UPDATE public.users
  SET 
    text_count = 0,
    image_count = 0,
    total_requests = 0,
    last_reset = v_reset_timestamp,
    updated_at = v_reset_timestamp
  WHERE 
    -- Check if last_reset is in a different month/year than current date
    DATE_TRUNC('month', last_reset) < DATE_TRUNC('month', v_reset_timestamp);
  
  -- Get count of affected rows
  GET DIAGNOSTICS v_users_reset = ROW_COUNT;
  
  -- Log the reset operation
  RAISE NOTICE 'Monthly usage reset completed. % users reset at %', v_users_reset, v_reset_timestamp;
  
  -- Return results
  RETURN QUERY SELECT v_users_reset, v_reset_timestamp;
END;
$$;

-- ============================================================================
-- COMMENT
-- ============================================================================
COMMENT ON FUNCTION public.reset_monthly_usage() IS 
'Resets text_count, image_count, and total_requests to 0 for all users whose last_reset was in a previous month. Returns the number of users reset and the timestamp.';

-- ============================================================================
-- MANUAL EXECUTION
-- ============================================================================
-- To manually reset usage (run this on the 1st of each month):
-- SELECT * FROM public.reset_monthly_usage();

-- ============================================================================
-- AUTOMATED SCHEDULING (Optional - requires pg_cron extension)
-- ============================================================================
-- Uncomment the following lines if you have pg_cron enabled:
-- 
-- -- Enable pg_cron extension (run once)
-- -- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- 
-- -- Schedule reset to run at 00:00 on the 1st of every month (UTC)
-- -- SELECT cron.schedule(
-- --   'monthly-usage-reset',           -- Job name
-- --   '0 0 1 * *',                     -- Cron schedule: At 00:00 on day 1 of every month
-- --   'SELECT public.reset_monthly_usage();'  -- SQL command to run
-- -- );
-- 
-- -- To view scheduled jobs:
-- -- SELECT * FROM cron.job;
-- 
-- -- To unschedule the job:
-- -- SELECT cron.unschedule('monthly-usage-reset');

-- ============================================================================
-- TESTING
-- ============================================================================
-- To test the function without affecting real data:
-- 
-- BEGIN;
--   -- Update a test user's last_reset to last month
--   UPDATE public.users 
--   SET last_reset = NOW() - INTERVAL '35 days'
--   WHERE id = 'YOUR_TEST_USER_ID';
--   
--   -- Run the reset function
--   SELECT * FROM public.reset_monthly_usage();
--   
--   -- Check the user's usage was reset
--   SELECT text_count, image_count, total_requests, last_reset
--   FROM public.users
--   WHERE id = 'YOUR_TEST_USER_ID';
-- ROLLBACK;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Grant execute permission to authenticated users (for manual resets via UI if needed)
GRANT EXECUTE ON FUNCTION public.reset_monthly_usage() TO authenticated;

-- Grant execute permission to service role (for automated scheduling)
GRANT EXECUTE ON FUNCTION public.reset_monthly_usage() TO service_role;
