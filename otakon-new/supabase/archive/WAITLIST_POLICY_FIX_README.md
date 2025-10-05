# Waitlist RLS Policy Fix

## Problem
The `public.waitlist` table had multiple permissive Row Level Security (RLS) policies for the same role and action (INSERT), causing performance warnings. This happens when multiple policies exist for the same operation, as each policy must be executed for every relevant query.

## Root Cause
Multiple SQL migration files created overlapping policies:
- `COMPREHENSIVE_WAITLIST_FIX.sql` created `waitlist_public_insert`
- `FIX_WAITLIST_RLS_POLICIES.sql` created `waitlist_anon_insert` 
- `MASTER_SCHEMA_COMPLETE.sql` created `Anyone can insert to waitlist`
- `complete-schema.sql` created `waitlist_insert_policy`

## Solution
The `FIX_MULTIPLE_PERMISSIVE_POLICIES.sql` script:

1. **Drops all existing waitlist policies** to eliminate conflicts
2. **Creates two unified policies**:
   - `waitlist_unified_select` - allows all users to read from waitlist
   - `waitlist_unified_insert` - allows all users to insert into waitlist
3. **Grants explicit permissions** to all relevant roles
4. **Verifies the fix** with test queries

## How to Apply the Fix

1. Run the fix script in your Supabase SQL editor:
   ```sql
   -- Execute the contents of FIX_MULTIPLE_PERMISSIVE_POLICIES.sql
   ```

2. Verify the fix worked by checking the policies:
   ```sql
   SELECT policyname, cmd, roles 
   FROM pg_policies 
   WHERE tablename = 'waitlist';
   ```

3. You should see exactly 2 policies:
   - `waitlist_unified_select` (SELECT)
   - `waitlist_unified_insert` (INSERT)

## Prevention
To avoid this issue in the future:

1. **Always check existing policies** before creating new ones
2. **Use consistent naming conventions** for policies
3. **Drop old policies** when creating new ones in the same migration
4. **Test policy changes** in a development environment first

## Performance Impact
- **Before**: Multiple policies executed for each query (performance penalty)
- **After**: Single policy per operation (optimized performance)

## Verification
After applying the fix, the Supabase database linter should no longer show the "Multiple Permissive Policies" warning for the waitlist table.
