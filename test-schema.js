// Simple script to test database connection and run schema
// Run with: node test-schema.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
let envContent = '';
try {
  envContent = readFileSync('.env.local', 'utf8');
} catch (error) {
  console.log('No .env.local file found, trying .env...');
  try {
    envContent = readFileSync('.env', 'utf8');
  } catch (error2) {
    console.log('No .env file found either');
  }
}

// Parse environment variables
const envVars = {};
if (envContent) {
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please check your .env file has:');
  console.log('VITE_SUPABASE_URL=your_supabase_url');
  console.log('VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔌 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('waitlist')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function checkTables() {
  try {
    console.log('📋 Checking database tables...');
    
    const tables = [
      'users',
      'onboarding_progress', 
      'user_sessions',
      'waitlist',
      'games',
      'conversations',
      'user_analytics',
      'api_usage'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}' not found or accessible`);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error:`, err.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Table check failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Otagon Database Schema Test');
  console.log('================================');
  
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  await checkTables();
  
  console.log('\n📝 Next steps:');
  console.log('1. Copy the content of supabase/master-schema.sql');
  console.log('2. Paste it into your Supabase SQL Editor');
  console.log('3. Click "Run" to execute the schema');
  console.log('4. Run this test again to verify everything works');
}

main().catch(console.error);
