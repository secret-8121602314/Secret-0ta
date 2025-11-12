# Fix Duplicate RLS Policies on subtabs Table

## Problem
The `subtabs` table has multiple permissive RLS policies for the same role and action combination, which causes performance issues as each policy must be executed for every relevant query.

Duplicate policies found:
- **SELECT**: "Users can view subtabs from their conversations" AND "Users can view subtabs of their conversations"
- **UPDATE**: "Users can update subtabs in their conversations" AND "Users can update subtabs of their conversations"

## Solution
Replace all duplicate policies with single optimized policies for each action (SELECT, INSERT, UPDATE, DELETE).

## How to Apply

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `fix_duplicate_policies.sql`
4. Click **Run** to execute

### Option 2: Using Supabase CLI

If you want to apply the migration properly:

```powershell
# Mark existing migrations as applied manually first, then push
npx supabase db push
```

Note: If you get errors about existing policies/tables, the database state is ahead of migrations. Use Option 1 instead.

### Option 3: Using psql (if installed)

```powershell
# Load the env variable
$env:DATABASE_URL = (Get-Content .env | Where-Object {$_ -match '^DATABASE_URL='}).Split('=')[1]

# Run the fix script
psql $env:DATABASE_URL -f fix_duplicate_policies.sql
```

## Verification

After applying the fix, verify that only one policy exists per action:

```sql
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'subtabs'
ORDER BY cmd, policyname;
```

Expected result: 4 policies total (SELECT, INSERT, UPDATE, DELETE)

## Migration File

The proper migration file has been created at:
`supabase/migrations/20251112000000_remove_duplicate_subtabs_policies.sql`

This can be pushed later once migration state is synchronized.
