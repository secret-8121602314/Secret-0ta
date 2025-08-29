import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LottieLoaderProps {
  variant?: 'ai-thinking' | 'loading' | 'success' | 'error' | 'connecting';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

const LottieLoader: React.FC<LottieLoaderProps> = ({
  variant = 'ai-thinking',
  size = 'md',
  showText = true,
  className = '',
  loop = true,
  autoplay = true
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // Lottie animation sources for different variants
  const lottieSources = {
    'ai-thinking': 'https://lottie.host/5208dfc0-fcec-424d-a426-e2d8988bf9fa/oiI54cVHly.lottie',
    'loading': 'https://lottie.host/5208dfc0-fcec-424d-a426-e2d8988bf9fa/oiI54cVHly.lottie', // You can replace with a different loading animation
    'success': 'https://lottie.host/5208dfc0-fcec-424d-a426-e2d8988bf9fa/oiI54cVHly.lottie', // You can replace with a success animation
    'error': 'https://lottie.host/5208dfc0-fcec-424d-a426-e2d8988bf9fa/oiI54cVHly.lottie', // You can replace with an error animation
    'connecting': 'https://lottie.host/5208dfc0-fcec-424d-a426-e2d8988bf9fa/oiI54cVHly.lottie' // You can replace with a connection animation
  };

  // Text for different variants
  const variantText = {
    'ai-thinking': 'AI is thinking...',
    'loading': 'Loading...',
    'success': 'Success!',
    'error': 'Error occurred',
    'connecting': 'Connecting...'
  };

  // Background styling for different variants
  const variantStyles = {
    'ai-thinking': 'bg-[#2E2E2E]/30 border-[#424242]/30',
    'loading': 'bg-[#2E2E2E]/30 border-[#424242]/30',
    'success': 'bg-green-500/20 border-green-500/30',
    'error': 'bg-red-500/20 border-red-500/30',
    'connecting': 'bg-blue-500/20 border-blue-500/30'
  };

  return (
    <div className={`flex items-center gap-3 py-3 px-4 rounded-lg border ${variantStyles[variant]} ${className}`}>
      <div className={sizeClasses[size]}>
        <DotLottieReact
          src={lottieSources[variant]}
          loop={loop}
          autoplay={autoplay}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      {showText && (
        <span className={`text-sm font-medium ${
          variant === 'success' ? 'text-green-400' :
          variant === 'error' ? 'text-red-400' :
          variant === 'connecting' ? 'text-blue-400' :
          'text-[#A3A3A3]'
        }`}>
          {variantText[variant]}
        </span>
      )}
    </div>
  );
};

export default LottieLoader;
