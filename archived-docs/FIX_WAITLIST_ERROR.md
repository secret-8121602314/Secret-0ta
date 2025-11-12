# Quick Fix: Remove Problematic Trigger

Run this SQL directly in your Supabase SQL Editor:
https://supabase.com/dashboard/project/qajcxgkqloumogioomiz/editor

```sql
-- Drop the trigger causing the error
DROP TRIGGER IF EXISTS on_waitlist_insert ON public.waitlist;

-- Drop the function
DROP FUNCTION IF EXISTS public.trigger_waitlist_email();
```

## Or run via psql:

\`\`\`powershell
# If you have psql installed
psql "your-supabase-connection-string" -c "DROP TRIGGER IF EXISTS on_waitlist_insert ON public.waitlist; DROP FUNCTION IF EXISTS public.trigger_waitlist_email();"
\`\`\`

## After running the SQL:

Your waitlist form will work again! The webhook you configured will handle the email automation instead.

## Why this happened:

The trigger migration tried to use `pg_net` extension for HTTP calls, but that approach isn't needed since you're using the webhook method instead.

The webhook is actually better because:
- ✅ No database extensions needed
- ✅ Easier to configure
- ✅ Better error handling
- ✅ Visible in dashboard
