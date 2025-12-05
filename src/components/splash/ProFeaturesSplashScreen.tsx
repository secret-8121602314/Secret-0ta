import React, { useState } from 'react';
import { HandsFreeIcon } from '../ui/HandsFreeIcon';
import KeyboardIcon from '../ui/KeyboardIcon';
import { motion, AnimatePresence } from 'framer-motion';

interface ProFeaturesSplashScreenProps {
  onComplete: () => void;
  onUpgrade: () => void;
  onUpgradeToVanguard: () => void;
}

// Full feature card for desktop
const FullFeature: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <motion.div 
    className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#1C1C1C]/80 to-[#0A0A0A]/80 backdrop-blur-xl rounded-xl border border-neutral-800/60 hover:border-neutral-700/80 transition-all duration-300"
    whileHover={{ scale: 1.01 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-[#FF4D4D]/20 to-[#FFAB40]/20 border border-neutral-700/60">
       {children}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-[#A3A3A3] leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const proFeatures = [
  { title: "Massively Increased Limits", description: "Get 1,583 Text | 328 Image Queries every month.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#FFAB40]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> },
  { title: "Batch Screenshot Capture", description: "Capture the last 5 minutes of gameplay with a hotkey.", icon: <KeyboardIcon className="w-5 h-5 text-[#FFAB40]" /> },
  { title: "In-Depth Insight Tabs", description: "Detailed breakdowns on lore, builds, and more.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#FFAB40]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg> },
  { title: "AI Mode Toggle", description: "Save query limits when you don't need insights.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#FFAB40]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /></svg> },
  { title: "Hands-Free Voice Mode", description: "Get hints read aloud without looking away.", icon: <HandsFreeIcon isActive={true} className="w-5 h-5 text-[#FFAB40]" /> },
  { title: "No Ads", description: "Completely ad-free experience.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#FFAB40]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> }
];

const vanguardFeatures = [
  { title: "Lifetime Price Guarantee", description: "$20/year forever. No increases.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> },
  { title: "Exclusive Founder's Badge", description: "Permanent badge showing early support.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg> },
  { title: "Direct Influence", description: "Join the Founder's Council on Discord.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> },
  { title: "First Access & Rewards", description: "Beta access to all new features.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> }
];

const ProFeaturesSplashScreen: React.FC<ProFeaturesSplashScreenProps> = ({ onComplete, onUpgrade, onUpgradeToVanguard }) => {
  const [activeTab, setActiveTab] = useState<'pro' | 'vanguard'>('pro');
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] flex items-center justify-center">
        <div className="animate-pulse text-[#FFAB40]">Loading...</div>
      </div>
    );
  }

  const currentFeatures = activeTab === 'pro' ? proFeatures : vanguardFeatures;
  const isVanguard = activeTab === 'vanguard';

  return (
    <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] text-[#F5F5F5] flex flex-col font-inter overflow-hidden">
      {/* Tab Switcher - Top */}
      <div className="flex-shrink-0 px-5 pt-6 sm:pt-4 pb-2">
        <div className="w-full max-w-xs mx-auto p-1 bg-[#1A1A1A]/80 backdrop-blur-sm rounded-xl flex items-center gap-1">
          <motion.button 
            onClick={() => setActiveTab('pro')} 
            className={`w-1/2 py-2 text-xs font-bold rounded-lg transition-colors duration-200 ${activeTab === 'pro' ? 'bg-gradient-to-r from-[#424242] to-[#2A2A2A] text-white shadow-md' : 'text-neutral-400'}`}
            whileTap={{ scale: 0.95 }}
          >
            Pro
          </motion.button>
          <motion.button 
            onClick={() => setActiveTab('vanguard')} 
            className={`w-1/2 py-2 text-xs font-bold rounded-lg transition-colors duration-200 ${activeTab === 'vanguard' ? 'bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] text-white shadow-md' : 'text-neutral-400'}`}
            whileTap={{ scale: 0.95 }}
          >
            Pro Vanguard
          </motion.button>
        </div>
      </div>

      {/* Main Content - Mascot and header above list, centered, mobile first */}
      <main className="flex-1 px-5 sm:px-6 py-2 overflow-hidden lg:overflow-y-auto">
        <div className="h-full max-w-5xl mx-auto flex flex-col lg:block">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="h-full"
              initial={{ opacity: 0, x: activeTab === 'pro' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === 'pro' ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Mobile Layout - Consistent structure for both tabs */}
              <div className="lg:hidden flex flex-col items-center justify-between h-full py-3 sm:py-4">
                {/* Top: Mascot and header */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="relative">
                    <img 
                      src={isVanguard ? '/images/mascot/vanguard-user.png' : '/images/mascot/pro-user.png'}
                      alt={isVanguard ? 'Vanguard Mascot' : 'Pro Mascot'}
                      className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 object-contain rounded-xl"
                    />
                  </div>
                  <h2 className={`mt-2 sm:mt-3 text-base sm:text-lg md:text-xl font-bold text-center ${
                    isVanguard 
                      ? 'text-amber-300' 
                      : 'bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]'
                  }`}>
                    {isVanguard ? 'Founding Member' : 'Otagon Pro'}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-400 text-center mt-0.5 px-2">
                    {isVanguard ? 'Shape the future' : 'Ultimate companion'}
                  </p>
                </div>

                {/* Middle: Badge (Vanguard only) or spacer */}
                {isVanguard && (
                  <div className="py-1.5 px-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-lg flex-shrink-0 my-2">
                    <p className="text-xs sm:text-sm font-semibold text-amber-300 text-center">✨ All Pro features included!</p>
                  </div>
                )}

                {/* Bottom: Features list */}
                <div className="flex-1 w-full flex flex-col justify-center overflow-hidden min-h-0">
                  <div className="space-y-1.5 sm:space-y-2 w-full max-w-xs mx-auto overflow-y-auto px-1" style={{ maxHeight: isVanguard ? '32vh' : '38vh' }}>
                    {currentFeatures.map(f => (
                      <div key={f.title} className="flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 px-2.5 rounded-lg bg-[#181818]/60 border border-neutral-800/40">
                        <svg className={`w-5 h-5 flex-shrink-0 ${isVanguard ? 'text-amber-400' : 'text-[#FFAB40]'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm sm:text-base text-neutral-200 font-medium">{f.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop Layout - Full cards with mascot */}
              <div className="hidden lg:flex h-full gap-8 items-center">
                {/* Mascot Side - Desktop */}
                <div className="w-1/3 flex flex-col items-center justify-center">
                  <div className="relative">
                    <img 
                      src={isVanguard ? '/images/mascot/vanguard-user.png' : '/images/mascot/pro-user.png'} 
                      alt={isVanguard ? 'Vanguard Mascot' : 'Pro Mascot'}
                      className="w-48 h-48 xl:w-56 xl:h-56 object-contain rounded-2xl"
                    />
                  </div>
                  <h2 className={`mt-4 text-2xl xl:text-3xl font-bold text-center bg-clip-text text-transparent ${
                    isVanguard 
                      ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300' 
                      : 'bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]'
                  }`}>
                    {isVanguard ? 'Become a Founding Member' : 'Supercharge with Pro'}
                  </h2>
                  <p className="text-sm text-neutral-400 text-center mt-2">
                    {isVanguard ? 'Join the elite. Shape the future of gaming.' : 'Unlock the ultimate gaming companion.'}
                  </p>
                </div>

                {/* Features Side - Desktop */}
                <div className="w-2/3 flex flex-col justify-center">
                  {isVanguard && (
                    <div className="mb-4 py-3 px-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-xl">
                      <p className="text-sm font-semibold text-amber-300 text-center">✨ All Pro features are included!</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {currentFeatures.map(f => (
                      <FullFeature key={f.title} title={f.title} description={f.description}>{f.icon}</FullFeature>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer - Sticky */}
      <footer className="flex-shrink-0 bg-gradient-to-t from-[#0A0A0A] to-transparent px-6 sm:px-8 pt-2 pb-6 sm:pb-5">
        <div className="w-full max-w-md mx-auto space-y-2">
          {/* Upgrade Button - Disabled */}
          <motion.button
            onClick={activeTab === 'pro' ? onUpgrade : onUpgradeToVanguard}
            disabled
            className="w-full font-bold py-3 px-6 rounded-xl cursor-not-allowed opacity-50 text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-neutral-600 to-neutral-500 text-neutral-300"
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Coming Soon
          </motion.button>
          
          {/* Maybe Later Button */}
          <motion.button
            onClick={onComplete}
            className="w-full text-neutral-400 font-medium py-2.5 px-4 rounded-xl border border-neutral-700/50 bg-neutral-800/30 hover:bg-neutral-700/40 hover:text-neutral-200 hover:border-neutral-600/60 transition-all duration-200 text-xs flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Maybe Later
          </motion.button>
        </div>
      </footer>
    </div>
  );
};

export default React.memo(ProFeaturesSplashScreen);
