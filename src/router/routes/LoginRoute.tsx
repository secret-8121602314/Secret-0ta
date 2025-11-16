import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginSplashScreen from '../../components/splash/LoginSplashScreen';

/**
 * Route wrapper for LoginSplashScreen
 * Bridges React Router navigation with component props
 * Note: LoginSplashScreen has its own modal state (Terms & Privacy)
 */
const LoginRoute: React.FC = () => {
  const navigate = useNavigate();

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
