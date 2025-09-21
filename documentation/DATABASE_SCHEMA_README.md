# 🗄️ Database Schema - Single Source of Truth

## 📋 Overview

This project now uses **`SINGLE_MASTER_SQL.sql`** as the single source of truth for all Supabase database operations. All other SQL files have been removed to eliminate confusion and maintain consistency.

## 🎯 What's Included

The `SINGLE_MASTER_SQL.sql` file contains:

### ✅ **Complete Database Schema**
- **23 Tables** - All tables your app actually uses
- **35+ Functions** - All RPC functions with proper security
- **RLS Policies** - Row-level security for all tables
- **Triggers** - Automatic timestamp updates
- **Permissions** - Proper grants for authenticated users

### ✅ **Security Compliant**
- All functions have `SET search_path = ''` for security
- Passes all Supabase linter checks
- Follows enterprise security best practices

### ✅ **App Coverage**
- **Core functionality** (users, conversations, games, etc.)
- **Analytics services** (gameAnalyticsService.ts, analyticsService.ts)
- **Diary services** (otakuDiaryService.ts)
- **API cost tracking** (apiCostService.ts)
- **All RPC functions** your app calls

## 🚀 Usage

### **For Development:**
1. Run `SINGLE_MASTER_SQL.sql` in your Supabase SQL Editor
2. All tables, functions, and policies will be created
3. Your app will work with 100% functionality

### **For Production:**
1. Run `SINGLE_MASTER_SQL.sql` in your production Supabase instance
2. All security policies and RLS will be properly configured
3. Ready for enterprise use

## 📊 Tables Included

**Core Tables:**
- `users` - User data and authentication
- `conversations` - Chat history
- `games` - Game data
- `tasks` - Task management
- `insights` - AI insights
- `waitlist` - User registration

**Analytics Tables:**
- `game_activities` - Game activity tracking
- `insight_tabs` - Insight tab data
- `insight_modifications` - Insight modifications
- `user_feedback` - User feedback
- `api_calls` - API call tracking
- `user_queries` - User query tracking
- `diary_tasks` - Diary tasks
- `onboarding_funnel` - Onboarding analytics
- `tier_upgrade_attempts` - Tier upgrade tracking
- `feature_usage` - Feature usage analytics

**System Tables:**
- `analytics` - User analytics
- `analytics_events` - Event tracking
- `admin` - Admin management
- `app_level` - App configuration
- `cache` - Caching system
- `app_cache` - Application cache
- `daily_engagement` - Daily engagement tracking

## 🔧 Functions Included

**Core Functions:**
- `save_conversation` / `load_conversations`
- `save_wishlist` / `load_wishlist`
- `save_app_state` / `get_app_state`
- `get_complete_user_data`
- `update_user_app_state`
- `get_user_preferences` / `update_user_preferences`

**Analytics Functions:**
- `get_knowledge_match_score`
- `get_game_knowledge_summary`
- `get_player_progress_summary`
- `get_user_game_summary`
- `get_global_api_usage_stats`
- `get_tier_usage_comparison`
- `get_user_insights_summary`

**Utility Functions:**
- `get_daily_engagement` / `update_daily_engagement`
- `get_app_cache` / `set_app_cache`
- `clear_expired_app_cache`
- `sync_all_user_data`

## ⚠️ Important Notes

- **This is the ONLY SQL file** you need for database setup
- **All other SQL files have been removed** to prevent confusion
- **Always use this file** for database migrations
- **Security compliant** - passes all Supabase linter checks
- **Production ready** - includes proper RLS policies

## 🎉 Benefits

✅ **Single source of truth** - No more confusion about which SQL file to use  
✅ **Complete coverage** - All app functionality supported  
✅ **Security compliant** - Passes all linter checks  
✅ **Production ready** - Enterprise-grade security  
✅ **Easy maintenance** - One file to rule them all  

---

**Last Updated:** January 2025  
**Status:** ✅ Complete and Production Ready
