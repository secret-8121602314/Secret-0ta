-- Migration: Add email automation trigger for waitlist
-- Created: 2024-11-12
-- Purpose: Automatically send welcome emails when users join the waitlist

-- Add email_sent_at and updated_at columns to waitlist table if they don't exist
ALTER TABLE public.waitlist 
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for email_sent_at for better query performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email_sent ON public.waitlist(email_sent_at);

-- Create or replace function to call the Edge Function when a new waitlist entry is inserted
CREATE OR REPLACE FUNCTION public.trigger_waitlist_email()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  request_id bigint;
  function_url text;
BEGIN
  -- Only send email for new inserts (not updates)
  IF (TG_OP = 'INSERT') THEN
    -- Get the Edge Function URL from environment or use default
    -- You'll need to configure this in your Supabase project settings
    function_url := current_setting('app.settings.edge_function_url', true);
    
    IF function_url IS NULL THEN
      -- Default to your Supabase project URL
      function_url := 'https://qajcxgkqloumogioomiz.supabase.co/functions/v1/waitlist-email';
    END IF;

    -- Make HTTP request to Edge Function using pg_net extension
    -- Note: This requires the pg_net extension to be enabled
    SELECT INTO request_id net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'source', NEW.source,
        'waitlistId', NEW.id::text
      )
    );

    -- Log the request (optional, for debugging)
    RAISE LOG 'Waitlist email trigger: Queued email for % with request_id %', NEW.email, request_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on waitlist table
DROP TRIGGER IF EXISTS on_waitlist_insert ON public.waitlist;

CREATE TRIGGER on_waitlist_insert
  AFTER INSERT ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_waitlist_email();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.trigger_waitlist_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_waitlist_email() TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION public.trigger_waitlist_email() IS 
  'Automatically sends welcome email via Edge Function when a user joins the waitlist';

COMMENT ON TRIGGER on_waitlist_insert ON public.waitlist IS 
  'Triggers welcome email automation after waitlist signup';
