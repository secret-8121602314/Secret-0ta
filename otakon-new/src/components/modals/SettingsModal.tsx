import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { User, UserTier } from '../../types';
import { authService } from '../../services/authService';

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
  const [activeTab, setActiveTab] = useState<'account' | 'tier' | 'preferences'>('account');

  if (!user) return null;

  const handleLogout = async () => {
    await authService.signOut();
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
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-surface/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'account'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab('tier')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'tier'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Tier & Usage
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'preferences'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Preferences
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

            <div className="flex justify-end">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-red-400 border-red-400/20 hover:bg-red-500/10"
              >
                Sign Out
              </Button>
            </div>
          </div>
        )}

        {/* Tier Tab */}
        {activeTab === 'tier' && (
          <div className="space-y-4">
            <div className="bg-surface/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Current Usage</h3>
              
              <div className="grid grid-cols-2 gap-4">
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

      </div>
    </Modal>
  );
};

export default SettingsModal;
