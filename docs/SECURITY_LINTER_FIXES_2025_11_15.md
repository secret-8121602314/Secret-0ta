# Security Linter Fixes - November 15, 2025

## Overview
This document details the fixes for three security warnings detected by the Supabase database linter.

## Issues Fixed

### 1. Security Definer View ❌ (ERROR)
**Issue**: View `public.waitlist_pending_emails` was detected with the SECURITY DEFINER property.

**Problem**: 
- SECURITY DEFINER views execute with the permissions of the view creator (typically postgres superuser)
- This bypasses RLS policies and grants excessive privileges to querying users
- Security risk: Users could access data they shouldn't have permission to see

**Solution**: 
- Recreated the view with `WITH (security_invoker = true)` option
- This ensures the view uses the caller's permissions, enforcing proper RLS policies
- Migration: `20251115000001_fix_security_linter_warnings.sql`

**Code Change**:
```sql
CREATE VIEW public.waitlist_pending_emails 
WITH (security_invoker = true)  -- Explicitly set SECURITY INVOKER
AS
SELECT id, email, source, created_at, email_status
FROM public.waitlist
WHERE email_status = 'pending' AND email_sent_at IS NULL
ORDER BY created_at ASC;
```

### 2. Function Search Path Mutable ⚠️ (WARN)
**Issue**: Function `public.update_waitlist_email_status` has a role-mutable search_path.

**Problem**:
- Without a fixed search_path, functions can be vulnerable to search_path attacks
- Malicious users could create same-named objects in schemas earlier in their search_path
- The function might then call the malicious code instead of the intended code

**Solution**:
- Explicitly set `search_path = 'public', 'pg_temp'` in the function definition
- This locks the function to only use the public schema and temporary objects
- Migration: `20251115000001_fix_security_linter_warnings.sql`

**Code Change**:
```sql
CREATE OR REPLACE FUNCTION public.update_waitlist_email_status(
  waitlist_email TEXT,
  new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'  -- Fixed search_path for security
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
```

### 3. Leaked Password Protection Disabled ⚠️ (WARN)
**Issue**: Auth leaked password protection is currently disabled.

**Problem**:
- Users can set passwords that have been compromised in data breaches
- Increases risk of account takeover attacks
- No protection against commonly leaked passwords

**Solution**:
This must be enabled in the Supabase Dashboard, not via SQL migrations.

**Steps to Enable**:
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Scroll to **Password Security** section
4. Enable **Check for leaked passwords** option
5. This feature checks passwords against the HaveIBeenPwned database

**What it does**:
- Validates passwords against 600+ million leaked passwords
- Prevents users from setting commonly compromised passwords
- Runs during signup and password changes
- Uses k-anonymity to protect user privacy (passwords are never sent in full)

**Reference**: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Migration File
- **File**: `supabase/migrations/20251115000001_fix_security_linter_warnings.sql`
- **Fixes**: Issues #1 and #2
- **Status**: Ready to apply

## Applying the Migration

### Local Development
```bash
# Apply migration locally
npx supabase db push

# Or reset and reapply all migrations
npx supabase db reset
```

### Production
```bash
# Push to production (be cautious)
npx supabase db push --db-url "postgresql://..."

# Or apply via Supabase Dashboard:
# Dashboard → Database → Migrations → Run migration
```

## Verification

After applying the migration, verify the fixes:

### Check View Security
```sql
SELECT reloptions 
FROM pg_class 
WHERE relname = 'waitlist_pending_emails' 
  AND relnamespace = 'public'::regnamespace;
-- Should return: {security_invoker=true}
```

### Check Function Search Path
```sql
SELECT proconfig 
FROM pg_proc 
WHERE proname = 'update_waitlist_email_status' 
  AND pronamespace = 'public'::regnamespace;
-- Should return: {search_path=public,pg_temp}
```

### Run Linter Again
```bash
# In Supabase Dashboard: Database → Linter
# Or via CLI (if available):
npx supabase db lint
```

## Impact Assessment

### Breaking Changes
- **None**: These are security improvements that maintain the same API
- Both the view and function continue to work as before
- User-facing functionality remains unchanged

### Performance Impact
- **Negligible**: No performance impact expected
- View queries execute with same efficiency
- Function execution time unchanged

### Security Improvements
- ✅ View now properly enforces RLS policies
- ✅ Function protected against search_path attacks
- ✅ When password protection is enabled: Passwords validated against breach database

## Recommendations

1. **Apply migration immediately** - These are security fixes
2. **Enable leaked password protection** in Supabase Dashboard
3. **Monitor auth logs** after enabling password protection for user impact
4. **Communicate with users** if many existing passwords are flagged (they'll need to reset)

## Related Documentation
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [Security Definer View Warning](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- [Function Search Path Warning](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Password Security](https://supabase.com/docs/guides/auth/password-security)

## Testing Checklist

- [ ] Migration applied successfully
- [ ] View still returns correct data
- [ ] View respects RLS policies (test with restricted user)
- [ ] Function still updates waitlist entries correctly
- [ ] No error logs after applying changes
- [ ] Linter warnings resolved (re-run linter)
- [ ] Leaked password protection enabled in Dashboard
- [ ] Test user signup with compromised password (should be rejected)
