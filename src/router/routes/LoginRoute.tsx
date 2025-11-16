import React, { useEffect } from 'react';
import { useNavigate, useLoaderData } from 'react-router-dom';
import LoginSplashScreen from '../../components/splash/LoginSplashScreen';
import type { User, OnboardingStatus } from '../../types';

/**
 * Route wrapper for LoginSplashScreen
 * Bridges React Router navigation with component props
 * Note: LoginSplashScreen has its own modal state (Terms & Privacy)
 */
const LoginRoute: React.FC = () => {
  const navigate = useNavigate();
  const loaderData = useLoaderData() as { user: Partial<User> | null; onboardingStatus: OnboardingStatus };

  // Redirect authenticated users to appropriate screen
  useEffect(() => {
    if (loaderData?.user) {
      const { onboardingStatus } = loaderData;
      console.log('[LoginRoute] User already authenticated, onboarding status:', onboardingStatus);
      
      if (onboardingStatus === 'complete') {
        console.log('[LoginRoute] Redirecting to /app');
        navigate('/app', { replace: true });
      } else {
        console.log('[LoginRoute] Redirecting to /onboarding');
        navigate('/onboarding', { replace: true });
      }
    }
  }, [loaderData, navigate]);

  const handleComplete = () => {
    // After login, navigate to onboarding (loader will determine correct step)
    navigate('/onboarding');
  };

  const handleBackToLanding = () => {
    // Return to landing page
    navigate('/');
  };

  const handleSetAppState = () => {
    // In router mode, state updates are handled by router loaders
    // This is a no-op since navigation state is derived from URL
    console.log('[LoginRoute] State update ignored in router mode');
  };

  return (
    <LoginSplashScreen
      onComplete={handleComplete}
      onBackToLanding={handleBackToLanding}
      onSetAppState={handleSetAppState}
    />
  );
};

export default LoginRoute;
