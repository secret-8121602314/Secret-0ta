import React, { useState, useEffect } from 'react';
import { ChartBarIcon, FireIcon, TrophyIcon, StarIcon } from '@heroicons/react/24/outline';
import dailyEngagementService, { DailyGoal, SessionProgress } from '../services/dailyEngagementService';

interface ProgressTrackingBarProps {
  gameId?: string;
  gameTitle?: string;
  onViewProgress: () => void;
  onSetGoals: () => void;
}

const ProgressTrackingBar: React.FC<ProgressTrackingBarProps> = ({
  gameId,
  gameTitle,
  onViewProgress,
  onSetGoals
}) => {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [sessionProgress, setSessionProgress] = useState<SessionProgress | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const loadData = () => {
      const dailyGoals = dailyEngagementService.getDailyGoals();
      setGoals(dailyGoals);
      
      if (gameId) {
        const progress = dailyEngagementService.getSessionProgress(gameId);
        setSessionProgress(progress);
      }
    };

    loadData();
    
    // Refresh data every minute
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [gameId]);

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getStreakIcon = (count: number) => {
    if (count >= 7) return <FireIcon className="w-4 h-4 text-orange-500" />;
    if (count >= 3) return <StarIcon className="w-4 h-4 text-yellow-500" />;
    return <TrophyIcon className="w-4 h-4 text-[#E53A3A]" />;
  };

  const totalGoalsCompleted = goals.reduce((sum, goal) => sum + goal.current, 0);
  const totalGoalsTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  const overallProgress = totalGoalsTarget > 0 ? (totalGoalsCompleted / totalGoalsTarget) * 100 : 0;

  if (!gameId || !gameTitle) return null;

  return (
    <div className="bg-gradient-to-r from-[#1C1C1C]/90 to-[#2E2E2E]/90 backdrop-blur-sm border border-[#E53A3A]/30 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#E53A3A]" />
          <div>
            <h4 className="text-xs sm:text-sm font-medium text-white">Session Progress</h4>
            <p className="text-xs text-[#FFAB40] truncate max-w-[120px] sm:max-w-[200px]">{gameTitle}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#FFAB40] hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <ChartBarIcon className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          <button
            onClick={onViewProgress}
            className="text-xs text-[#FFAB40] hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
          >
            View All
          </button>
        </div>
      </div>

      {/* Session Progress */}
      {sessionProgress && (
        <div className="mb-3 p-2 sm:p-3 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#FFAB40]">Story Progress</span>
            <span className="text-xs font-medium text-white">{sessionProgress.progress}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] h-2 rounded-full transition-all duration-500"
              style={{ width: `${sessionProgress.progress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-[#FFAB40]/80">
              📸 {sessionProgress.screenshotsToday} today
            </span>
            <span className="text-[#FFAB40]/80">
              💬 {sessionProgress.questionsToday} questions
            </span>
            <span className="text-[#FFAB40]/80">
              💡 {sessionProgress.newInsights} insights
            </span>
          </div>
        </div>
      )}

      {/* Daily Goals Summary */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#FFAB40]">Daily Goals</span>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-white font-medium">
            {totalGoalsCompleted}/{totalGoalsTarget}
          </span>
          <span className="text-xs text-[#FFAB40]">
            ({overallProgress.toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="w-full bg-white/20 rounded-full h-2 mb-3">
        <div 
          className="bg-gradient-to-r from-[#5CBB7B] to-[#4CAF50] h-2 rounded-full transition-all duration-500"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Expanded Goals View */}
      {isExpanded && (
        <div className="space-y-2 mt-3 pt-3 border-t border-white/20">
          {goals.map((goal) => (
            <div key={goal.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className="text-[#FFAB40] truncate">{goal.title}</span>
                <span className="text-white/60 flex-shrink-0">({goal.current}/{goal.target})</span>
              </div>
              <span className="text-[#5CBB7B] font-medium flex-shrink-0 ml-2">{goal.reward}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2 mt-3 pt-3 border-t border-white/20">
        <button
          onClick={onSetGoals}
          className="flex-1 bg-white/10 text-white py-2 px-3 rounded text-xs font-medium hover:bg-white/20 transition-colors"
        >
          Set Goals
        </button>
        <button
          onClick={onViewProgress}
          className="flex-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white py-2 px-3 rounded text-xs font-medium hover:from-[#D42A2A] hover:to-[#C87A1A] transition-all duration-200"
        >
          View Progress
        </button>
      </div>
    </div>
  );
};

export default ProgressTrackingBar;
