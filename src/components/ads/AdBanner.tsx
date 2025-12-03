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
  const containerRef = useRef<HTMLDivElement>(null);
  const isAdLoaded = useRef(false);
  const adKeyRef = useRef(Date.now()); // Unique key for each mount

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

    // Cleanup function to reset state and remove orphaned iframes
    return () => {
      isAdLoaded.current = false;
      adKeyRef.current = Date.now();
      
      // Clean up any orphaned AdSense iframes in the container
      if (containerRef.current) {
        const iframes = containerRef.current.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          try {
            iframe.remove();
          } catch (e) {
            // Ignore errors during cleanup
          }
        });
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="px-3 sm:px-4 lg:px-6 pt-0 sm:pt-1 flex-shrink-0">
      <div className="bg-gradient-to-r from-gray-100/10 to-gray-200/10 border border-gray-300/20 rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
        {/* 
          Constrain ad height to prevent AdSense from taking too much space on mobile/PWA.
          Mobile: max 90px, Tablet: max 100px, Desktop: max 120px
          Using overflow-hidden to clip any overflow from AdSense iframe
        */}
        <div className="h-[90px] sm:h-[100px] lg:h-[120px] overflow-hidden rounded-lg">
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ 
              display: 'block',
              width: '100%',
              height: '100%',
              maxHeight: '120px'
            }}
            data-ad-client="ca-pub-4482938310886744"
            data-ad-slot="6150844525"
            data-ad-format="horizontal"
            data-full-width-responsive="false"
          />
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
