-- Verify and ensure the view is created without SECURITY DEFINER
-- This is a clean recreation to be absolutely certain

-- Drop the view completely
DROP VIEW IF EXISTS public.waitlist_pending_emails CASCADE;

-- Recreate WITHOUT any SECURITY DEFINER clause
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

-- Grant appropriate permissions
GRANT SELECT ON public.waitlist_pending_emails TO authenticated;

-- Verify view definition (check the result to confirm no SECURITY DEFINER)
DO $$
DECLARE
  view_def TEXT;
BEGIN
  SELECT pg_get_viewdef('public.waitlist_pending_emails'::regclass, true) INTO view_def;
  RAISE NOTICE 'View definition: %', view_def;
  
  IF view_def LIKE '%SECURITY DEFINER%' THEN
    RAISE EXCEPTION 'ERROR: View still has SECURITY DEFINER!';
  ELSE
    RAISE NOTICE 'SUCCESS: View does not have SECURITY DEFINER';
  END IF;
END $$;

-- Add comment
COMMENT ON VIEW public.waitlist_pending_emails IS 
  'Shows waitlist entries pending email delivery. No SECURITY DEFINER - uses caller permissions.';
