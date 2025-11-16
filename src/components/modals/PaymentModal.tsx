/**
 * Payment Modal Component (Placeholder for Future Payment Integration)
 * 
 * This modal will handle payment processing and subscription management.
 * Currently shows a placeholder UI that can be replaced with actual payment forms.
 * 
 * @todo Implement Stripe Elements integration
 */

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import CheckIcon from '../ui/CheckIcon';
import { paymentService } from '../../services/paymentService';
import type { BillingInterval } from '../../types/payment';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier: 'pro' | 'vanguard_pro';
  userId: string;
  onSuccess?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  selectedTier,
  userId,
  onSuccess,
}) => {
  const [interval, setInterval] = useState<BillingInterval>('month');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plans = paymentService.getPricingPlans();
  const selectedPlan = plans.find(p => p.tier === selectedTier && p.interval === interval);

  const handlePayment = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    setError(null);

    try {
      // @todo: Implement actual payment processing
      await paymentService.createSubscription(userId, selectedTier, interval);
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setError('Payment integration is not yet implemented. This will be added soon!');
      console.error('[PaymentModal] Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upgrade Your Plan"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Billing Interval Toggle */}
        {selectedTier === 'vanguard_pro' ? (
          <div className="text-center">
            <span className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-full font-semibold">
              Yearly Billing - Best Value!
            </span>
          </div>
        ) : (
          <div className="flex gap-2 bg-neutral-800 p-1 rounded-lg">
            <button
              onClick={() => setInterval('month')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                interval === 'month'
                  ? 'bg-primary text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                interval === 'year'
                  ? 'bg-primary text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Yearly <span className="text-green-400 ml-1">(Save 20%)</span>
            </button>
          </div>
        )}

        {/* Plan Details */}
        {selectedPlan && (
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{selectedPlan.name}</h3>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-white">
                  ${selectedPlan.price}
                </span>
                <span className="text-neutral-400">
                  /{selectedPlan.interval}
                </span>
              </div>
            </div>

            <ul className="space-y-3">
              {selectedPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-neutral-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Payment Form Placeholder */}
        <div className="bg-neutral-800/30 border border-neutral-700/50 rounded-lg p-6">
          <div className="text-center space-y-4">
            <div className="text-neutral-400 text-sm">
              Payment processing will be integrated here
            </div>
            <div className="text-neutral-500 text-xs">
              Stripe payment form coming soon
            </div>
            
            {/* @todo: Add Stripe Elements here */}
            {/* 
            <Elements stripe={stripePromise}>
              <PaymentForm 
                onSuccess={handlePaymentSuccess}
                amount={selectedPlan.price}
              />
            </Elements>
            */}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            variant="primary"
            className="flex-1"
            disabled={isProcessing || !selectedPlan}
          >
            {isProcessing ? 'Processing...' : `Subscribe - $${selectedPlan?.price}`}
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="text-center text-xs text-neutral-500 space-y-1">
          <p>🔒 Secure payment processing powered by Stripe</p>
          <p>💳 Cancel anytime, no questions asked</p>
          <p>✨ Instant activation after payment</p>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
