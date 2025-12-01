import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCallback from '../../components/auth/AuthCallback';

/**
 * Route wrapper for AuthCallback
 * Handles OAuth callback flow in React Router mode
 */
const AuthCallbackRoute: React.FC = () => {
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
        // After successful OAuth, navigate to onboarding
    // The onboarding loader will determine the correct step
    navigate('/earlyaccess/onboarding');
  };

  const handleAuthError = (error: string) => {
    console.error('[AuthCallbackRoute] Auth error:', error);
    // On error, navigate back to landing page
    navigate('/');
  };

  return (
    <AuthCallback
      onAuthSuccess={handleAuthSuccess}
      onAuthError={handleAuthError}
    />
  );
};

export default AuthCallbackRoute;
