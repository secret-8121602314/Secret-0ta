import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface TypingIndicatorProps {
  variant?: 'dots' | 'skeleton' | 'wave' | 'circular' | 'lottie';
  showText?: boolean;
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  variant = 'lottie', 
  showText = true, 
  className = '' 
}) => {
  // Lottie animation (new default)
  if (variant === 'lottie') {
    return (
      <div className={`flex items-center gap-3 py-3 px-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30 ${className}`}>
        <div className="w-8 h-8">
          <DotLottieReact
            src="https://lottie.host/5208dfc0-fcec-424d-a426-e2d8988bf9fa/oiI54cVHly.lottie"
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        {showText && <span className="text-sm text-[#A3A3A3] font-medium">AI is thinking...</span>}
      </div>
    );
  }

  // Dots animation (original)
  if (variant === 'dots') {
    return (
      <div className={`flex items-center gap-2 py-2 px-3 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30 ${className}`}>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-[#FF4D4D] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-[#FFAB40] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-[#5CBB7B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        {showText && <span className="text-sm text-[#A3A3A3] font-medium">AI is thinking...</span>}
      </div>
    );
  }

  // Skeleton animation
  if (variant === 'skeleton') {
    return (
      <div className={`flex flex-col gap-3 py-3 px-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gradient-to-r from-[#FF4D4D]/20 to-[#FFAB40]/20 rounded animate-pulse" style={{ width: '60%' }}></div>
            <div className="h-3 bg-gradient-to-r from-[#FFAB40]/20 to-[#5CBB7B]/20 rounded animate-pulse" style={{ width: '80%' }}></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gradient-to-r from-[#5CBB7B]/20 to-[#FF4D4D]/20 rounded animate-pulse"></div>
          <div className="h-4 bg-gradient-to-r from-[#FF4D4D]/20 to-[#FFAB40]/20 rounded animate-pulse" style={{ width: '70%' }}></div>
          <div className="h-4 bg-gradient-to-r from-[#FFAB40]/20 to-[#5CBB7B]/20 rounded animate-pulse" style={{ width: '90%' }}></div>
        </div>
        {showText && <span className="text-sm text-[#A3A3A3] font-medium">AI is thinking...</span>}
      </div>
    );
  }

  // Wave animation
  if (variant === 'wave') {
    return (
      <div className={`flex items-center gap-3 py-3 px-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30 ${className}`}>
        <div className="flex items-center space-x-1">
          <div className="w-1 h-4 bg-[#FF4D4D] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-4 bg-[#FFAB40] rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1 h-4 bg-[#5CBB7B] rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
          <div className="w-1 h-4 bg-[#FF4D4D] rounded-full animate-pulse" style={{ animationDelay: '450ms' }}></div>
        </div>
        {showText && <span className="text-sm text-[#A3A3A3] font-medium">AI is thinking...</span>}
      </div>
    );
  }

  // Circular progress
  if (variant === 'circular') {
    return (
      <div className={`flex items-center gap-3 py-3 px-4 bg-[#2E2E2E]/30 rounded-lg border border-[#424242]/30 ${className}`}>
        <div className="relative w-8 h-8">
          {/* Outer ring */}
          <div className="absolute inset-0 w-8 h-8 border-2 border-[#424242]/30 rounded-full"></div>
          {/* Animated ring */}
          <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-t-[#E53A3A] border-r-[#D98C1F] border-b-transparent rounded-full animate-spin"></div>
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] rounded-full animate-pulse"></div>
          </div>
        </div>
        {showText && <span className="text-sm text-[#A3A3A3] font-medium">AI is thinking...</span>}
      </div>
    );
  }

  return null;
};

export default TypingIndicator;