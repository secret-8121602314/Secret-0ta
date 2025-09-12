import { lazy } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// Lazy load heavy modals that are conditionally rendered
export const LazySettingsModal = lazy(() => import('./SettingsModal'));
export const LazyConnectionModal = lazy(() => import('./ConnectionModal'));
export const LazyHandsFreeModal = lazy(() => import('./HandsFreeModal'));
export const LazyPlayerProfileSetupModal = lazy(() => 
  import('./PlayerProfileSetupModal').then(module => ({ default: module.PlayerProfileSetupModal }))
);
export const LazyGameProgressModal = lazy(() => import('./GameProgressModal'));
export const LazyOtakuDiaryModal = lazy(() => 
  import('./OtakuDiaryModal').then(module => ({ default: module.OtakuDiaryModal }))
);
export const LazyWishlistModal = lazy(() => 
  import('./WishlistModal').then(module => ({ default: module.WishlistModal }))
);
export const LazyTierUpgradeModal = lazy(() => 
  import('./TierUpgradeModal').then(module => ({ default: module.TierUpgradeModal }))
);
export const LazyInsightActionModal = lazy(() => import('./InsightActionModal'));
export const LazyFeedbackModal = lazy(() => import('./FeedbackModal'));
export const LazyCreditModal = lazy(() => import('./CreditModal'));
export const LazyConfirmationModal = lazy(() => import('./ConfirmationModal'));

// Lazy load heavy screens
export const LazyUpgradeSplashScreen = lazy(() => import('./UpgradeSplashScreen'));
export const LazyProFeaturesSplashScreen = lazy(() => import('./ProFeaturesSplashScreen'));
export const LazyTierSplashScreen = lazy(() => import('./TierSplashScreen'));

// Lazy load feature components that aren't always needed
export const LazyLandingPage = lazy(() => import('./new-landing/LandingPage'));
export const LazyPerformanceDashboard = lazy(() => import('./PerformanceDashboard'));
export const LazyCachePerformanceDashboard = lazy(() => import('./CachePerformanceDashboard'));

// Simple loading fallback component (animation only) - Responsive for all devices
export const LoadingFallback: React.FC<{ message?: string }> = ({ message }) => (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 loading-overlay">
    <div className="flex flex-col items-center space-y-4 p-6 loading-fade-in">
      {/* Simple CSS spinner instead of Lottie for better performance */}
      <div className="loading-spinner-responsive relative">
        <div className="w-full h-full border-2 border-gray-300 border-t-[#E53A3A] rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-full h-full border-2 border-transparent border-r-[#D98C1F] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      {message && (
        <p className="text-white text-sm font-medium text-center max-w-xs">
          {message}
        </p>
      )}
    </div>
  </div>
);

// Error boundary fallback
export const LazyErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md">
      <h3 className="text-lg font-semibold text-red-600 mb-2">Loading Error</h3>
      <p className="text-gray-700 mb-4">
        Failed to load component. Please try again.
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Reload App
      </button>
    </div>
  </div>
);
