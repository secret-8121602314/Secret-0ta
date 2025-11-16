# Context Summarization Edge Function

This Supabase Edge Function automatically summarizes long conversations to keep context manageable and improve AI responses.

## Features

- ✅ Finds conversations with >50 messages that need summarization
- ✅ Summarizes conversations that have no summary OR summary >7 days old
- ✅ Uses Gemini API for intelligent summarization (300-500 words)
- ✅ Focuses on: topics, user questions, advice given, game progress, unresolved issues
- ✅ Updates `conversations.context_summary` and `context_summary_updated_at` fields
- ✅ Rate limiting: 1 second between API calls
- ✅ Processes last 100 messages per conversation for token efficiency

## Deployment

Deploy the function to Supabase:

```bash
supabase functions deploy summarize-conversations
```

## Configuration

### Environment Variables

Required environment variables (set in Supabase Dashboard → Edge Functions → Settings):

- `VITE_GEMINI_API_KEY` - Your Google Gemini API key
- `SUPABASE_URL` - Automatically provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically provided by Supabase

### Cron Job Setup

To run this function daily at 3 AM UTC, use Supabase's pg_cron extension:

1. Enable pg_cron in Supabase Dashboard → Database → Extensions

2. Run this SQL in the SQL Editor:

```sql
-- Create cron job to run summarization daily at 3 AM UTC
SELECT cron.schedule(
  'summarize-conversations-daily',
  '0 3 * * *', -- 3 AM UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/summarize-conversations',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
```

Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference ID
- `YOUR_SERVICE_ROLE_KEY` with your service role key (from Settings → API)

### Manual Invocation

Test the function manually:

```bash
# Using curl
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/summarize-conversations' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

Or use the Supabase CLI:

```bash
supabase functions invoke summarize-conversations
```

## Response Format

Success response:

```json
{
  "success": true,
  "summarized": 5,
  "skipped": 3,
  "total": 8,
  "message": "Processed 8 conversations: 5 summarized, 3 skipped"
}
```

Error response:

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Logs

View function logs in real-time:

```bash
supabase functions logs summarize-conversations
```

Or in the Supabase Dashboard → Edge Functions → summarize-conversations → Logs

## How It Works

1. **Query:** Find conversations with >50 messages AND (no summary OR summary >7 days old)
2. **Count Check:** Verify message count meets threshold (50+)
3. **Fetch Messages:** Get last 100 messages for each conversation
4. **Summarize:** Call Gemini API with context-aware prompt
5. **Update:** Save summary to `conversations.context_summary`
6. **Rate Limit:** Wait 1 second between API calls
7. **Report:** Return summary statistics

## Database Schema

Requires these columns in `conversations` table:

```sql
context_summary text -- AI-generated summary of conversation history
context_summary_updated_at timestamptz -- Last summary update timestamp
```

## Performance

- Processes ~1 conversation per second (rate limited)
- ~100 conversations = ~2 minutes total runtime
- Gemini API cost: ~$0.001 per conversation
- Daily run at 3 AM avoids user-facing impact

## Troubleshooting

**No conversations summarized:**
- Check message count threshold (must be >50)
- Verify conversations exist with `context_summary IS NULL`
- Check Gemini API key is set correctly

**API errors:**
- Review Edge Function logs for Gemini API errors
- Verify API key has quota remaining
- Check network connectivity to Gemini API

**Cron job not running:**
- Verify pg_cron extension is enabled
- Check cron job exists: `SELECT * FROM cron.job;`
- View cron run history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
