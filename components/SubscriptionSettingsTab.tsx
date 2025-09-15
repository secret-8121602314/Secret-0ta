import React from 'react';
import { Usage } from '../services/types';
import DevTierSwitcher from './DevTierSwitcher';
// Dynamic import to avoid circular dependency
// import { unifiedUsageService } from '../services/unifiedUsageService';
import { canAccessDeveloperFeatures } from '../config/developer';

interface SubscriptionSettingsTabProps {
    usage: Usage;
    refreshUsage?: () => void;
    userEmail?: string;
}

const SubscriptionSettingsTab: React.FC<SubscriptionSettingsTabProps> = ({ usage, refreshUsage, userEmail }) => {
    const handleManageSubscription = () => {
        // In a real application, this would redirect to a Stripe customer portal URL
        alert("This will open the subscription management portal (e.g., Stripe) where you can cancel or update your plan.");
    };

    const handleRefreshUsage = () => {
        if (refreshUsage) {
            try {
                // Add a small delay to allow the tier switching to complete
                setTimeout(() => {
                    try {
                        refreshUsage();
                    } catch (error) {
                        console.warn('⚠️ Refresh usage failed, but tier switching was successful:', error);
                        // Don't fail completely - the tier was already updated locally
                    }
                }, 100);
            } catch (error) {
                console.warn('⚠️ Refresh usage setup failed:', error);
            }
        } else {
            // Fallback to page reload if no refresh function provided
            try {
                window.location.reload();
            } catch (error) {
                console.warn('⚠️ Page reload failed:', error);
            }
        }
    };

    const getTierDisplayName = (tier: string) => {
        switch (tier) {
            case 'free': return 'Free';
            case 'pro': return 'Pro';
            case 'vanguard_pro': return 'Vanguard';
            default: return tier;
        }
    };

    const getTierDescription = (tier: string) => {
        switch (tier) {
            case 'free': return 'Basic features with limited queries';
            case 'pro': return 'Enhanced features with higher limits';
            case 'vanguard_pro': return 'Premium features with unlimited access';
            default: return 'Custom tier';
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Manage Subscription</h2>
            
            {/* Current Tier Display & Switcher */}
            <div className="bg-[#2E2E2E]/60 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Current Plan</h3>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-neutral-300">
                            You are currently on the <span className="text-white font-semibold">{getTierDisplayName(usage.tier)}</span> plan.
                        </p>
                        <p className="text-sm text-neutral-400 mt-1">{getTierDescription(usage.tier)}</p>
                        {canAccessDeveloperFeatures(userEmail) && (
                            <p className="text-xs text-yellow-400 mt-2">Switch between tiers for testing purposes</p>
                        )}
                    </div>
                    {canAccessDeveloperFeatures(userEmail) ? (
                        <DevTierSwitcher 
                            currentTier={usage.tier} 
                            onSwitch={handleRefreshUsage}
                        />
                    ) : (
                        <div className="text-xs text-gray-500 italic">
                            Developer feature
                        </div>
                    )}
                </div>
            </div>

            {/* Upgrade Section for Free Users */}
            {usage.tier === 'free' && (
                <div className="bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 border border-[#E53A3A]/40 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-3">Upgrade Your Plan</h3>
                    <p className="text-neutral-300 mb-4">
                        Unlock enhanced features, higher query limits, and premium capabilities with a Pro subscription.
                    </p>
                    <button
                        onClick={handleManageSubscription}
                        className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-2.5 px-6 rounded-lg transition-transform hover:scale-105"
                    >
                        Upgrade to Pro - $3.99/month
                    </button>
                </div>
            )}

            {/* Billing Portal for Paid Users */}
            {usage.tier !== 'free' && (
                <div className="bg-[#2E2E2E]/60 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-3">Billing Portal</h3>
                    <p className="text-neutral-300 mb-4">
                        Manage your subscription, view invoices, and update your payment method through our secure Stripe-powered billing portal.
                    </p>
                    <button
                        onClick={handleManageSubscription}
                        className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-2.5 px-6 rounded-lg transition-transform hover:scale-105"
                    >
                        Manage Billing & Payment
                    </button>
                </div>
            )}
        </div>
    );
};

export default SubscriptionSettingsTab;
