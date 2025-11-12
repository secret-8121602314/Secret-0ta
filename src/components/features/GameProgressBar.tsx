import React from 'react';

interface GameProgressBarProps {
  progress: number; // 0-100
  gameTitle?: string;
  className?: string;
}

const GameProgressBar: React.FC<GameProgressBarProps> = ({ 
  progress,
  className = '' 
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={`relative ${className}`}>
      {/* Progress Track */}
      <div className="relative h-2 bg-surface-light/20 rounded-full overflow-hidden">
        {/* Progress Fill */}
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
        
        {/* Progress Dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-primary transition-all duration-500 ease-out"
          style={{ 
            left: `${clampedProgress}%`,
            transform: `translateX(-50%) translateY(-50%)`
          }}
        >
          {/* Pulse animation for recent updates */}
          <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
        </div>
      </div>
    </div>
  );
};

export default GameProgressBar;
