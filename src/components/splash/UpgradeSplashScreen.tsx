import React from 'react';
import StarIcon from '../ui/StarIcon';

interface UpgradeSplashScreenProps {
  onUpgrade: () => void;
  onUpgradeToVanguard: () => void;
  onClose: () => void;
}

const CheckFeatureLine: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-start gap-4">
    <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
    <span className="text-neutral-200 text-base leading-relaxed">{children}</span>
  </li>
);

const StarFeatureLine: React.FC<{ children: React.ReactNode; comingSoon?: boolean }> = ({ children, comingSoon }) => (
  <li className="flex items-start gap-4">
    <StarIcon className="w-6 h-6 mt-1 text-[#FFAB40] flex-shrink-0" />
    <span className="text-neutral-200 font-medium text-base leading-relaxed">
      {children}
      {comingSoon && (
         <span className="ml-3 text-xs font-semibold align-middle bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-300 border-2 border-sky-500/40 px-3 py-1 rounded-full uppercase">Coming Soon</span>
      )}
    </span>
  </li>
);

const proFeatures = [
  '1,583 Text | 328 Image Queries/month',
  'Up-to-date knowledge using web search',
  'Advanced AI Model',
  'Batch Screenshot Capture',
  'AI Mode Toggle (Analyze or Store)',
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
  return (
    <div className="h-screen bg-gradient-to-br from-black to-[#0A0A0A] text-white flex flex-col items-center justify-center font-inter px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 animate-fade-in overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#FF4D4D]/30 to-transparent pointer-events-none"></div>
      
      <div className="w-full max-w-5xl mx-auto bg-gradient-to-r from-[#1C1C1C]/90 to-[#0A0A0A]/90 backdrop-blur-xl border-2 border-[#424242]/60 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 text-center animate-scale-in relative hover:border-[#424242]/80 transition-all duration-500">
        {/* Header with title and close button */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] leading-normal">Upgrade Your Plan</h1>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <p className="text-neutral-300 text-base mb-8 leading-relaxed">Unlock your full potential and support the community.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8 text-left">
          {/* Pro Plan */}
          <div className="bg-neutral-900/50 border border-neutral-700 rounded-xl p-6 flex flex-col">
            <h3 className="text-xl font-bold text-white">Pro</h3>
            <p className="text-neutral-400 mt-1 mb-6">For serious gamers who want the best.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$3.99</span>
              <span className="text-base text-neutral-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm">
              {proFeatures.map(feature => <CheckFeatureLine key={feature}>{feature}</CheckFeatureLine>)}
            </ul>
            <div className="mt-auto">
              <button 
                onClick={onUpgrade} 
                disabled
                className="w-full bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 font-bold py-3 px-6 rounded-xl transition-colors cursor-not-allowed opacity-50 flex items-center justify-center"
              >
                Coming Soon
              </button>
            </div>
          </div>

          {/* Vanguard Plan */}
          <div className="relative border-2 border-[#FFAB40] rounded-xl p-6 bg-[#111] shadow-2xl shadow-[#D98C1F]/20 flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#FF4D4D] to-[#D98C1F] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Best Value
            </div>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-500">Pro Vanguard</h3>
            <p className="text-neutral-400 mt-1 mb-6">Become a founding member.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$20</span>
              <span className="text-base text-neutral-400">/year</span>
              <p className="text-sm text-green-400 mt-1">Limited Offer - Price Locked Forever!</p>
            </div>
            <ul className="space-y-3 mb-8 text-sm">
              <CheckFeatureLine><b>All Pro features, plus:</b></CheckFeatureLine>
              {vanguardFeatures.map(feature => <StarFeatureLine key={feature.text} {...(feature.comingSoon && { comingSoon: feature.comingSoon })}>{feature.text}</StarFeatureLine>)}
            </ul>
            <div className="mt-auto">
              <button 
                onClick={onUpgradeToVanguard} 
                disabled
                className="w-full bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 font-bold py-3 px-6 rounded-xl transition-colors cursor-not-allowed opacity-50 flex items-center justify-center"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={onClose}
            className="w-full text-neutral-400 font-medium py-2 px-4 rounded-xl hover:bg-neutral-800/50 transition-colors active:scale-95 flex items-center justify-center"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(UpgradeSplashScreen);
