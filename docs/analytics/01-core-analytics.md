# 📊 Analytics Implementation Guide for Otakon

This document explains how to implement and use the comprehensive analytics tracking system that has been added to your Otakon application.

## 🎯 **What We're Tracking**

### 1. **Onboarding Funnel Analytics**
- **User progression** through splash screens
- **Drop-off points** and reasons
- **Step completion times** and success rates
- **Conversion optimization** insights

### 2. **Tier Upgrade Conversion Tracking**
- **Upgrade attempts** from different sources
- **Success/failure rates** for each tier
- **Payment method** preferences
- **Revenue optimization** opportunities

### 3. **Feature Usage Patterns**
- **User engagement** with different features
- **Feature adoption** rates
- **Usage frequency** and duration
- **Power user** identification

## 🚀 **Quick Start**

### **Step 1: Apply Database Schema**
```bash
# Run the analytics schema
psql -h your-host -U your-user -d your-db -f supabase-schema-analytics.sql
```

### **Step 2: Import Analytics Hook**
```tsx
import { useAnalytics } from '../hooks/useAnalytics';

const MyComponent = () => {
  const { 
    startOnboardingStep, 
    completeOnboardingStep, 
    trackFeatureUsage,
    trackButtonClick 
  } = useAnalytics();
  
  // Use analytics functions...
};
```

### **Step 3: Start Tracking**
```tsx
// Track onboarding steps
useEffect(() => {
  startOnboardingStep('login', 1, { component: 'LoginSplashScreen' });
}, []);

// Track feature usage
const handleFeatureUse = () => {
  trackFeatureUsage({
    featureName: 'button_click',
    featureCategory: 'chat',
    metadata: { action: 'send_message' }
  });
};
```

## 📋 **Implementation Examples**

### **Onboarding Funnel Tracking**

#### **In Splash Screen Components:**
```tsx
import { useAnalytics } from '../hooks/useAnalytics';

const SplashScreen = () => {
  const { startOnboardingStep, completeOnboardingStep, trackOnboardingDropOff } = useAnalytics();
  
  useEffect(() => {
    // Start tracking when component mounts
    startOnboardingStep('pc_connection', 2, { component: 'SplashScreen' });
  }, []);
  
  const handleComplete = () => {
    // Mark step as completed
    completeOnboardingStep('pc_connection', 2, { success: true });
    onComplete();
  };
  
  const handleSkip = () => {
    // Track drop-off with reason
    trackOnboardingDropOff('pc_connection', 2, 'user_skipped', { reason: 'not_interested' });
    onSkip();
  };
  
  return (
    // Your component JSX
  );
};
```

#### **In Login Components:**
```tsx
const LoginSplashScreen = () => {
  const { startOnboardingStep, completeOnboardingStep, trackOnboardingDropOff } = useAnalytics();
  
  useEffect(() => {
    startOnboardingStep('login', 1, { component: 'LoginSplashScreen' });
  }, []);
  
  const handleAuthSuccess = (method: string) => {
    completeOnboardingStep('login', 1, { 
      method, 
      success: true,
      authMethod: method 
    });
    onComplete();
  };
  
  const handleAuthFailure = (method: string, error: string) => {
    trackOnboardingDropOff('login', 1, 'auth_failed', { 
      method, 
      error 
    });
  };
};
```

### **Tier Upgrade Tracking**

#### **In Upgrade Components:**
```tsx
const UpgradeModal = () => {
  const { trackTierUpgradeAttempt } = useAnalytics();
  
  const handleUpgrade = (fromTier: string, toTier: string) => {
    trackTierUpgradeAttempt({
      fromTier,
      toTier,
      attemptSource: 'upgrade_modal',
      success: false, // Will be updated when payment succeeds
      amount: 3.99,
      metadata: { source: 'UpgradeModal' }
    });
    
    // Proceed with upgrade...
  };
};
```

#### **Update Success Status:**
```tsx
// After successful payment
const handlePaymentSuccess = () => {
  // Update the upgrade attempt to success
  analyticsService.updateTierUpgradeSuccess(upgradeAttemptId, {
    paymentMethod: 'stripe',
    success: true
  });
};
```

### **Feature Usage Tracking**

#### **Track Button Clicks:**
```tsx
const MyComponent = () => {
  const { trackButtonClick } = useAnalytics();
  
  const handleButtonClick = () => {
    trackButtonClick('send_message', 'ChatInput', { 
      hasText: true, 
      messageLength: text.length 
    });
    
    // Your button logic...
  };
};
```

#### **Track Feature Duration:**
```tsx
const VoiceChat = () => {
  const { startFeatureTimer, stopFeatureTimer } = useAnalytics();
  
  const startVoiceChat = () => {
    startFeatureTimer('voice_chat');
    // Start voice recording...
  };
  
  const stopVoiceChat = () => {
    stopFeatureTimer('voice_chat', { 
      duration: recordingDuration,
      wordsSpoken: wordCount 
    });
    // Stop recording...
  };
};
```

#### **Track Page Views:**
```tsx
const SettingsPage = () => {
  const { trackPageView } = useAnalytics();
  
  useEffect(() => {
    trackPageView('settings', { 
      section: 'general',
      userTier: currentTier 
    });
  }, []);
};
```

## 📊 **Analytics Dashboard**

### **Access the Dashboard:**
```tsx
import AnalyticsDashboard from '../components/AnalyticsDashboard';

// In your app routing
<Route path="/analytics" element={<AnalyticsDashboard />} />
```

### **Dashboard Features:**
- **Onboarding Funnel Stats** - Step completion rates and drop-offs
- **Tier Conversion Rates** - Upgrade success rates and revenue
- **Feature Usage Patterns** - User engagement and adoption
- **Date Range Filtering** - 7, 30, or 90 day views
- **Real-time Updates** - Refresh data on demand

## 🔧 **Advanced Usage**

### **Custom Analytics Events:**
```tsx
const { trackFeatureUsage } = useAnalytics();

// Track custom events
trackFeatureUsage({
  featureName: 'custom_event',
  featureCategory: 'other',
  metadata: {
    eventType: 'user_preference_change',
    oldValue: 'dark',
    newValue: 'light',
    timestamp: Date.now()
  }
});
```

### **Batch Analytics:**
```tsx
// Track multiple events at once
const trackUserSession = () => {
  trackFeatureUsage({ featureName: 'session_start', featureCategory: 'other' });
  trackFeatureUsage({ featureName: 'page_load', featureCategory: 'other' });
  trackFeatureUsage({ featureName: 'feature_discovery', featureCategory: 'other' });
};
```

### **Error Tracking:**
```tsx
const { trackError } = useAnalytics();

try {
  // Your code...
} catch (error) {
  trackError('api_call_failed', error.message, 'MyComponent', {
    endpoint: '/api/data',
    statusCode: 500
  });
}
```

## 📈 **Analytics Queries**

### **Get Onboarding Stats:**
```sql
-- Get completion rates for last 30 days
SELECT * FROM get_onboarding_funnel_stats(
  NOW() - INTERVAL '30 days',
  NOW()
);

-- Find drop-off points
SELECT step_name, COUNT(*) as drop_offs 
FROM onboarding_funnel 
WHERE dropped_off = true 
GROUP BY step_name;
```

### **Get Conversion Stats:**
```sql
-- Get tier conversion rates
SELECT * FROM get_tier_conversion_stats();

-- Find most successful upgrade paths
SELECT from_tier, to_tier, conversion_rate
FROM get_tier_conversion_stats()
ORDER BY conversion_rate DESC;
```

### **Get Feature Usage:**
```sql
-- Get feature adoption rates
SELECT * FROM get_feature_usage_stats();

-- Find power users
SELECT user_id, COUNT(*) as feature_count
FROM feature_usage
GROUP BY user_id
HAVING COUNT(*) > 10
ORDER BY feature_count DESC;
```

## 🎨 **Integration with Existing Components**

### **Already Integrated:**
- ✅ **LoginSplashScreen** - Tracks login attempts and success/failure
- ✅ **UpgradeSplashScreen** - Tracks upgrade attempts and conversions
- ✅ **useChat Hook** - Tracks message sending and retries
- ✅ **Analytics Dashboard** - Visualizes all collected data

### **Components to Integrate Next:**
- 🔄 **VoiceChatInput** - Track voice feature usage
- 🔄 **HandsFreeModal** - Track hands-free mode adoption
- 🔄 **SettingsModal** - Track settings changes
- 🔄 **PWAInstallBanner** - Track PWA installation rates

## 🚨 **Best Practices**

### **1. Consistent Naming:**
```tsx
// Use consistent feature names
trackFeatureUsage({ featureName: 'send_message', featureCategory: 'chat' });
trackFeatureUsage({ featureName: 'retry_message', featureCategory: 'chat' });
trackFeatureUsage({ featureName: 'voice_input', featureCategory: 'voice' });
```

### **2. Meaningful Metadata:**
```tsx
// Include relevant context
trackFeatureUsage({
  featureName: 'button_click',
  featureCategory: 'chat',
  metadata: {
    buttonType: 'send',
    messageLength: text.length,
    hasImages: images.length > 0,
    userTier: currentTier
  }
});
```

### **3. Error Handling:**
```tsx
// Always handle analytics errors gracefully
try {
  await trackFeatureUsage(event);
} catch (error) {
  console.warn('Analytics tracking failed:', error);
  // Don't break user experience
}
```

### **4. Performance:**
```tsx
// Use analytics hooks efficiently
const { trackButtonClick } = useAnalytics();

// Don't recreate functions on every render
const handleClick = useCallback(() => {
  trackButtonClick('action', 'component');
}, [trackButtonClick]);
```

## 🔍 **Monitoring & Debugging**

### **Console Logs:**
The analytics service provides detailed console logging:
- 🚀 `Onboarding step started: login (1)`
- ✅ `Onboarding step completed: login (1500ms)`
- ❌ `Onboarding drop-off tracked: login - auth_failed (2000ms)`
- 💰 `Tier upgrade tracked: free → pro (success)`
- 📊 `Feature usage tracked: send_message (chat)`

### **Database Queries:**
```sql
-- Check if data is being collected
SELECT COUNT(*) FROM onboarding_funnel;
SELECT COUNT(*) FROM tier_upgrade_attempts;
SELECT COUNT(*) FROM feature_usage;

-- Verify user data
SELECT user_id, step_name, dropped_off, created_at
FROM onboarding_funnel
ORDER BY created_at DESC
LIMIT 10;
```

## 🎯 **Next Steps**

1. **Apply the database schema** to enable analytics collection
2. **Test the tracking** in development mode
3. **Integrate remaining components** using the examples above
4. **Monitor the dashboard** to identify optimization opportunities
5. **Set up alerts** for critical drop-off points

## 📞 **Support**

If you encounter any issues with the analytics implementation:
1. Check the browser console for error messages
2. Verify the database schema is applied correctly
3. Ensure the analytics service is properly imported
4. Check that user authentication is working

The analytics system is designed to be non-intrusive and won't affect your app's performance or user experience. All tracking happens asynchronously and errors are handled gracefully.
