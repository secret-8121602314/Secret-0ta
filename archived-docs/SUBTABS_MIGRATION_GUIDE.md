# Subtabs Schema Migration Guide

## Migration SQL to Execute

Run the following SQL in your Supabase SQL Editor:

```sql
-- Add conversation_id column to subtabs table
ALTER TABLE public.subtabs 
ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Create index for conversation_id queries
CREATE INDEX IF NOT EXISTS idx_subtabs_conversation_id 
ON public.subtabs(conversation_id);

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_subtabs_conversation_order 
ON public.subtabs(conversation_id, order_index);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subtabs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subtabs_timestamp ON public.subtabs;
CREATE TRIGGER trigger_update_subtabs_timestamp
  BEFORE UPDATE ON public.subtabs
  FOR EACH ROW
  EXECUTE FUNCTION update_subtabs_updated_at();
```

## After Migration

1. Regenerate TypeScript types:
```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

2. Toggle the feature flag in `src/constants/index.ts`:
```typescript
USE_NORMALIZED_SUBTABS: true
```

3. (Optional) Migrate existing subtabs data:
```typescript
import { subtabsService } from './services/subtabsService';
await subtabsService.migrateAllSubtabs();
```

## Rollback (if needed)

```sql
-- Remove the new column and indexes
DROP INDEX IF EXISTS idx_subtabs_conversation_id;
DROP INDEX IF EXISTS idx_subtabs_conversation_order;
ALTER TABLE public.subtabs DROP COLUMN IF EXISTS conversation_id;
```

## Notes

- The `game_id` column will remain for backward compatibility
- Both `game_id` and `conversation_id` can coexist
- The app will use `conversation_id` when `USE_NORMALIZED_SUBTABS` is enabled
- Data migration is handled by `subtabsService.migrateAllSubtabs()`
