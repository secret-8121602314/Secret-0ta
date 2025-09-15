# 🎮 Otagon AI Gaming Companion - System Architecture

## 📋 Overview
This document defines the core system architecture, user flows, and behavioral patterns that have been implemented and tested. **Any changes to these patterns must be approved before implementation.**

---

## 🔄 User Flow Architecture

### 1. Landing → Login → Splash Screens → Chat Flow

#### **Phase 1: Landing Page**
- **Purpose**: Initial app entry point
- **Behavior**: 
  - Shows app branding and value proposition
  - "Get Started" button triggers login flow
- **Next**: Login Screen

#### **Phase 2: Login Screen** 
- **Purpose**: Authentication entry point
- **Behavior**:
  - Shows login options (Google, Discord, Email)
  - **Developer Mode**: Password `zircon123` enables dev mode
  - **Dev Mode Detection**: `localStorage.getItem('otakon_developer_mode') === 'true'`
- **Developer Mode Login Flow**:
  1. User enters password `zircon123`
  2. System creates mock user with fixed UUID: `00000000-0000-0000-0000-000000000001`
  3. Sets developer flags in localStorage: `otakon_developer_mode: 'true'`
  4. Initializes developer data structure in localStorage
  5. Bypasses all Supabase authentication calls
- **Next**: Splash Screen Sequence

#### **Phase 3: Splash Screen Sequence**
- **Order**: `initial` → `features` → `pro-features` → `complete`
- **Behavior**:
  - **New Users**: Must complete all splash screens
  - **Returning Users**: Skip splash screens if `hasSeenSplashScreens: true`
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

## ⚠️ Change Control Protocol

### **Protected Features**:
1. **User Flow**: Landing → Login → Splash → Chat
2. **Developer Mode**: localStorage-based data handling
3. **Tier System**: Free → Pro → Vanguard cycling
4. **Supabase Prevention**: Dev mode skips all Supabase calls
5. **Chat Interface**: Welcome message + suggested prompts layout
6. **14-Day Trial System**: One-time trial eligibility and expiration logic

### **Change Approval Required For**:
- Modifying user flow sequence
- Changing developer mode behavior
- Altering tier system logic
- Adding/removing Supabase calls in dev mode
- Changing chat interface layout
- Modifying localStorage key names
- Modifying trial eligibility logic or duration
- Changing trial button placement or behavior

### **Approval Process**:
1. **Identify**: What feature is being changed
2. **Document**: Why the change is needed
3. **Impact**: How it affects existing behavior
4. **Approval**: Get explicit user approval before implementation

---

## 📊 Current Implementation Status

### ✅ **Completed Features**:
- [x] Landing → Login → Splash → Chat flow
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

### 🔄 **Active Monitoring**:
- Developer mode localStorage consistency
- Tier switching persistence
- Image upload error handling
- Supabase call prevention
- Trial eligibility accuracy
- Trial expiration automation
- Trial button visibility in dev mode
- Payment CTA functionality

---

## 🚨 Warning System

**Before making any changes to the above features, this system will:**
1. **Identify** the feature being modified
2. **Warn** about potential impact
3. **Request** explicit approval
4. **Document** the change in this file

**This ensures system consistency and prevents unintended regressions.**

---

*Last Updated: January 15, 2025*
*Version: 1.2*
