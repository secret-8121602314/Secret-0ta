import React from 'react';
import { useNavigate, useLoaderData } from 'react-router-dom';
import ProFeaturesSplashScreen from '../../components/splash/ProFeaturesSplashScreen';
import type { User } from '../../types';
import { supabase } from '../../lib/supabase';

/**
 * Route wrapper for ProFeaturesSplashScreen
 * Bridges React Router navigation with component props
 */
const ProFeaturesRoute: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useLoaderData() as { user: User | null };

  const handleComplete = async () => {
    // Update database to mark onboarding complete
    if (user?.authUserId) {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            has_seen_pro_features: true,
            onboarding_completed: true,
            app_state: {
              onboardingStatus: 'complete',
              hasSeenProFeatures: true,
              onboardingCompleted: true,
              completedOnboardingAt: new Date().toISOString()
            }
          })
          .eq('auth_user_id', user.authUserId);
          
        if (error) {
          console.error('[ProFeaturesRoute] DB update failed:', error);
        } else {
          console.log('[ProFeaturesRoute] Onboarding marked complete');
        }
        
        // Wait a moment for DB to propagate
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error('[ProFeaturesRoute] DB update error:', error);
      }
    } else {
      console.warn('[ProFeaturesRoute] No user authUserId - user may still be initializing');
      // For new users, wait for DB trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Set flag to bypass onboarding check (appLoader will see this)
    sessionStorage.setItem('otagon_onboarding_complete', 'true');
    
    // Navigate to app
    navigate('/app', { replace: true });
  };

  const handleUpgrade = () => {
    // TODO: Implement upgrade modal/flow
      };

  const handleUpgradeToVanguard = () => {
    // TODO: Implement Vanguard upgrade modal/flow
      };

  return (
    <ProFeaturesSplashScreen
      onComplete={handleComplete}
      onUpgrade={handleUpgrade}
      onUpgradeToVanguard={handleUpgradeToVanguard}
    />
  );
};

export default ProFeaturesRoute;
