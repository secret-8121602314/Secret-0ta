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
  autoDismiss = true,
  dismissDelay = 8000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(dismissDelay / 1000);

  useEffect(() => {
    // Auto-dismiss countdown
    if (autoDismiss) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsVisible(false);
            setTimeout(onClose, 300);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [autoDismiss, dismissDelay, onClose]);

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
        return <FireIcon className="w-8 h-8 text-orange-500" />;
      case 'star':
        return <StarIcon className="w-8 h-8 text-yellow-500" />;
      case 'sparkles':
        return <SparklesIcon className="w-8 h-8 text-purple-500" />;
      default:
        return <TrophyIcon className="w-8 h-8 text-yellow-500" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <div className={`
        bg-gradient-to-r from-yellow-900/95 to-orange-900/95 backdrop-blur-sm
        border border-yellow-500/30 rounded-xl shadow-2xl
        p-6 text-white transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              {getAchievementIcon(achievement.icon)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-yellow-100">Achievement Unlocked!</h3>
              <p className="text-yellow-200 text-sm">Congratulations!</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-yellow-200 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Achievement Details */}
        <div className="mb-4">
          <h4 className="text-xl font-bold text-white mb-2">{achievement.title}</h4>
          <p className="text-yellow-100 text-sm mb-3">{achievement.description}</p>
          
          {achievement.reward && (
            <div className="bg-white/10 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2">
                <SparklesIcon className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-200 font-medium">{achievement.reward}</span>
              </div>
            </div>
          )}
          
          {achievement.progress && achievement.target && (
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-yellow-200">Progress</span>
                <span className="text-sm font-medium text-white">
                  {achievement.progress}/{achievement.target}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleShare}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 px-4 rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition-all duration-200"
          >
            Share
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-yellow-400/30 text-yellow-200 rounded-lg hover:bg-white/10 transition-colors"
          >
            Awesome!
          </button>
        </div>

        {/* Auto-dismiss indicator */}
        {autoDismiss && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-yellow-300">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span>Auto-dismissing in {timeRemaining}s</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementNotification;
