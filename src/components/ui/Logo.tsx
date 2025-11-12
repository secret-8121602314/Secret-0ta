import React from 'react';
import { getPublicPath } from '../../utils/publicPath';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  spin?: boolean;
  spinOnce?: boolean;
  bounce?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', spin = false, spinOnce = false, bounce = false }) => {
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

  return (
    <img
      src={getPublicPath('/images/otagon-logo.png')}
      alt="Otagon Logo"
      className={`${sizeClasses[size]} ${className}`}
      style={{ 
        objectFit: 'contain',
        animation: getAnimation()
      }}
    />
  );
};

export default Logo;
