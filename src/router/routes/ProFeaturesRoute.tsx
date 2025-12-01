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
        // Update database FIRST to avoid race condition with router loader
    if (user) {
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
                  }
      } catch (error) {
        console.error('[ProFeaturesRoute] DB update error:', error);
      }
    }
    
    // Navigate after DB update to prevent race condition
    navigate('/earlyaccess/app');
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
