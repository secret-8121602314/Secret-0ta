import React, { useState, useEffect } from 'react';
import { XMarkIcon, TrophyIcon, StarIcon, FireIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Achievement } from '../services/dailyEngagementService';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
  onShare?: () => void;
  autoDismiss?: boolean;
  dismissDelay?: number;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose,
  onShare,
  autoDismiss = false,
  dismissDelay = 0
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    }
    // Default share behavior
    if (navigator.share) {
      navigator.share({
        title: `I just unlocked "${achievement.title}" on Otakon!`,
        text: `Check out my gaming achievement: ${achievement.description}`,
        url: window.location.href
      });
    }
  };

  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case 'fire':
        return <FireIcon className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />;
      case 'star':
        return <StarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />;
      case 'sparkles':
        return <SparklesIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#FFAB40]" />;
      default:
        return <TrophyIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#D98C1F]" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-2 sm:right-4 z-50 w-72 sm:w-80">
      <div className={`
        bg-gradient-to-r from-[#1C1C1C]/95 to-[#2E2E2E]/95 backdrop-blur-sm
        border border-[#E53A3A]/30 rounded-xl shadow-2xl
        p-4 sm:p-6 text-white transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center">
              {getAchievementIcon(achievement.icon)}
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-[#FFAB40]">Achievement Unlocked!</h3>
              <p className="text-[#FFAB40]/80 text-xs sm:text-sm">Congratulations!</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-[#FFAB40] hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Achievement Details */}
        <div className="mb-4">
          <h4 className="text-lg sm:text-xl font-bold text-white mb-2">{achievement.title}</h4>
          <p className="text-[#FFAB40]/90 text-xs sm:text-sm mb-3">{achievement.description}</p>
          
          {achievement.reward && (
            <div className="bg-white/5 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFAB40]" />
                <span className="text-[#FFAB40] font-medium text-sm">{achievement.reward}</span>
              </div>
            </div>
          )}
          
          {achievement.progress && achievement.target && (
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-[#FFAB40]">Progress</span>
                <span className="text-xs sm:text-sm font-medium text-white">
                  {achievement.progress}/{achievement.target}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 sm:space-x-3">
          <button
            onClick={handleShare}
            className="flex-1 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium hover:from-[#D42A2A] hover:to-[#C87A1A] transition-all duration-200 text-sm"
          >
            Share
          </button>
          <button
            onClick={handleClose}
            className="px-3 sm:px-4 py-2 sm:py-3 border border-[#E53A3A]/30 text-[#FFAB40] rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            Awesome!
          </button>
        </div>


      </div>
    </div>
  );
};

export default AchievementNotification;
