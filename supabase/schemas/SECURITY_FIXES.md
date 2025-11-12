# Supabase Security Configuration Guide

## Overview
This document outlines security configurations needed for the Otakon app's Supabase instance.

---

## 🔒 Leaked Password Protection (REQUIRED)

### What It Does
Supabase Auth can check user passwords against the [HaveIBeenPwned](https://haveibeenpwned.com/) database to prevent use of compromised passwords. This adds an extra layer of security without impacting user experience.

### Why It Matters
- **1 billion+** compromised passwords in the database
- Prevents account takeover from credential stuffing attacks
- Industry best practice for authentication security
- Required for compliance with many security standards

### How to Enable

#### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Scroll down to **Password Protection Settings**
4. Enable **"Check passwords against HaveIBeenPwned database"**
5. Click **Save**

#### Option 2: SQL Configuration
```sql
-- This may require direct database access
-- Check your Supabase project's auth configuration
```

#### Option 3: Supabase CLI
```bash
# Update your supabase/config.toml file
[auth.password]
# Enable leaked password protection
leaked_password_protection = true
```

### Current Status
❌ **DISABLED** - Currently showing in linter warnings

### Action Required
**Enable this setting immediately** to improve security posture.

---

## 📝 Other Security Fixes Applied

### ✅ RLS Performance Optimization
**Fixed in migration:** `20251021000000_fix_rls_performance_and_security.sql`

- Replaced `auth.uid()` with `(select auth.uid())` in all RLS policies
- Affects tables: `messages`, `subtabs`
- **Impact:** Prevents per-row re-evaluation, improves query performance at scale

### ✅ Function Search Path Security
**Fixed in migration:** `20251021000000_fix_rls_performance_and_security.sql`

- Added `SET search_path = public, pg_temp` to all `SECURITY DEFINER` functions
- Affects functions:
  - `get_user_onboarding_status`
  - `update_user_onboarding_status`
  - `get_or_create_game_hub`
  - `migrate_messages_to_conversation`
- **Impact:** Prevents search_path hijacking attacks

---

## 🚀 How to Apply Fixes

### 1. Apply Database Migration
```powershell
# From project root
cd supabase
supabase db push
```

This will apply the RLS and function security fixes.

### 2. Enable Password Protection
Follow the steps in the "How to Enable" section above using the Supabase Dashboard.

### 3. Verify Changes
```sql
-- Check RLS policies use (select auth.uid())
SELECT 
  schemaname, 
  tablename, 
  policyname,
  definition
FROM pg_policies 
WHERE tablename IN ('messages', 'subtabs')
ORDER BY tablename, policyname;

-- Check functions have search_path set
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  CASE 
    WHEN prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security,
  proconfig as config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_user_onboarding_status',
    'update_user_onboarding_status',
    'get_or_create_game_hub',
    'migrate_messages_to_conversation'
  );
```

---

## 📊 Before & After

### Performance Impact (RLS Optimization)
- **Before:** `auth.uid()` called for every row in query
- **After:** `auth.uid()` called once per query
- **Improvement:** ~50-90% reduction in auth function calls for large result sets

### Security Impact
- **Before:** Functions vulnerable to search_path hijacking
- **After:** Functions protected with explicit search_path
- **Before:** Passwords not checked against breach database
- **After (once enabled):** All new passwords validated against HaveIBeenPwned

---

## 🎯 Checklist

- [x] Create migration file for RLS optimization
- [x] Create migration file for function security
- [ ] Apply migration with `supabase db push`
- [ ] Enable leaked password protection in dashboard
- [ ] Verify all changes applied successfully
- [ ] Update current_schema.sql after applying

---

## 📚 References

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [Function Search Path Security](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- [Password Security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)

---

## 🔧 Troubleshooting

### Migration Fails
```powershell
# Check connection
supabase status

# Reset and try again
supabase db reset
```

### Can't Find Password Protection Setting
- Ensure you're using Supabase version that supports this feature (v2.x+)
- Check if your project tier has this feature enabled
- Contact Supabase support if option is missing

### RLS Policies Not Updating
```sql
-- Drop and recreate manually if needed
-- Use the migration file as reference
```

---

**Last Updated:** October 21, 2025  
**Migration Version:** 20251021000000  
**Status:** Ready to apply
