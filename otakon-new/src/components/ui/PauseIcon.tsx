import React from 'react';

interface PauseIconProps {
  className?: string;
}

const PauseIcon: React.FC<PauseIconProps> = ({ className = 'w-4 h-4' }) => {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
    </svg>
  );
};

export default PauseIcon;
