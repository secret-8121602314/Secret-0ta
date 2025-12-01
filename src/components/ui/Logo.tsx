import React from 'react';
import { getPublicPath } from '../../utils/publicPath';
import { UserTier } from '../../types';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  spin?: boolean;
  spinOnce?: boolean; // New: rotates once and stops
  bounce?: boolean;
  userTier?: UserTier;
  isOnTrial?: boolean; // Optional: indicates user is on a pro trial
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', spin = false, spinOnce = false, bounce = false, userTier, isOnTrial = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const getAnimation = () => {
    const animations = [];
    if (bounce) {
      animations.push('bounce 2s infinite');
    }
    if (spinOnce) {
      animations.push('spin-once 2s ease-in-out forwards');
    } else if (spin) {
      animations.push('spin 6s linear infinite');
    }
    return animations.length > 0 ? animations.join(', ') : 'none';
  };

  // Get tier-specific icon path
  const getTierIcon = () => {
    // Pro trial users should show pro icon
    if (isOnTrial) {
      return getPublicPath('/images/icons/pro.png');
    }
    
    switch (userTier) {
      case 'vanguard_pro':
        return getPublicPath('/images/icons/vanguard.png');
      case 'pro':
        return getPublicPath('/images/icons/pro.png');
      case 'free':
        return getPublicPath('/images/icons/free.png');
      default:
        // Default to original logo if no tier specified
        return getPublicPath('/images/otagon-logo.png');
    }
  };

  const logoSrc = getTierIcon();
  const altText = userTier ? `Otagon ${userTier} Logo` : 'Otagon Logo';

  return (
    <img
      src={logoSrc}
      alt={altText}
      className={`${sizeClasses[size]} ${className}`}
      style={{ 
        filter: 'drop-shadow(0 0 24px rgba(255, 140, 0, 0.3))',
        objectFit: 'contain',
        animation: getAnimation()
      }}
    />
  );
};

export default Logo;
