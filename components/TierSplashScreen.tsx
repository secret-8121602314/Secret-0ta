import React from 'react';
import Logo from './Logo';
import StarIcon from './StarIcon';
import { UserTier } from '../services/types';

interface TierSplashScreenProps {
  userTier: UserTier;
  onContinue: () => void;
  onUpgradeToPro?: () => void;
  onUpgradeToVanguard?: () => void;
}

const TierSplashScreen: React.FC<TierSplashScreenProps> = ({ 
  userTier, 
  onContinue, 
  onUpgradeToPro, 
  onUpgradeToVanguard 
}) => {
  const isFreeTier = userTier === 'free';
  const isProTier = userTier === 'pro';

  return (
    <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] text-[#F5F5F5] flex flex-col items-center justify-center font-inter px-4 sm:px-6 md:px-8 text-center overflow-hidden animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial-at-top from-[#1C1C1C]/30 to-transparent pointer-events-none"></div>
      
      <main className="flex flex-col items-center justify-center w-full max-w-lg">
        <div className="flex-shrink-0 animate-fade-slide-up mb-1">
          <Logo className="w-24 h-24 sm:w-26 sm:h-26 md:w-28 md:h-28" />
        </div>

        <h1 className="text-5xl font-bold text-white animate-fade-slide-up leading-normal">
          {isFreeTier ? 'Supercharge with Otagon' : 'Unlock Your Full Potential'}
        </h1>

        <p className="text-base text-[#A3A3A3] mb-6 leading-relaxed animate-fade-slide-up">
          {isFreeTier 
            ? 'Ready to take your gaming experience to the next level?'
            : 'You\'re already a Pro! Ready to become a Vanguard?'
          }
        </p>

        {/* Tier Options */}
        <div className="w-full space-y-6 mb-8 animate-fade-slide-up">
          {/* Pro Plan */}
          <div className={`relative p-6 rounded-3xl border-2 transition-all duration-500 hover:scale-105 ${
            isFreeTier 
              ? 'bg-gradient-to-r from-[#1C1C1C]/60 to-[#0A0A0A]/60 backdrop-blur-xl border-neutral-700/60 hover:border-[#E53A3A]/60 cursor-pointer hover:shadow-xl hover:shadow-[#E53A3A]/10' 
              : 'bg-gradient-to-r from-[#1C1C1C]/40 to-[#0A0A0A]/40 backdrop-blur-sm border-neutral-600/60 opacity-50 cursor-not-allowed'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-3xl font-bold text-white">Pro</h3>
              <div className="text-right">
                <div className="text-4xl font-bold text-white">$3.99</div>
                <div className="text-base text-neutral-300">/month</div>
              </div>
            </div>
            
            <ul className="text-left space-y-3 mb-6 text-base text-neutral-200 leading-relaxed">
              <li>• 1,583 Text Queries/month</li>
              <li>• 328 Image Queries/month</li>
              <li>• Advanced AI Model</li>
              <li>• Batch Screenshot Capture</li>
              <li>• Hands-Free Voice Response</li>
              <li>• No ads</li>
            </ul>

            {isFreeTier ? (
              <button
                onClick={onUpgradeToPro}
                className="w-full bg-gradient-to-r from-neutral-700 to-neutral-600 hover:from-neutral-600 hover:to-neutral-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center"
              >
                <StarIcon className="w-6 h-6 mr-3" />
                Upgrade to Pro
              </button>
            ) : (
              <div className="w-full bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 font-bold py-4 px-8 rounded-xl cursor-not-allowed text-center">
                Current Plan
              </div>
            )}
          </div>

          {/* Vanguard Plan */}
          <div className="relative p-6 rounded-3xl border-2 border-[#FFAB40] bg-gradient-to-r from-[#111] to-[#0A0A0A] shadow-2xl shadow-[#D98C1F]/30 hover:shadow-[#D98C1F]/50 transition-all duration-500 hover:scale-105">
            {/* Badge inside card content */}
            <div className="text-center mb-4">
              <span className="text-sm font-bold bg-gradient-to-r from-[#FFAB40] to-[#FF8C00] text-black px-4 py-2 rounded-full uppercase tracking-wider shadow-lg">
                {isProTier ? 'Recommended' : 'Most Popular'}
              </span>
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]">
                Vanguard
              </h3>
              <div className="text-right">
                <div className="text-4xl font-bold text-white">$20.00</div>
                <div className="text-base text-neutral-300">/month</div>
              </div>
            </div>
            
            <ul className="text-left space-y-2 mb-4 text-sm text-neutral-300">
              <li>• All Pro features, plus:</li>
              <li>• Permanent Price Lock-in</li>
              <li>• Exclusive "Vanguard" Badge</li>
              <li>• Founder's Council Access</li>
              <li>• Beta Access to New Features</li>
              <li>• Earn by Playing (Coming Soon)</li>
            </ul>

            <button
              onClick={onUpgradeToVanguard}
              className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              <StarIcon className="w-5 h-5 mr-2" />
              {isProTier ? 'Upgrade to Vanguard' : 'Become a Vanguard'}
            </button>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
        >
          Continue with Current Plan
        </button>

        <p className="text-sm text-neutral-500 mt-4">
          You can upgrade anytime from the settings menu
        </p>
      </main>
    </div>
  );
};

export default TierSplashScreen;
