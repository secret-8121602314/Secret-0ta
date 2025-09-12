#!/bin/bash

echo "🔧 Applying User Creation Fix..."

# Check if we're in the right directory
if [ ! -f "USER_CREATION_FIX.sql" ]; then
    echo "❌ USER_CREATION_FIX.sql not found. Please run this script from the project root."
    exit 1
fi

echo "📋 This script will fix the user creation issue in Supabase."
echo "   - Users will be created immediately after authentication"
echo "   - Better error handling for trigger failures"
echo "   - Improved RLS policies"
echo ""

read -p "Do you want to continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled."
    exit 1
fi

echo "🚀 Applying user creation fix..."

# Note: User needs to run this in Supabase SQL editor
echo "📝 Please run the following SQL in your Supabase SQL Editor:"
echo ""
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of USER_CREATION_FIX.sql"
echo "4. Click 'Run'"
echo ""

echo "✅ After running the SQL, test the authentication flow:"
echo "   1. Clear browser storage: localStorage.clear(); sessionStorage.clear();"
echo "   2. Reload the page"
echo "   3. Sign in with Google/Discord"
echo "   4. Check if user appears in Supabase users table"
echo ""

echo "🔍 To verify the fix worked:"
echo "   - Check Supabase users table for new user records"
echo "   - Verify email appears in the users table"
echo "   - Test that new users go to initial splash screen"
echo ""

echo "📞 If issues persist:"
echo "   - Check Supabase logs for trigger errors"
echo "   - Verify RLS policies are correct"
echo "   - Test with a fresh browser session"
