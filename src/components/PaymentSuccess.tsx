import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { authService } from '../services/authService';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Refresh user data to get updated subscription
    const refreshUserData = async () => {
      await authService.refreshUser();
      
      // ✅ Set flag to show upgrade splash when user lands on /app
      localStorage.setItem('otakon_show_upgrade_splash', 'true');
      
      // Redirect to main app after 3 seconds
      setTimeout(() => {
        navigate('/app');
      }, 3000);
    };

    refreshUserData();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full">
          <CheckCircleIcon className="w-16 h-16 text-green-500" />
        </div>

        {/* Success Message */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center justify-center gap-2">
            Payment Successful!
            <SparklesIcon className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-text-secondary text-lg">
            Your subscription has been activated. Welcome to the premium experience!
          </p>
        </div>

        {/* Status Card */}
        <div className="p-6 bg-surface/50 rounded-xl space-y-3 border border-surface-light">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Status</span>
            <span className="text-green-500 font-medium flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Active
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Access Level</span>
            <span className="text-primary font-medium">Premium</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Redirecting in</span>
            <span className="text-text-primary font-medium">3 seconds...</span>
          </div>
        </div>

        {/* Premium Features Preview */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
          <p className="text-sm text-text-secondary mb-2">You now have access to:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1">
              <CheckCircleIcon className="w-3 h-3 text-primary" />
              <span>500 queries/month</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircleIcon className="w-3 h-3 text-primary" />
              <span>Batch analysis</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircleIcon className="w-3 h-3 text-primary" />
              <span>Voice mode</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircleIcon className="w-3 h-3 text-primary" />
              <span>No ads</span>
            </div>
          </div>
        </div>

        {/* Manual Navigation Button */}
        <button
          onClick={() => navigate('/app')}
          className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          Go to Dashboard Now
        </button>

        <p className="text-xs text-text-muted">
          Thank you for upgrading! If you have any questions, reach out to our support team.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
