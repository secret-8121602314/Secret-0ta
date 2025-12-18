import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { User, UserTier } from '../../types';
import { authService } from '../../services/authService';
import { getCustomerPortalUrl } from '../../services/lemonsqueezy';
import TrialBanner from '../trial/TrialBanner';
import Logo from '../ui/Logo';
import PaymentModal from './PaymentModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onTrialStart?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  user,
  onTrialStart
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'tier' | 'profile'>('account');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Profile preferences state (from ProfileSetupBanner)
  const [hintStyle, setHintStyle] = useState(user?.profileData?.hintStyle || 'Balanced');
  const [preferredTone, setPreferredTone] = useState(user?.profileData?.preferredTone || 'Encouraging');
  const [spoilerTolerance, setSpoilerTolerance] = useState(user?.profileData?.spoilerTolerance || 'Strict');
  
  // Additional profile preferences (Settings-specific)
  const [playerFocus, setPlayerFocus] = useState(user?.profileData?.playerFocus || 'Story-Driven');
  const [gamingStyle, setGamingStyle] = useState(user?.profileData?.gamingStyle || 'balanced');
  const [experienceLevel, setExperienceLevel] = useState(user?.profileData?.experienceLevel || 'intermediate');
  const [preferredContentStyle, setPreferredContentStyle] = useState(user?.profileData?.preferredContentStyle || 'detailed');

  // Handle checkout completion - close all modals
  const handleCheckoutSuccess = () => {
    console.log('💳 Checkout success - closing all modals');
    setShowPaymentModal(false);
    onClose(); // Close settings modal
  };
  
  // Handle checkout close - close all modals and return to chat
  const handleCheckoutClose = () => {
    console.log('❌ Checkout closed - closing all modals and returning to chat');
    setShowPaymentModal(false);
    onClose(); // Close settings modal too
  };

  if (!user) {

    return null;

  }

  const handleTrialStart = () => {
    // Call parent's onTrialStart to refresh user data
    if (onTrialStart) {
      onTrialStart();
    }
    // Close the modal after trial starts
    onClose();
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
        <div className="flex gap-1 sm:space-x-1 bg-surface/50 rounded-lg p-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 sm:flex-none py-2.5 px-2.5 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors active:scale-95 whitespace-nowrap ${
              activeTab === 'account'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab('tier')}
            className={`flex-1 sm:flex-none py-2.5 px-2.5 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors active:scale-95 whitespace-nowrap ${
              activeTab === 'tier'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="hidden sm:inline">Tier & Usage</span>
            <span className="sm:hidden">Tier</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 sm:flex-none py-2.5 px-2.5 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors active:scale-95 whitespace-nowrap ${
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
            {/* Tier Logo */}
            <div className="flex justify-center">
              <Logo 
                size="xl" 
                userTier={user.tier}
                isOnTrial={Boolean(user.trialExpiresAt && user.trialExpiresAt > Date.now())}
              />
            </div>
            
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

            {/* Notifications Section */}
            <div className="bg-surface/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-text-primary font-medium">Push Notifications</div>
                    <div className="text-sm text-text-secondary">Receive app notifications</div>
                  </div>
                  <button 
                    onClick={async () => {
                      if ('Notification' in window) {
                        if (Notification.permission === 'granted') {
                          // Already enabled - show message
                          new Notification('Otagon', {
                            body: 'Notifications are enabled!',
                            icon: '/images/pwa-icon.png'
                          });
                        } else {
                          // Request permission
                          const permission = await Notification.requestPermission();
                          if (permission === 'granted') {
                            new Notification('Otagon', {
                              body: 'Notifications enabled!',
                              icon: '/images/pwa-icon.png'
                            });
                          }
                        }
                      }
                    }}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      typeof Notification !== 'undefined' && Notification.permission === 'granted'
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-surface-light/50 text-text-secondary hover:bg-primary hover:text-white'
                    }`}
                    title={typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'Notifications enabled - Click to test' : 'Enable notifications'}
                  >
                    {typeof Notification !== 'undefined' && Notification.permission === 'granted' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tier Tab */}
        {activeTab === 'tier' && (
          <div className="space-y-4">
            {/* Tier Logo */}
            <div className="flex flex-col items-center gap-2">
              <Logo 
                size="xl" 
                userTier={user.tier}
                isOnTrial={Boolean(user.trialExpiresAt && user.trialExpiresAt > Date.now())}
              />
              <span className={`text-lg font-semibold ${getTierColor(user.tier)}`}>
                {getTierDisplayName(user.tier)}
              </span>
            </div>
            
            {/* Trial Banner */}
            <div className="overflow-x-auto">
              <TrialBanner
                userTier={user.tier}
                onTrialStart={handleTrialStart}
              />
            </div>
            
            <div className="bg-surface/50 rounded-lg p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4">Monthly Query Usage</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div>
                  <div className="text-xs sm:text-sm text-text-secondary mb-2">Text Queries</div>
                  <div className="text-xl sm:text-2xl font-bold text-text-primary">
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
                  <div className="text-xs sm:text-sm text-text-secondary mb-2">Image Queries</div>
                  <div className="text-xl sm:text-2xl font-bold text-text-primary">
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
              <div className="text-xs sm:text-sm text-text-secondary text-center pt-3 border-t border-surface-light/20">
                Usage resets on the 1st of each month
                {user.tier === 'free' && (
                  <div className="mt-2 text-primary font-medium text-xs sm:text-sm">
                    ⭐ Upgrade to Pro for 350 text + 150 image queries!
                  </div>
                )}
              </div>
            </div>

            {/* Subscription Management */}
            <div className="flex gap-3">
              {user.tier === 'free' ? (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Upgrade Now
                </button>
              ) : (
                <button
                  onClick={() => {
                    const portalUrl = getCustomerPortalUrl();
                    window.open(portalUrl, '_blank');
                  }}
                  className="w-full px-6 py-3 bg-surface-light text-text-primary rounded-lg hover:bg-surface transition-colors font-medium"
                >
                  Manage Subscription
                </button>
              )}
            </div>

          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-surface/50 rounded-lg p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-3 sm:mb-4">Player Profile</h3>
              <p className="text-xs sm:text-sm text-text-secondary mb-4 sm:mb-6">
                Customize how Otagon responds to you. These preferences will affect AI responses across all your game tabs.
              </p>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Hint Style */}
                <div>
                  <label className="text-xs sm:text-sm font-medium text-text-primary mb-2 block">
                    How do you like your hints?
                  </label>
                  <p className="text-xs text-text-secondary mb-2 sm:mb-3">
                    Choose how direct or subtle you want guidance to be
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {[
                      { value: 'Cryptic', label: '🔮 Cryptic' },
                      { value: 'Balanced', label: '⚖️ Balanced' },
                      { value: 'Direct', label: '🎯 Direct' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setHintStyle(option.value as typeof hintStyle)}
                        className={`py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          hintStyle === option.value
                            ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white'
                            : 'bg-surface/50 text-text-secondary hover:bg-surface hover:text-text-primary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Player Focus (from banner) */}
                <div>
                  <label className="text-xs sm:text-sm font-medium text-text-primary mb-2 block">
                    What's your gaming focus?
                  </label>
                  <p className="text-xs text-text-secondary mb-2 sm:mb-3">
                    What type of gamer are you?
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {[
                      { value: 'Story-Driven', label: '📖 Story' },
                      { value: 'Completionist', label: '💯 Complete' },
                      { value: 'Strategist', label: '🧠 Strategy' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setPlayerFocus(option.value as typeof playerFocus)}
                        className={`py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          playerFocus === option.value
                            ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white'
                            : 'bg-surface/50 text-text-secondary hover:bg-surface hover:text-text-primary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Tone */}
                <div>
                  <label className="text-xs sm:text-sm font-medium text-text-primary mb-2 block">
                    Preferred tone?
                  </label>
                  <p className="text-xs text-text-secondary mb-2 sm:mb-3">
                    How should Otagon communicate with you?
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {[
                      { value: 'Encouraging', label: '💪 Encouraging' },
                      { value: 'Professional', label: '💼 Professional' },
                      { value: 'Casual', label: '😎 Casual' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setPreferredTone(option.value as typeof preferredTone)}
                        className={`py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          preferredTone === option.value
                            ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white'
                            : 'bg-surface/50 text-text-secondary hover:bg-surface hover:text-text-primary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spoiler Tolerance */}
                <div>
                  <label className="text-xs sm:text-sm font-medium text-text-primary mb-2 block">
                    Spoiler protection?
                  </label>
                  <p className="text-xs text-text-secondary mb-2 sm:mb-3">
                    How careful should Otagon be about revealing story details?
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {[
                      { value: 'Strict', label: '🔒 Strict' },
                      { value: 'Moderate', label: '🔓 Moderate' },
                      { value: 'Relaxed', label: '🔓 Relaxed' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSpoilerTolerance(option.value as typeof spoilerTolerance)}
                        className={`py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          spoilerTolerance === option.value
                            ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white'
                            : 'bg-surface/50 text-text-secondary hover:bg-surface hover:text-text-primary'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-surface-light/20 pt-4 sm:pt-6">
                  <h4 className="text-sm sm:text-base font-semibold text-text-primary mb-3 sm:mb-4">Additional Preferences</h4>
                </div>

                {/* Gaming Style */}
                <div>
                  <label className="text-xs sm:text-sm font-medium text-text-primary mb-2 block">
                    Gaming Style
                  </label>
                  <p className="text-xs text-text-secondary mb-2 sm:mb-3">
                    What aspect of gaming do you focus on most?
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {['story', 'combat', 'exploration', 'completion', 'balanced'].map((focus) => (
                      <button
                        key={focus}
                        onClick={() => setGamingStyle(focus)}
                        className={`py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          gamingStyle === focus
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
                  <label className="text-xs sm:text-sm font-medium text-text-primary mb-2 block">
                    Experience Level
                  </label>
                  <p className="text-xs text-text-secondary mb-2 sm:mb-3">
                    How experienced are you with games?
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {['beginner', 'intermediate', 'veteran'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setExperienceLevel(level)}
                        className={`py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
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
                  <label className="text-xs sm:text-sm font-medium text-text-primary mb-2 block">
                    Preferred Content Style
                  </label>
                  <p className="text-xs text-text-secondary mb-2 sm:mb-3">
                    How detailed do you want responses to be?
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {['concise', 'detailed', 'comprehensive'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setPreferredContentStyle(style)}
                        className={`py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all ${
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

                {/* Save Button - with proper spacing from content above */}
                <button
                  onClick={async () => {
                    const profileData = {
                      // From ProfileSetupBanner
                      hintStyle,
                      preferredTone,
                      spoilerTolerance,
                      // Additional preferences
                      playerFocus,
                      gamingStyle,
                      experienceLevel,
                      preferredContentStyle
                    };
                    
                    // Update user profile using the correct method
                    if (user?.authUserId) {
                      await authService.updateUserProfile(user.authUserId, profileData);
                    }
                    
                    // Show success message (you can add a toast notification here)
                    onClose();
                  }}
                  className="w-full mt-6 sm:mt-8 py-2.5 sm:py-3 px-4 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] md:hover:from-[#D42A2A] md:hover:to-[#C87A1A] text-white rounded-lg font-medium transition-all md:hover:scale-105 active:scale-95 text-sm sm:text-base"
                >
                  Save Profile Preferences
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Payment Modal */}
      {user && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          user={user}
          onCheckoutSuccess={handleCheckoutSuccess}
          onCheckoutClose={handleCheckoutClose}
        />
      )}
    </Modal>
  );
};

export default SettingsModal;

