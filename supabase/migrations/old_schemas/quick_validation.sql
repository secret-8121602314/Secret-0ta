-- Quick validation check for messages migration
-- Run this to verify data integrity before applying migration

SELECT 'Check 1: Messages with NULL conversation_id' as check_name, COUNT(*) as count FROM messages WHERE conversation_id IS NULL
UNION ALL
SELECT 'Check 2: Orphaned messages', COUNT(*) FROM messages m LEFT JOIN conversations c ON m.conversation_id = c.id WHERE c.id IS NULL
UNION ALL
SELECT 'Check 3: Total messages to backfill', COUNT(*) FROM messages
UNION ALL
SELECT 'Check 4: Conversations with NULL auth_user_id', COUNT(*) FROM conversations WHERE auth_user_id IS NULL
UNION ALL
SELECT 'Check 5: Invalid auth_user_id references', COUNT(*) FROM conversations c LEFT JOIN auth.users u ON c.auth_user_id = u.id WHERE c.auth_user_id IS NOT NULL AND u.id IS NULL;

-- If all checks return 0 (except Check 3), migration is safe to apply
