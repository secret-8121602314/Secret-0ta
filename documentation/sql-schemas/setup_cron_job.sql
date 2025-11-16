-- Setup cron job for daily context summarization
-- Run this SQL in Supabase SQL Editor after ensuring pg_cron extension is enabled

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create cron job to run summarization daily at 3 AM UTC
SELECT cron.schedule(
  'summarize-conversations-daily',
  '0 3 * * *', -- 3 AM UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://qajcxgkqloumogioomiz.supabase.co/functions/v1/summarize-conversations',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhamN4Z2txbG91bW9naW9vbWl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzY1MDQwOCwiZXhwIjoyMDQzMjI2NDA4fQ.7FfYl_YEWDP9SH7d9fB0G-hkP5RwW6cPl6kfIDFwFxw"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- 3. Verify cron job was created
SELECT jobid, jobname, schedule, command 
FROM cron.job 
WHERE jobname = 'summarize-conversations-daily';

-- 4. View recent cron job run history (after first run)
-- SELECT jobid, runid, job_pid, status, return_message, start_time, end_time
-- FROM cron.job_run_details 
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'summarize-conversations-daily')
-- ORDER BY start_time DESC 
-- LIMIT 10;

-- IMPORTANT: Before running this, ensure:
-- 1. pg_cron extension is enabled in Supabase Dashboard → Database → Extensions
-- 2. Edge Function 'summarize-conversations' is deployed
-- 3. Environment variable VITE_GEMINI_API_KEY is set in Edge Functions settings
