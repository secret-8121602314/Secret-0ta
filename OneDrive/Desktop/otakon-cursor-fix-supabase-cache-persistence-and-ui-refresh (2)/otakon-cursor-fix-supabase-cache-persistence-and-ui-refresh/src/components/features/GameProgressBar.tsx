import React from 'react';

interface GameProgressBarProps {
  progress: number; // 0-100
  gameTitle?: string;
  className?: string;
}

const GameProgressBar: React.FC<GameProgressBarProps> = ({ 
  progress, 
  gameTitle,
  className = '' 
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={`relative ${className}`}>
      {/* Progress Label */}
      {gameTitle && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary">Game Progress</span>
          <span className="text-xs text-text-primary font-medium">{Math.round(clampedProgress)}%</span>
        </div>
      )}
      
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
      
      {/* Progress Milestones */}
      <div className="flex justify-between mt-1">
        {[0, 25, 50, 75, 100].map((milestone) => (
          <div
            key={milestone}
            className={`text-xs ${
              clampedProgress >= milestone 
                ? 'text-primary font-medium' 
                : 'text-text-muted'
            }`}
          >
            {milestone === 0 ? 'Start' : milestone === 100 ? 'Complete' : `${milestone}%`}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameProgressBar;
