import React from 'react';
import StarIcon from './StarIcon';
import Button from './ui/Button';
import { useAnalytics } from '../hooks/useAnalytics';

interface UpgradeSplashScreenProps {
    onUpgrade: () => void;
    onUpgradeToVanguard: () => void;
    onClose: () => void;
}

const CheckFeatureLine: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start gap-3 sm:gap-4">
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5 sm:mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        <span className="text-neutral-200 text-sm sm:text-base leading-relaxed">{children}</span>
    </li>
);

const StarFeatureLine: React.FC<{ children: React.ReactNode; comingSoon?: boolean }> = ({ children, comingSoon }) => (
    <li className="flex items-start gap-3 sm:gap-4">
        <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 mt-0.5 sm:mt-1 text-[#FFAB40] flex-shrink-0" />
        <span className="text-neutral-200 font-medium text-sm sm:text-base leading-relaxed">
            {children}
            {comingSoon && (
                 <span className="ml-2 sm:ml-3 text-xs font-semibold align-middle bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-300 border-2 border-sky-500/40 px-2 sm:px-3 py-1 rounded-full uppercase">Coming Soon</span>
            )}
        </span>
    </li>
);

const proFeatures = [
    '1,583 Text Queries/month',
    '328 Image Queries/month',
    'Advanced AI Model',
    'Batch Screenshot Capture',
    'Hands-Free Voice Response',
    'In-depth Insight Tabs',
    'Priority Support',
    'No ads'
];

const vanguardFeatures = [
    { text: 'Permanent Price Lock-in' },
    { text: 'Exclusive "Vanguard" Badge' },
    { text: "Access to Founder's Council" },
    { text: 'Beta Access to New Features' },
    { text: 'Earn by playing new games', comingSoon: true },
];

const UpgradeSplashScreen: React.FC<UpgradeSplashScreenProps> = ({ onUpgrade, onUpgradeToVanguard, onClose }) => {
    const { trackTierUpgradeAttempt, trackButtonClick } = useAnalytics();

    const handleProUpgrade = () => {
        trackTierUpgradeAttempt({
            fromTier: 'free',
            toTier: 'pro',
            attemptSource: 'splash_screen',
            success: false, // Will be updated when payment succeeds
            amount: 3.99,
            metadata: { source: 'UpgradeSplashScreen' }
        });
        trackButtonClick('go_pro', 'UpgradeSplashScreen');
        onUpgrade();
    };

    const handleVanguardUpgrade = () => {
        trackTierUpgradeAttempt({
            fromTier: 'free',
            toTier: 'vanguard_pro',
            attemptSource: 'splash_screen',
            success: false, // Will be updated when payment succeeds
            amount: 20.00,
            metadata: { source: 'UpgradeSplashScreen' }
        });
        trackButtonClick('become_vanguard', 'UpgradeSplashScreen');
        onUpgradeToVanguard();
    };

    const handleClose = () => {
        trackButtonClick('maybe_later', 'UpgradeSplashScreen');
        onClose();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-black to-[#0A0A0A] text-white flex flex-col items-center justify-center font-inter p-4 sm:p-6 md:p-8 animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#FF4D4D]/30 to-transparent pointer-events-none"></div>
            
            <div className="w-full max-w-6xl mx-auto bg-gradient-to-r from-[#1C1C1C]/90 to-[#0A0A0A]/90 backdrop-blur-xl border-2 border-[#424242]/60 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 text-center animate-scale-in relative hover:border-[#424242]/80 transition-all duration-500">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 sm:top-6 sm:right-6 text-neutral-400 hover:text-white transition-all duration-300 z-10 hover:scale-110 p-1"
                    aria-label="Close modal"
                >
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] mb-3 sm:mb-4 leading-tight px-2">Upgrade Your Plan</h1>
                <p className="text-neutral-300 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 md:mb-10 leading-relaxed px-2">Unlock your full potential and support the community.</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mt-6 sm:mt-8 md:mt-10 text-left">
                    {/* Pro Plan */}
                    <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl p-4 sm:p-6 flex flex-col">
                        <h3 className="text-xl sm:text-2xl font-bold text-white">Pro</h3>
                        <p className="text-neutral-400 mt-1 mb-4 sm:mb-6 text-sm sm:text-base">For serious gamers who want the best.</p>
                        <div className="mb-4 sm:mb-6">
                            <span className="text-3xl sm:text-4xl font-bold text-white">$3.99</span>
                            <span className="text-sm sm:text-base text-neutral-400">/month</span>
                        </div>
                        <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 text-xs sm:text-sm">
                            {proFeatures.map(feature => <CheckFeatureLine key={feature}>{feature}</CheckFeatureLine>)}
                        </ul>
                        <div className="mt-auto">
                            <button 
                                onClick={handleProUpgrade} 
                                className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
                            >
                                Go Pro
                            </button>
                        </div>
                    </div>

                    {/* Vanguard Plan */}
                    <div className="relative border-2 border-[#FFAB40] rounded-xl p-4 sm:p-6 bg-[#111] shadow-2xl shadow-[#D98C1F]/20 flex flex-col">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#FF4D4D] to-[#D98C1F] text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full uppercase tracking-wider">
                            Best Value
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">Pro Vanguard</h3>
                        <p className="text-neutral-400 mt-1 mb-4 sm:mb-6 text-sm sm:text-base">Become a founding member.</p>
                        <div className="mb-4 sm:mb-6">
                            <span className="text-3xl sm:text-4xl font-bold text-white">$20</span>
                            <span className="text-sm sm:text-base text-neutral-400">/year</span>
                            <p className="text-xs sm:text-sm text-green-400 mt-1">Limited Offer - Price Locked Forever!</p>
                        </div>
                        <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 text-xs sm:text-sm">
                            <CheckFeatureLine><b>All Pro features, plus:</b></CheckFeatureLine>
                            {vanguardFeatures.map(feature => <StarFeatureLine key={feature.text} comingSoon={feature.comingSoon}>{feature.text}</StarFeatureLine>)}
                        </ul>
                        <div className="mt-auto">
                            <button 
                                onClick={handleVanguardUpgrade} 
                                className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
                            >
                                Become a Vanguard
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 sm:mt-8">
                    <button
                        onClick={handleClose}
                        className="w-full text-neutral-400 font-medium py-2 px-4 sm:px-6 rounded-lg hover:bg-neutral-800/50 transition-colors flex items-center justify-center text-sm sm:text-base"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(UpgradeSplashScreen);
