import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { User } from '../../types';
import { CheckCircleIcon, ShieldCheckIcon, StarIcon } from '@heroicons/react/24/solid';
import CheckoutButton from '../payment/CheckoutButton';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  defaultTier?: 'pro' | 'vanguard_pro';
  onCheckoutSuccess?: () => void;
  onCheckoutClose?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  user,
  defaultTier = 'pro',
  onCheckoutSuccess,
  onCheckoutClose,
}) => {
  // Check if user is in trial
  const isInTrial = user.tier === 'pro' && user.hasUsedTrial && user.trialExpiresAt && user.trialExpiresAt > Date.now();
  
  // Pro trial users can upgrade to paid Pro or Vanguard
  // Paid Pro users can only upgrade to Vanguard
  // Free users can choose Pro or Vanguard
  let availableTiers: ('pro' | 'vanguard_pro')[];
  if (isInTrial) {
    // Trial users: show both options (convert trial to paid)
    availableTiers = ['pro', 'vanguard_pro'];
  } else if (user.tier === 'pro') {
    // Paid Pro users: only Vanguard upgrade
    availableTiers = ['vanguard_pro'];
  } else {
    // Free users: both options
    availableTiers = ['pro', 'vanguard_pro'];
  }
  
  const initialTier = availableTiers.includes(defaultTier) ? defaultTier : availableTiers[0];
  const [selectedTier, setSelectedTier] = useState<'pro' | 'vanguard_pro'>(initialTier);

  // Update modal title based on user tier and trial status
  let modalTitle: string;
  if (isInTrial) {
    modalTitle = 'Convert Trial to Paid Plan';
  } else if (user.tier === 'pro') {
    modalTitle = 'Upgrade to Vanguard Pro';
  } else {
    modalTitle = 'Upgrade to Premium';
  }

  // Wrap callbacks to ensure PaymentModal closes too
  const handleCheckoutSuccess = () => {
    // Small delay to let button state update before closing
    setTimeout(() => {
      onClose(); // Close PaymentModal first
      onCheckoutSuccess?.(); // Then notify parent
    }, 100);
  };

  const handleCheckoutClose = () => {
    // Small delay to let button state update before closing
    setTimeout(() => {
      onClose(); // Close PaymentModal first
      onCheckoutClose?.(); // Then notify parent
    }, 100);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="4xl"
    >
      <div className="space-y-3 sm:space-y-4 max-h-[calc(100vh-220px)] sm:max-h-none overflow-y-auto sm:overflow-visible">
        {/* Tier Selection - Mobile First Grid */}
        <div className={`grid grid-cols-1 gap-2 sm:gap-4 ${availableTiers.length > 1 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-2xl mx-auto'}`}>
          {/* Pro Tier - Only show for free users */}
          {availableTiers.includes('pro') && <div
            onClick={() => setSelectedTier('pro')}
            className={`relative p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${
              selectedTier === 'pro'
                ? 'border-[#FF4D4D] bg-[#FF4D4D]/10'
                : 'border-surface-light hover:border-[#FF4D4D]/50'
            }`}
          >
            {selectedTier === 'pro' && (
              <div className="absolute top-1.5 sm:top-2.5 right-1.5 sm:right-2.5">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF4D4D]" />
              </div>
            )}
            
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <img src="/images/icons/pro.webp" alt="Pro" className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-sm sm:text-lg font-bold text-text-primary truncate">Pro</h3>
                <p className="text-lg sm:text-xl font-bold text-[#FFAB40]">
                  $5<span className="ml-1 text-xs text-text-muted">/mo</span>
                </p>
              </div>
            </div>

            <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
              <li className="flex items-start gap-1 sm:gap-1.5 text-text-secondary">
                <CheckCircleIcon className="w-3 h-3 mt-0.5 text-[#FFAB40] flex-shrink-0" />
                <span>350 text queries</span>
              </li>
              <li className="flex items-start gap-1 sm:gap-1.5 text-text-secondary">
                <CheckCircleIcon className="w-3 h-3 mt-0.5 text-[#FFAB40] flex-shrink-0" />
                <span>150 image queries</span>
              </li>
              <li className="flex items-start gap-1 sm:gap-1.5 text-text-secondary">
                <CheckCircleIcon className="w-3 h-3 mt-0.5 text-[#FFAB40] flex-shrink-0" />
                <span>Advanced AI mode</span>
              </li>
              <li className="flex items-start gap-1 sm:gap-1.5 text-text-secondary">
                <CheckCircleIcon className="w-3 h-3 mt-0.5 text-[#FFAB40] flex-shrink-0" />
                <span>Batch analysis</span>
              </li>
              <li className="flex items-start gap-1 sm:gap-1.5 text-text-secondary">
                <CheckCircleIcon className="w-3 h-3 mt-0.5 text-[#FFAB40] flex-shrink-0" />
                <span>Voice mode</span>
              </li>
              <li className="flex items-start gap-1 sm:gap-1.5 text-text-secondary">
                <CheckCircleIcon className="w-3 h-3 mt-0.5 text-[#FFAB40] flex-shrink-0" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-1 sm:gap-1.5 text-text-secondary">
                <CheckCircleIcon className="w-3 h-3 mt-0.5 text-[#FFAB40] flex-shrink-0" />
                <span>No ads</span>
              </li>
            </ul>

            <p className="text-xs text-text-muted mt-1 sm:mt-2">Cancel anytime</p>
          </div>}

          {/* Vanguard Pro Tier */}
          {availableTiers.includes('vanguard_pro') && <div
            onClick={() => setSelectedTier('vanguard_pro')}
            className={`relative p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${
              selectedTier === 'vanguard_pro'
                ? 'border-amber-400 bg-amber-400/10'
                : 'border-surface-light hover:border-amber-400/50'
            }`}
          >
            {/* Best Value Badge */}
            <div className="absolute -top-1.5 sm:-top-2 left-1/2 -translate-x-1/2">
              <span className="px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] sm:text-xs font-bold rounded-full whitespace-nowrap">
                BEST VALUE
              </span>
            </div>

            {selectedTier === 'vanguard_pro' && (
              <div className="absolute top-1.5 sm:top-2.5 right-1.5 sm:right-2.5">
                <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              </div>
            )}
            
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <img src="/images/icons/vanguard.webp" alt="Vanguard Pro" className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-sm sm:text-lg font-bold text-text-primary truncate">Vanguard Pro</h3>
                <p className="text-lg sm:text-xl font-bold text-amber-300">
                  $35<span className="ml-1 text-xs text-text-muted">/yr</span>
                </p>
              </div>
            </div>

            <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
              <li className="flex items-start gap-1 sm:gap-1.5 text-text-secondary">
                <StarIcon className="w-3 h-3 mt-0.5 text-amber-400 flex-shrink-0" />
                <span className="font-semibold">All Pro features</span>
              </li>
              <li className="flex items-start gap-1 sm:gap-1.5 text-text-secondary">
                <CheckCircleIcon className="w-3 h-3 mt-0.5 text-amber-400 flex-shrink-0" />
                <span><strong>Save 42%</strong> yearly</span>
              </li>
              <li className="flex items-start gap-1 sm:gap-1.5 text-text-secondary">
                <CheckCircleIcon className="w-3 h-3 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>Price lock forever</span>
              </li>
              <li className="flex items-start gap-1 sm:gap-1.5 text-text-secondary">
                <CheckCircleIcon className="w-3 h-3 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>Founder's Badge</span>
              </li>
              <li className="flex items-start gap-1 sm:gap-1.5 text-text-secondary">
                <CheckCircleIcon className="w-3 h-3 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>Early access</span>
              </li>
              <li className="flex items-start gap-1 sm:gap-1.5 text-text-secondary">
                <CheckCircleIcon className="w-3 h-3 mt-0.5 text-amber-400 flex-shrink-0" />
                <span>VIP Discord role</span>
              </li>
            </ul>

            <p className="text-xs text-amber-300 font-medium mt-1 sm:mt-2">Limited founding offer</p>
          </div>}
        </div>

        {/* Trial Conversion Notice */}
        {isInTrial && (
          <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs sm:text-sm text-text-secondary min-w-0">
              <p className="font-medium text-blue-400 mb-0.5">Converting Your Trial</p>
              <p>Your trial becomes a paid plan with no interruption!</p>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 bg-surface/50 rounded-lg">
          <ShieldCheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-text-secondary min-w-0">
            <p className="font-medium text-text-primary mb-0.5">Secure Payment</p>
            <p>Processed via LemonSqueezy. We never store your card.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <CheckoutButton
            tier={selectedTier}
            user={user}
            variant="primary"
            size="md"
            fullWidth
            onSuccess={handleCheckoutSuccess}
            onClose={handleCheckoutClose}
          >
            Upgrade to {selectedTier === 'pro' ? 'Pro' : 'Vanguard Pro'}
          </CheckoutButton>
          <button
            onClick={onClose}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface-light text-text-secondary text-xs sm:text-sm rounded-lg hover:bg-surface transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
