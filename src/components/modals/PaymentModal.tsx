import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { User } from '../../types';
import { CheckCircleIcon, BoltIcon, ShieldCheckIcon, StarIcon } from '@heroicons/react/24/solid';
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
      <div className="space-y-4 sm:space-y-6">
        {/* Tier Selection - Mobile First Grid */}
        <div className={`grid grid-cols-1 gap-3 sm:gap-4 ${availableTiers.length > 1 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-2xl mx-auto'}`}>
          {/* Pro Tier - Only show for free users */}
          {availableTiers.includes('pro') && <div
            onClick={() => setSelectedTier('pro')}
            className={`relative p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${
              selectedTier === 'pro'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-surface-light hover:border-blue-500/50'
            }`}
          >
            {selectedTier === 'pro' && (
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
            )}
            
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <BoltIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-500 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-text-primary truncate">Pro</h3>
                <p className="text-xl sm:text-2xl font-bold text-blue-500">
                  $5<span className="text-xs sm:text-sm text-text-muted">/month</span>
                </p>
              </div>
            </div>

            <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
              <li className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
                <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>1,583 text queries / month</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
                <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>328 image queries / month</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
                <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Advanced AI capabilities</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
                <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Batch screenshot analysis</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
                <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Hands-free voice mode</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
                <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
                <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                <span>No advertisements</span>
              </li>
            </ul>

            <p className="text-xs text-text-muted">Cancel anytime</p>
          </div>}

          {/* Vanguard Pro Tier */}
          {availableTiers.includes('vanguard_pro') && <div
            onClick={() => setSelectedTier('vanguard_pro')}
            className={`relative p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all ${
              selectedTier === 'vanguard_pro'
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-surface-light hover:border-purple-500/50'
            }`}
          >
            {/* Best Value Badge */}
            <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2">
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] sm:text-xs font-bold rounded-full whitespace-nowrap">
                BEST VALUE
              </span>
            </div>

            {selectedTier === 'vanguard_pro' && (
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              </div>
            )}
            
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <StarIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-500 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-text-primary truncate">Vanguard Pro</h3>
                <p className="text-xl sm:text-2xl font-bold text-purple-500">
                  $35<span className="text-xs sm:text-sm text-text-muted">/year</span>
                </p>
              </div>
            </div>

            <ul className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
              <li className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
                <StarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                <span className="font-semibold">Everything in Pro</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
                <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                <span><strong>Save 42%</strong> vs monthly</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
                <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                <span>Lifetime price guarantee</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
                <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                <span>Exclusive Founder's Badge</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
                <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                <span>Early access to new features</span>
              </li>
              <li className="flex items-start gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-secondary">
                <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 text-purple-500 flex-shrink-0" />
                <span>VIP Discord role</span>
              </li>
            </ul>

            <p className="text-xs text-purple-400 font-medium">Limited founding member pricing</p>
          </div>}
        </div>

        {/* Trial Conversion Notice */}
        {isInTrial && (
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs sm:text-sm text-text-secondary min-w-0">
              <p className="font-medium text-blue-400 mb-1">Converting Your Trial</p>
              <p>Your trial will automatically convert to a paid subscription. You'll keep all Pro features with no interruption!</p>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-surface/50 rounded-lg">
          <ShieldCheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-text-secondary min-w-0">
            <p className="font-medium text-text-primary mb-1">Secure Payment via LemonSqueezy</p>
            <p>Your payment information is processed securely. We never store your card details.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:gap-3">
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
            className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-surface-light text-text-secondary rounded-lg hover:bg-surface transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
