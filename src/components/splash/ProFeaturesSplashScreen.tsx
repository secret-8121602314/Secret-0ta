import React, { useState } from 'react';
import StarIcon from '../ui/StarIcon';
import { HandsFreeIcon } from '../ui/HandsFreeIcon';
import KeyboardIcon from '../ui/KeyboardIcon';

interface ProFeaturesSplashScreenProps {
  onComplete: () => void;
  onUpgrade: () => void;
  onUpgradeToVanguard: () => void;
}

const ProFeature: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <div className="flex items-start gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 bg-gradient-to-r from-[#1C1C1C]/80 to-[#0A0A0A]/80 backdrop-blur-xl rounded-2xl border-2 border-neutral-800/60 hover:border-neutral-700/80 hover:scale-105 transition-all duration-500 feature-card">
    <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 mt-1 rounded-xl bg-gradient-to-br from-[#FF4D4D]/20 to-[#FFAB40]/20 border-2 border-neutral-700/60 backdrop-blur-sm">
       {children}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-white mb-1 sm:mb-2 leading-tight">{title}</h3>
      <p className="text-xs sm:text-sm md:text-base text-[#A3A3A3] leading-relaxed">{description}</p>
    </div>
  </div>
);

const proFeatures = [
  { title: "Massively Increased Limits", description: "Get 1,583 Text | 328 Image Queries every month, so you never have to hold back.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#FFAB40]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> },
  { title: "Batch Screenshot Capture", description: "Instantly capture the last 5 minutes of gameplay with a hotkey. Otagon analyzes all key moments for a comprehensive summary.", icon: <KeyboardIcon className="w-6 h-6 text-[#FFAB40]" /> },
  { title: "In-Depth Insight Tabs", description: "Go beyond a simple hint. Get detailed breakdowns on lore, character builds, missed items, and more.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#FFAB40]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg> },
  { title: "Hands-Free Mode", description: "Stay focused on the action. Get hints read aloud to you without ever looking away from your screen.", icon: <HandsFreeIcon isActive={true} className="w-6 h-6 text-[#FFAB40]" /> },
  { title: "No Ads", description: "Enjoy a completely ad-free experience with no interruptions during your gaming sessions.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#FFAB40]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> }
];

const vanguardFeatures = [
  { title: "Lifetime Price Guarantee", description: "Your price of $20/year will never increase. Ever.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> },
  { title: "Exclusive Founder's Badge", description: "A permanent in-app badge showing your early support.", icon: <StarIcon className="w-6 h-6 text-amber-300" /> },
  { title: "Direct Influence", description: "Join the Founder's Council on Discord to help shape the future of Otagon.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
  { title: "First Access & Rewards", description: "Get beta access to all new features and earn by helping train our AI on new games.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> }
];

const ProFeaturesSplashScreen: React.FC<ProFeaturesSplashScreenProps> = ({ onComplete, onUpgrade, onUpgradeToVanguard }) => {
  const [activeTab, setActiveTab] = useState<'pro' | 'vanguard'>('pro');
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    // Ensure smooth render - show everything at once
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] flex items-center justify-center">
        <div className="animate-pulse text-[#FFAB40]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] text-[#F5F5F5] flex flex-col font-inter overflow-hidden">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 text-center bg-gradient-to-b from-[#111111]/95 to-transparent backdrop-blur-sm">
        <div className="max-w-2xl w-full mx-auto">
          <div className="flex justify-center mb-2">
            <StarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[#FFAB40]" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] leading-tight mb-2 pb-1" style={{ lineHeight: '1.2', paddingBottom: '0.25rem' }}>Supercharge with Otagon Pro</h1>
          <p className="text-sm sm:text-base md:text-lg text-neutral-300 leading-relaxed px-2">Unlock exclusive features for the ultimate gaming companion.</p>

          <div className="w-full max-w-sm mx-auto p-1 bg-gradient-to-r from-[#2E2E2E]/60 to-[#1A1A1A]/60 backdrop-blur-sm rounded-2xl flex items-center gap-1 mt-4 sm:mt-6">
            <button onClick={() => setActiveTab('pro')} className={`w-1/2 py-2 sm:py-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 active:scale-95 ${activeTab === 'pro' ? 'bg-gradient-to-r from-[#424242] to-[#2A2A2A] text-white shadow-lg' : 'text-neutral-300 md:hover:bg-neutral-700/50'}`}>Pro</button>
            <button onClick={() => setActiveTab('vanguard')} className={`w-1/2 py-2 sm:py-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 active:scale-95 ${activeTab === 'vanguard' ? 'bg-gradient-to-r from-[#424242] to-[#2A2A2A] text-white shadow-lg' : 'text-neutral-300 md:hover:bg-neutral-700/50'}`}>Pro Vanguard</button>
          </div>
        </div>
      </header>

      {/* Content - Scrollable */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-2 sm:py-4">
        <div className="max-w-2xl w-full mx-auto">
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
             {activeTab === 'pro' && proFeatures.map(f => <ProFeature key={f.title} title={f.title} description={f.description}>{f.icon}</ProFeature>)}
             {activeTab === 'vanguard' && (
              <>
                <div className="text-center p-3 sm:p-4 mb-4 sm:mb-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/40 rounded-2xl backdrop-blur-sm">
                   <p className="font-bold text-amber-300 text-sm sm:text-base md:text-lg">All Pro features are included!</p>
               </div>
               {vanguardFeatures.map(f => <ProFeature key={f.title} title={f.title} description={f.description}>{f.icon}</ProFeature>)}
              </>
             )}
          </div>
          {/* Extra padding to ensure content doesn't get hidden behind sticky footer */}
          <div className="h-24 sm:h-32"></div>
        </div>
      </main>

      {/* Footer - Sticky */}
      <footer className="flex-shrink-0 sticky bottom-0 bg-gradient-to-t from-[#0A0A0A]/95 via-[#0A0A0A]/90 to-transparent backdrop-blur-md border-t border-neutral-800/30 px-4 sm:px-6 md:px-8 pt-4 pb-4 sm:pb-6">
        <div className="w-full max-w-lg mx-auto space-y-2 sm:space-y-3">
          <button
            onClick={activeTab === 'pro' ? onUpgrade : onUpgradeToVanguard}
            disabled
            className="w-full bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300 font-bold py-3 sm:py-4 px-6 rounded-xl transition-all duration-300 cursor-not-allowed opacity-50 text-sm sm:text-base flex items-center justify-center"
          >
            Coming Soon
          </button>
          <button
            onClick={onComplete}
            className="w-full text-neutral-300 font-medium py-2 sm:py-3 px-4 rounded-xl hover:bg-neutral-800/50 transition-all duration-300 hover:scale-105 active:scale-95 text-xs sm:text-sm flex items-center justify-center"
          >
            Maybe Later
          </button>
        </div>
      </footer>
    </div>
  );
};

export default React.memo(ProFeaturesSplashScreen);
