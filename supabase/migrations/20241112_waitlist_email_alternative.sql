-- Alternative Migration: Simpler approach using Supabase Webhooks
-- This approach uses Supabase Database Webhooks instead of pg_net
-- Configure webhooks in Supabase Dashboard: Database > Webhooks

-- Add email tracking columns to waitlist table
ALTER TABLE public.waitlist 
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_status TEXT CHECK (email_status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email_sent ON public.waitlist(email_sent_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_email_status ON public.waitlist(email_status);

-- Create a view for pending email sends (useful for retry logic)
CREATE OR REPLACE VIEW public.waitlist_pending_emails AS
SELECT 
  id,
  email,
  source,
  created_at,
  email_status
FROM public.waitlist
WHERE email_status = 'pending'
  AND email_sent_at IS NULL
ORDER BY created_at ASC;

-- Function to update email status
CREATE OR REPLACE FUNCTION public.update_waitlist_email_status(
  waitlist_email TEXT,
  new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.waitlist
  SET 
    email_status = new_status,
    email_sent_at = CASE WHEN new_status = 'sent' THEN NOW() ELSE email_sent_at END,
    updated_at = NOW()
  WHERE email = waitlist_email;
  
  RETURN FOUND;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.waitlist_pending_emails TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_waitlist_email_status(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_waitlist_email_status(TEXT, TEXT) TO service_role;

-- Add comments
COMMENT ON VIEW public.waitlist_pending_emails IS 
  'Shows waitlist entries that are pending email delivery';

COMMENT ON FUNCTION public.update_waitlist_email_status(TEXT, TEXT) IS 
  'Updates the email delivery status for a waitlist entry';

-- Instructions for setting up Database Webhook:
-- 1. Go to Supabase Dashboard > Database > Webhooks
-- 2. Click "Create a new hook"
-- 3. Configure:
--    - Name: waitlist-email-automation
--    - Table: waitlist
--    - Events: INSERT
--    - HTTP Request:
--      - Method: POST
--      - URL: https://[your-project].supabase.co/functions/v1/waitlist-email
--      - Headers: Add Authorization with service role key
--      - Payload: Use default (sends row data as JSON)
-- 4. Enable the webhook
