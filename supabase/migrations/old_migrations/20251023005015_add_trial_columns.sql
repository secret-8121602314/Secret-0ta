-- Add trial tracking columns to users table
-- This enables proper 14-day trial period tracking

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;

-- Add index for efficient trial expiry queries
CREATE INDEX IF NOT EXISTS idx_users_trial_expires_at ON public.users(trial_expires_at)
WHERE trial_expires_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.users.trial_started_at IS 'When the user started their 14-day trial';
COMMENT ON COLUMN public.users.trial_expires_at IS 'When the user trial expires';
