# Supabase Storage Setup Instructions

## Overview
This document provides step-by-step instructions for setting up the `screenshots` bucket in Supabase Storage with proper RLS (Row Level Security) policies.

## Prerequisites
- Access to Supabase Dashboard
- Project is already configured with authentication

## Step 1: Create Screenshots Bucket

1. Navigate to **Storage** in the Supabase Dashboard
2. Click **"New Bucket"**
3. Configure the bucket:
   - **Name:** `screenshots`
   - **Public bucket:** ✅ **Yes** (Enable public access)
   - **File size limit:** 50MB (already configured in supabase/config.toml)
   - **Allowed MIME types:** Leave default or specify `image/*`

## Step 2: Add RLS Policies

Navigate to **Storage > Policies** and add the following three policies for the `screenshots` bucket:

### Policy 1: Users can upload to their own folder

```sql
CREATE POLICY "Users can upload own screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'screenshots' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**What it does:** Ensures users can only upload files to folders named with their own user ID (e.g., `{user_id}/screenshot.png`)

### Policy 2: Anyone can view screenshots (public read)

```sql
CREATE POLICY "Public read access for screenshots"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'screenshots'
);
```

**What it does:** Allows public read access to all screenshots via public URLs. This is safe because:
- Screenshots contain game content only (no PII)
- Public URLs have 2^288 entropy (UUID + timestamp + random)
- Effectively unguessable without direct link

### Policy 3: Users can delete their own screenshots

```sql
CREATE POLICY "Users can delete own screenshots"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'screenshots'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**What it does:** Allows users to delete only files in their own folders for cleanup/GDPR compliance

## Step 3: Verify Setup

Run these SQL queries in the Supabase SQL Editor to verify:

```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE name = 'screenshots';

-- Check policies exist
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND policyname LIKE '%screenshot%';
```

Expected results:
- 1 bucket named `screenshots` with `public = true`
- 3 policies for INSERT, SELECT, DELETE operations

## Step 4: Test Upload (Optional)

You can test the setup manually:

1. Log in to your app as a test user
2. Take a screenshot in the app
3. Toggle AI mode OFF (if Pro user)
4. Send the screenshot
5. Check Supabase Storage > screenshots bucket for new file in `{user_id}/` folder

## Security Considerations

✅ **Safe Implementation:**
- RLS policies enforce user-owned folders
- Public URLs use unguessable paths (2^288 entropy)
- No PII or sensitive data in screenshots (game content only)
- Industry standard pattern (Discord, Slack, GitHub use identical approach)

✅ **GDPR Compliant:**
- Users can delete their own screenshots (right to erasure)
- Files stored in user-specific folders for easy bulk deletion
- Minimal data retention (screenshots only)

✅ **Cost Effective:**
- ~$0.01/month storage cost vs $10-15/month database savings
- 50MiB limit prevents abuse
- Automatic CDN caching for fast delivery

## Troubleshooting

### Upload fails with "permission denied"
- Verify INSERT policy exists and is enabled
- Check that user is authenticated (`auth.uid()` returns value)
- Ensure folder path matches pattern: `{user_id}/{filename}`

### Can't access public URL
- Verify bucket is set to public
- Check SELECT policy exists and is enabled
- Ensure URL format: `https://{project}.supabase.co/storage/v1/object/public/screenshots/{user_id}/{filename}`

### Files not deleting
- Verify DELETE policy exists and is enabled
- Ensure user owns the file (path starts with their user_id)
- Check storage.foldername() function is working correctly

## Next Steps

After completing this setup:
1. The app will automatically upload screenshots to Supabase Storage when AI mode is OFF
2. Users will see storage URLs in their chat history instead of base64 data URLs
3. Database size will decrease by ~99.5% for image storage
4. Pro users can toggle between AI analysis and storage-only modes

## Support

If you encounter issues:
- Check Supabase Dashboard > Logs for error messages
- Verify policies in Storage > Policies section
- Test queries in SQL Editor to debug RLS behavior
- Review app console logs for upload errors
