import React from 'react';

interface SimpleLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const SimpleLoadingSpinner: React.FC<SimpleLoadingSpinnerProps> = ({ 
  size = 'md', 
  color = '#FF4D4D',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div 
        className="w-full h-full border-2 border-gray-300 border-t-current rounded-full animate-spin"
        style={{ borderTopColor: color }}
      />
    </div>
  );
};

export default SimpleLoadingSpinner;
