import React from 'react';

interface GameProgressBarProps {
  progress: number; // 0-100
  gameTitle?: string;
  className?: string;
  showLabel?: boolean;
}

const GameProgressBar: React.FC<GameProgressBarProps> = ({ 
  progress,
  gameTitle,
  className = '',
  showLabel = true
}) => {
  // 🔍 DEBUG: Log received progress value
  console.log('🎮 [GameProgressBar] Received progress:', progress, 'for game:', gameTitle);
  
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  // Get progress stage label
  const getProgressStage = (p: number): string => {
    if (p === 0) { return 'Not Started'; }
    if (p < 15) { return 'Beginning'; }
    if (p < 35) { return 'Early Game'; }
    if (p < 55) { return 'Mid Game'; }
    if (p < 75) { return 'Late Game'; }
    if (p < 90) { return 'Endgame'; }
    if (p < 100) { return 'Almost Done'; }
    return 'Complete!';
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Label Row */}
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-[#D98C1F]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Player Progress
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#888888]">
              {getProgressStage(clampedProgress)}
            </span>
            <span className="text-xs font-bold text-[#D98C1F] min-w-[36px] text-right">
              {clampedProgress}%
            </span>
          </div>
        </div>
      )}
      
      {/* Progress Track */}
      <div className="relative h-3 bg-[#1A1A1A] rounded-full overflow-hidden border border-[#333333]/60 shadow-inner">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.03) 8px, rgba(255,255,255,0.03) 16px)'
        }} />
        
        {/* Progress Fill with animated gradient */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
          style={{ 
            width: `${clampedProgress}%`,
            background: clampedProgress > 0 
              ? 'linear-gradient(90deg, #D98C1F 0%, #E5A63D 50%, #FFB366 100%)'
              : 'transparent',
            boxShadow: clampedProgress > 0 ? '0 0 8px rgba(217, 140, 31, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none'
          }}
        />
        
        {/* Progress Dot - only show if progress > 0 */}
        {clampedProgress > 0 && (
          <div
            className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-[#D98C1F] transition-all duration-700 ease-out z-10"
            style={{ 
              left: `${Math.max(clampedProgress, 3)}%`,
              transform: `translateX(-50%) translateY(-50%)`
            }}
          >
            {/* Glow effect */}
            <div className="absolute inset-[-4px] bg-[#D98C1F]/15 rounded-full blur-sm" />
          </div>
        )}
        
        {/* Milestone markers */}
        {[25, 50, 75].map(milestone => (
          <div
            key={milestone}
            className={`absolute top-0 bottom-0 w-px transition-colors duration-300 ${
              clampedProgress >= milestone ? 'bg-white/30' : 'bg-white/10'
            }`}
            style={{ left: `${milestone}%` }}
          />
        ))}
      </div>
      
      {/* Hint text when progress is 0 */}
      {clampedProgress === 0 && (
        <p className="text-[10px] text-[#666666] mt-1.5 italic flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Share screenshots to track your {gameTitle || 'game'} progress
        </p>
      )}
    </div>
  );
};

export default GameProgressBar;
