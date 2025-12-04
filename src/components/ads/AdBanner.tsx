/**
 * AdBanner Component for Google AdSense
 * 
 * This component properly loads AdSense ads in React by:
 * 1. Rendering the <ins> element first
 * 2. Using useEffect to call adsbygoogle.push() after mount
 */

import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const AdBanner: React.FC = () => {
  const adRef = useRef<HTMLModElement>(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    // Only push the ad once per component mount
    if (isAdLoaded.current) {
      return;
    }
    
    try {
      // Check if adsbygoogle is available
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({});
        isAdLoaded.current = true;
      }
    } catch (error) {
      console.error('[AdBanner] Error loading ad:', error);
    }
  }, []);

  return (
    <div className="px-3 sm:px-4 lg:px-6 pt-0 sm:pt-1 flex-shrink-0">
      <div className="bg-gradient-to-r from-gray-100/10 to-gray-200/10 border border-gray-300/20 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
        {/* 
          Constrain ad height to prevent AdSense from taking too much space on mobile/PWA.
          Mobile: 75px, Tablet: 84px, Desktop: 100px (50% increase from previous sizes)
          Using overflow-hidden to clip any overflow from AdSense iframe
        */}
        <div 
          className="overflow-hidden rounded-lg flex items-center justify-center"
          style={{ height: '75px' }}
        >
          <ins
            ref={adRef}
            className="adsbygoogle w-full"
            style={{ 
              display: 'block',
              width: '100%',
              height: '75px',
              maxHeight: '75px'
            }}
            data-ad-client="ca-pub-4482938310886744"
            data-ad-slot="6150844525"
            data-ad-format="display"
            data-width="300"
            data-height="75"
            data-full-width-responsive="false"
          />
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
