-- Deep check: Look for any security_invoker or security_definer options
-- PostgreSQL 15+ introduced SECURITY INVOKER as an option

-- Check pg_class for view options
SELECT 
  c.relname,
  c.relkind,
  c.reloptions
FROM pg_class c
WHERE c.relname = 'waitlist_pending_emails'
  AND c.relnamespace = 'public'::regnamespace;

-- Check if there's a security_invoker option
SELECT 
  v.viewname,
  -- Try to see if there are any options
  (SELECT string_agg(option_name || '=' || option_value, ', ')
   FROM pg_options_to_table(c.reloptions)
  ) as options
FROM pg_views v
JOIN pg_class c ON c.relname = v.viewname AND c.relnamespace = (
  SELECT oid FROM pg_namespace WHERE nspname = v.schemaname
)
WHERE v.viewname = 'waitlist_pending_emails' AND v.schemaname = 'public';

-- The fix: Explicitly set security_invoker = true (PostgreSQL 15+)
-- This makes it crystal clear the view uses caller's privileges
DROP VIEW IF EXISTS public.waitlist_pending_emails CASCADE;

CREATE VIEW public.waitlist_pending_emails
WITH (security_invoker = true)  -- Explicitly use caller's privileges
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

-- Grant permissions
GRANT SELECT ON public.waitlist_pending_emails TO authenticated;

-- Add comment
COMMENT ON VIEW public.waitlist_pending_emails IS 
  'Shows waitlist entries pending email delivery. Uses SECURITY INVOKER (caller permissions).';
