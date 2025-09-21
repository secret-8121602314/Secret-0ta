# 💥 NUCLEAR DEPLOYMENT GUIDE

## ⚠️ WARNING: This will delete ALL data in your Supabase database!

## 🚀 Step-by-Step Deployment:

### Step 1: Nuclear Cleanup
1. Open **Supabase SQL Editor**
2. Copy the **entire contents** of `NUCLEAR_CLEANUP.sql`
3. Paste and **run the script**
4. This will drop ALL tables, functions, triggers, and data

### Step 2: Recreate Everything
1. After cleanup is complete
2. Copy the **entire contents** of `MASTER_DATABASE_SCHEMA.sql`
3. Paste and **run the script**
4. This will recreate everything cleanly

## ✅ What This Does:

### Nuclear Cleanup:
- Drops ALL functions (every possible signature)
- Drops ALL triggers
- Drops ALL tables (users, conversations, insights, etc.)
- Verifies everything is clean

### Master Schema Recreation:
- Creates all tables with proper structure
- Creates all functions with correct signatures
- Creates all triggers
- Grants all permissions
- Sets up proper user ID mapping

## 🎯 Result:
- Clean database with no conflicts
- All functions working properly
- All features available (conversations, insights, splash screens, etc.)
- Proper error handling and security

## 📋 Functions Created:
- ✅ Conversation persistence
- ✅ Insights and subtabs
- ✅ Splash screen progression
- ✅ Welcome message management
- ✅ User preferences and app state
- ✅ Daily engagement tracking
- ✅ App cache management
- ✅ Otaku diary system
- ✅ Logout support
- ✅ Profile setup completion

## 🚨 Important Notes:
- **This will delete ALL existing data**
- Make sure you have backups if needed
- Run this in a test environment first if possible
- After deployment, test all features thoroughly

## 🎉 After Deployment:
Your database will be completely clean and all conversation persistence issues will be resolved!
