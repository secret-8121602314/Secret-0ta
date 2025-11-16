# Supabase Optimization Deployment Guide

## Overview

This deployment includes:
- ✅ Game Hub interaction tracking (new `game_hub_interactions` table)
- ✅ RLS performance optimization (auth_user_id denormalization)
- ✅ API usage tracking for Gemini calls (enhanced `api_usage` table)
- ✅ User session tracking (enhanced `user_sessions` table)
- ✅ Unreleased games subtabs blocking
- ✅ Normalized table cleanup (drop JSONB columns)
- ✅ Rate limiting (500ms throttle)
- ✅ Context summarization Edge Function

## Pre-Deployment Checklist

### 1. Backup Current Database
```bash
# Backup remote schema
supabase db dump --remote > backup_$(date +%Y%m%d_%H%M%S).sql

# Or via Supabase Dashboard:
# Settings → Database → Database Backups → Download
```

### 2. Review Migration Files
- `20251116231436_schema_optimization_consolidated.sql` - Main optimization migration
- `20251116231824_drop_jsonb_columns.sql` - JSONB cleanup (safe after normalized tables verified)

### 3. Verify Environment Variables
Check that these are set in Supabase Dashboard → Edge Functions → Settings:
- `VITE_GEMINI_API_KEY` - For context summarization

## Deployment Steps

### Step 1: Push Migrations to Production

**IMPORTANT:** This will modify the production database schema.

```bash
# Preview changes first (recommended)
supabase db diff --remote

# Push migrations
supabase db push
```

Expected migrations to apply:
1. `20251116231436_schema_optimization_consolidated.sql` (~30 seconds)
2. `20251116231824_drop_jsonb_columns.sql` (~5 seconds)

### Step 2: Verify Migration Success

Run verification queries in Supabase SQL Editor:

```sql
-- Check game_hub_interactions table exists
SELECT COUNT(*) FROM game_hub_interactions;

-- Check auth_user_id columns exist
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name IN ('messages', 'subtabs') 
  AND column_name = 'auth_user_id';

-- Check JSONB columns dropped
SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'conversations' 
  AND column_name IN ('messages', 'subtabs', 'subtabs_order');

-- Should return 0 (columns dropped)
```

### Step 3: Deploy Edge Function

Already deployed via:
```bash
supabase functions deploy summarize-conversations
```

Dashboard: https://supabase.com/dashboard/project/qajcxgkqloumogioomiz/functions

### Step 4: Configure Cron Job

Run the SQL in `setup_cron_job.sql` via Supabase SQL Editor:

1. Enable pg_cron extension (if not already)
2. Create daily cron job (3 AM UTC)
3. Verify cron job created

### Step 5: Test Edge Function

Manual invocation:
```bash
curl -X POST \
  'https://qajcxgkqloumogioomiz.supabase.co/functions/v1/summarize-conversations' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

Or via Dashboard → Edge Functions → summarize-conversations → Invoke

### Step 6: Monitor for Errors

Check for errors in:
- Supabase Dashboard → Edge Functions → Logs
- Supabase Dashboard → Database → Query Performance
- Application error logs

## Rollback Plan

If issues occur, rollback using the backup:

```bash
# Restore from backup
psql -h db.qajcxgkqloumogioomiz.supabase.co \
  -U postgres \
  -d postgres \
  < backup_YYYYMMDD_HHMMSS.sql
```

Or use Supabase Dashboard → Database → Database Backups → Restore

## Post-Deployment Verification

### Test Game Hub Interaction Logging
1. Open Game Hub conversation
2. Send a query about a game
3. Check `game_hub_interactions` table for new row:
```sql
SELECT * FROM game_hub_interactions ORDER BY created_at DESC LIMIT 5;
```

### Test RLS Performance
Run EXPLAIN ANALYZE on queries:
```sql
EXPLAIN ANALYZE
SELECT * FROM messages 
WHERE auth_user_id = auth.uid()
LIMIT 100;
```

Should show index scan on `idx_messages_auth_user_id`.

### Test Unreleased Games Validation
Try to create subtab for unreleased game conversation:
```sql
-- This should fail with error
INSERT INTO subtabs (conversation_id, title, content)
SELECT id, 'Test', 'Test'
FROM conversations
WHERE is_unreleased = true
LIMIT 1;
```

Expected: `ERROR: Subtabs cannot be created for unreleased games`

### Test Rate Limiting
Click send button rapidly in UI - should silently ignore requests within 500ms.

### Test Context Summarization
Wait for cron job to run at 3 AM UTC, or invoke manually.
Check `conversations.context_summary` column populated for conversations with >50 messages.

## Monitoring

### Database Performance
- Monitor query performance in Dashboard → Database → Query Performance
- Watch for slow queries on `messages` and `subtabs` tables
- Check RLS policy execution times

### Edge Function Health
- Dashboard → Edge Functions → summarize-conversations → Logs
- Monitor Gemini API quota usage
- Check for failed summarization attempts

### Cron Job Status
```sql
-- View recent cron job runs
SELECT jobid, runid, status, return_message, start_time, end_time
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'summarize-conversations-daily')
ORDER BY start_time DESC 
LIMIT 10;
```

## Expected Impact

### Performance Improvements
- **RLS queries:** 50-70% faster (from 3-table JOINs to direct index lookup)
- **Messages queries:** ~100ms → ~20ms (with auth_user_id index)
- **Subtabs queries:** ~80ms → ~15ms (with auth_user_id index)

### New Capabilities
- Game Hub analytics tracking (queries, responses, game detection, tab creation)
- Unreleased games protection (no subtabs allowed)
- Context summarization (reduces token usage by ~60% for long conversations)
- Rate limiting (prevents duplicate API calls from rapid clicks)

### Data Changes
- JSONB columns removed (migration complete to normalized tables)
- Unused tables dropped (api_usage, game_insights, user_sessions)
- New triggers and functions for auto-population and validation

## Troubleshooting

### Migration Fails
- Check backup is available
- Review error message in migration logs
- Run migrations one at a time if needed

### RLS Performance Not Improved
- Verify indexes created: `\d messages` and `\d subtabs`
- Check auth_user_id columns populated
- Run EXPLAIN ANALYZE on queries

### Edge Function Errors
- Check VITE_GEMINI_API_KEY is set correctly
- Verify Gemini API quota available
- Review Edge Function logs for specific errors

### Cron Job Not Running
- Verify pg_cron extension enabled
- Check cron job exists: `SELECT * FROM cron.job;`
- Review cron run history for errors

## Success Criteria

✅ All migrations applied without errors
✅ Game Hub interactions logged in database
✅ RLS queries using auth_user_id indexes
✅ Unreleased games cannot have subtabs
✅ Rate limiting prevents rapid clicks
✅ Context summarization runs daily at 3 AM UTC
✅ No application errors or regressions
✅ Query performance improved by 50-70%

## Support

If issues occur:
1. Check this guide's troubleshooting section
2. Review Supabase Dashboard logs
3. Restore from backup if critical
4. Contact development team
