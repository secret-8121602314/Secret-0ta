# Manual Migration Deployment Guide

Since the Supabase CLI version is outdated (v2.34.3) and has authentication issues, here are alternative deployment methods:

## Option 1: Update Supabase CLI (Recommended)

```powershell
# Update via Scoop (if installed via Scoop)
scoop update supabase

# Or via NPM
npm update -g supabase

# Or download latest from GitHub
# https://github.com/supabase/cli/releases/latest
```

After updating to v2.58.5+, retry:
```bash
supabase link --project-ref qajcxgkqloumogioomiz
supabase db push
```

## Option 2: Manual SQL Execution (Current Method)

### Step 1: Open Supabase Dashboard SQL Editor
https://supabase.com/dashboard/project/qajcxgkqloumogioomiz/sql/new

### Step 2: Execute Migrations in Order

#### Migration 1: Schema Optimization
Copy and execute contents of:
`supabase/migrations/20251116231436_schema_optimization_consolidated.sql`

**Verify Success:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'game_hub_interactions';
-- Should return: game_hub_interactions
```

#### Migration 2: Drop JSONB Columns
Copy and execute contents of:
`supabase/migrations/20251116231824_drop_jsonb_columns.sql`

**Verify Success:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'conversations' 
AND column_name IN ('messages', 'subtabs', 'subtabs_order');
-- Should return: 0 rows (columns dropped)
```

### Step 3: Set Up Cron Job
Copy and execute contents of:
`setup_cron_job.sql`

**Verify Success:**
```sql
SELECT jobname, schedule FROM cron.job 
WHERE jobname = 'summarize-conversations-daily';
-- Should return: 1 row with schedule '0 3 * * *'
```

### Step 4: Verify Complete Deployment

Run all checks from `verify_migration.sql`:

```sql
-- Check if game_hub_interactions table exists
SELECT 'game_hub_interactions table exists' as check_name, 
       EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'game_hub_interactions'
       ) as result;

-- Check if auth_user_id column exists on messages
SELECT 'messages.auth_user_id exists' as check_name,
       EXISTS (
         SELECT FROM information_schema.columns 
         WHERE table_name = 'messages' AND column_name = 'auth_user_id'
       ) as result;

-- Check if auth_user_id column exists on subtabs
SELECT 'subtabs.auth_user_id exists' as check_name,
       EXISTS (
         SELECT FROM information_schema.columns 
         WHERE table_name = 'subtabs' AND column_name = 'auth_user_id'
       ) as result;

-- Check if auth_user_id column exists on api_usage
SELECT 'api_usage.auth_user_id exists' as check_name,
       EXISTS (
         SELECT FROM information_schema.columns 
         WHERE table_name = 'api_usage' AND column_name = 'auth_user_id'
       ) as result;

-- Check if auth_user_id column exists on user_sessions
SELECT 'user_sessions.auth_user_id exists' as check_name,
       EXISTS (
         SELECT FROM information_schema.columns 
         WHERE table_name = 'user_sessions' AND column_name = 'auth_user_id'
       ) as result;

-- Check if JSONB columns are dropped from conversations
SELECT 'conversations.messages dropped' as check_name,
       NOT EXISTS (
         SELECT FROM information_schema.columns 
         WHERE table_name = 'conversations' AND column_name = 'messages'
       ) as result;

-- Check if unreleased games validation trigger exists
SELECT 'unreleased games trigger exists' as check_name,
       EXISTS (
         SELECT FROM information_schema.triggers 
         WHERE trigger_name = 'validate_subtab_unreleased_trigger'
       ) as result;

-- Count auth_user_id indexes
SELECT 'auth_user_id indexes count' as check_name,
       COUNT(*)::text as result
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE '%auth_user_id%';
```

All checks should return `result = true` (or count > 0 for indexes).

## Option 3: Remote Connection via psql

If you have PostgreSQL client tools installed:

```powershell
# Set environment variable
$env:PGPASSWORD='YOUR_DATABASE_PASSWORD'

# Connect to remote database
psql -h aws-1-ap-south-1.pooler.supabase.com `
     -p 6543 `
     -U postgres.qajcxgkqloumogioomiz `
     -d postgres

# Then execute migrations:
\i supabase/migrations/20251116231436_schema_optimization_consolidated.sql
\i supabase/migrations/20251116231824_drop_jsonb_columns.sql
```

## Post-Deployment

After successful migration:

1. **Test Game Hub:** Send a query, verify row appears in `game_hub_interactions`
2. **Test API Tracking:** Send any AI message, verify row appears in `api_usage`
3. **Monitor Edge Function:** Check logs at https://supabase.com/dashboard/project/qajcxgkqloumogioomiz/functions
4. **Check Cron Job:** After first 3 AM UTC run, verify summaries in `conversations.context_summary`

## Troubleshooting

**Authentication Error:**
- Verify database password in Supabase Dashboard → Settings → Database
- Try resetting the password

**Migration Error:**
- Check existing schema conflicts
- Review error message for specific constraint violations
- May need to manually drop conflicting objects first

**Performance Degradation:**
- Run `ANALYZE` on affected tables
- Check query performance in Dashboard → Database → Query Performance
