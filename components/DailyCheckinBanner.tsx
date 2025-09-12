import React, { useState, useEffect } from 'react';
import { DailyGoal, UserStreak } from '../services/dailyEngagementService';
import { DailyEngagementService } from '../services/dailyEngagementService';
import { XMarkIcon, FireIcon, TrophyIcon, StarIcon } from '@heroicons/react/24/outline';
// Dynamic import to avoid circular dependency
// import dailyEngagementService, { DailyGoal, UserStreak } from '../services/dailyEngagementService';

interface DailyCheckinBannerProps {
  onClose: () => void;
  autoDismiss?: boolean;
  dismissDelay?: number;
}

const DailyCheckinBanner: React.FC<DailyCheckinBannerProps> = ({ 
  onClose, 
  autoDismiss = false, 
  dismissDelay = 0 
}) => {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [streaks, setStreaks] = useState<UserStreak | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const loadDailyData = async () => {
      try {
        const dailyEngagementService = DailyEngagementService.getInstance();
        const dailyGoals = dailyEngagementService.getDailyGoals();
        const userStreaks = dailyEngagementService.getUserStreaks();
        
        setGoals(dailyGoals);
        setStreaks(userStreaks);
        
        // Update login streak
        dailyEngagementService.updateLoginStreak();
      } catch (error) {
        console.error('Failed to load daily data:', error);
      }
    };
    
    loadDailyData();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    const dailyEngagementService = DailyEngagementService.getInstance();
    dailyEngagementService.markDailyCheckinShown();
    setTimeout(onClose, 300);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getStreakIcon = (count: number) => {
    if (count >= 7) return <FireIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />;
    if (count >= 3) return <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />;
    return <TrophyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#E53A3A]" />;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm sm:max-w-md lg:max-w-lg px-2 sm:px-4">
      <div className={`
        bg-gradient-to-r from-[#1C1C1C]/95 to-[#2E2E2E]/95 backdrop-blur-sm
        border border-[#E53A3A]/30 rounded-xl shadow-2xl
        p-4 sm:p-6 text-white transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center">
              <TrophyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Daily Gaming Check-In</h3>
              <p className="text-[#FFAB40] text-xs sm:text-sm">Track your progress and earn rewards</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-[#FFAB40] hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Streaks */}
        {streaks && (
          <div className="mb-4 p-3 bg-white/5 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <span className="text-xs sm:text-sm text-[#FFAB40] font-medium">Current Streaks</span>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {getStreakIcon(streaks.dailyLogin)}
                  <span className="text-xs sm:text-sm font-medium">{streaks.dailyLogin} days</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <TrophyIcon className="w-4 h-4 text-[#D98C1F]" />
                  <span className="text-xs sm:text-sm font-medium">{streaks.gameDays} games</span>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <StarIcon className="w-4 h-4 text-[#5CBB7B]" />
                  <span className="text-xs sm:text-sm font-medium">{streaks.insightDays} insights</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily Goals */}
        <div className="space-y-2 sm:space-y-3">
          <h4 className="font-semibold text-[#FFAB40] text-sm sm:text-base">Today's Goals</h4>
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white/5 rounded-lg p-2 sm:p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-white text-sm sm:text-base truncate">{goal.title}</h5>
                  <p className="text-xs text-[#FFAB40]/80 truncate">{goal.description}</p>
                </div>
                <span className="text-xs text-[#5CBB7B] font-medium ml-2 flex-shrink-0">{goal.reward}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage(goal.current, goal.target)}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-[#FFAB40]/80">
                  {goal.current} / {goal.target} completed
                </span>
                <span className="text-white font-medium">
                  {getProgressPercentage(goal.current, goal.target).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
          <button
            onClick={() => {
              // Navigate to progress tracking or goals
              console.log('View Full Progress clicked');
              // You can implement navigation here
            }}
            className="flex-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white py-2 px-4 rounded-lg font-medium hover:from-[#D42A2A] hover:to-[#C87A1A] transition-all duration-200 text-sm sm:text-base"
          >
            View Full Progress
          </button>
          
          <button
            onClick={() => {
              // Set daily goals
              console.log('Set Goals clicked');
              // You can implement goal setting here
            }}
            className="flex-1 bg-white/10 text-white py-2 px-4 rounded-lg font-medium hover:bg-white/20 transition-colors text-sm sm:text-base"
          >
            Set Goals
          </button>
        </div>


      </div>
    </div>
  );
};

export default DailyCheckinBanner;
