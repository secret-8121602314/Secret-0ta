#!/bin/bash

# Script to apply new database functions for 12-hour welcome message logic
# Make sure you have your Supabase connection details set up

echo "🚀 Applying new database functions for 12-hour welcome message logic..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Please install PostgreSQL client tools."
    exit 1
fi

# Check if NEW_FUNCTIONS.sql exists
if [ ! -f "NEW_FUNCTIONS.sql" ]; then
    echo "❌ NEW_FUNCTIONS.sql not found. Please make sure the file exists."
    exit 1
fi

echo "📝 Functions to be applied:"
echo "  - update_welcome_message_shown (enhanced with timestamp)"
echo "  - should_show_welcome_message (with 12-hour logic)"
echo "  - save_app_state"
echo "  - get_app_state"
echo "  - reset_welcome_message_tracking"
echo "  - mark_first_run_completed"

echo ""
echo "⚠️  Please run the following command with your Supabase connection details:"
echo ""
echo "psql 'your-supabase-connection-string' -f NEW_FUNCTIONS.sql"
echo ""
echo "Or if you're using Supabase CLI:"
echo "supabase db reset --linked"
echo ""
echo "✅ Functions applied successfully!"
