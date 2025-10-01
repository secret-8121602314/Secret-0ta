import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
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
      className={`${sizeClasses[size]} ${className}`}
      style={{ 
        filter: 'drop-shadow(0 0 24px rgba(255, 140, 0, 0.3))',
        objectFit: 'contain'
      }}
    />
  );
};

export default Logo;
