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
  - **Back Button**: Returns to landing page (proper navigation)
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
- **CTAs**: All upgrade buttons show pricing ($3.99/month Pro, $20.00/month Vanguard)
- **Stripe Ready**: Payment processing mentions "Stripe-powered"
- **Billing Portal**: Subscription management interface prepared

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

2. **Regular Authentication**:
   - Google OAuth → Supabase authentication
   - Discord OAuth → Supabase authentication  
   - Email/Password → Supabase authentication
   - Session persistence across browser refreshes

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

### **Current Behavior State**
- **Navigation**: ✅ Landing ↔ Login ↔ Chat flow working correctly
- **Authentication**: ✅ Dev mode and regular auth flows stable
- **User States**: ✅ First-time vs returning user detection working
- **UI Components**: ✅ Settings modal, chat interface, trial system stable
- **Error Handling**: ✅ All error patterns documented and working
- **Data Storage**: ✅ localStorage and Supabase patterns stable
- **Tier System**: ✅ Free → Pro → Vanguard cycling working

### **Pending Behavior Reviews**
*No pending reviews - all behaviors are approved and stable*

---

*Last Updated: January 15, 2025*
*Version: 1.4*
*Updated: Added behavior change detection system, change log, and validation protocols*
