/**
 * CheckoutButton Component
 * 
 * Reusable button component that opens LemonSqueezy checkout
 * Handles loading states and error handling
 */

import React, { useState, useRef, useEffect } from 'react';
import { openCheckout, type TierKey } from '../../services/lemonsqueezy';
import type { User } from '../../types';
import { BoltIcon } from '@heroicons/react/24/solid';
import { authService } from '../../services/authService';

interface CheckoutButtonProps {
  tier: TierKey;
  user: User;
  redirectUrl?: string;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  onSuccess?: () => void;
  onClose?: () => void;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  tier,
  user,
  redirectUrl,
  className = '',
  children,
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  onSuccess,
  onClose,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCheckoutOpenRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleClick = async () => {
    if (disabled || isProcessing || isConfirming) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Open checkout overlay with callbacks
      await openCheckout(
        {
          tier,
          user,
          redirectUrl: redirectUrl || `${window.location.origin}/payment-success`,
        },
        {
          onSuccess: async () => {
            console.log('💳 Checkout success callback triggered');
            setIsProcessing(false);
            setIsConfirming(true);

            // Poll for tier update with retries
            let attempts = 0;
            const maxAttempts = 12; // 12 attempts over ~12 seconds
            let tierUpdated = false;

            const checkTierUpdate = async (): Promise<boolean> => {
              await authService.refreshUser();
              const currentUser = authService.getAuthState().user;
              return currentUser !== null && currentUser.tier !== 'free';
            };

            while (attempts < maxAttempts && !tierUpdated) {
              attempts++;
              
              // Wait 1 second between attempts (total: ~12 seconds)
              // eslint-disable-next-line no-await-in-loop
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              try {
                console.log(`🔄 Attempt ${attempts}/${maxAttempts}: Checking for tier update...`);
                // eslint-disable-next-line no-await-in-loop
                tierUpdated = await checkTierUpdate();
                
                if (tierUpdated) {
                  const currentUser = authService.getAuthState().user;
                  console.log('✅ Tier updated to:', currentUser?.tier);
                  break;
                } else {
                  console.log(`⏳ Still free tier, retrying... (${attempts}/${maxAttempts})`);
                }
              } catch (refreshError) {
                console.error('❌ Refresh attempt failed:', refreshError);
              }
            }

            if (!tierUpdated) {
              console.warn('⚠️ Tier not updated after all attempts, but continuing...');
            }

            // Call success callback
            if (onSuccess) {
              onSuccess();
            }

            setIsConfirming(false);
          },
          onClose: () => {
            console.log('❌ Checkout closed callback triggered');
            setIsProcessing(false);
            setIsConfirming(false);
            if (onClose) {
              onClose();
            }
          },
        }
      );

      // Fallback: Check if checkout overlay is closed after a short delay
      // This handles cases where LemonSqueezy events don't fire properly
      isCheckoutOpenRef.current = true;
      
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Check every 500ms starting after 1 second
      setTimeout(() => {
        intervalRef.current = setInterval(() => {
          // Look for LemonSqueezy overlay elements
          const overlay = document.querySelector('.lemonsqueezy-loader, .lemon-squeezy-overlay, [class*="lemonsqueezy"], iframe[src*="lemonsqueezy"], iframe[src*="lemon"]');
          
          if (!overlay && isCheckoutOpenRef.current) {
            console.log('🔄 Fallback: Checkout overlay closed, resetting state');
            isCheckoutOpenRef.current = false;
            setIsProcessing(false);
            setIsConfirming(false);
            if (onClose) {
              onClose();
            }
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }, 500);
        
        // Clear interval after 60 seconds to prevent memory leaks
        setTimeout(() => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }, 60000);
      }, 1500);

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to open checkout');
      setIsProcessing(false);
      setIsConfirming(false);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base',
    lg: 'px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg',
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90',
    secondary: 'bg-surface-light text-text-primary hover:bg-surface',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10',
  };

  const baseClasses = `
    ${fullWidth ? 'w-full' : ''}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    font-medium rounded-lg
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center justify-center gap-2
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing || isConfirming}
        className={baseClasses}
        aria-label={`Upgrade to ${tier}`}
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Opening Checkout...</span>
          </>
        ) : isConfirming ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Confirming subscription...</span>
          </>
        ) : (
          <>
            {icon || <BoltIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
            <span>{children || `Upgrade to ${tier === 'pro' ? 'Pro' : 'Vanguard Pro'}`}</span>
          </>
        )}
      </button>
      
      {error && (
        <p className="mt-2 text-xs sm:text-sm text-red-500 text-center">
          {error}
        </p>
      )}
    </div>
  );
};

export default CheckoutButton;
