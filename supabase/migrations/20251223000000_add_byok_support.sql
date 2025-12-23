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

-- Update expire_trials function to clear custom keys on trial expiration
CREATE OR REPLACE FUNCTION public.expire_trials()
RETURNS TABLE(expired_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- Update users whose trial has expired
  UPDATE users
  SET 
    tier = 'free',
    text_limit = 20,
    image_limit = 15,
    uses_custom_gemini_key = false,
    gemini_api_key_encrypted = NULL,
    had_custom_key_before = CASE 
      WHEN uses_custom_gemini_key = true THEN true 
      ELSE had_custom_key_before 
    END,
    updated_at = NOW()
  WHERE 
    trial_expires_at < NOW()
    AND tier = 'pro'
    AND has_used_trial = true
    AND trial_started_at IS NOT NULL;
  
  -- Get count of affected rows
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Log the expiration
  RAISE NOTICE 'Expired % trial(s) at %', affected_rows, NOW();
  
  -- Return the count
  RETURN QUERY SELECT affected_rows;
END;
$$;
