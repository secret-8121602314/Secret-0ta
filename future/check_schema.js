// Quick script to check conversations table schema from Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qajcxgkqloumogioomiz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhamN4Z2txbG91bW9naW9vbWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk2MTAyNDYsImV4cCI6MjA0NTE4NjI0Nn0.uIbR0PoJjXm6vKEKCJyXLLKxBmvpDVxP-ZOqVF_Yqzg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'conversations'
      ORDER BY ordinal_position;
    `
  });
  
  if (error) {
    console.error('Error:', error);
    
    // Try alternate method - query a sample row to see columns
    const { data: sample, error: sampleError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Sample query error:', sampleError);
    } else {
      console.log('\nSample conversation columns:');
      if (sample && sample[0]) {
        Object.keys(sample[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof sample[0][key]}`);
        });
      }
    }
  } else {
    console.log('Schema:', data);
  }
}

checkSchema();
