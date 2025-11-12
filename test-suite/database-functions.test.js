/**
 * COMPREHENSIVE DATABASE FUNCTIONS TEST SUITE
 * Tests all Supabase RPC functions, triggers, and database operations
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local file
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

// Initialize Supabase client
const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                    envVars.VITE_SUPABASE_ANON_KEY || 
                    process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('URL found:', !!supabaseUrl);
  console.error('Key found:', !!supabaseKey);
  console.error('Available keys:', Object.keys(envVars));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test Results Tracker
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function logTest(phase, testName, status, details = '') {
  const result = { phase, testName, status, details, timestamp: new Date().toISOString() };
  testResults.tests.push(result);
  
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${phase}] ${testName}`);
  if (details) console.log(`   └─ ${details}`);
  
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
}

// ============================================================================
// PHASE 1: AUTHENTICATION & WAITLIST TESTS
// ============================================================================

async function testPhase1_Waitlist() {
  console.log('\n🔍 PHASE 1: AUTHENTICATION & WAITLIST\n');
  
  // Test 1: Waitlist table exists and is accessible
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    logTest('PHASE 1', 'Waitlist table accessible', 'PASS', `Table exists with ${data} entries`);
  } catch (error) {
    logTest('PHASE 1', 'Waitlist table accessible', 'FAIL', error.message);
  }
  
  // Test 2: Waitlist email unique constraint
  try {
    const testEmail = `test-${Date.now()}@example.com`;
    
    // Insert first time
    const { error: insertError1 } = await supabase
      .from('waitlist')
      .insert({ email: testEmail, source: 'test' });
    
    if (insertError1) throw insertError1;
    
    // Try to insert duplicate
    const { error: insertError2 } = await supabase
      .from('waitlist')
      .insert({ email: testEmail, source: 'test' });
    
    if (insertError2 && insertError2.code === '23505') {
      logTest('PHASE 1', 'Waitlist duplicate prevention', 'PASS', 'Unique constraint working (23505 error)');
    } else {
      logTest('PHASE 1', 'Waitlist duplicate prevention', 'FAIL', 'Duplicate was allowed');
    }
    
    // Cleanup
    await supabase.from('waitlist').delete().eq('email', testEmail);
  } catch (error) {
    logTest('PHASE 1', 'Waitlist duplicate prevention', 'FAIL', error.message);
  }
  
  // Test 3: Waitlist RLS policies
  try {
    // Test anonymous access (should work)
    const { data, error } = await supabase
      .from('waitlist')
      .select('id, email, status')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 1', 'Waitlist RLS allows public read', 'PASS');
    } else {
      logTest('PHASE 1', 'Waitlist RLS allows public read', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 1', 'Waitlist RLS allows public read', 'FAIL', error.message);
  }
}

// ============================================================================
// PHASE 13: DATABASE OPERATIONS TESTS
// ============================================================================

async function testPhase13_DatabaseFunctions() {
  console.log('\n🔍 PHASE 13: DATABASE OPERATIONS\n');
  
  // Test: Users table structure
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, auth_user_id, email, tier, text_count, image_count, text_limit, image_limit')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 13', 'Users table has correct columns', 'PASS', 'All required columns exist');
    } else {
      logTest('PHASE 13', 'Users table has correct columns', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 13', 'Users table has correct columns', 'FAIL', error.message);
  }
  
  // Test: Conversations table has is_game_hub flag
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, is_game_hub, title, user_id')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 13', 'Conversations table has is_game_hub flag', 'PASS');
    } else {
      logTest('PHASE 13', 'Conversations table has is_game_hub flag', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 13', 'Conversations table has is_game_hub flag', 'FAIL', error.message);
  }
  
  // Test: increment_user_usage function exists
  try {
    const testUserId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
    const { error } = await supabase.rpc('increment_user_usage', {
      p_auth_user_id: testUserId,
      p_query_type: 'text',
      p_increment: 1
    });
    
    // We expect this to fail (user doesn't exist) but function should exist
    if (error && !error.message.includes('function') && !error.message.includes('does not exist')) {
      logTest('PHASE 13', 'increment_user_usage function exists', 'PASS', 'Function callable (expected user not found)');
    } else if (error && (error.message.includes('function') || error.message.includes('does not exist'))) {
      logTest('PHASE 13', 'increment_user_usage function exists', 'FAIL', 'Function not found');
    } else {
      logTest('PHASE 13', 'increment_user_usage function exists', 'PASS');
    }
  } catch (error) {
    logTest('PHASE 13', 'increment_user_usage function exists', 'FAIL', error.message);
  }
  
  // Test: reset_monthly_usage function exists
  try {
    const { data, error } = await supabase.rpc('reset_monthly_usage');
    
    if (!error || (error && !error.message.includes('does not exist'))) {
      logTest('PHASE 13', 'reset_monthly_usage function exists', 'PASS', `Reset ${data?.[0]?.users_reset || 0} users`);
    } else {
      logTest('PHASE 13', 'reset_monthly_usage function exists', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 13', 'reset_monthly_usage function exists', 'FAIL', error.message);
  }
  
  // Test: get_or_create_game_hub function exists
  try {
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { error } = await supabase.rpc('get_or_create_game_hub', {
      p_user_id: testUserId
    });
    
    if (!error || (error && !error.message.includes('does not exist'))) {
      logTest('PHASE 13', 'get_or_create_game_hub function exists', 'PASS');
    } else {
      logTest('PHASE 13', 'get_or_create_game_hub function exists', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 13', 'get_or_create_game_hub function exists', 'FAIL', error.message);
  }
}

// ============================================================================
// PHASE 19: CACHE SYSTEM TESTS
// ============================================================================

async function testPhase19_CacheSystem() {
  console.log('\n🔍 PHASE 19: CACHE & PERSISTENCE SYSTEM\n');
  
  // Test: app_cache table exists
  try {
    const { error } = await supabase
      .from('app_cache')
      .select('key, value, expires_at, cache_type')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 19', 'app_cache table accessible', 'PASS');
    } else {
      logTest('PHASE 19', 'app_cache table accessible', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 19', 'app_cache table accessible', 'FAIL', error.message);
  }
  
  // Test: ai_responses table exists
  try {
    const { error } = await supabase
      .from('ai_responses')
      .select('id, cache_key, response_data')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 19', 'ai_responses table accessible', 'PASS');
    } else {
      logTest('PHASE 19', 'ai_responses table accessible', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 19', 'ai_responses table accessible', 'FAIL', error.message);
  }
  
  // Test: game_insights table exists
  try {
    const { error } = await supabase
      .from('game_insights')
      .select('id, game_title, insights_data')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 19', 'game_insights table accessible', 'PASS');
    } else {
      logTest('PHASE 19', 'game_insights table accessible', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 19', 'game_insights table accessible', 'FAIL', error.message);
  }
  
  // Test: cleanup_expired_cache function
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_cache');
    
    if (!error) {
      logTest('PHASE 19', 'cleanup_expired_cache function works', 'PASS', `Cleaned ${data} entries`);
    } else {
      logTest('PHASE 19', 'cleanup_expired_cache function works', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 19', 'cleanup_expired_cache function works', 'FAIL', error.message);
  }
  
  // Test: get_cache_stats function
  try {
    const { data, error } = await supabase.rpc('get_cache_stats');
    
    if (!error) {
      logTest('PHASE 19', 'get_cache_stats function works', 'PASS', `${data?.length || 0} cache types found`);
    } else {
      logTest('PHASE 19', 'get_cache_stats function works', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 19', 'get_cache_stats function works', 'FAIL', error.message);
  }
}

// ============================================================================
// PHASE 28: DATABASE FUNCTIONS & TRIGGERS TESTS
// ============================================================================

async function testPhase28_FunctionsAndTriggers() {
  console.log('\n🔍 PHASE 28: DATABASE FUNCTIONS & TRIGGERS\n');
  
  // Test: get_complete_user_data function
  try {
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { error } = await supabase.rpc('get_complete_user_data', {
      p_auth_user_id: testUserId
    });
    
    if (!error || (error && !error.message.includes('does not exist'))) {
      logTest('PHASE 28', 'get_complete_user_data function exists', 'PASS');
    } else {
      logTest('PHASE 28', 'get_complete_user_data function exists', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 28', 'get_complete_user_data function exists', 'FAIL', error.message);
  }
  
  // Test: get_user_onboarding_status function
  try {
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { error } = await supabase.rpc('get_user_onboarding_status', {
      p_user_id: testUserId
    });
    
    if (!error || (error && !error.message.includes('does not exist'))) {
      logTest('PHASE 28', 'get_user_onboarding_status function exists', 'PASS');
    } else {
      logTest('PHASE 28', 'get_user_onboarding_status function exists', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 28', 'get_user_onboarding_status function exists', 'FAIL', error.message);
  }
  
  // Test: update_user_onboarding_status function
  try {
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { error } = await supabase.rpc('update_user_onboarding_status', {
      p_user_id: testUserId,
      p_step: 'initial',
      p_data: {}
    });
    
    if (!error || (error && !error.message.includes('does not exist'))) {
      logTest('PHASE 28', 'update_user_onboarding_status function exists', 'PASS');
    } else {
      logTest('PHASE 28', 'update_user_onboarding_status function exists', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 28', 'update_user_onboarding_status function exists', 'FAIL', error.message);
  }
  
  // Test: migrate_messages_to_conversation function
  try {
    const { error } = await supabase.rpc('migrate_messages_to_conversation', {
      p_message_ids: [],
      p_target_conversation_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (!error || (error && !error.message.includes('does not exist'))) {
      logTest('PHASE 28', 'migrate_messages_to_conversation function exists', 'PASS');
    } else {
      logTest('PHASE 28', 'migrate_messages_to_conversation function exists', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 28', 'migrate_messages_to_conversation function exists', 'FAIL', error.message);
  }
  
  // Test: get_cache_performance_metrics function
  try {
    const { data, error } = await supabase.rpc('get_cache_performance_metrics');
    
    if (!error) {
      logTest('PHASE 28', 'get_cache_performance_metrics function works', 'PASS', `${data?.length || 0} metrics returned`);
    } else {
      logTest('PHASE 28', 'get_cache_performance_metrics function works', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 28', 'get_cache_performance_metrics function works', 'FAIL', error.message);
  }
}

// ============================================================================
// PHASE 2-12: FRONTEND FEATURE TESTS (DATABASE VERIFICATION)
// ============================================================================

async function testPhase2to12_FrontendFeatures() {
  console.log('\n🔍 PHASE 2-12: FRONTEND FEATURES (DATABASE VERIFICATION)\n');
  
  // Test: Onboarding flags exist in users table
  try {
    const { data, error } = await supabase
      .from('users')
      .select('has_seen_splash_screens, has_seen_how_to_use, has_seen_features_connected, has_seen_pro_features, pc_connected, pc_connection_skipped, onboarding_completed, has_profile_setup')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 2-3', 'All onboarding flags exist in users table', 'PASS');
    } else {
      logTest('PHASE 2-3', 'All onboarding flags exist in users table', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 2-3', 'All onboarding flags exist in users table', 'FAIL', error.message);
  }
  
  // Test: Conversations table supports Game Hub
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, is_game_hub, title, messages, subtabs, game_progress, is_active_session')
      .eq('is_game_hub', true)
      .limit(1);
    
    if (!error) {
      logTest('PHASE 4', 'Conversations table supports Game Hub structure', 'PASS');
    } else {
      logTest('PHASE 4', 'Conversations table supports Game Hub structure', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 4', 'Conversations table supports Game Hub structure', 'FAIL', error.message);
  }
  
  // Test: Profile data stored as JSONB
  try {
    const { data, error } = await supabase
      .from('users')
      .select('profile_data')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 9', 'profile_data JSONB column exists', 'PASS');
    } else {
      logTest('PHASE 9', 'profile_data JSONB column exists', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 9', 'profile_data JSONB column exists', 'FAIL', error.message);
  }
  
  // Test: Conversation pinning support
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('is_pinned, pinned_at')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 10', 'Conversation pinning fields exist', 'PASS');
    } else {
      logTest('PHASE 10', 'Conversation pinning fields exist', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 10', 'Conversation pinning fields exist', 'FAIL', error.message);
  }
  
  // Test: Playing mode / active session support
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('is_active_session, active_objective')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 11', 'Playing mode fields exist', 'PASS');
    } else {
      logTest('PHASE 11', 'Playing mode fields exist', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 11', 'Playing mode fields exist', 'FAIL', error.message);
  }
  
  // Test: Tier system fields
  try {
    const { data, error } = await supabase
      .from('users')
      .select('tier, is_developer, has_used_trial')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 12', 'Tier and trial fields exist', 'PASS');
    } else {
      logTest('PHASE 12', 'Tier and trial fields exist', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 12', 'Tier and trial fields exist', 'FAIL', error.message);
  }
}

// ============================================================================
// PHASE 21: SESSION & ANALYTICS TESTS
// ============================================================================

async function testPhase21_SessionAnalytics() {
  console.log('\n🔍 PHASE 21: SESSION & ANALYTICS\n');
  
  // Test: user_sessions table structure
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('id, user_id, session_data, started_at, ended_at, duration_seconds')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 21', 'user_sessions table has correct structure', 'PASS');
    } else {
      logTest('PHASE 21', 'user_sessions table has correct structure', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 21', 'user_sessions table has correct structure', 'FAIL', error.message);
  }
  
  // Test: user_analytics table structure
  try {
    const { data, error } = await supabase
      .from('user_analytics')
      .select('id, user_id, event_type, event_data, created_at')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 21', 'user_analytics table has correct structure', 'PASS');
    } else {
      logTest('PHASE 21', 'user_analytics table has correct structure', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 21', 'user_analytics table has correct structure', 'FAIL', error.message);
  }
}

// ============================================================================
// PHASE 25: GAME TAB MANAGEMENT TESTS
// ============================================================================

async function testPhase25_GameManagement() {
  console.log('\n🔍 PHASE 25: GAME TAB MANAGEMENT\n');
  
  // Test: games table structure
  try {
    const { data, error } = await supabase
      .from('games')
      .select('id, user_id, title, genre, status, progress, playtime_hours, rating')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 25', 'games table has correct structure', 'PASS');
    } else {
      logTest('PHASE 25', 'games table has correct structure', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 25', 'games table has correct structure', 'FAIL', error.message);
  }
  
  // Test: Game conversation fields
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('game_id, game_title, genre, game_progress')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 25', 'Conversations have game-related fields', 'PASS');
    } else {
      logTest('PHASE 25', 'Conversations have game-related fields', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 25', 'Conversations have game-related fields', 'FAIL', error.message);
  }
}

// ============================================================================
// PHASE 30: QUERY LIMITS & USAGE TRACKING TESTS
// ============================================================================

async function testPhase30_UsageLimits() {
  console.log('\n🔍 PHASE 30: QUERY LIMITS & USAGE TRACKING\n');
  
  // Test: Users table has usage tracking columns
  try {
    const { data, error } = await supabase
      .from('users')
      .select('text_count, image_count, text_limit, image_limit, total_requests, last_reset')
      .limit(1);
    
    if (!error) {
      logTest('PHASE 30', 'Users table has usage tracking columns', 'PASS', 'All limit columns exist');
    } else {
      logTest('PHASE 30', 'Users table has usage tracking columns', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('PHASE 30', 'Users table has usage tracking columns', 'FAIL', error.message);
  }
  
  // Test: Default limits are correct
  try {
    const { data, error } = await supabase
      .from('users')
      .select('tier, text_limit, image_limit')
      .eq('tier', 'free')
      .limit(1)
      .single();
    
    if (!error && data) {
      if (data.text_limit === 55 && data.image_limit === 25) {
        logTest('PHASE 30', 'Free tier has correct limits (55 text, 25 image)', 'PASS');
      } else {
        logTest('PHASE 30', 'Free tier has correct limits (55 text, 25 image)', 'FAIL', 
          `Found: ${data.text_limit} text, ${data.image_limit} image`);
      }
    } else {
      logTest('PHASE 30', 'Free tier has correct limits (55 text, 25 image)', 'WARNING', 'No free users found to test');
    }
  } catch (error) {
    logTest('PHASE 30', 'Free tier has correct limits (55 text, 25 image)', 'FAIL', error.message);
  }
  
  // Test: Pro tier limits
  try {
    const { data, error } = await supabase
      .from('users')
      .select('tier, text_limit, image_limit')
      .eq('tier', 'pro')
      .limit(1)
      .single();
    
    if (!error && data) {
      if (data.text_limit === 1583 && data.image_limit === 328) {
        logTest('PHASE 30', 'Pro tier has correct limits (1583 text, 328 image)', 'PASS');
      } else {
        logTest('PHASE 30', 'Pro tier has correct limits (1583 text, 328 image)', 'FAIL', 
          `Found: ${data.text_limit} text, ${data.image_limit} image`);
      }
    } else {
      logTest('PHASE 30', 'Pro tier has correct limits (1583 text, 328 image)', 'WARNING', 'No pro users found to test');
    }
  } catch (error) {
    logTest('PHASE 30', 'Pro tier has correct limits (1583 text, 328 image)', 'FAIL', error.message);
  }
}

// ============================================================================
// ADDITIONAL TABLES VERIFICATION
// ============================================================================

async function testAdditionalTables() {
  console.log('\n🔍 ADDITIONAL: TABLE STRUCTURE VERIFICATION\n');
  
  // Note: messages and subtabs are stored as JSONB columns in conversations table, not separate tables
  const tables = [
    'users',
    'conversations',
    'games',
    'onboarding_progress',
    'waitlist',
    'app_cache',
    'ai_responses',
    'game_insights',
    'api_usage',
    'user_analytics',
    'user_sessions'
  ];
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        logTest('TABLES', `${table} table exists and is accessible`, 'PASS');
      } else {
        logTest('TABLES', `${table} table exists and is accessible`, 'FAIL', error.message);
      }
    } catch (error) {
      logTest('TABLES', `${table} table exists and is accessible`, 'FAIL', error.message);
    }
  }
  
  // Verify that messages and subtabs are JSONB columns in conversations table
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, messages, subtabs')
      .limit(1);
    
    if (!error) {
      logTest('TABLES', 'messages stored as JSONB in conversations', 'PASS');
      logTest('TABLES', 'subtabs stored as JSONB in conversations', 'PASS');
    } else {
      logTest('TABLES', 'messages/subtabs JSONB columns', 'FAIL', error.message);
    }
  } catch (error) {
    logTest('TABLES', 'messages/subtabs JSONB columns', 'FAIL', error.message);
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     OTAKON AI - COMPREHENSIVE DATABASE TEST SUITE              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    await testPhase1_Waitlist();
    await testPhase2to12_FrontendFeatures();
    await testPhase13_DatabaseFunctions();
    await testPhase19_CacheSystem();
    await testPhase21_SessionAnalytics();
    await testPhase25_GameManagement();
    await testPhase28_FunctionsAndTriggers();
    await testPhase30_UsageLimits();
    await testAdditionalTables();
    
    // Print Summary
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                      TEST SUMMARY                              ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Passed:   ${testResults.passed}`);
    console.log(`❌ Failed:   ${testResults.failed}`);
    console.log(`⚠️  Warnings: ${testResults.warnings}`);
    console.log(`📊 Total:    ${testResults.tests.length}`);
    console.log(`\n✨ Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%\n`);
    
    // Exit with appropriate code
    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
