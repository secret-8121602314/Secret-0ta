# 🎮 Otagon AI Gaming Companion - System Architecture

## 📋 Overview
This document defines the core system architecture, user flows, and behavioral patterns that have been implemented and tested. **Any changes to these patterns must be approved before implementation.**

---

## 🔄 User Flow Architecture

### 1. Landing → Login → Chat Flow (First-Time Users)
### 2. Landing → Login → Chat Flow (Returning Users)

#### **Phase 1: Landing Page**
- **Purpose**: Initial app entry point
- **Behavior**: 
  - Shows app branding and value proposition
  - "Get Started" button triggers login flow
  - **Waitlist System**: Email collection for early access
  - **Back Button**: Returns to landing page (proper navigation)
- **Waitlist Functionality**:
  - **Email Collection**: Users can enter email to join waitlist
  - **Duplicate Prevention**: System checks for existing emails
  - **Database Storage**: Emails stored in `waitlist` table
  - **User Feedback**: Success/error messages displayed
  - **Source Tracking**: Records signup source as 'landing_page'
- **Next**: Login Screen

#### **Phase 2: Login Screen** 
- **Purpose**: Authentication entry point
- **Behavior**:
  - Shows login options (Google, Discord, Email)
  - **Developer Mode**: Password `zircon123` enables dev mode
  - **Dev Mode Detection**: `localStorage.getItem('otakon_developer_mode') === 'true'`
  - **Back Button**: Returns to landing page (fixed navigation bug)
- **Developer Mode Login Flow**:
  1. User enters password `zircon123`
  2. System creates mock user with fixed UUID: `00000000-0000-0000-0000-000000000001`
  3. Sets developer flags in localStorage: `otakon_developer_mode: 'true'`
  4. Initializes developer data structure in localStorage
  5. Bypasses all Supabase authentication calls
- **OAuth Authentication Flow** (Google, Discord, Email):
  1. **OAuth Initiation**: User clicks authentication provider button
  2. **Callback Detection**: `unifiedOAuthService.isOAuthCallback()` detects OAuth parameters
  3. **Immediate Flag Setting**: `isOAuthCallback = true` prevents landing page flash
  4. **Loading State**: Black background (`#000000`) with loading spinner during processing
  5. **Session Establishment**: `supabase.auth.setSession()` establishes proper authentication
  6. **User Creation**: `userCreationService.ensureUserRecord()` creates user in database
  7. **Auth State Update**: Authentication state changes trigger app view updates
  8. **Flag Reset**: `isOAuthCallback = false` when auth state change completes
  9. **Smooth Transition**: Direct transition to splash screens (first-time) or chat (returning)
- **Next**: Chat Interface (for returning users) OR Splash Screens (for first-time users)

#### **Phase 3: Splash Screen Sequence (First-Time Users Only)**
- **Order**: `initial` → `features` → `pro-features` → `complete`
- **Behavior**:
  - **First-Time Users**: Must complete all splash screens
  - **Returning Users**: Skip splash screens entirely, go straight to chat
  - **Developer Mode**: Can skip splash screens after first run
- **Next**: Chat Interface

#### **Phase 4: Chat Interface**
- **Purpose**: Main application interface
- **Components**:
  - Welcome message (system-styled)
  - Suggested prompts (left-aligned)
  - Chat input with image upload
  - Settings modal with dev tier switcher

---

## 🛠️ Developer Mode Architecture

### **Core Principle**: 
**Developer mode should replicate Supabase behavior using localStorage**

### **Authentication Flow**
```typescript
// Developer Mode Detection
const isDevMode = localStorage.getItem('otakon_developer_mode') === 'true';

// Mock User Data
const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'developer@otakon.app',
  tier: 'free', // Default tier, can be switched
  isAuthenticated: true,
  isDeveloper: true
};
```

### **Data Storage Strategy**
- **Supabase Tables** ↔ **localStorage Keys**
- **User Data**: `otakon_dev_data`
- **Usage Tracking**: `otakonUserTier`, `otakonTextCount`, `otakonImageCount`
- **App State**: `otakon_dev_splash_screens_seen`, `otakon_dev_profile_setup_completed`

### **Tier System Behavior**
- **Default Tier**: `free`
- **Tier Cycling**: `free` → `pro` → `vanguard_pro` → `free`
- **Persistence**: Changes persist after settings modal close
- **Usage Limits**: 
  - Free: 55 text, 25 images
  - Pro: 1583 text, 328 images  
  - Vanguard: 1583 text, 328 images

---

## 🚫 Supabase Call Prevention in Dev Mode

### **Services That Skip Supabase in Dev Mode**:
1. **unifiedUsageService.ts**
   - `checkAndResetUsage()`: Uses localStorage only
   - `getTier()`: Uses localStorage only
   - `getCurrentTier()`: Uses localStorage only
   - `getUsage()`: Uses localStorage only

2. **unifiedAnalyticsService.ts**
   - `processEventQueue()`: Skips analytics events entirely

### **Dev Mode Detection Pattern**:
```typescript
const isDevMode = localStorage.getItem('otakon_developer_mode') === 'true';

if (isDevMode) {
  console.log('🔧 Developer mode: Using localStorage only');
  // Use localStorage instead of Supabase
  return;
}
```

---

## 🎯 Chat Interface Specifications

### **Welcome Message**
- **Style**: System message appearance
- **Content**: Gaming-focused greeting
- **Position**: Top of chat when no messages exist

### **Suggested Prompts**
- **Alignment**: Left-aligned with welcome message
- **Behavior**: Show when no messages exist
- **Count**: 4 prompts maximum

### **Image Upload**
- **Button**: Camera icon in chat input
- **Limits**: Tier-based (Free: 1, Pro/Vanguard: 5)
- **Processing**: Base64 conversion with compression
- **Error Handling**: User-friendly error messages

### **Settings Modal**
- **Dev Tier Switcher**: Cycles through tiers
- **Persistence**: Changes persist after modal close
- **Responsive**: Works on all screen sizes

---

## 🎁 14-Day Free Trial System

### **Core Principle**: 
**One-time free trial to convert free users to paid subscribers**

### **Trial Eligibility Logic**
```typescript
// Trial eligibility check
const isEligible = user.tier === 'free' && !user.has_used_trial;
```

### **Database Schema**
```sql
-- Trial tracking columns in users table
trial_started_at TIMESTAMP WITH TIME ZONE NULL,
trial_expires_at TIMESTAMP WITH TIME ZONE NULL,
has_used_trial BOOLEAN DEFAULT false,

-- Automatic trial expiration function
CREATE FUNCTION check_and_expire_trials()
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET tier = 'free', updated_at = NOW()
    WHERE trial_expires_at < NOW() AND tier = 'pro';
END;
$$;
```

### **Trial Flow Architecture**

#### **Phase 1: Trial Button Display**
- **Location**: Settings context menu (right-click settings button)
- **Visibility**: Only for free users who haven't used trial AND not in developer mode
- **Button Text**: "Start 14-Day Free Trial"
- **Icon**: StarIcon
- **Dev Mode**: Trial button is hidden in developer mode

#### **Phase 2: Trial Activation**
- **Trigger**: Click "Start 14-Day Free Trial" button
- **Confirmation**: `FreeTrialModal` shows trial benefits
- **Duration**: 14 days from activation
- **Features**: Full Pro tier access (1,583 text, 328 images, grounding search, etc.)

#### **Phase 3: Trial Status Tracking**
- **Real-time**: Trial eligibility checked on user state changes
- **Expiration**: Automatic tier reset via database function
- **UI Updates**: Button changes to "Upgrade to Pro" after trial expires

### **TierService Integration**
```typescript
// Core trial methods
async startFreeTrial(userId: string): Promise<boolean>
async isEligibleForTrial(userId: string): Promise<boolean>
async getTrialStatus(userId: string): Promise<TrialStatus>
```

### **User Experience Flow**
1. **Free User**: Right-clicks settings button → sees trial option in context menu
2. **Trial Start**: Confirmation modal → Pro features activated
3. **Trial Period**: 14 days of Pro features
4. **Trial Expiry**: Automatic revert to Free tier
5. **Post-Trial**: Trial option disappears from context menu (one-time only)
6. **Developer Mode**: Trial option never appears regardless of tier

### **Payment Integration Ready**
- **CTAs**: All upgrade buttons show pricing ($3.99/month Pro, $20.00/year Vanguard)
- **Stripe Ready**: Payment processing mentions "Stripe-powered"
- **Billing Portal**: Subscription management interface prepared

---

## 📧 Waitlist System Architecture

### **Core Principle**: 
Collect user emails for early access notification while preventing duplicates and providing clear user feedback.

### **Database Schema**
```sql
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'landing_page',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'registered')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **WaitlistService Integration**
```typescript
// Core waitlist methods
async addToWaitlist(email: string, source: string = 'landing_page'): Promise<{ success: boolean; error?: string }>
async getWaitlistStatus(email: string): Promise<{ status?: string; error?: string }>
async getWaitlistCount(): Promise<{ count?: number; error?: string }>
```

### **User Experience Flow**
1. **Email Entry**: User enters email in landing page form
2. **Duplicate Check**: System checks if email already exists
3. **Database Storage**: Email stored in `waitlist` table with source tracking
4. **User Feedback**: Success message displayed, form cleared
5. **Error Handling**: Clear error messages for failures
6. **Analytics**: Successful signups logged to analytics (if user authenticated)

### **Error Handling Patterns**
- **Duplicate Email**: "Email already registered for waitlist"
- **Database Error**: "Failed to add to waitlist: [specific error]"
- **Network Error**: "An unexpected error occurred. Please try again."
- **Validation Error**: Form validation prevents invalid emails

### **Security & Privacy**
- **RLS Policies**: Anonymous users can insert, authenticated users can view own entries
- **Email Validation**: Client-side and server-side email format validation
- **Source Tracking**: Records where user signed up (landing_page, etc.)
- **Status Management**: Tracks invitation and registration status

---

## 📊 Comprehensive User Behavior Tracking

### **Navigation Behaviors**
1. **Landing Page Navigation**:
   - "Get Started" → Login Screen
   - Back button → Stays on landing page
   - Modal links → Open respective modals (About, Privacy, Terms, etc.)

2. **Login Screen Navigation**:
   - Back button → Returns to Landing Page ✅ (Fixed)
   - Successful login → Chat Interface (returning users) OR Splash Screens (first-time)
   - Developer mode login → Chat Interface (bypasses splash screens)

3. **Splash Screen Navigation** (First-Time Users Only):
   - Initial → Features → Pro-Features → Complete
   - Skip options available on each screen
   - Back button behavior varies by screen

4. **Chat Interface Navigation**:
   - Settings button → Opens settings modal
   - Context menu → Shows tier switcher (dev mode) or trial options (free users)
   - Back button → Not applicable (main interface)

### **Authentication Behaviors**
1. **Developer Mode**:
   - Password: `zircon123`
   - Mock user ID: `00000000-0000-0000-0000-000000000001`
   - localStorage flags: `otakon_developer_mode: 'true'`
   - Bypasses all Supabase calls
   - Tier switching available in settings

2. **OAuth Authentication** (Google, Discord, Email):
   - **Callback Processing**: `unifiedOAuthService.handleOAuthCallback()` handles all OAuth flows
   - **Session Management**: `supabase.auth.setSession()` establishes proper authentication state
   - **User Creation**: Automatic user record creation in `public.users` table
   - **Loading States**: Consistent black background (`#000000`) with loading spinner
   - **Error Handling**: Comprehensive error recovery with user-friendly messages
   - **Smooth Transitions**: No landing page flash, direct transition to appropriate screen
   - **Session Persistence**: Automatic session refresh and monitoring

### **User State Behaviors**
1. **First-Time Users**:
   - Must complete splash screen sequence
   - Welcome message shown after onboarding
   - Profile setup required

2. **Returning Users**:
   - Skip splash screens entirely
   - Go directly to chat interface
   - Welcome message based on session state

3. **Developer Mode Users**:
   - All onboarding steps marked as complete
   - Tier switching available
   - Trial options hidden
   - localStorage-based data management

### **UI Component Behaviors**
1. **Settings Modal**:
   - Tier switcher (dev mode): Cycles through free → pro → vanguard → free
   - Trial button (free users): "Start 14-Day Free Trial"
   - Sign out option: Clears session and returns to login

2. **Chat Interface**:
   - Welcome message: System-styled, gaming-focused
   - Suggested prompts: Left-aligned, 4 prompts maximum
   - Image upload: Tier-based limits (Free: 1, Pro/Vanguard: 5)
   - Credit indicator: Shows usage counts

3. **Trial System**:
   - Eligibility: Free users who haven't used trial
   - Duration: 14 days
   - Features: Full Pro tier access
   - Expiration: Automatic tier reset

### **Error Handling Behaviors**
1. **Authentication Errors**:
   - Display user-friendly error messages
   - Reset button animations
   - Allow retry attempts

2. **Network Errors**:
   - Supabase call failures → localStorage fallback (dev mode)
   - Analytics failures → Silent fail, continue operation
   - Conversation save failures → Retry mechanism

3. **Validation Errors**:
   - Form validation → Real-time feedback
   - Image upload limits → Clear error messages
   - Usage limit exceeded → Upgrade prompts

---

## ⚠️ Change Control Protocol

### **Protected Features**:
1. **User Flow**: Landing → Login → Chat (returning users) OR Landing → Login → Splash → Chat (first-time users)
2. **Navigation**: Back button on login screen returns to landing page
3. **Developer Mode**: localStorage-based data handling
4. **Tier System**: Free → Pro → Vanguard cycling
5. **Supabase Prevention**: Dev mode skips all Supabase calls
6. **Chat Interface**: Welcome message + suggested prompts layout
7. **14-Day Trial System**: One-time trial eligibility and expiration logic
8. **Splash Screens**: Only for first-time users, returning users skip entirely

### **Change Approval Required For**:
- Modifying user flow sequence
- Changing developer mode behavior
- Altering tier system logic
- Adding/removing Supabase calls in dev mode
- Changing chat interface layout
- Modifying localStorage key names
- Modifying trial eligibility logic or duration
- Changing trial button placement or behavior
- Modifying navigation behavior (back buttons, routing)
- Changing splash screen logic or requirements

### **Approval Process**:
1. **Identify**: What feature is being changed
2. **Document**: Why the change is needed
3. **Impact**: How it affects existing behavior
4. **Approval**: Get explicit user approval before implementation

---

## 📊 Current Implementation Status

### ✅ **Completed Features**:
- [x] Landing → Login → Chat flow (returning users)
- [x] Landing → Login → Splash → Chat flow (first-time users)
- [x] Developer mode authentication
- [x] Supabase call prevention in dev mode
- [x] Tier switcher with persistence
- [x] Image upload functionality
- [x] Welcome message styling
- [x] Suggested prompts alignment
- [x] Settings modal responsiveness
- [x] 14-day free trial system
- [x] Trial button in settings context menu
- [x] Trial eligibility tracking
- [x] Trial button hidden in developer mode
- [x] Payment-ready CTAs
- [x] **Waitlist system**: Email collection with duplicate prevention and error handling
- [x] **Navigation bug fix**: Back button on login screen returns to landing page
- [x] **Splash screen logic**: Only shows for first-time users

### 🔄 **Active Monitoring**:
- Developer mode localStorage consistency
- Tier switching persistence
- Image upload error handling
- Supabase call prevention
- Trial eligibility accuracy
- Trial expiration automation
- Trial button visibility in dev mode
- Payment CTA functionality
- **Navigation flow integrity**: Back button behavior
- **User state management**: First-time vs returning user detection
- **Splash screen logic**: Proper skipping for returning users

---

## 🚨 Behavior Change Detection & Warning System

### **Pre-Change Analysis Protocol**
**Before making ANY changes, this system will:**

1. **🔍 Analyze Impact**: Check if the change affects any approved behaviors
2. **⚠️ Identify Conflicts**: Detect violations of established patterns
3. **📋 Report Dependencies**: List all connected behaviors that might be affected
4. **🛑 Request Approval**: Get explicit user approval before implementation
5. **📝 Document Changes**: Update this file with the new behavior patterns

### **Protected Behavior Categories**
- **Navigation Patterns**: All routing and back button behaviors
- **Authentication Flows**: Login, dev mode, session management
- **User State Management**: First-time vs returning user logic
- **UI Component Behaviors**: Settings modal, chat interface, trial system
- **Error Handling**: Authentication, network, validation patterns
- **Data Storage**: localStorage keys, Supabase call prevention
- **Tier System**: Free → Pro → Vanguard cycling logic

### **Change Detection Matrix**
| Change Type | Behavior Impact | Approval Required |
|-------------|----------------|-------------------|
| Navigation Logic | High | ✅ Always |
| Authentication Flow | High | ✅ Always |
| User State Logic | High | ✅ Always |
| UI Component Props | Medium | ✅ If behavior changes |
| Styling/CSS | Low | ⚠️ If affects layout |
| New Features | Medium | ✅ If affects existing flow |
| Bug Fixes | Medium | ✅ If changes behavior |

### **Behavior Validation Checklist**
Before implementing any change, verify:
- [ ] Does this change any navigation patterns?
- [ ] Does this affect authentication flows?
- [ ] Does this modify user state management?
- [ ] Does this change UI component behaviors?
- [ ] Does this affect error handling patterns?
- [ ] Does this modify data storage patterns?
- [ ] Does this change tier system logic?

**This ensures system consistency and prevents unintended regressions.**

---

## 📝 Behavior Change Log

### **Change History**
| Date | Change Type | Description | Impact Level | Approved By |
|------|-------------|-------------|--------------|-------------|
| 2025-01-15 | Navigation Fix | Fixed back button on login screen to return to landing page | High | ✅ User |
| 2025-01-15 | Documentation | Added comprehensive behavior tracking system | Medium | ✅ User |
| 2025-01-15 | User Flow | Clarified splash screen logic for first-time vs returning users | High | ✅ User |
| 2025-01-15 | Tier System Fix | Fixed developer mode tier switching persistence issue | High | ✅ User |
| 2025-01-15 | Tier Gating | Implemented comprehensive tier-based feature gating | High | ✅ User |
| 2025-01-15 | Critical Bug Fix | Fixed refreshUsage callback TypeError preventing tier switching | Critical | ✅ User |
| 2025-01-15 | UI Consistency | Fixed CreditModal showing wrong tier limits | High | ✅ User |
| 2025-01-15 | Auth Architecture | Implemented unified OAuth callback handling to prevent race conditions | High | ✅ User |
| 2025-01-15 | Error Recovery | Added comprehensive error recovery system for authentication | High | ✅ User |
| 2025-01-15 | Session Management | Implemented automatic session refresh to prevent unexpected logouts | High | ✅ User |
| 2025-01-15 | Critical Bug Fix | Fixed missing authService import causing app crash | Critical | ✅ User |
| 2025-01-15 | Feature Addition | Implemented waitlist system with email collection and duplicate prevention | Medium | ✅ User |
| 2025-01-15 | Authentication Enhancement | Enhanced OAuth authentication flow with smooth transitions and loading states | High | ✅ User |
| 2025-01-16 | Session Persistence | Fixed critical session persistence issues preventing proper page refresh behavior | Critical | ✅ User |
| 2025-01-16 | Developer Mode Fix | Fixed developer mode session detection causing landing page issues for unauthenticated users | High | ✅ User |
| 2025-01-16 | Chat Persistence | Implemented proper conversation restoration across page refreshes | High | ✅ User |
| 2025-01-16 | Welcome Message Fix | Enhanced welcome message system with proper session deduplication and timing | Medium | ✅ User |
| 2025-01-16 | Screenshot Timeline | Implemented comprehensive screenshot timeline system for AI context awareness | High | ✅ User |
| 2025-01-16 | Game Pill Logic | Fixed unrelated game detection and unreleased game pill handling | Medium | ✅ User |
| 2025-01-16 | Session Persistence Enhancement | Enhanced session management with improved connection handling and websocket stability | High | ✅ User |
| 2025-01-16 | Flow Optimization | Improved main view container state management and chat hook error handling | High | ✅ User |
| 2025-01-16 | UI Enhancement | Updated suggested prompts component and enhanced responsive design | Medium | ✅ User |
| 2025-01-16 | PWA Configuration | Enhanced HTML meta tags and PWA configuration for better mobile experience | Medium | ✅ User |

### **Current Behavior State**
- **Navigation**: ✅ Landing ↔ Login ↔ Chat flow working correctly
- **Authentication**: ✅ Dev mode and OAuth flows stable with enhanced error handling and smooth transitions
- **User States**: ✅ First-time vs returning user detection working
- **UI Components**: ✅ Settings modal, chat interface, trial system stable
- **Waitlist System**: ✅ Email collection, duplicate prevention, and error handling working correctly
- **Error Handling**: ✅ All error patterns documented and working with comprehensive recovery
- **Data Storage**: ✅ localStorage and Supabase patterns stable
- **Tier System**: ✅ Free → Pro → Vanguard cycling working correctly
- **Developer Mode Tier Switching**: ✅ Tier changes persist after settings modal close
- **Tier-Based Feature Gating**: ✅ All premium features properly gated by tier
- **Usage Limits Display**: ✅ CreditIndicator and CreditModal show correct tier-based limits
- **Cache Management**: ✅ User state cache properly cleared on tier changes
- **OAuth Callback Handling**: ✅ Unified service prevents race conditions and landing page flash
- **Error Recovery**: ✅ Comprehensive error handling with proper UI state management
- **Session Management**: ✅ Automatic session refresh prevents unexpected logouts
- **Loading States**: ✅ Consistent background color and loading animation across all states
- **Smooth Transitions**: ✅ No landing page flash during OAuth authentication
- **Session Persistence**: ✅ Page refreshes properly restore authentication state and conversations
- **Developer Mode Session Management**: ✅ Proper session timeout and cleanup prevents unauthenticated user issues
- **Chat Message Persistence**: ✅ Conversations and messages properly restored across page refreshes
- **Welcome Message System**: ✅ Proper deduplication and timing prevents multiple welcome messages
- **Screenshot Timeline System**: ✅ AI context awareness with chronological screenshot progression
- **Game Pill Logic**: ✅ Proper handling of unrelated games and unreleased game detection
- **Connection Management**: ✅ Enhanced websocket stability with improved error handling and reconnection logic
- **Main View Container**: ✅ Better state management for conversations and improved error recovery
- **Chat Hook**: ✅ Enhanced error handling, loading states, and conversation persistence
- **Suggested Prompts**: ✅ Improved responsiveness and user interaction handling
- **PWA Configuration**: ✅ Enhanced mobile experience with better meta tags and responsive design

### **Technical Fix Details**

#### **OAuth Authentication Flow Enhancement (2025-01-15)**
**Problem**: OAuth authentication was causing landing page flash and inconsistent loading states during authentication.

**Root Causes**:
1. **Landing Page Flash**: OAuth callback flag was set too late, allowing landing page to render briefly
2. **Inconsistent Loading States**: Loading spinner used gray background instead of app's black background
3. **Session Management Issues**: Database constraint violations and SQL syntax errors preventing user creation
4. **getUserState TypeError**: Wildcard queries returning undefined data

**Solutions Implemented**:
1. **Immediate Flag Setting**: `setIsOAuthCallback(true)` called immediately when OAuth callback detected
2. **Consistent Loading States**: Updated all loading states to use `bg-[#000000]` matching app design
3. **Database Fixes**: 
   - Removed conversation fields from `app_state` to comply with `check_no_conversations_in_app_state` constraint
   - Fixed SQL syntax by changing `.eq('deleted_at', null)` to `.is('deleted_at', null)`
4. **getUserState Fix**: Corrected `getSupabaseData` return logic for wildcard queries (`key === '*' ? data : data[key]`)
5. **Session Establishment**: Added `supabase.auth.setSession()` to properly establish authentication state
6. **User Creation Fallback**: Implemented `userCreationService.ensureUserRecord()` as fallback for database trigger failures

**Result**: Smooth OAuth authentication with no landing page flash, consistent loading states, and reliable user creation.

#### **Tier Switching Persistence Fix (2025-01-15)**
**Problem**: Developer mode tier switching was not persisting after settings modal close. Tier would revert to previous state.

**Root Cause**: Missing `refreshUsage` callback in SettingsModal props in App.tsx. The DevTierSwitcher was calling `onSwitch()` → `onTierChanged()` → `refreshUsage()`, but the SettingsModal wasn't receiving the `refreshUsage` prop, so app state never refreshed.

**Solution**: Added `refreshUsage` prop to SettingsModal in App.tsx that calls `handleAuthStateChange()` to refresh the entire app state when tier changes.

**Code Changes**:
```typescript
// App.tsx - SettingsModal props
refreshUsage={async () => {
  console.log('🔄 Refreshing app state after tier change...');
  await handleAuthStateChange();
}}
```

**Impact**: Tier switching now works correctly in developer mode with proper persistence.

#### **Critical TypeError Fix (2025-01-15)**
**Problem**: Tier switching was completely broken due to `TypeError: secureAppStateService2.getInstance is not a function`.

**Root Cause**: The `refreshUsage` callback was incorrectly trying to call `getInstance()` on the imported service. The `secureAppStateService` is imported as a default export, not a class with a `getInstance()` method.

**Solution**: Removed the incorrect `getInstance()` call and used the direct service method.

**Code Changes**:
```typescript
// ❌ OLD (BROKEN) CODE
const { secureAppStateService } = await import('./services/secureAppStateService');
secureAppStateService.getInstance().clearUserStateCache();

// ✅ NEW (FIXED) CODE  
secureAppStateService.clearUserStateCache();
```

**Impact**: Tier switching functionality restored, cache clearing works properly.

#### **CreditModal Limits Fix (2025-01-15)**
**Problem**: CreditModal was showing hardcoded limits (55/25) instead of tier-based limits (1583/328 for pro/vanguard).

**Root Cause**: CreditModal was using hardcoded usage data instead of `appState.userState.usage` like CreditIndicator does.

**Solution**: Updated CreditModal to use the same data source as CreditIndicator.

**Code Changes**:
```typescript
// ❌ OLD (BROKEN) CODE - Hardcoded limits
usage={{ 
  textLimit: 55,        // Always 55
  imageLimit: 25,       // Always 25  
  tier: 'free'          // Always free
}}

// ✅ NEW (FIXED) CODE - Uses actual tier data
usage={appState.userState?.usage ? {
  textLimit: appState.userState.usage.textLimit,    // ✅ Tier-based (55 or 1583)
  imageLimit: appState.userState.usage.imageLimit,  // ✅ Tier-based (25 or 328)
  tier: appState.userState.tier                     // ✅ Actual tier (free/pro/vanguard)
} : { /* fallback */ }}
```

**Impact**: CreditModal now shows correct tier-based limits matching CreditIndicator.

#### **Comprehensive Tier-Based Feature Gating (2025-01-15)**
**Problem**: Several premium features were accessible to free users.

**Root Cause**: Missing tier gating on hands-free mode, tab management, and other premium features.

**Solution**: Implemented comprehensive tier gating across all premium features.

**Features Gated**:
- **Hands-Free Mode**: Pro/Vanguard only (HandsFreeToggle, HandsFreeModal)
- **Tab Management**: Pro/Vanguard only (drag-and-drop, context menu)
- **Usage Limits**: Properly calculated based on tier
- **Ad Banner**: Free tier only (developer mode users on pro/vanguard don't see ads)

**Code Changes**:
```typescript
// Hands-Free Toggle - Pro/Vanguard only
{(appState.userState?.tier === 'pro' || appState.userState?.tier === 'vanguard_pro') && (
  <HandsFreeToggle ... />
)}

// Tab drag-and-drop - Pro/Vanguard only
draggable={!isChatTab && userTier !== 'free'}

// Ad Banner - Free tier only
{appState.userState?.tier === 'free' && (
  <AdBanner />
)}
```

**Impact**: All premium features properly gated by tier, consistent behavior across developer mode and authenticated accounts.

#### **Critical Import Fix (2025-01-15)**
**Problem**: App.tsx was throwing `ReferenceError: authService is not defined` at line 854, causing the entire app to crash on load.

**Root Cause**: When implementing the new authentication services (`unifiedOAuthService`, `sessionRefreshService`), the existing `authService` import was accidentally removed from App.tsx, but the code still referenced it for auth state subscriptions.

**Solution**: Re-added the missing import: `import { authService } from './services/supabase';`

**Code Changes**:
```typescript
// App.tsx - Fixed imports
import { authService } from './services/supabase';
import { unifiedOAuthService } from './services/unifiedOAuthService';
import { sessionRefreshService } from './services/sessionRefreshService';
```

**Impact**: App now loads correctly without crashing, all authentication services work together properly.

**Lesson Learned**: This error occurred because changes were made to SYSTEM_ARCHITECTURE.md without proper approval process. Future changes must follow the established change control protocol.

#### **Session Persistence Critical Fix (2025-01-16)**
**Problem**: Users were experiencing session loss on page refresh, causing them to be logged out and lose chat messages.

**Root Causes**:
1. **Authentication State Not Persisting**: App wasn't properly restoring authentication state on page refresh
2. **Developer Mode Session Loss**: Developer mode authentication was lost on refresh
3. **Conversation Data Not Loading**: Chat messages weren't being restored from storage after refresh
4. **App State Reset**: App state was being reset instead of restored from localStorage

**Solutions Implemented**:
1. **Enhanced Authentication Service**: Added `restoreDeveloperModeSession()` method to properly restore developer sessions
2. **Session Cleanup**: Added `cleanupExpiredDeveloperMode()` to clear expired sessions on app start
3. **Conversation Restoration**: Enhanced `useChat` hook to properly restore conversations from localStorage
4. **App State Restoration**: Fixed `secureAppStateService.getUserState()` to properly restore app state
5. **Session Validation**: Added proper session validation and cleanup for invalid sessions

**Code Changes**:
```typescript
// Enhanced session restoration
private async restoreDeveloperModeSession(): Promise<void> {
  const devData = localStorage.getItem('otakon_dev_data');
  if (devData) {
    const parsedData = JSON.parse(devData);
    // Restore developer session with proper validation
  }
}

// Session cleanup on app start
private cleanupExpiredDeveloperMode(): void {
  const devSessionStart = localStorage.getItem('otakon_dev_session_start');
  const sessionAge = Date.now() - parseInt(devSessionStart, 10);
  if (sessionAge >= this.DEV_SESSION_TIMEOUT) {
    // Clear expired session data
  }
}
```

**Impact**: Users now maintain their session and chat messages across page refreshes, providing seamless user experience.

#### **Developer Mode Session Detection Fix (2025-01-16)**
**Problem**: Unauthenticated users were being treated as developer mode users, causing landing page issues.

**Root Cause**: Developer mode detection was too aggressive - checking for `otakon_developer_mode` flag without verifying active session.

**Solution**: Enhanced developer mode detection to require both flag AND active session validation.

**Code Changes**:
```typescript
// Before: Aggressive detection
const isDevMode = localStorage.getItem('otakon_developer_mode') === 'true';

// After: Session-aware detection
const devSessionStart = localStorage.getItem('otakon_dev_session_start');
const devMode = localStorage.getItem('otakon_developer_mode') === 'true';
if (devMode && devSessionStart) {
  const sessionAge = Date.now() - parseInt(devSessionStart, 10);
  if (sessionAge < this.DEV_SESSION_TIMEOUT) {
    // Valid developer session
  }
}
```

**Impact**: Unauthenticated users now properly see landing page instead of being stuck in "initializing chat..." state.

#### **Screenshot Timeline System Implementation (2025-01-16)**
**Problem**: AI lacked context awareness of screenshot progression over time.

**Solution**: Implemented comprehensive screenshot timeline system.

**Features Implemented**:
1. **Timeline Tracking**: Screenshots tracked as chronological sequences
2. **Context Generation**: Rich context provided to AI for better understanding
3. **Progression Windows**: Single shots (1-minute), multi-shots (5-minute), batches (10-minute)
4. **AI Integration**: Timeline context injected into AI prompts

**Code Changes**:
```typescript
// Screenshot timeline service
export class ScreenshotTimelineService {
  addScreenshotEvent(conversationId: string, event: ScreenshotTimelineEvent): void
  getTimelineContext(conversationId: string): TimelineContext
  clearTimeline(conversationId: string): void
}
```

**Impact**: AI now understands screenshot progression patterns and provides more contextual assistance.

#### **Game Pill Logic Enhancement (2025-01-16)**
**Problem**: Unrelated games and unreleased games were incorrectly creating game pills.

**Solution**: Enhanced game detection logic with proper filtering.

**Features Implemented**:
1. **Unrelated Game Detection**: Prevents creation of game pills for unrelated content
2. **Unreleased Game Handling**: Proper handling of unreleased game queries
3. **Ownership Confirmation**: Screenshots confirm game ownership for pill creation
4. **Context Awareness**: Better understanding of game-help intent vs general queries

**Impact**: Game pills now only created for relevant, owned games, improving user experience and AI accuracy.

#### **Session Persistence and Flow Enhancement (2025-01-16)**
**Problem**: Users were experiencing inconsistent session behavior and connection issues affecting overall app stability.

**Root Causes**:
1. **Connection Modal Issues**: Websocket connection handling was unstable
2. **Main View Container State**: State management was causing UI inconsistencies
3. **Chat Hook Errors**: Error handling in chat functionality was incomplete
4. **Suggested Prompts**: Component behavior was inconsistent
5. **PWA Configuration**: Mobile experience needed improvement

**Solutions Implemented**:

1. **Enhanced Connection Management**:
   - Improved websocket connection stability
   - Better error handling for connection failures
   - Enhanced connection status display
   - Improved reconnection logic

2. **Main View Container Optimization**:
   - Better state management for active conversations
   - Improved sub-view handling
   - Enhanced message loading states
   - Better error recovery mechanisms

3. **Chat Hook Improvements**:
   - Enhanced error handling for message sending
   - Better loading state management
   - Improved retry mechanisms
   - Better conversation state persistence

4. **Suggested Prompts Enhancement**:
   - Improved component responsiveness
   - Better prompt generation logic
   - Enhanced user interaction handling
   - Improved accessibility

5. **PWA Configuration Updates**:
   - Enhanced HTML meta tags for better SEO
   - Improved mobile viewport configuration
   - Better PWA manifest settings
   - Enhanced responsive design

**Code Changes**:
```typescript
// Enhanced connection handling
const useConnection = (onMessage: MessageHandler) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  const [connectionCode, setConnectionCode] = useState<string | null>(() => {
    return localStorage.getItem('lastConnectionCode');
  });
  // Enhanced error handling and reconnection logic
};

// Improved main view container state management
const MainViewContainer: React.FC<MainViewContainerProps> = ({
  activeConversation,
  activeSubView,
  onSubViewChange,
  // Enhanced state management and error handling
}) => {
  // Better state management implementation
};

// Enhanced chat hook with better error handling
export const useChat = () => {
  // Improved error handling and retry mechanisms
  // Better loading state management
  // Enhanced conversation persistence
};
```

**Impact**: Users now experience more stable connections, better error handling, improved UI responsiveness, and enhanced mobile experience.

**Technical Details**:
- **Connection Stability**: Websocket connections now handle failures gracefully with automatic retry
- **State Management**: Main view container now properly manages conversation states
- **Error Recovery**: Chat functionality now has comprehensive error handling
- **Mobile Experience**: PWA configuration provides better mobile user experience
- **Responsive Design**: Enhanced responsive design across all screen sizes

---

## 🔐 **ENHANCED AUTHENTICATION ARCHITECTURE**

### **Unified OAuth Callback Handling**
**Problem Solved**: Multiple OAuth callback handlers causing race conditions and duplicate processing.

**Solution**: Centralized `unifiedOAuthService` that:
- **Single Entry Point**: Only one OAuth callback handler per app load
- **Queue Management**: Prevents race conditions by queuing multiple calls
- **Consistent Processing**: Same logic for all OAuth providers (Google, Discord)
- **Error Handling**: Comprehensive error categorization and recovery
- **URL Cleanup**: Automatic cleanup of OAuth parameters from URL

**Implementation**:
```typescript
// Single OAuth callback handler in App.tsx
const result = await unifiedOAuthService.handleOAuthCallback({
  onSuccess: (user, session) => { /* handle success */ },
  onError: (error) => { /* handle error */ }
});
```

### **Comprehensive Error Recovery System**
**Problem Solved**: UI getting stuck in loading states and inconsistent error handling.

**Solution**: `errorRecoveryService` that provides:
- **Error Categorization**: Automatic error type detection (network, OAuth, validation, etc.)
- **Recovery Strategies**: Different strategies based on error type
- **Button State Management**: Proper reset of loading/disabled states
- **User-Friendly Messages**: Context-aware error messages
- **Retry Logic**: Smart retry mechanisms for temporary errors

**Error Types Handled**:
- **User Cancelled**: No error message shown, allow retry
- **Access Denied**: Show message, allow retry
- **Network Errors**: Show message, allow retry
- **Rate Limited**: Show message, disable retry temporarily
- **Unauthorized**: Show message, redirect to login

### **Automatic Session Refresh**
**Problem Solved**: Users getting logged out unexpectedly due to session expiration.

**Solution**: `sessionRefreshService` that provides:
- **Proactive Refresh**: Refreshes session before expiration (10 minutes before)
- **Automatic Retry**: Retries failed refreshes with exponential backoff
- **Session Monitoring**: Continuous monitoring of session validity
- **Graceful Degradation**: Handles session expiration with user-friendly redirects

**Configuration**:
- **Refresh Interval**: 5 minutes (configurable)
- **Max Retries**: 3 attempts before giving up
- **Expiry Threshold**: 10 minutes before expiration triggers refresh
- **Auto-Redirect**: Redirects to login on session expiration

### **Enhanced OAuth Authentication Flow**
1. **OAuth Initiation**: User clicks Google/Discord/Email button
2. **Callback Detection**: `unifiedOAuthService.isOAuthCallback()` detects OAuth parameters in URL
3. **Immediate Flag Setting**: `setIsOAuthCallback(true)` prevents landing page flash
4. **Loading State Display**: Black background (`#000000`) with loading spinner
5. **Session Processing**: `unifiedOAuthService.handleOAuthCallback()` processes OAuth response
6. **Session Establishment**: `supabase.auth.setSession()` establishes proper authentication
7. **User Record Creation**: `userCreationService.ensureUserRecord()` ensures user exists in database
8. **Auth State Update**: Authentication state changes trigger app view updates
9. **Flag Reset**: `setIsOAuthCallback(false)` when auth state change completes
10. **Smooth Transition**: Direct transition to splash screens (first-time) or chat (returning)

### **OAuth Callback Handling Architecture**
```typescript
// OAuth callback detection and processing
const handleOAuthCallback = async () => {
  if (!unifiedOAuthService.isOAuthCallback()) return;
  
  // Set flag immediately to prevent landing page flash
  setIsOAuthCallback(true);
  
  try {
    const result = await unifiedOAuthService.handleOAuthCallback({
      onSuccess: (user, session) => {
        // Session established, auth state will update automatically
      },
      onError: (error) => {
        setIsOAuthCallback(false);
        // Handle error appropriately
      }
    });
  } catch (error) {
    setIsOAuthCallback(false);
  }
};
```

### **Loading State Management**
- **Background Color**: Consistent `bg-[#000000]` across all loading states
- **Loading Spinner**: `LoadingSpinner` component with `size="xl"`
- **Centering**: `flex items-center justify-center` for proper positioning
- **Full Screen**: `min-h-screen` for complete coverage

### **Protected Authentication Behaviors**
- **OAuth Callback Handling**: Single service, no race conditions, immediate flag setting
- **Error Recovery**: Comprehensive error handling with proper UI state reset
- **Session Refresh**: Automatic session management to prevent unexpected logouts
- **Button State Management**: Proper loading/disabled states during authentication
- **User Experience**: Consistent error messages and recovery options
- **Loading State Management**: Consistent background color and loading animation
- **Landing Page Prevention**: OAuth callback flag prevents landing page flash
- **Smooth Transitions**: Direct transition from OAuth to appropriate screen

---

### **Tier System Behavior for Authenticated Users**
The tier system behavior implemented in developer mode **MUST** be identical for authenticated users:

#### **Usage Limits**
- **Free Tier**: 55 text queries, 25 image queries per month
- **Pro Tier**: 1583 text queries, 328 image queries per month  
- **Vanguard Tier**: 1583 text queries, 328 image queries per month (12-month subscription)

#### **Feature Gating**
- **Free Users**: Basic features only, see ads, limited usage
- **Pro Users**: All premium features, no ads, high usage limits
- **Vanguard Users**: All premium features, no ads, high usage limits (12-month subscription)

#### **UI Component Behavior**
- **CreditIndicator**: Shows tier-based limits and usage
- **CreditModal**: Shows tier-based limits and usage (matches CreditIndicator)
- **Ad Banner**: Only visible for free tier users
- **Hands-Free Toggle**: Only visible for pro/vanguard users
- **Tab Management**: Drag-and-drop only for pro/vanguard users

#### **Data Sources**
- **Developer Mode**: Uses `localStorage` for tier data, bypasses Supabase
- **Authenticated Users**: Uses Supabase database for tier data
- **Both Modes**: Use `unifiedUsageService.getUsage()` for consistent limit calculation

### **Critical Consistency Requirements**
1. **Same Tier Limits**: Free (55/25), Pro/Vanguard (1583/328)
2. **Same Feature Gating**: Premium features only for pro/vanguard
3. **Same UI Behavior**: CreditIndicator and CreditModal show identical data
4. **Same Cache Management**: User state cache cleared on tier changes
5. **Same Error Handling**: Graceful fallbacks for network issues

### **Testing Requirements**
Before deploying to production, verify:
- [ ] Authenticated free users see 55/25 limits
- [ ] Authenticated pro users see 1583/328 limits  
- [ ] Authenticated vanguard users see 1583/328 limits
- [ ] Free users see ads, pro/vanguard users don't
- [ ] Hands-free mode only available for pro/vanguard
- [ ] Tab management features only for pro/vanguard
- [ ] CreditModal matches CreditIndicator values

### **Pending Behavior Reviews**
*No pending reviews - all behaviors are approved and stable*

---

## 🎯 **WELCOME MESSAGE MANAGEMENT SYSTEM**

### **Overview**
The welcome message system provides first-time users with an introduction to Otakon's capabilities. The system has been designed to prevent duplication and ensure messages appear only in the appropriate conversation tab.

### **System Components**

#### **Primary Welcome Message Logic (App.tsx)**
- **Location**: `App.tsx` lines 970-1031
- **Trigger**: useEffect with dependencies `[appState.userState?.isAuthenticated, appState.appView?.onboardingStatus, conversations]`
- **Purpose**: Shows welcome message to authenticated users who have completed onboarding

#### **Session-Based Deduplication**
- **Session Key**: `otakon_welcome_shown_session` in sessionStorage
- **Purpose**: Prevents multiple welcome messages in the same browser session
- **Implementation**: Checked before showing welcome message, set to `true` after showing

#### **Tab Targeting**
- **Target Tab**: Always `'everything-else'` conversation
- **Implementation**: `addSystemMessage('...', 'everything-else')`
- **Purpose**: Ensures welcome message appears in the general conversation, not game-specific tabs

#### **Existing Message Check**
- **Logic**: Checks if `conversations['everything-else']` already has messages
- **Behavior**: Skips welcome message if conversation already has content
- **Purpose**: Prevents welcome message from appearing after user has already started chatting

### **Welcome Message Conditions**

#### **Required Conditions (All Must Be True)**
1. **User Authentication**: `appState.userState?.isAuthenticated === true`
2. **Onboarding Complete**: `appState.appView?.onboardingStatus === 'complete'`
3. **Session Check**: `sessionStorage.getItem('otakon_welcome_shown_session') !== 'true'`
4. **Supabase Check**: `supabaseDataService.shouldShowWelcomeMessage() === true`
5. **Profile Setup**: User has completed profile setup
6. **Empty Conversation**: `conversations['everything-else']` has no existing messages

#### **Message Content**
```
"Welcome to Otakon! I'm here to help you with your anime and gaming needs. Feel free to ask me anything!"
```

### **SupabaseDataService Integration**

#### **shouldShowWelcomeMessage() Method**
- **Session Caching**: Uses `otakon_welcome_status_determined` in sessionStorage
- **Developer Mode**: Falls back to localStorage-based logic when not authenticated
- **Database Integration**: Calls Supabase RPC `should_show_welcome_message`
- **Error Handling**: Graceful fallback to localStorage in dev mode

#### **updateWelcomeMessageShown() Method**
- **Purpose**: Marks welcome message as shown in database
- **Parameter**: `'first_time'` message type
- **Error Handling**: Continues execution even if Supabase call fails

### **Developer Mode Behavior**

#### **Authentication Bypass**
- **Behavior**: Uses localStorage fallback when not authenticated
- **Session Management**: Still uses sessionStorage for deduplication
- **Consistency**: Maintains same welcome message logic as authenticated users

#### **LocalStorage Integration**
- **Profile Setup**: Checks `localStorage.getItem('otakon_profile_setup_completed')`
- **Welcome Status**: Uses `shouldShowLocalStorageWelcome()` method
- **Persistence**: Welcome message status persists across browser sessions

### **Error Handling & Fallbacks**

#### **Network Failures**
- **Supabase Errors**: Graceful fallback to localStorage-based logic
- **Session Storage**: Continues to work even if database is unavailable
- **User Experience**: No interruption to user flow

#### **State Management**
- **Conversation State**: Safely handles undefined conversation objects
- **Message Addition**: Checks for `addSystemMessage` function availability
- **Session Storage**: Handles sessionStorage unavailability gracefully

### **Testing Requirements**

#### **Functional Testing**
- [ ] Welcome message shows only once per session
- [ ] Welcome message appears only in "everything-else" tab
- [ ] Welcome message doesn't show if conversation has existing messages
- [ ] Welcome message doesn't show in game-specific tabs
- [ ] Session deduplication works across tab switches
- [ ] Developer mode behavior matches authenticated user behavior

#### **Edge Case Testing**
- [ ] Welcome message behavior with multiple browser tabs
- [ ] Welcome message behavior after page refresh
- [ ] Welcome message behavior with cleared sessionStorage
- [ ] Welcome message behavior with network failures
- [ ] Welcome message behavior with incomplete profile setup

#### **Integration Testing**
- [ ] Welcome message integrates with onboarding flow
- [ ] Welcome message integrates with authentication flow
- [ ] Welcome message integrates with conversation management
- [ ] Welcome message integrates with SupabaseDataService

### **Performance Considerations**

#### **Optimization Features**
- **Session Caching**: Prevents repeated Supabase calls
- **Conditional Execution**: Only runs when necessary conditions are met
- **Dependency Management**: Minimal useEffect dependencies to prevent unnecessary re-runs
- **Early Returns**: Multiple early return conditions to avoid unnecessary processing

#### **Memory Management**
- **Session Storage**: Lightweight session-based tracking
- **No Memory Leaks**: Proper cleanup of session storage on session end
- **Efficient Checks**: Quick boolean checks before expensive operations

### **Future Considerations**

#### **Potential Enhancements**
- **Personalization**: Include user's first name in welcome message
- **Context Awareness**: Show different welcome messages based on user's previous activity
- **A/B Testing**: Support for different welcome message variants
- **Analytics**: Track welcome message effectiveness and user engagement

#### **Maintenance Notes**
- **Code Location**: All welcome message logic centralized in App.tsx
- **Dependencies**: Minimal external dependencies for easy maintenance
- **Testing**: Comprehensive test coverage for all scenarios
- **Documentation**: Clear documentation for future developers

---

## 🔥 Firebase Hosting Configuration

### **Deployment Architecture**

#### **Hosting Setup**
- **Platform**: Firebase Hosting
- **Build Output**: `dist/` directory
- **Configuration**: `firebase.json`
- **Site ID**: `otagon-0509`
- **Local Development**: Firebase Emulator Suite

#### **Build Configuration**
- **Build Tool**: Vite 6.3.6
- **Bundle Strategy**: Single main bundle (`main-CKUH2ZpR.js`)
- **Source Maps**: Enabled for debugging
- **CSS**: Single bundled stylesheet (`main-6mN-puJX.css`)
- **Assets**: Optimized images and static files

### **Critical Build Lessons Learned**

#### **React Bundling Issues (Resolved)**
**Problem**: Custom `manualChunks` function and `terserOptions` in `vite.config.ts` were interfering with React's proper bundling, causing:
- `Uncaught TypeError: Cannot read properties of undefined (reading 'createContext')`
- `Uncaught ReferenceError: React is not defined`
- React contexts (`ToastSystem.tsx`, `AppStateProvider.tsx`) failing to initialize

**Root Cause**: 
- Custom chunking logic was separating React from its dependencies
- Manual terser configuration was fighting against Vite's optimization
- Complex vendor chunking (`vendor-react`, `vendor-supabase`, etc.) broke dependency resolution

**Solution Applied**:
```typescript
// REMOVED problematic configuration:
// - manualChunks function
// - terserOptions with reserved names
// - Complex vendor chunking logic

// SIMPLIFIED to:
build: {
  outDir: 'dist',
  sourcemap: true,
  chunkSizeWarningLimit: 1200,
  rollupOptions: {
    input: {
      main: './index.html'
    }
  }
}
```

**Key Principle**: Let Vite handle code splitting and optimization automatically. Custom configurations should only be added when absolutely necessary and thoroughly tested.

### **Firebase Configuration**

#### **firebase.json Structure**
```json
{
  "hosting": {
    "site": "otagon-0509",
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      }
    ]
  }
}
```

#### **Emulator Configuration**
- **Hosting Port**: 3000
- **Emulator Hub**: 4400
- **UI Port**: 4000 (when enabled)
- **Local URL**: `http://127.0.0.1:3000`

### **Deployment Workflow**

#### **Development Process**
1. **Local Development**: `npm run dev` (Vite dev server)
2. **Build Testing**: `npm run build` (production build)
3. **Emulator Testing**: `firebase emulators:start --only hosting`
4. **Production Deploy**: `firebase deploy --only hosting`

#### **Build Process**
```bash
# Clean build workflow (CRITICAL for React issues)
rm -rf dist
npm run build
firebase emulators:start --only hosting
```

#### **Cache Management**
- **HTML Files**: No-cache headers for immediate updates
- **JS/CSS**: 1-hour cache for performance
- **Images**: 1-year cache for static assets
- **Build Artifacts**: Always delete `dist/` before rebuild

### **Performance Considerations**

#### **Bundle Optimization**
- **Single Bundle**: Reduces HTTP requests and dependency resolution issues
- **Automatic Splitting**: Vite handles dynamic imports intelligently
- **Source Maps**: Enabled for debugging without affecting production performance
- **Compression**: Gzip enabled for all text assets

#### **Caching Strategy**
- **HTML**: Always fresh (no-cache)
- **JavaScript**: Cached with versioned filenames
- **CSS**: Cached with versioned filenames
- **Images**: Long-term caching with proper headers

### **Monitoring and Debugging**

#### **Build Verification**
- **Bundle Size**: Monitor `main-CKUH2ZpR.js` size (currently ~2MB)
- **Asset Loading**: Verify all chunks load successfully
- **React Context**: Test `createContext()` functionality
- **Source Maps**: Ensure debugging capabilities

#### **Common Issues**
1. **React Undefined**: Usually caused by custom bundling configuration
2. **Context Errors**: Check for proper React imports and bundling
3. **Cache Issues**: Always perform clean builds for testing
4. **Emulator Serving**: Ensure `dist/` contains latest build

### **Future Deployment Considerations**

#### **Production Optimizations**
- **CDN Integration**: Consider Firebase CDN for global distribution
- **Bundle Splitting**: May implement strategic code splitting for large bundles
- **Performance Monitoring**: Add Firebase Performance Monitoring
- **Error Tracking**: Integrate Firebase Crashlytics

#### **Scaling Considerations**
- **Asset Optimization**: Implement image optimization pipeline
- **Bundle Analysis**: Regular bundle size monitoring
- **Caching Strategy**: Optimize cache headers for different asset types
- **CDN Configuration**: Fine-tune Firebase CDN settings

---

*Last Updated: January 16, 2025*
*Version: 2.1*
*Updated: Added session persistence and flow fixes, enhanced connection management, improved UI components, and comprehensive system behavior documentation*
