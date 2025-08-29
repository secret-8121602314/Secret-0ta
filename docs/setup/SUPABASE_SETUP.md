# 🗄️ **Supabase Database Setup Guide**

This guide will help you set up Supabase to enable persistent storage for the Otaku Diary system.

## 🚀 **Quick Start**

### **1. Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub or create account
4. Click "New Project"
5. Choose organization and enter project details
6. Set database password (save this!)
7. Choose region closest to your users
8. Click "Create new project"

### **2. Get Project Credentials**
1. Go to Project Settings → API
2. Copy your project URL and anon key
3. Update your `.env.local` file:

```bash
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### **3. Run Database Schema**
1. Go to SQL Editor in your Supabase dashboard
2. Copy the contents of `docs/schemas/OTAKON_DIARY_SCHEMA.sql`
3. Paste and run the SQL
4. Verify all tables are created successfully

## 📊 **Database Schema Overview**

### **Core Tables**
- **`user_profiles`** - Extended user information
- **`games`** - User games with progress tracking
- **`diary_tasks`** - User and AI-suggested tasks
- **`diary_favorites`** - Favorited content
- **`game_progress`** - Daily progress tracking

### **Key Features**
- **Row Level Security (RLS)** - Users only see their own data
- **Automatic timestamps** - Created/updated tracking
- **Performance indexes** - Fast queries
- **Helper functions** - Progress summaries and analytics

## 🔐 **Security & Authentication**

### **Row Level Security (RLS)**
All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- No cross-user data leakage
- Secure by default

### **Authentication Flow**
1. User signs up/logs in via Supabase Auth
2. User profile automatically created
3. All subsequent operations scoped to user ID
4. Automatic cleanup on user deletion

## 🚀 **Integration Steps**

### **1. Update Environment Variables**
```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### **2. Verify Supabase Client**
Ensure your `services/supabase.ts` is properly configured:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### **3. Test Connection**
The system will automatically:
- Create user profiles on first login
- Sync data between localStorage and Supabase
- Handle offline/online scenarios gracefully

## 📱 **Mobile Responsiveness Features**

### **Responsive Design**
- **Header**: Stacks vertically on mobile, horizontal on desktop
- **Progress Summary**: Centers on mobile, right-aligned on desktop
- **Tab Navigation**: Horizontal scroll on mobile, fixed on desktop
- **Content**: Proper mobile spacing and touch targets

### **Touch Optimization**
- **Button Sizes**: Minimum 44px touch targets
- **Spacing**: Consistent mobile-first spacing
- **Scrolling**: Smooth horizontal tab scrolling
- **Gestures**: Touch-friendly interactions

## 🔄 **Data Migration**

### **From localStorage to Supabase**
1. **Automatic Migration**: Data migrates on first login
2. **Hybrid Storage**: Uses both local and remote storage
3. **Offline Support**: Works without internet connection
4. **Conflict Resolution**: Smart merging of local/remote data

### **Migration Process**
```typescript
// Automatic migration happens in background
await otakuDiarySupabaseService.migrateFromLocalStorage(localData)
```

## 🧪 **Testing Your Setup**

### **1. Create Test User**
1. Sign up with a new email
2. Verify user profile is created in `user_profiles` table
3. Check RLS policies are working

### **2. Test Otaku Diary**
1. Create a new game pill
2. Add some tasks and favorites
3. Verify data appears in Supabase tables
4. Check data persists across sessions

### **3. Test Mobile Responsiveness**
1. Open app on mobile device
2. Test all diary features
3. Verify proper spacing and touch targets
4. Check horizontal scrolling on tabs

## 🚨 **Troubleshooting**

### **Common Issues**

#### **"Table doesn't exist" Error**
- Run the schema SQL again
- Check table names match exactly
- Verify you're in the correct database

#### **"RLS Policy" Errors**
- Ensure RLS is enabled on all tables
- Check policy names match exactly
- Verify user authentication is working

#### **"Permission denied" Errors**
- Check RLS policies are correct
- Verify user is authenticated
- Check user ID matches in policies

#### **Mobile Layout Issues**
- Clear browser cache
- Check CSS classes are applied
- Verify responsive breakpoints

### **Debug Commands**
```typescript
// Check Supabase connection
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

// Check user authentication
const user = await supabase.auth.getUser()
console.log('Current user:', user)

// Test table access
const { data, error } = await supabase
  .from('diary_tasks')
  .select('*')
  .limit(1)
console.log('Test query result:', { data, error })
```

## 📈 **Performance Optimization**

### **Database Indexes**
- **User queries**: Fast user-specific data retrieval
- **Game queries**: Efficient game data access
- **Task queries**: Quick task filtering and sorting
- **Progress queries**: Fast progress calculations

### **Query Optimization**
- **Batch operations**: Multiple operations in single request
- **Selective fields**: Only fetch needed data
- **Pagination**: Limit large result sets
- **Caching**: Smart client-side caching

## 🔮 **Future Enhancements**

### **Planned Features**
- **Real-time sync**: Live updates across devices
- **Advanced analytics**: Progress insights and trends
- **Social features**: Share progress with friends
- **Backup/restore**: Data export and import

### **Scalability**
- **Database partitioning**: Handle millions of users
- **CDN integration**: Global content delivery
- **Advanced caching**: Redis integration
- **Monitoring**: Performance and error tracking

## 📚 **Additional Resources**

### **Documentation**
- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

### **Support**
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
- [Community Forum](https://github.com/supabase/supabase/discussions)

---

## ✅ **Setup Checklist**

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Database schema executed
- [ ] RLS policies verified
- [ ] Test user created
- [ ] Otaku Diary functionality tested
- [ ] Mobile responsiveness verified
- [ ] Data persistence confirmed

**Your Otaku Diary system is now ready for production use! 🎉**
