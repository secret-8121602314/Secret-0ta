/**
 * Ad Container Component (Placeholder for Future AdSense Implementation)
 * 
 * This component will display Google AdSense ads for free tier users.
 * Currently shows a placeholder that can be replaced with actual ads.
 * 
 * @todo Implement Google AdSense integration
 */

import React, { useEffect, useState } from 'react';
import type { AdContainerProps } from '../types/ads';
import { adService } from '../services/adService';

const AdContainer: React.FC<AdContainerProps> = ({
  slotId,
  placement,
  format = 'display',
  size = 'responsive',
  className = '',
  fallbackContent,
  onAdLoaded,
  onAdFailed,
}) => {
  const [isAdBlocked, setIsAdBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAd = async () => {
      try {
        // Check for ad blocker
        const blocked = await adService.detectAdBlocker();
        setIsAdBlocked(blocked);

        if (!blocked) {
          // Load the ad
          await adService.loadAd(slotId);
          
          // Track impression
          adService.trackImpression(slotId);
          
          onAdLoaded?.();
        } else {
          onAdFailed?.(new Error('Ad blocker detected'));
        }
      } catch (error) {
        console.error('[AdContainer] Error loading ad:', error);
        onAdFailed?.(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    initAd();
  }, [slotId, onAdLoaded, onAdFailed]);

  // Don't render anything while loading
  if (isLoading) {
    return (
      <div className={`ad-container ad-loading ${className}`}>
        <div className="flex items-center justify-center p-4 text-neutral-400 text-sm">
          Loading...
        </div>
      </div>
    );
  }

  // Show fallback if ad is blocked
  if (isAdBlocked && fallbackContent) {
    return (
      <div className={`ad-container ad-blocked ${className}`}>
        {fallbackContent}
      </div>
    );
  }

  // @todo: Replace with actual AdSense code when implementing
  // Example AdSense implementation:
  // <ins className="adsbygoogle"
  //      style={{ display: 'block' }}
  //      data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
  //      data-ad-slot={slotId}
  //      data-ad-format={format}
  //      data-full-width-responsive={size === 'responsive' ? 'true' : 'false'}>
  // </ins>

  return (
    <div 
      className={`ad-container ad-placeholder ${className}`}
      data-placement={placement}
      data-format={format}
      data-size={size}
    >
      {/* Placeholder for future AdSense implementation */}
      <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-lg p-4 text-center">
        <div className="text-neutral-500 text-xs uppercase tracking-wider mb-2">
          Advertisement
        </div>
        <div className="text-neutral-600 text-sm">
          Ad space reserved for Google AdSense
        </div>
        <div className="text-neutral-700 text-xs mt-1">
          Placement: {placement}
        </div>
      </div>
    </div>
  );
};

export default AdContainer;
