/**
 * CREATE TEST USERS
 * Creates test users with different tiers to verify limit enforcement
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
function loadEnvFile(filePath) {
  try {
    const envContent = readFileSync(filePath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Error loading .env.local:', error.message);
    process.exit(1);
  }
}

const envPath = join(__dirname, '../.env.local');
const envVars = loadEnvFile(envPath);

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║        OTAKON AI - CREATE TEST USERS                           ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

async function createTestUsers() {
  try {
    // First, we need to create auth users manually or use the database directly
    // Since we can't create auth users via the anon key, we'll create users table entries
    // that can be used for testing (without auth_user_id for now)
    
    console.log('📝 Creating test user entries in users table...\n');

    // Test User 1: Free Tier
    const freeUser = {
      auth_user_id: '00000000-0000-0000-0000-000000000001', // Dummy UUID for testing
      email: 'test-free@otakon.local',
      full_name: 'Free Test User',
      tier: 'free',
      text_count: 0,
      text_limit: 55,
      image_count: 0,
      image_limit: 25,
      total_requests: 0,
      last_reset: new Date().toISOString(),
      has_seen_splash_screens: true,
      has_seen_how_to_use: true,
      has_seen_features_connected: true,
      has_seen_pro_features: false,
      onboarding_completed: true,
      has_welcome_message: true,
      is_new_user: false,
      has_used_trial: false,
      profile_data: {
        persona: 'balanced',
        avatar: 'default',
        displayName: 'Free Test User'
      }
    };

    // Test User 2: Pro Tier
    const proUser = {
      auth_user_id: '00000000-0000-0000-0000-000000000002', // Dummy UUID for testing
      email: 'test-pro@otakon.local',
      full_name: 'Pro Test User',
      tier: 'pro',
      text_count: 0,
      text_limit: 1583,
      image_count: 0,
      image_limit: 328,
      total_requests: 0,
      last_reset: new Date().toISOString(),
      has_seen_splash_screens: true,
      has_seen_how_to_use: true,
      has_seen_features_connected: true,
      has_seen_pro_features: true,
      onboarding_completed: true,
      has_welcome_message: true,
      is_new_user: false,
      has_used_trial: true,
      profile_data: {
        persona: 'strategic',
        avatar: 'premium',
        displayName: 'Pro Test User'
      }
    };

    // Check if test users already exist
    console.log('🔍 Checking for existing test users...');
    const { data: existingUsers } = await supabase
      .from('users')
      .select('email, tier')
      .in('email', [freeUser.email, proUser.email]);

    if (existingUsers && existingUsers.length > 0) {
      console.log('⚠️  Test users already exist:');
      existingUsers.forEach(u => console.log(`   - ${u.email} (${u.tier})`));
      console.log('\n💡 To recreate, delete them first or update the script.\n');
      
      // Query and display current limits
      console.log('📊 Current test user stats:');
      const { data: users } = await supabase
        .from('users')
        .select('email, tier, text_count, text_limit, image_count, image_limit, total_requests')
        .in('email', [freeUser.email, proUser.email]);
      
      if (users) {
        users.forEach(user => {
          console.log(`\n✅ ${user.email} (${user.tier} Tier)`);
          console.log(`   Text:  ${user.text_count}/${user.text_limit}`);
          console.log(`   Image: ${user.image_count}/${user.image_limit}`);
          console.log(`   Total Requests: ${user.total_requests}`);
        });
      }
      
      return;
    }

    // Create Free tier test user
    console.log('\n📝 Creating Free tier test user...');
    const { data: freeData, error: freeError } = await supabase
      .from('users')
      .insert([freeUser])
      .select()
      .single();

    if (freeError) {
      console.error('❌ Error creating Free tier user:', freeError.message);
    } else {
      console.log(`✅ Created Free tier user: ${freeData.email}`);
      console.log(`   Text limit:  ${freeData.text_limit}`);
      console.log(`   Image limit: ${freeData.image_limit}`);
    }

    // Create Pro tier test user
    console.log('\n📝 Creating Pro tier test user...');
    const { data: proData, error: proError } = await supabase
      .from('users')
      .insert([proUser])
      .select()
      .single();

    if (proError) {
      console.error('❌ Error creating Pro tier user:', proError.message);
    } else {
      console.log(`✅ Created Pro tier user: ${proData.email}`);
      console.log(`   Text limit:  ${proData.text_limit}`);
      console.log(`   Image limit: ${proData.image_limit}`);
    }

    // Verify creation
    console.log('\n🔍 Verifying test users...');
    const { data: verifyData } = await supabase
      .from('users')
      .select('email, tier, text_limit, image_limit')
      .in('email', [freeUser.email, proUser.email]);

    if (verifyData && verifyData.length === 2) {
      console.log('\n✅ VERIFICATION SUCCESSFUL\n');
      console.log('Test users created and ready:');
      verifyData.forEach(user => {
        console.log(`\n📊 ${user.email}`);
        console.log(`   Tier: ${user.tier}`);
        console.log(`   Text queries/month: ${user.text_limit}`);
        console.log(`   Image queries/month: ${user.image_limit}`);
      });
      
      console.log('\n💡 You can now test tier limit enforcement with these users!');
      console.log('💡 To test limits, manually increment counts using increment_user_usage()');
    } else {
      console.log('⚠️  Verification incomplete. Please check the database manually.');
    }

    // Provide SQL commands for manual testing
    console.log('\n📋 SQL COMMANDS FOR TESTING:\n');
    console.log('-- Test Free tier limit (55 text):');
    console.log(`SELECT increment_user_usage((SELECT id FROM users WHERE email = '${freeUser.email}'), false);`);
    console.log('\n-- Check Free tier count:');
    console.log(`SELECT email, tier, text_count, text_limit FROM users WHERE email = '${freeUser.email}';`);
    console.log('\n-- Test Pro tier limit (1583 text):');
    console.log(`SELECT increment_user_usage((SELECT id FROM users WHERE email = '${proUser.email}'), false);`);
    console.log('\n-- Check Pro tier count:');
    console.log(`SELECT email, tier, text_count, text_limit FROM users WHERE email = '${proUser.email}';`);

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

// Run the script
createTestUsers().then(() => {
  console.log('\n✨ Test user creation complete!\n');
  process.exit(0);
});
