import React, { useState, useEffect } from 'react';
import { XMarkIcon, FireIcon, TrophyIcon, StarIcon } from '@heroicons/react/24/outline';
import dailyEngagementService, { DailyGoal, UserStreak } from '../services/dailyEngagementService';

interface DailyCheckinBannerProps {
  onClose: () => void;
  autoDismiss?: boolean;
  dismissDelay?: number;
}

const DailyCheckinBanner: React.FC<DailyCheckinBannerProps> = ({ 
  onClose, 
  autoDismiss = true, 
  dismissDelay = 10000 
}) => {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [streaks, setStreaks] = useState<UserStreak | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Load daily data
    const dailyGoals = dailyEngagementService.getDailyGoals();
    const userStreaks = dailyEngagementService.getUserStreaks();
    
    setGoals(dailyGoals);
    setStreaks(userStreaks);
    
    // Update login streak
    dailyEngagementService.updateLoginStreak();
    
    // Auto-dismiss after delay
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for fade out animation
      }, dismissDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissDelay, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    dailyEngagementService.markDailyCheckinShown();
    setTimeout(onClose, 300);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getStreakIcon = (count: number) => {
    if (count >= 7) return <FireIcon className="w-5 h-5 text-orange-500" />;
    if (count >= 3) return <StarIcon className="w-5 h-5 text-yellow-500" />;
    return <TrophyIcon className="w-5 h-5 text-blue-500" />;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className={`
        bg-gradient-to-r from-blue-900/95 to-purple-900/95 backdrop-blur-sm
        border border-blue-500/30 rounded-xl shadow-2xl
        p-6 text-white transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <TrophyIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Daily Gaming Check-In</h3>
              <p className="text-blue-200 text-sm">Track your progress and earn rewards</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-blue-200 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Streaks */}
        {streaks && (
          <div className="mb-4 p-3 bg-white/10 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-200">Current Streaks</span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getStreakIcon(streaks.dailyLogin)}
                  <span className="text-sm font-medium">{streaks.dailyLogin} days</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrophyIcon className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{streaks.gameDays} games</span>
                </div>
                <div className="flex items-center space-x-2">
                  <StarIcon className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">{streaks.insightDays} insights</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily Goals */}
        <div className="space-y-3">
          <h4 className="font-semibold text-blue-100">Today's Goals</h4>
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h5 className="font-medium text-white">{goal.title}</h5>
                  <p className="text-xs text-blue-200">{goal.description}</p>
                </div>
                <span className="text-xs text-green-400 font-medium">{goal.reward}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage(goal.current, goal.target)}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-blue-200">
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
        <div className="flex space-x-3 mt-4">
          <button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200">
            View Full Progress
          </button>
          <button className="px-4 py-2 border border-blue-400/30 text-blue-200 rounded-lg hover:bg-white/10 transition-colors">
            Set Goals
          </button>
        </div>

        {/* Auto-dismiss indicator */}
        {autoDismiss && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-blue-300">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span>Auto-dismissing in {Math.ceil(dismissDelay / 1000)}s</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyCheckinBanner;
