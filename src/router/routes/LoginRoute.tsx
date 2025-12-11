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
            if (onboardingStatus === 'complete') {
                navigate('/app', { replace: true });
      } else {
                navigate('/onboarding', { replace: true });
      }
    }
  }, [loaderData, navigate]);

  const handleComplete = async () => {
    // After login completes, wait a moment for Supabase session to settle
    // Then navigate to onboarding (loader will fetch fresh user data)
    await new Promise(resolve => setTimeout(resolve, 100));
    navigate('/onboarding', { replace: true });
  };

  const handleBackToLanding = () => {
    // Return to landing page
    navigate('/');
  };

  const handleSetAppState = () => {
    // In router mode, state updates are handled by router loaders
    // This is a no-op since navigation state is derived from URL
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
