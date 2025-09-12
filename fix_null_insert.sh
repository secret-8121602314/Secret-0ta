#!/bin/bash

echo "🔧 Fixing NULL Insert Issue..."

# Check if we're in the right directory
if [ ! -f "FIX_NULL_INSERT.sql" ]; then
    echo "❌ FIX_NULL_INSERT.sql not found. Please run this script from the project root."
    exit 1
fi

echo "📋 This script will fix the NULL insert issue in Supabase user creation."
echo "   - Handles NULL user IDs properly"
echo "   - Provides default email if missing"
echo "   - Better error logging"
echo ""

read -p "Do you want to continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled."
    exit 1
fi

echo "🚀 Applying NULL insert fix..."

# Note: User needs to run this in Supabase SQL editor
echo "📝 Please run the following SQL in your Supabase SQL Editor:"
echo ""
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of FIX_NULL_INSERT.sql"
echo "4. Click 'Run'"
echo ""

echo "✅ After running the SQL, test the authentication flow:"
echo "   1. Clear browser storage: localStorage.clear(); sessionStorage.clear();"
echo "   2. Reload the page"
echo "   3. Sign in with Google/Discord"
echo "   4. Check Supabase logs for any errors"
echo ""

echo "🔍 To verify the fix worked:"
echo "   - Check Supabase users table for new user records"
echo "   - Look for 'User created successfully' messages in logs"
echo "   - Verify no NULL auth_user_id records"
echo ""

echo "📞 If issues persist:"
echo "   - Check Supabase logs for detailed error messages"
echo "   - Verify the table structure matches expectations"
echo "   - Test with a fresh browser session"
