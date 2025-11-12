import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the SQL file
const sqlContent = fs.readFileSync(
  path.join(__dirname, 'fix_duplicate_policies.sql'),
  'utf-8'
);

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL || fs.readFileSync(
  path.join(__dirname, '.env'),
  'utf-8'
).split('\n').find(line => line.startsWith('DATABASE_URL='))?.split('=')[1];

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment or .env file');
  process.exit(1);
}

// Parse the connection string to get Supabase URL and key
// Format: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
const match = DATABASE_URL.match(/postgresql:\/\/postgres:([^@]+)@db\.([^.]+)\.supabase\.co/);
if (!match) {
  console.error('❌ Could not parse DATABASE_URL');
  process.exit(1);
}

const password = match[1];
const projectRef = match[2];
const supabaseUrl = `https://${projectRef}.supabase.co`;

// You need to get the service_role key from your Supabase dashboard
console.log('🔧 To run this script, you need the service_role key from:');
console.log(`   ${supabaseUrl}/project/${projectRef}/settings/api`);
console.log('');
console.log('Then run:');
console.log(`   $env:SUPABASE_SERVICE_KEY="your-service-role-key"; node fix_policies.js`);
console.log('');

const serviceKey = process.env.SUPABASE_SERVICE_KEY;
if (!serviceKey) {
  console.log('⚠️  SUPABASE_SERVICE_KEY not set, cannot proceed');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function executeSql() {
  console.log('🚀 Executing SQL to fix duplicate policies...\n');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      process.exit(1);
    }
    
    console.log('✅ Successfully removed duplicate policies!');
    console.log('');
    console.log('Verifying...');
    
    // Verify the policies
    const { data: policies, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT policyname, cmd 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'subtabs'
        ORDER BY cmd, policyname;
      `
    });
    
    if (verifyError) {
      console.error('⚠️  Could not verify policies:', verifyError);
    } else {
      console.log('\nCurrent policies:');
      console.table(policies);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

executeSql();
