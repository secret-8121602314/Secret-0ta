-- Test query to verify trial_expires_at column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'users'
    AND column_name IN ('trial_started_at', 'trial_expires_at', 'has_used_trial');
