import React, { useEffect, useState, useCallback } from 'react';

interface ScreenshotFlashProps {
  show: boolean;
  isMulti?: boolean;
  onHide: () => void;
}

export const ScreenshotFlash: React.FC<ScreenshotFlashProps> = ({ show, isMulti, onHide }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Memoize onHide to prevent unnecessary effect re-runs
  const stableOnHide = useCallback(() => {
    onHide();
  }, [onHide]);

  useEffect(() => {
    if (show) {
      // Start showing and animating
      setIsVisible(true);
      setIsAnimating(true);
      
      // Animation duration is 800ms - start fade out slightly before it ends
      const fadeTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 700);
      
      // Wait for fade-out transition to complete, then call onHide
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        stableOnHide();
      }, 1000); // 700ms animation + 300ms fade transition
      
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [show, stableOnHide]);

  if (!show && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 backdrop-blur-lg bg-black/60" />
      
      {/* Flash content */}
      <div
        className={`relative flex flex-col items-center justify-center gap-4 transition-transform duration-300 ${
          isAnimating ? 'scale-100' : 'scale-95'
        }`}
      >
        {/* Screenshot icon */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl backdrop-blur-md border-2 border-emerald-400/50 shadow-2xl shadow-emerald-500/30">
          <svg
            viewBox="0 0 64 64"
            className="w-16 h-16 sm:w-20 sm:h-20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="8"
              y="8"
              width="48"
              height="36"
              rx="4"
              stroke="#10b981"
              strokeWidth="2.5"
              fill="none"
            />
            <circle cx="32" cy="26" r="6" fill="#FFAB40" />
            <path d="M16 44 L48 44" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M20 48 L44 48" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        
        {/* Text */}
        <div className="px-6 py-3 bg-gradient-to-r from-surface/95 to-surface-light/95 backdrop-blur-md rounded-xl border border-emerald-400/30 shadow-xl">
          <p className="text-lg sm:text-xl font-semibold text-emerald-400 whitespace-nowrap">
            {isMulti ? 'Screenshots Captured' : 'Screenshot Captured'}
          </p>
        </div>
      </div>
    </div>
  );
};
