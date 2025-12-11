// LemonSqueezy Webhook Handler - Direct REST API Version
// Bypasses Supabase client schema cache issues by using direct HTTP

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

// Direct REST API call to Supabase (bypasses schema cache completely)
async function supabaseRest(
  endpoint: string,
  method: string,
  body?: any,
  filters?: string
): Promise<{ data: any; error: any }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  
  let url = `${supabaseUrl}/rest/v1/${endpoint}`;
  if (filters) {
    url += `?${filters}`;
  }
  
  const headers: Record<string, string> = {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
  
  try {
    console.log(`📡 REST API ${method} ${endpoint}${filters ? '?' + filters : ''}`);
    
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    
    if (!response.ok) {
      console.error(`❌ REST error ${response.status}:`, data);
      return { data: null, error: { message: data?.message || data?.error || text, status: response.status } };
    }
    
    console.log(`✅ REST success:`, JSON.stringify(data).slice(0, 200));
    return { data, error: null };
  } catch (error) {
    console.error(`❌ REST fetch error:`, error);
    return { data: null, error: { message: error.message } };
  }
}

// Verify webhook signature using HMAC
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );
    
    const digest = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return digest === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature') || '';
    const webhookSecret = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET') ?? '';

    console.log('🔔 Webhook received');
    console.log('📦 Raw body length:', rawBody.length);

    // Verify webhook signature
    if (!signature || !await verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('❌ Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Signature verified');

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const subscriptionData = payload.data.attributes;

    console.log('📦 Event:', eventName);
    console.log('📧 Customer email:', subscriptionData.user_email);
    console.log('🔑 Full custom_data:', JSON.stringify(payload.meta.custom_data));

    // Extract user IDs from custom data
    const authUserId = payload.meta.custom_data?.auth_user_id;
    const userId = payload.meta.custom_data?.user_id;
    const userEmail = subscriptionData.user_email;
    
    console.log('🔑 auth_user_id:', authUserId);
    console.log('🔑 user_id (internal):', userId);
    console.log('📧 user_email:', userEmail);

    if (!authUserId && !userId && !userEmail) {
      console.error('❌ No user ID or email in webhook payload');
      return new Response(
        JSON.stringify({ error: 'No user ID or email provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine tier from variant ID
    let tier = 'pro';
    if (subscriptionData.variant_id) {
      const variantId = subscriptionData.variant_id.toString();
      tier = variantId === '1139844' ? 'vanguard_pro' : 'pro';
    }
    console.log('📊 Determined tier:', tier);

    // Handle subscription events
    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      console.log('🔄 Processing subscription_created/updated...');

      // Step 1: Find user by auth_user_id using direct REST API
      let foundUser = null;
      
      if (authUserId) {
        const { data: users, error: findError } = await supabaseRest(
          'users',
          'GET',
          null,
          `auth_user_id=eq.${authUserId}&select=id,tier,email,auth_user_id`
        );

        if (!findError && users && users.length > 0) {
          foundUser = users[0];
          console.log('✅ Found user by auth_user_id:', foundUser.id);
        } else {
          console.warn('⚠️ Could not find user by auth_user_id:', findError?.message);
        }
      }

      // Try finding by internal user_id if auth_user_id lookup failed
      if (!foundUser && userId) {
        const { data: users2, error: findError2 } = await supabaseRest(
          'users',
          'GET',
          null,
          `id=eq.${userId}&select=id,tier,email,auth_user_id`
        );
        
        if (!findError2 && users2 && users2.length > 0) {
          foundUser = users2[0];
          console.log('✅ Found user by internal id:', foundUser.id);
        } else {
          console.warn('⚠️ Could not find user by internal id:', findError2?.message);
        }
      }

      // Last resort: Try finding by email
      if (!foundUser && userEmail) {
        const { data: users3, error: findError3 } = await supabaseRest(
          'users',
          'GET',
          null,
          `email=eq.${encodeURIComponent(userEmail)}&select=id,tier,email,auth_user_id`
        );
        
        if (!findError3 && users3 && users3.length > 0) {
          foundUser = users3[0];
          console.log('✅ Found user by email:', foundUser.id);
        } else {
          console.warn('⚠️ Could not find user by email:', findError3?.message);
        }
      }

      if (!foundUser) {
        console.error('❌ User not found by any ID');
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('👤 Found user:', foundUser.id, foundUser.email, 'current tier:', foundUser.tier);

      // Step 2: Update user tier directly via REST API PATCH
      const updatePayload = {
        tier: tier,
        trial_expires_at: null,
        text_limit: 1583,
        image_limit: 328,
        updated_at: new Date().toISOString(),
      };
      console.log('📝 Updating user with:', JSON.stringify(updatePayload));

      const { data: updateResult, error: updateError } = await supabaseRest(
        'users',
        'PATCH',
        updatePayload,
        `id=eq.${foundUser.id}`
      );

      if (updateError) {
        console.error('❌ Failed to update user:', updateError.message);
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ USER TIER UPDATED SUCCESSFULLY TO:', tier);

      // Step 3: Try to insert subscription record (optional, for tracking)
      try {
        const subPayload = {
          user_id: foundUser.id,
          lemon_subscription_id: payload.data.id,
          lemon_customer_id: subscriptionData.customer_id?.toString() || '',
          lemon_order_id: subscriptionData.order_id?.toString() || null,
          lemon_product_id: subscriptionData.product_id?.toString() || '724192',
          lemon_variant_id: subscriptionData.variant_id?.toString() || '1139861',
          tier: tier,
          status: subscriptionData.status || 'active',
          billing_interval: tier === 'vanguard_pro' ? 'year' : 'month',
          renews_at: subscriptionData.renews_at || null,
          ends_at: subscriptionData.ends_at || null,
        };
        console.log('📝 Creating subscription record...');
        
        const { error: subError } = await supabaseRest(
          'subscriptions',
          'POST',
          subPayload
        );
        
        if (subError) {
          console.warn('⚠️ Could not create subscription record (non-critical):', subError.message);
        } else {
          console.log('✅ Subscription record created');
        }
      } catch (e) {
        console.warn('⚠️ Subscription record insert skipped:', e.message);
      }

      // Step 4: Log payment event (optional)
      try {
        await supabaseRest('payment_events', 'POST', {
          user_id: foundUser.id,
          event_type: eventName,
          event_name: eventName,
          lemon_event_id: payload.data.id,
          payload: payload,
          processed: true,
        });
        console.log('✅ Payment event logged');
      } catch (e) {
        console.warn('⚠️ Could not log payment event:', e.message);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          tier: tier, 
          userId: foundUser.id,
          message: `User upgraded to ${tier}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle cancellation
    if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
      console.log('🔄 Processing cancellation...');

      // Find user
      let foundUser = null;
      if (authUserId) {
        const { data: users } = await supabaseRest(
          'users', 'GET', null, `auth_user_id=eq.${authUserId}&select=id`
        );
        if (users && users.length > 0) foundUser = users[0];
      }
      if (!foundUser && userId) {
        const { data: users } = await supabaseRest(
          'users', 'GET', null, `id=eq.${userId}&select=id`
        );
        if (users && users.length > 0) foundUser = users[0];
      }

      if (foundUser) {
        await supabaseRest('users', 'PATCH', {
          tier: 'free',
          text_limit: 55,
          image_limit: 25,
          updated_at: new Date().toISOString(),
        }, `id=eq.${foundUser.id}`);
        console.log('✅ User downgraded to free');
      }

      return new Response(
        JSON.stringify({ success: true, action: 'downgraded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Other events - just acknowledge
    console.log('ℹ️ Event acknowledged:', eventName);
    return new Response(
      JSON.stringify({ success: true, event: eventName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
