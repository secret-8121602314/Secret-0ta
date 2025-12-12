import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import StarIcon from '../ui/StarIcon';
import TextIcon from '../ui/TextIcon';
import ImageIcon from '../ui/ImageIcon';
import PaymentModal from './PaymentModal';
import { groundingControlService } from '../../services/groundingControlService';
import { unreleasedTabLimitService } from '../../services/unreleasedTabLimitService';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  user: User;
}

const CreditModal: React.FC<CreditModalProps> = ({ isOpen, onClose, onUpgrade, user }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [groundingQuota, setGroundingQuota] = useState<{
    gameKnowledge: { used: number; limit: number; remaining: number };
    aiMessages: { used: number; limit: number; remaining: number };
  } | null>(null);
  const [unreleasedTabInfo, setUnreleasedTabInfo] = useState<{
    currentCount: number;
    limit: number;
  } | null>(null);
  
  // Fetch grounding quota for Pro/Vanguard users
  useEffect(() => {
    if ((user.tier === 'pro' || user.tier === 'vanguard_pro') && user.authUserId && isOpen) {
      groundingControlService.getRemainingQuota(user.authUserId, user.tier)
        .then(setGroundingQuota)
        .catch(err => {
          console.error('Failed to fetch grounding quota:', err);
        });
    }
  }, [user.tier, user.authUserId, isOpen]);
  
  // Fetch unreleased tab info for all users
  useEffect(() => {
    if (user.authUserId && isOpen) {
      unreleasedTabLimitService.canCreateUnreleasedTab(user.authUserId, user.tier)
        .then(result => {
          setUnreleasedTabInfo({
            currentCount: result.currentCount,
            limit: result.limit
          });
        })
        .catch(err => {
          console.error('Failed to fetch unreleased tab info:', err);
        });
    }
  }, [user.authUserId, user.tier, isOpen]);
  
  // Handle checkout completion - close all modals
  const handleCheckoutSuccess = () => {
    console.log('💳 Checkout success - closing all modals');
    setShowPaymentModal(false);
    onClose(); // Close credit modal
  };
  
  // Handle checkout close - close all modals and return to chat
  const handleCheckoutClose = () => {
    console.log('❌ Checkout closed - closing all modals and returning to chat');
    setShowPaymentModal(false);
    onClose(); // Close credit modal too
  };
  
  if (!isOpen) {
    return null;
  }

  const { textCount, textLimit, imageCount, imageLimit, tier } = user.usage;
  const textRemaining = Math.max(0, textLimit - textCount);
  const imageRemaining = Math.max(0, imageLimit - imageCount);
  const isPaidUser = tier === 'pro' || tier === 'vanguard_pro';

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
      <div 
        className="bg-[#1C1C1C]/90 backdrop-blur-md border border-[#424242]/60 rounded-2xl shadow-2xl w-full max-w-sm relative animate-scale-in flex flex-col max-h-[90vh]"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed header with close button */}
        <div className="flex-shrink-0 p-6 pb-0 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-[#6E6E6E] hover:text-[#F5F5F5] transition-colors z-10"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          
          <div className="flex justify-center mb-4">
            <img
              src="/images/mascot/8.png"
              alt="Credits"
              className="w-28 h-28 sm:w-32 sm:h-32 object-contain aspect-square"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          
          <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">Monthly Credits</h2>
          <p className="text-[#A3A3A3] mb-6">Your usage resets at the start of each month.</p>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-[#424242] scrollbar-track-transparent">
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-[#2E2E2E]/40 backdrop-blur-sm p-4 rounded-lg border border-[#424242]/30">
            <TextIcon className="w-8 h-8 text-sky-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#CFCFCF]">Text Queries</p>
              <p className="text-2xl font-bold text-white">
                {textRemaining.toLocaleString()}
                <span className="text-base font-normal text-[#A3A3A3]"> / {textLimit.toLocaleString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#2E2E2E]/40 backdrop-blur-sm p-4 rounded-lg border border-[#424242]/30">
            <ImageIcon className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[#CFCFCF]">Image Queries</p>
              <p className="text-2xl font-bold text-white">
                {imageRemaining.toLocaleString()}
                <span className="text-base font-normal text-[#A3A3A3]"> / {imageLimit.toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* ALL USERS: Show unreleased game tab limits */}
          {unreleasedTabInfo && (
            <>
              <div className="pt-4 border-t border-[#424242]/30">
                <p className="text-sm font-semibold text-[#CFCFCF] mb-3">Unreleased Game Tabs</p>
              </div>
              
              <div className="flex items-center gap-4 bg-[#2E2E2E]/40 backdrop-blur-sm p-4 rounded-lg border border-[#424242]/30">
                <svg className="w-8 h-8 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#CFCFCF]">Games Not Yet Released</p>
                  <p className="text-2xl font-bold text-white">
                    {(unreleasedTabInfo.limit - unreleasedTabInfo.currentCount).toLocaleString()}
                    <span className="text-base font-normal text-[#A3A3A3]"> / {unreleasedTabInfo.limit.toLocaleString()}</span>
                  </p>
                </div>
              </div>

              <div className="bg-[#2E2E2E]/20 backdrop-blur-sm p-3 rounded-lg border border-[#424242]/20">
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  <span className="font-semibold text-[#CFCFCF]">ℹ️ About Unreleased Games:</span> {isPaidUser 
                    ? 'You can create tabs for games not yet released. These tabs have limited features (Discuss mode only, no subtabs) until the game launches.' 
                    : 'You can create up to 3 tabs for unreleased games. These have limited features (Discuss mode only, no subtabs or AI insights). Upgrade to Pro for 10 unreleased game tabs.'}
                </p>
              </div>
            </>
          )}

          {/* Pro/Vanguard: Show grounding quota */}
          {isPaidUser && groundingQuota && (
            <>
              <div className="pt-4 border-t border-[#424242]/30">
                <p className="text-sm font-semibold text-[#CFCFCF] mb-3">Internet Searches (Google Grounding)</p>
              </div>
              
              <div className="flex items-center gap-4 bg-[#2E2E2E]/40 backdrop-blur-sm p-4 rounded-lg border border-[#424242]/30">
                <svg className="w-8 h-8 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#CFCFCF]">Game Knowledge (New Games)</p>
                  <p className="text-2xl font-bold text-white">
                    {groundingQuota.gameKnowledge.remaining.toLocaleString()}
                    <span className="text-base font-normal text-[#A3A3A3]"> / {groundingQuota.gameKnowledge.limit.toLocaleString()}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-[#2E2E2E]/40 backdrop-blur-sm p-4 rounded-lg border border-[#424242]/30">
                <svg className="w-8 h-8 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#CFCFCF]">AI Messages (News, Patches, Meta)</p>
                  <p className="text-2xl font-bold text-white">
                    {groundingQuota.aiMessages.remaining.toLocaleString()}
                    <span className="text-base font-normal text-[#A3A3A3]"> / {groundingQuota.aiMessages.limit.toLocaleString()}</span>
                  </p>
                </div>
              </div>

              <div className="bg-[#2E2E2E]/20 backdrop-blur-sm p-3 rounded-lg border border-[#424242]/20">
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  <span className="font-semibold text-[#CFCFCF]">ℹ️ About Internet Searches:</span> When limits are reached, 
                  Otagon will rely on training knowledge (accurate for games before Jan 2025). 
                  New releases and live game meta may be outdated.
                </p>
              </div>
            </>
          )}
        </div>
        </div>

        {/* Fixed footer for free tier */}
        {tier === 'free' && (
          <div className="flex-shrink-0 px-6 pb-6 pt-0">
            <div className="bg-[#2E2E2E]/30 backdrop-blur-sm p-4 rounded-lg border border-[#424242]/30">
              <button
                onClick={() => {
                  setShowPaymentModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105"
              >
                <StarIcon className="w-5 h-5" />
                Upgrade to Pro for More
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        user={user}
        onCheckoutSuccess={handleCheckoutSuccess}
        onCheckoutClose={handleCheckoutClose}
      />
    </div>
  );
};

export default CreditModal;
