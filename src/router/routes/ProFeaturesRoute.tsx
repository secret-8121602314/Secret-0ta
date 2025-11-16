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
    console.log('[ProFeaturesRoute] Complete clicked, navigating immediately...');
    
    // Navigate immediately for smooth UX
    navigate('/app');
    
    // Complete onboarding in background (optimistic navigation)
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
          console.error('[ProFeaturesRoute] Background DB update failed:', error);
        } else {
          console.log('[ProFeaturesRoute] Background DB update complete');
        }
      } catch (error) {
        console.error('[ProFeaturesRoute] Background DB update error:', error);
      }
    }
  };

  const handleUpgrade = () => {
    // TODO: Implement upgrade modal/flow
    console.log('[ProFeaturesRoute] Upgrade to Pro clicked');
  };

  const handleUpgradeToVanguard = () => {
    // TODO: Implement Vanguard upgrade modal/flow
    console.log('[ProFeaturesRoute] Upgrade to Vanguard clicked');
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
