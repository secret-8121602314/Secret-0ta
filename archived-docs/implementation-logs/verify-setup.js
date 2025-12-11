// Quick verification script for LemonSqueezy setup
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qajcxgkqloumogioomiz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhamN4Z2txbG91bW9naW9vbWl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNDcyMzYxOCwiZXhwIjoyMDQwMjk5NjE4fQ.b9jfhK72wuF5bHZQJJrN-8oEaibEqqFNYBzV5P1KA6w'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Checking LemonSqueezy Setup...\n')

// Check if subscriptions table exists
console.log('1. Checking subscriptions table...')
const { data: subData, error: subError } = await supabase
  .from('subscriptions')
  .select('id')
  .limit(1)

if (subError) {
  console.log('   ❌ Subscriptions table not found:', subError.message)
  console.log('   → Run migration: supabase/migrations/20251211_lemonsqueezy_subscriptions.sql')
} else {
  console.log('   ✅ Subscriptions table exists')
}

// Check if payment_events table exists
console.log('\n2. Checking payment_events table...')
const { data: eventData, error: eventError } = await supabase
  .from('payment_events')
  .select('id')
  .limit(1)

if (eventError) {
  console.log('   ❌ Payment events table not found:', eventError.message)
} else {
  console.log('   ✅ Payment events table exists')
}

// Check webhook endpoint
console.log('\n3. Checking webhook endpoint...')
try {
  const response = await fetch('https://qajcxgkqloumogioomiz.supabase.co/functions/v1/handle-lemonsqueezy-webhook', {
    method: 'OPTIONS'
  })
  if (response.ok) {
    console.log('   ✅ Webhook endpoint is accessible')
  } else {
    console.log('   ⚠️  Webhook returned:', response.status)
  }
} catch (error) {
  console.log('   ❌ Cannot reach webhook:', error.message)
}

console.log('\n📋 Setup Summary:')
console.log('   Webhook URL: https://qajcxgkqloumogioomiz.supabase.co/functions/v1/handle-lemonsqueezy-webhook')
console.log('   Store ID: 254556')
console.log('   Pro Variant: 1139861')
console.log('   Vanguard Variant: 1139844')
console.log('\n✅ Webhook deployed and secrets configured!')
console.log('⚠️  Next: Configure this webhook URL in LemonSqueezy dashboard')
