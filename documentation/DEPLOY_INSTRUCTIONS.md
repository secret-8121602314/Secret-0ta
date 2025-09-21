#!/bin/bash

echo "🧹 Starting aggressive database cleanup and deployment..."

# Step 1: Run aggressive cleanup
echo "1️⃣ Running aggressive cleanup to remove all duplicate functions..."
echo "Copy and paste the contents of AGGRESSIVE_CLEANUP.sql into Supabase SQL Editor and run it first."

echo ""
echo "2️⃣ After cleanup is complete, run the master schema..."
echo "Copy and paste the contents of MASTER_DATABASE_SCHEMA.sql into Supabase SQL Editor and run it."

echo ""
echo "📋 Manual Steps:"
echo "1. Open Supabase SQL Editor"
echo "2. Copy contents of AGGRESSIVE_CLEANUP.sql"
echo "3. Paste and run the cleanup script"
echo "4. Copy contents of MASTER_DATABASE_SCHEMA.sql"
echo "5. Paste and run the master schema"
echo ""
echo "✅ This will give you a clean database with all functions working properly!"
