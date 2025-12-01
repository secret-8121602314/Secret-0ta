import React from 'react';
import { useNavigate, useLoaderData } from 'react-router-dom';
import InitialSplashScreen from '../../components/splash/InitialSplashScreen';
import type { User } from '../../types';

/**
 * Route wrapper for InitialSplashScreen
 * Bridges React Router navigation with component props
 */
const InitialOnboardingRoute: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useLoaderData() as { user: User | null };

  const handleComplete = () => {
    // After initial splash, navigate to how-to-use screen
    navigate('/onboarding/how-to-use');
  };

  return (
    <InitialSplashScreen
      onComplete={handleComplete}
      user={user}
    />
  );
};

export default InitialOnboardingRoute;
