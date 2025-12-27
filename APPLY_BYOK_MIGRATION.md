# Apply BYOK Migration

## Error
```
Could not find the 'custom_key_verified_at' column of 'users' in the schema cache
```

This means the BYOK (Bring Your Own Key) migration hasn't been applied to your database yet.

## Solution

### Option 1: Apply via Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
```powershell
npm install -g supabase
```

2. **Login to Supabase**:
```powershell
supabase login
```

3. **Link to your project**:
```powershell
cd "c:\Users\mdamk\OneDrive\Desktop\Otagon App\Otagon Latest\Otagon"
supabase link --project-ref qajcxgkqloumogioomiz
```

4. **Push the migration**:
```powershell
supabase db push
```

### Option 2: Apply via Supabase Dashboard (Manual)

1. Go to your Supabase project: https://supabase.com/dashboard/project/qajcxgkqloumogioomiz

2. Navigate to **SQL Editor**

3. Copy and paste this SQL:

```sql
-- Add BYOK (Bring Your Own Key) support to users table
-- Allows users to use their own Gemini API keys to bypass quota limits

-- Add BYOK columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS uses_custom_gemini_key BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gemini_api_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS custom_key_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS had_custom_key_before BOOLEAN DEFAULT false;

-- Add index for performance when checking BYOK status
CREATE INDEX IF NOT EXISTS idx_users_custom_gemini_key ON public.users(uses_custom_gemini_key) 
WHERE uses_custom_gemini_key = true;

-- Add comment for documentation
COMMENT ON COLUMN public.users.uses_custom_gemini_key IS 'Whether user is currently using their own Gemini API key';
COMMENT ON COLUMN public.users.gemini_api_key_encrypted IS 'User''s encrypted Gemini API key (AES-256-GCM)';
COMMENT ON COLUMN public.users.custom_key_verified_at IS 'Timestamp when custom key was last successfully verified';
COMMENT ON COLUMN public.users.had_custom_key_before IS 'Flag to show "Use Custom Key" button if user previously had a key';
```

4. Click **Run** or press `Ctrl+Enter`

5. Verify the columns were created:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
  'uses_custom_gemini_key',
  'gemini_api_key_encrypted',
  'custom_key_verified_at',
  'had_custom_key_before'
);
```

Should return 4 rows.

### Option 3: Quick Fix (Temporary - Not Recommended for Production)

The code has been updated to work even without the migration, but you won't get:
- Key verification timestamps
- "Had custom key before" tracking
- Performance optimizations

**This is NOT recommended for production use.**

## After Migration

Once the migration is applied:
1. Refresh your app
2. Go to Settings → API Keys
3. Enter your Gemini API key
4. Click "Save & Activate"
5. The key will be saved successfully

## Verify It Worked

After applying the migration, run this query:
```sql
SELECT 
  id,
  email,
  uses_custom_gemini_key,
  custom_key_verified_at,
  had_custom_key_before
FROM users
WHERE auth_user_id = 'c8844271-ab4f-4943-9844-cc644249b691';
```

You should see your user with the BYOK columns.
