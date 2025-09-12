#!/bin/bash

# SUPABASE QUICK FIX DEPLOYMENT SCRIPT
# This script helps you deploy the database fixes to Supabase

echo "🔧 Supabase Quick Fix Deployment Script"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "QUICK_SUPABASE_FIX.sql" ]; then
    echo "❌ Error: QUICK_SUPABASE_FIX.sql not found"
    echo "   Please run this script from the project root directory"
    exit 1
fi

echo "📋 What this script will fix:"
echo "  ✅ Create user record for current authenticated user"
echo "  ✅ Fix RLS policies causing 406 errors"
echo "  ✅ Create auto-user creation trigger"
echo "  ✅ Enable proper database access"
echo ""

echo "🚀 Deployment Options:"
echo ""
echo "Option 1 - Using Supabase Dashboard (RECOMMENDED):"
echo "  1. Go to your Supabase project dashboard"
echo "  2. Navigate to SQL Editor"
echo "  3. Copy and paste the contents of QUICK_SUPABASE_FIX.sql"
echo "  4. Click 'Run' to execute the script"
echo ""

echo "Option 2 - Using Supabase CLI (if installed):"
echo "  supabase db reset --linked"
echo "  supabase db push"
echo ""

echo "Option 3 - Manual SQL Execution:"
echo "  Copy the SQL from QUICK_SUPABASE_FIX.sql and run it manually"
echo ""

echo "📝 Next Steps After Database Fix:"
echo "  1. Configure redirect URLs in Supabase Dashboard:"
echo "     - Site URL: http://localhost:5173"
echo "     - Additional URLs: http://localhost:5173/**"
echo ""
echo "  2. Set up OAuth providers (Google/Discord) in Supabase Dashboard"
echo ""
echo "  3. Test the authentication flow:"
echo "     - Refresh your app"
echo "     - Check browser console for errors"
echo "     - Test OAuth sign-in"
echo ""

echo "🔍 Verification Commands:"
echo "  # Check if user record exists"
echo "  SELECT * FROM public.users WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';"
echo ""
echo "  # Check RLS policies"
echo "  SELECT policyname FROM pg_policies WHERE tablename = 'users';"
echo ""

echo "🧪 Testing Commands (in browser console):"
echo "  localStorage.removeItem('otakonSkippedLanding'); location.reload();"
echo "  window.showLandingPage();"
echo ""

echo "📞 If you encounter issues:"
echo "  - Check Supabase dashboard logs"
echo "  - Verify environment variables"
echo "  - Test with browser console commands"
echo "  - Check network tab for API errors"
echo ""

echo "✅ Ready to deploy! Choose your preferred option above."
