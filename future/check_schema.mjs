import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://postgres:biLNCCJgKsj8K09Q@db.qajcxgkqloumogioomiz.supabase.co:5432/postgres'
});

try {
  await client.connect();
  console.log('✅ Connected to Supabase database\n');
  
  // Get conversations table schema
  const result = await client.query(`
    SELECT 
      column_name, 
      data_type, 
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations'
    ORDER BY ordinal_position;
  `);
  
  console.log('📋 CONVERSATIONS TABLE SCHEMA (Remote Supabase):');
  console.log('================================================\n');
  console.table(result.rows);
  
  await client.end();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

