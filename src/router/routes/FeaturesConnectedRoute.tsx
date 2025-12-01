import React from 'react';
import { useNavigate, useLoaderData } from 'react-router-dom';
import HowToUseSplashScreen from '../../components/splash/HowToUseSplashScreen';
import type { User } from '../../types';
import { supabase } from '../../lib/supabase';

/**
 * Route wrapper for HowToUseSplashScreen ("You're Connected!" screen)
 * Shown only after successful PC connection
 * Bridges React Router navigation with component props
 */
const FeaturesConnectedRoute: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useLoaderData() as { user: User | null };

  const handleComplete = async () => {
        // Navigate immediately for smooth UX
    navigate('/onboarding/pro-features');
    
    // Update database in background (optimistic navigation)
    if (user) {
      try {
        const { error } = await supabase
          .from('users')
          .update({
            has_seen_features_connected: true,
            app_state: {
              onboardingStatus: 'pro-features',
              hasSeenFeaturesConnected: true,
              completedFeaturesAt: new Date().toISOString()
            }
          })
          .eq('auth_user_id', user.authUserId);
          
        if (error) {
          console.error('[FeaturesConnectedRoute] Background DB update failed:', error);
        } else {
                  }
      } catch (error) {
        console.error('[FeaturesConnectedRoute] Background DB update error:', error);
      }
    }
  };

  return (
    <HowToUseSplashScreen
      onComplete={handleComplete}
    />
  );
};

export default FeaturesConnectedRoute;
