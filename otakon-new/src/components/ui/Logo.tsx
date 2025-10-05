import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  spin?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', spin = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <img
      src="/images/Dragon Circle Logo Design.png"
      alt="Otagon Logo"
      className={`${sizeClasses[size]} ${className} animate-bounce`}
      style={{ 
        filter: 'drop-shadow(0 0 24px rgba(255, 140, 0, 0.3))',
        objectFit: 'contain',
        animation: spin ? 'bounce 2s infinite, spin 6s linear infinite' : 'bounce 2s infinite'
      }}
    />
  );
};

export default Logo;
