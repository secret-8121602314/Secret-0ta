-- Fix Security Linter Warnings
-- Date: 2025-11-15
-- Issues:
-- 1. View 'waitlist_pending_emails' detected with SECURITY DEFINER
-- 2. Function 'update_waitlist_email_status' has mutable search_path

-- ============================================================================
-- FIX 1: Recreate view with explicit SECURITY INVOKER
-- ============================================================================

-- Drop and recreate the view with explicit security_invoker option
DROP VIEW IF EXISTS public.waitlist_pending_emails CASCADE;

-- Create view with SECURITY INVOKER explicitly set
-- This ensures the view uses the permissions of the calling user, not the view creator
CREATE VIEW public.waitlist_pending_emails 
WITH (security_invoker = true)
AS
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

-- Grant appropriate permissions
GRANT SELECT ON public.waitlist_pending_emails TO authenticated;
GRANT SELECT ON public.waitlist_pending_emails TO service_role;

-- Add documentation comment
COMMENT ON VIEW public.waitlist_pending_emails IS 
  'Shows waitlist entries pending email delivery. Uses SECURITY INVOKER (caller permissions).';

-- ============================================================================
-- FIX 2: Recreate function with immutable search_path
-- ============================================================================

-- Drop and recreate the function with a fixed search_path
DROP FUNCTION IF EXISTS public.update_waitlist_email_status(TEXT, TEXT);

-- Create function with explicit search_path setting
CREATE OR REPLACE FUNCTION public.update_waitlist_email_status(
  waitlist_email TEXT,
  new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Update the waitlist entry
  UPDATE public.waitlist
  SET 
    email_status = new_status,
    email_sent_at = CASE WHEN new_status = 'sent' THEN NOW() ELSE email_sent_at END,
    updated_at = NOW()
  WHERE email = waitlist_email;
  
  RETURN FOUND;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.update_waitlist_email_status(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_waitlist_email_status(TEXT, TEXT) TO service_role;

-- Add documentation comment
COMMENT ON FUNCTION public.update_waitlist_email_status(TEXT, TEXT) IS 
  'Updates the email delivery status for a waitlist entry. Uses fixed search_path for security.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify view security settings
DO $$
DECLARE
  view_options TEXT[];
  has_security_invoker BOOLEAN := FALSE;
BEGIN
  -- Check view options
  SELECT reloptions INTO view_options
  FROM pg_class
  WHERE relname = 'waitlist_pending_emails'
    AND relnamespace = 'public'::regnamespace;
  
  -- Check if security_invoker is set
  IF view_options IS NOT NULL THEN
    has_security_invoker := 'security_invoker=true' = ANY(view_options);
  END IF;
  
  IF has_security_invoker THEN
    RAISE NOTICE 'SUCCESS: View waitlist_pending_emails has security_invoker=true';
  ELSE
    RAISE WARNING 'View waitlist_pending_emails may not have security_invoker set correctly';
  END IF;
END $$;

-- Verify function search_path
DO $$
DECLARE
  func_config TEXT[];
  has_search_path BOOLEAN := FALSE;
BEGIN
  -- Check function configuration
  SELECT proconfig INTO func_config
  FROM pg_proc
  WHERE proname = 'update_waitlist_email_status'
    AND pronamespace = 'public'::regnamespace;
  
  -- Check if search_path is set
  IF func_config IS NOT NULL THEN
    has_search_path := EXISTS(
      SELECT 1 FROM unnest(func_config) AS config
      WHERE config LIKE 'search_path=%'
    );
  END IF;
  
  IF has_search_path THEN
    RAISE NOTICE 'SUCCESS: Function update_waitlist_email_status has fixed search_path';
  ELSE
    RAISE WARNING 'Function update_waitlist_email_status may not have search_path set correctly';
  END IF;
END $$;
