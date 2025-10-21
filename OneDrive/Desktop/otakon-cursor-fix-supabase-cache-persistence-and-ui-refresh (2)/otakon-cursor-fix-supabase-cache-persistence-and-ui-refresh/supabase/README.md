# Otagon Database Schema

This directory contains the complete database schema for the Otagon application.

## 📁 Files

### `MASTER_SCHEMA_COMPLETE.sql`
**The single source of truth for the database schema.**

This file contains:
- All table definitions (users, games, conversations, etc.)
- All functions (authentication, user management, etc.)
- All triggers (automatic user creation, timestamp updates)
- All Row Level Security (RLS) policies
- All permissions and grants
- Complete indexes for performance

### `TEST_COMPLETE.sql`
**Comprehensive test script to verify the schema.**

This file tests:
- All functions exist and work correctly
- All tables exist with proper structure
- All triggers are active
- All RLS policies are in place
- All indexes are created
- Authentication flow is ready

## 🚀 Quick Start

1. **Run the master schema:**
   ```sql
   -- In Supabase SQL Editor, run:
   -- MASTER_SCHEMA_COMPLETE.sql
   ```

2. **Verify everything works:**
   ```sql
   -- In Supabase SQL Editor, run:
   -- TEST_COMPLETE.sql
   ```

3. **Test authentication in your app:**
   - Try Google OAuth
   - Try Discord OAuth  
   - Try Email signup/login
   - Verify users appear in both `auth.users` and `public.users`
   - Verify redirect to initial splash screen works

## 🔧 What's Fixed

### Authentication Issues Resolved:
- ✅ OAuth users now create records in `public.users` table
- ✅ Database trigger automatically creates user records
- ✅ `get_complete_user_data` function works correctly
- ✅ All authentication methods (Google, Discord, Email) work
- ✅ Proper redirect to initial splash screen after auth
- ✅ Fallback mechanism if database trigger fails

### Schema Improvements:
- ✅ Complete table structure with all necessary fields
- ✅ Proper foreign key relationships
- ✅ Comprehensive indexing for performance
- ✅ Row Level Security (RLS) for data protection
- ✅ Automatic timestamp updates via triggers
- ✅ JSONB fields for flexible data storage

## 📊 Database Structure

### Core Tables:
- **`users`** - Main user data with onboarding tracking
- **`onboarding_progress`** - Track user onboarding steps
- **`games`** - User's game library
- **`conversations`** - Chat conversations
- **`api_usage`** - API usage tracking
- **`user_analytics`** - User behavior analytics
- **`user_sessions`** - User session management
- **`waitlist`** - Email waitlist

### Key Functions:
- **`get_complete_user_data`** - Load complete user data for auth
- **`create_user_record`** - Create user record manually
- **`handle_new_user`** - Trigger function for automatic user creation
- **`update_user_app_state`** - Update user application state
- **`update_user_onboarding_status`** - Track onboarding progress

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Proper authentication checks in all functions
- Secure trigger functions with proper permissions

## 🎯 Next Steps

After running the master schema:

1. **Test authentication** - Try all auth methods
2. **Verify user creation** - Check both auth and public tables
3. **Test onboarding flow** - Ensure splash screens work
4. **Monitor logs** - Check for any errors in console
5. **Performance test** - Ensure queries are fast

## 🆘 Troubleshooting

If you encounter issues:

1. **Run the test script** - `TEST_COMPLETE.sql` will show what's missing
2. **Check console logs** - Look for authentication errors
3. **Verify functions** - Ensure all functions exist in Supabase
4. **Check RLS policies** - Make sure policies are active
5. **Test with fresh user** - Try with a new email address

## 📝 Notes

- This schema is designed to be the single source of truth
- All previous schema files have been consolidated
- The schema includes all recent authentication fixes
- It's designed to be run from scratch (drops everything first)
- All functions include proper error handling and logging