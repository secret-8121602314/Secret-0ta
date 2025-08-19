# 🗄️ Otakon Database Schemas

This folder contains all database schemas for the Otakon application, organized by purpose and version.

## 📁 **Folder Structure**

### **🚀 Production** (`/production/`)
**Current production-ready schemas for deployment.**

- **OTAKON_V19_ULTIMATE_MASTER_SCHEMA.sql** - **USE THIS FOR PRODUCTION**
  - 27 tables with full v19 features
  - Row Level Security (RLS) enabled
  - Performance optimized indexes
  - Production ready, no migration issues
  - **Recommended for new deployments**

- **README_V19_ULTIMATE_MASTER.md** - Complete production schema documentation

### **🔄 Migrations** (`/migrations/`)
**Safe migration scripts for existing databases.**

- **OTAKON_V19_MIGRATION_SCRIPT_FIXED.sql** - **SAFE MIGRATION SCRIPT**
  - Adds v19 tables to existing database
  - Uses `IF NOT EXISTS` checks
  - No data loss, safe for production
  - **Use for upgrading existing databases**

- **OTAKON_V19_MIGRATION_SCRIPT.sql** - Original migration script
- **INDEX_RECREATION_PRODUCTION.sql** - Production index optimization

### **📚 Legacy** (`/legacy/`)
**Previous schema versions for reference only.**

- **OTAKON_V19_ENHANCED_SCHEMA.sql** - Previous enhanced schema
- **ULTIMATE-MASTER-CLEAN-SLATE.sql** - Legacy clean slate
- **otakon-complete-schema.sql** - Legacy complete schema

## 🚀 **Quick Start**

### **New Deployment (Recommended):**
```bash
# Use production schema
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f docs/schemas/production/OTAKON_V19_ULTIMATE_MASTER_SCHEMA.sql
```

### **Existing Database Migration:**
```bash
# Safe migration
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f docs/schemas/migrations/OTAKON_V19_MIGRATION_SCRIPT_FIXED.sql
```

### **Production Index Optimization:**
```bash
# Optimize indexes (run during maintenance window)
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f docs/schemas/migrations/INDEX_RECREATION_PRODUCTION.sql
```

## 📊 **Schema Features**

### **v19 Tables (27 total):**
- **User Management**: `user_profiles`, `player_profiles`, `user_preferences`
- **Game Context**: `game_contexts`, `build_snapshots`, `session_summaries`
- **AI Features**: `enhanced_insights`, `proactive_insights`, `proactive_triggers`
- **Conversation**: `conversation_contexts`
- **Cost Tracking**: `api_cost_tracking`
- **Core Tables**: `conversations`, `messages`, `insights`, `usage`, etc.

### **Security Features:**
- **Row Level Security (RLS)** - User data isolation
- **Admin Access Control** - Secure admin operations
- **Encrypted Storage** - Sensitive data protection

### **Performance Features:**
- **Strategic Indexing** - Optimized query performance
- **Efficient Triggers** - Automated data management
- **Clean Architecture** - No unused tables or indexes

## ⚠️ **Important Notes**

1. **Production Schema**: Always use `/production/` for new deployments
2. **Migration Script**: Use `/migrations/` for existing database upgrades
3. **Backup First**: Always backup before schema changes
4. **Test Environment**: Test migrations in development first
5. **Maintenance Window**: Use production scripts during low-traffic periods

## 🔍 **Verification**

After deployment, verify:
- **Table Count**: Should be exactly 27 tables
- **RLS Policies**: User isolation working correctly
- **Indexes**: Performance queries running fast
- **Triggers**: Automated functions working properly

---

**Use the right schema for your deployment scenario! 🎮**



