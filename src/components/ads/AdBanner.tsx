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
      <div className="bg-gradient-to-r from-gray-100/10 to-gray-200/10 border border-gray-300/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="min-h-[64px] sm:min-h-[80px] lg:min-h-[96px] overflow-hidden rounded-lg">
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-4482938310886744"
            data-ad-slot="6150844525"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
