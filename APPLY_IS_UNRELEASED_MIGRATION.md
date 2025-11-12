# Apply is_unreleased Column Migration

## Execute this SQL in Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Paste and execute:

```sql
-- Add is_unreleased column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS is_unreleased boolean DEFAULT false;

-- Create index for filtering unreleased game conversations
CREATE INDEX IF NOT EXISTS idx_conversations_is_unreleased 
ON public.conversations(is_unreleased) 
WHERE is_unreleased = true;

-- Add comment for documentation
COMMENT ON COLUMN public.conversations.is_unreleased IS 
'Indicates if this conversation is for an unreleased/upcoming game. Unreleased games have limited features (e.g., no subtabs, discussion mode only).';
```

4. After executing, regenerate types:
```bash
npx supabase gen types typescript --linked > src/types/database.ts
```
