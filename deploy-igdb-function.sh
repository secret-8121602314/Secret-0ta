#!/bin/bash

# IGDB Edge Function Deployment Script
# Run this after making changes to the IGDB proxy function

echo "🚀 Deploying IGDB Proxy Edge Function..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
echo "Checking Supabase login status..."
if ! supabase projects list &> /dev/null
then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Deploy the edge function
echo "Deploying igdb-proxy function..."
supabase functions deploy igdb-proxy --no-verify-jwt

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Edge function deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Verify IGDB credentials in Supabase dashboard:"
    echo "   - IGDB_CLIENT_ID"
    echo "   - IGDB_CLIENT_SECRET"
    echo ""
    echo "2. Test the function:"
    echo "   Open browser console and run:"
    echo "   fetch('YOUR_SUPABASE_URL/functions/v1/igdb-proxy', {"
    echo "     method: 'POST',"
    echo "     headers: { 'Content-Type': 'application/json' },"
    echo "     body: JSON.stringify({ queryType: 'popular', limit: 5 })"
    echo "   }).then(r => r.json()).then(console.log)"
    echo ""
    echo "3. Clear cache and reload Gaming Explorer:"
    echo "   localStorage.clear()"
    echo "   location.reload()"
else
    echo ""
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi
