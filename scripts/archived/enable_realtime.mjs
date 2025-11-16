import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function enableRealtime() {
  console.log('🔌 Enabling real-time for conversations table...');
  
  try {
    // Note: This SQL needs to be run with the service_role key or via Supabase Dashboard
    // The anon key doesn't have permissions to ALTER PUBLICATION
    const { data, error } = await supabase.rpc('query', {
      query: 'ALTER PUBLICATION supabase_realtime ADD TABLE conversations;'
    });
    
    if (error) {
      console.error('❌ Error enabling real-time:', error);
      console.log('\n⚠️  Please run this SQL manually in Supabase Dashboard:');
      console.log('ALTER PUBLICATION supabase_realtime ADD TABLE conversations;');
      process.exit(1);
    }
    
    console.log('✅ Real-time enabled successfully!');
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.log('\n⚠️  Please run this SQL manually in Supabase Dashboard:');
    console.log('1. Go to: https://supabase.com/dashboard/project/qajcxgkqloumogioomiz/editor');
    console.log('2. Run this SQL:');
    console.log('   ALTER PUBLICATION supabase_realtime ADD TABLE conversations;');
    process.exit(1);
  }
}

enableRealtime();
