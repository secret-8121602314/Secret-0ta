import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { User, UserTier } from '../../types';
import { authService } from '../../services/authService';
import TrialBanner from '../trial/TrialBanner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  user
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'tier' | 'preferences' | 'profile'>('account');
  
  // Profile preferences state
  const [playerFocus, setPlayerFocus] = useState(user?.profileData?.playerFocus || 'balanced');
  const [experienceLevel, setExperienceLevel] = useState(user?.profileData?.experienceLevel || 'intermediate');
  const [preferredContentStyle, setPreferredContentStyle] = useState(user?.profileData?.preferredContentStyle || 'detailed');
  const [spoilerPreference, setSpoilerPreference] = useState(user?.profileData?.spoilerPreference || 'minimal');

  if (!user) {

    return null;

  }


  const handleTrialStart = () => {
    // Refresh user data to reflect trial status
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      // The parent component should handle updating the user state
      // For now, we'll just close the modal to refresh the UI
      onClose();
    }
  };


  const getTierDisplayName = (tier: UserTier) => {
    switch (tier) {
      case 'free':
        return 'Free';
      case 'pro':
        return 'Pro';
      case 'vanguard_pro':
        return 'Vanguard Pro';
      default:
        return tier;
    }
  };

  const getTierColor = (tier: UserTier) => {
    switch (tier) {
      case 'free':
        return 'text-gray-400';
      case 'pro':
        return 'text-blue-400';
      case 'vanguard_pro':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Tab Navigation - Mobile Responsive */}
        <div className="flex space-x-1 bg-surface/50 rounded-lg p-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-shrink-0 py-2.5 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors active:scale-95 whitespace-nowrap min-w-[80px] sm:min-w-0 sm:flex-1 ${
              activeTab === 'account'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab('tier')}
            className={`flex-shrink-0 py-2.5 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors active:scale-95 whitespace-nowrap min-w-[80px] sm:min-w-0 sm:flex-1 ${
              activeTab === 'tier'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="hidden sm:inline">Tier & Usage</span>
            <span className="sm:hidden">Tier</span>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-shrink-0 py-2.5 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors active:scale-95 whitespace-nowrap min-w-[80px] sm:min-w-0 sm:flex-1 ${
              activeTab === 'preferences'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Preferences
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-shrink-0 py-2.5 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors active:scale-95 whitespace-nowrap min-w-[80px] sm:min-w-0 sm:flex-1 ${
              activeTab === 'profile'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Profile
          </button>
        </div>

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="space-y-4">
            <div className="bg-surface/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Account Information</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-text-secondary">Email</label>
                  <div className="mt-1 text-text-primary">{user.email}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-text-secondary">User ID</label>
                  <div className="mt-1 text-text-primary font-mono text-sm">{user.id}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-text-secondary">Current Tier</label>
                  <div className={`mt-1 font-medium ${getTierColor(user.tier)}`}>
                    {getTierDisplayName(user.tier)}
                  </div>
                </div>
                
              </div>
            </div>

          </div>
        )}

        {/* Tier Tab */}
        {activeTab === 'tier' && (
          <div className="space-y-4">
            {/* Trial Banner */}
            <TrialBanner
              userTier={user.tier}
              onTrialStart={handleTrialStart}
            />
            
            <div className="bg-surface/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Monthly Query Usage</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm text-text-secondary mb-2">Text Queries</div>
                  <div className="text-2xl font-bold text-text-primary">
                    {user.usage.textCount} / {user.usage.textLimit}
                  </div>
                  <div className="w-full bg-surface-light/20 rounded-full h-2 mt-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((user.usage.textCount / user.usage.textLimit) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-text-secondary mb-2">Image Queries</div>
                  <div className="text-2xl font-bold text-text-primary">
                    {user.usage.imageCount} / {user.usage.imageLimit}
                  </div>
                  <div className="w-full bg-surface-light/20 rounded-full h-2 mt-2">
                    <div
                      className="bg-secondary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((user.usage.imageCount / user.usage.imageLimit) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Reset Date Info */}
              <div className="text-sm text-text-secondary text-center pt-3 border-t border-surface-light/20">
                Usage resets on the 1st of each month
                {user.tier === 'free' && (
                  <div className="mt-2 text-primary font-medium">
                    ⭐ Upgrade to Pro for 1,583 text + 328 image queries!
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-4">
            <div className="bg-surface/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-text-primary mb-4">App Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-text-primary font-medium">Dark Mode</div>
                    <div className="text-sm text-text-secondary">Use dark theme</div>
                  </div>
                  <div className="w-12 h-6 bg-primary rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-text-primary font-medium">Notifications</div>
                    <div className="text-sm text-text-secondary">Receive app notifications</div>
                  </div>
                  <div className="w-12 h-6 bg-surface-light/30 rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-text-primary font-medium">Auto-save Conversations</div>
                    <div className="text-sm text-text-secondary">Automatically save chat history</div>
                  </div>
                  <div className="w-12 h-6 bg-primary rounded-full relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-surface/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Player Profile</h3>
              <p className="text-sm text-text-secondary mb-6">
                Customize how Otagon responds to you. These preferences will affect AI responses across all your game tabs.
              </p>
              
              <div className="space-y-6">
                {/* Player Focus */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block">
                    Player Focus
                  </label>
                  <p className="text-xs text-text-secondary mb-3">
                    What aspect of gaming do you focus on most?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {['story', 'combat', 'exploration', 'completion', 'balanced'].map((focus) => (
                      <button
                        key={focus}
                        onClick={() => setPlayerFocus(focus)}
                        className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          playerFocus === focus
                            ? 'bg-primary text-white'
                            : 'bg-surface/50 text-text-secondary hover:bg-surface hover:text-text-primary'
                        }`}
                      >
                        {focus.charAt(0).toUpperCase() + focus.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block">
                    Experience Level
                  </label>
                  <p className="text-xs text-text-secondary mb-3">
                    How experienced are you with games?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {['beginner', 'intermediate', 'veteran'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setExperienceLevel(level)}
                        className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          experienceLevel === level
                            ? 'bg-primary text-white'
                            : 'bg-surface/50 text-text-secondary hover:bg-surface hover:text-text-primary'
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Style */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block">
                    Preferred Content Style
                  </label>
                  <p className="text-xs text-text-secondary mb-3">
                    How detailed do you want responses to be?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {['concise', 'detailed', 'comprehensive'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setPreferredContentStyle(style)}
                        className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          preferredContentStyle === style
                            ? 'bg-primary text-white'
                            : 'bg-surface/50 text-text-secondary hover:bg-surface hover:text-text-primary'
                        }`}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spoiler Preference */}
                <div>
                  <label className="text-sm font-medium text-text-primary mb-2 block">
                    Spoiler Preference
                  </label>
                  <p className="text-xs text-text-secondary mb-3">
                    How much story information do you want revealed?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {['none', 'minimal', 'full'].map((pref) => (
                      <button
                        key={pref}
                        onClick={() => setSpoilerPreference(pref)}
                        className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          spoilerPreference === pref
                            ? 'bg-primary text-white'
                            : 'bg-surface/50 text-text-secondary hover:bg-surface hover:text-text-primary'
                        }`}
                      >
                        {pref.charAt(0).toUpperCase() + pref.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={async () => {
                    const profileData = {
                      playerFocus,
                      experienceLevel,
                      preferredContentStyle,
                      spoilerPreference
                    };
                    
                    // Update user profile
                    await authService.updateUserProfile(user.authUserId, profileData);
                    
                    // Show success message (you can add a toast notification here)
                    console.log('Profile preferences saved:', profileData);
                    onClose();
                  }}
                  className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors active:scale-95"
                >
                  Save Profile Preferences
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};

export default SettingsModal;

