-- Check conversations table columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'conversations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check subtabs table columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'subtabs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies on conversations
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  LEFT(qual::text, 100) as qual_preview,
  LEFT(with_check::text, 100) as with_check_preview
FROM pg_policies 
WHERE tablename = 'conversations'
ORDER BY policyname;

-- Check RLS policies on subtabs
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  LEFT(qual::text, 100) as qual_preview,
  LEFT(with_check::text, 100) as with_check_preview
FROM pg_policies 
WHERE tablename = 'subtabs'
ORDER BY policyname;

-- Check for the function
SELECT 
  routine_name, 
  routine_type,
  data_type as return_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_user_id_from_auth_id';
