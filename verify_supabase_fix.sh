#!/bin/bash

# SUPABASE FIX VERIFICATION SCRIPT
# This script helps you verify that the Supabase fix worked

echo "🧪 Supabase Fix Verification"
echo "============================"
echo ""

echo "📋 What to check:"
echo "  1. ✅ Auto-user creation trigger created"
echo "  2. ✅ User record exists for current user"
echo "  3. ✅ RLS policies are working"
echo "  4. ✅ No more 406 errors"
echo ""

echo "🔍 Verification Steps:"
echo ""
echo "Step 1 - Run Verification SQL:"
echo "  Go to Supabase Dashboard → SQL Editor"
echo "  Copy and paste the contents of VERIFY_SUPABASE_FIX.sql"
echo "  Click 'Run' to check the results"
echo ""

echo "Step 2 - Test the App:"
echo "  1. Open your app: http://localhost:5173"
echo "  2. Open browser console (F12)"
echo "  3. Look for these logs:"
echo "     ✅ 'User authenticated, checking onboarding status...'"
echo "     ✅ 'Showing landing page for authenticated user'"
echo "     ❌ No more 'Failed to load user data' errors"
echo ""

echo "Step 3 - Test Landing Page:"
echo "  # In browser console, run:"
echo "  localStorage.removeItem('otakonSkippedLanding');"
echo "  location.reload();"
echo "  # Should show landing page"
echo ""

echo "Step 4 - Test Authentication:"
echo "  # Click 'Get Started' on landing page"
echo "  # Should go to app without errors"
echo ""

echo "🔧 If you still see 406 errors:"
echo "  1. Check if user record was created:"
echo "     SELECT * FROM public.users WHERE auth_user_id = '996d53ca-3a2c-40d4-9a9d-23f224bd4c30';"
echo ""
echo "  2. Check RLS policies:"
echo "     SELECT policyname FROM pg_policies WHERE tablename = 'users';"
echo ""
echo "  3. Verify trigger exists:"
echo "     SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';"
echo ""

echo "✅ Expected Results:"
echo "  - User record exists in database"
echo "  - RLS policies allow access"
echo "  - Auto-user creation trigger is active"
echo "  - No 406 errors in console"
echo "  - Landing page shows properly"
echo ""

echo "🚀 Next Steps (if everything works):"
echo "  1. Configure redirect URLs in Supabase Dashboard"
echo "  2. Set up OAuth providers (Google/Discord)"
echo "  3. Test OAuth sign-in flow"
echo ""

echo "📞 Need Help?"
echo "  - Check Supabase dashboard logs"
echo "  - Verify environment variables"
echo "  - Test with browser console commands"
echo ""

echo "🎯 Ready to verify! Run the verification steps above."
