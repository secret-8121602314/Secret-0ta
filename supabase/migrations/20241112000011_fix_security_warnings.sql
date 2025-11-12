-- Fix security warnings from database linter
-- 1. Remove SECURITY DEFINER from view
-- 2. Add search_path to function

-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.waitlist_pending_emails;

CREATE VIEW public.waitlist_pending_emails AS
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

-- Grant permissions
GRANT SELECT ON public.waitlist_pending_emails TO authenticated;

-- Recreate function with search_path set
DROP FUNCTION IF EXISTS public.update_waitlist_email_status(TEXT, TEXT);

CREATE FUNCTION public.update_waitlist_email_status(
  waitlist_email TEXT,
  new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- Fix: Set search_path to prevent security issues
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_waitlist_email_status(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_waitlist_email_status(TEXT, TEXT) TO service_role;

-- Add comments
COMMENT ON VIEW public.waitlist_pending_emails IS 
  'Shows waitlist entries that are pending email delivery (no SECURITY DEFINER)';

COMMENT ON FUNCTION public.update_waitlist_email_status(TEXT, TEXT) IS 
  'Updates the email delivery status for a waitlist entry (with secure search_path)';
