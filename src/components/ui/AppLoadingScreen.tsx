/**
 * App Loading Screen Component
 * Provides a consistent, animated loading experience across the app
 * Uses BlinkBlur animation from react-loading-indicators
 */

import React from 'react';
import { BlinkBlur } from 'react-loading-indicators';
import { cn } from '../../lib/utils';

interface AppLoadingScreenProps {
  /** Size of the loader */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
  /** Whether to show full screen or inline */
  fullScreen?: boolean;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  size = 'md',
  className = '',
  fullScreen = true,
}) => {
  const sizeMap = {
    sm: 'small',
    md: 'medium',
    lg: 'large',
  } as const;

  const loader = (
    <BlinkBlur 
      color="#ff4d00" 
      size={sizeMap[size]} 
      text="" 
      textColor="" 
    />
  );

  if (fullScreen) {
    return (
      <div className={cn('h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] flex items-center justify-center', className)}>
        {loader}
      </div>
    );
  }

  return (
    <div className={cn('h-full bg-background flex items-center justify-center', className)}>
      {loader}
    </div>
  );
};

export default AppLoadingScreen;
