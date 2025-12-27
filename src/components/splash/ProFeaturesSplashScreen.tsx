import React, { useState } from 'react';
import { HandsFreeIcon } from '../ui/HandsFreeIcon';
import KeyboardIcon from '../ui/KeyboardIcon';
import { AppLoadingScreen } from '../ui/AppLoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentModal from '../modals/PaymentModal';
import { authService } from '../../services/authService';

interface ProFeaturesSplashScreenProps {
  onComplete: () => void;
  onUpgrade: () => void;
  onUpgradeToVanguard: () => void;
}

// Full feature card for desktop
const FullFeature: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <motion.div 
    className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 bg-gradient-to-br from-[#1C1C1C]/90 to-[#0A0A0A]/80 backdrop-blur-xl rounded-xl border border-neutral-800/60 hover:border-neutral-700/80 hover:shadow-lg hover:shadow-[#FF4D4D]/10 transition-all duration-300"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02, y: -2 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
  >
    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-[#FF4D4D]/20 to-[#FFAB40]/20 border border-neutral-700/60 shadow-inner">
       {children}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const proFeatures = [
  { title: "Massively Increased Limits", description: "Get 350 Text | 150 Image Queries every month.", icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#FFAB40]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> },
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

const ProFeaturesSplashScreen: React.FC<ProFeaturesSplashScreenProps> = ({ onComplete, onUpgrade: _onUpgrade, onUpgradeToVanguard: _onUpgradeToVanguard }) => {
  const [activeTab, setActiveTab] = useState<'pro' | 'vanguard'>('pro');
  const [isMounted, setIsMounted] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const user = authService.getCurrentUser();

  // Handle checkout completion - close payment modal and go to chat
  const handleCheckoutSuccess = () => {
    console.log('💳 Checkout success - navigating to chat');
    setShowPaymentModal(false);
    // Navigate to chat after successful upgrade
    onComplete();
  };
  
  // Handle checkout close - close payment modal and stay on splash
  const handleCheckoutClose = () => {
    console.log('❌ Checkout closed - closing payment modal, staying on splash');
    setShowPaymentModal(false);
    // Keep user on splash screen (they can click "Maybe Later" to proceed)
  };

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <AppLoadingScreen size="md" />;
  }

  const currentFeatures = activeTab === 'pro' ? proFeatures : vanguardFeatures;
  const isVanguard = activeTab === 'vanguard';

  return (
    <div className="h-screen bg-gradient-to-br from-[#111111] via-[#0F0F0F] to-[#0A0A0A] text-[#F5F5F5] flex flex-col font-inter overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF4D4D]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFAB40]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Tab Switcher - Top */}
      <div className="flex-shrink-0 px-4 sm:px-6 pt-5 sm:pt-6 md:pt-8 pb-3 sm:pb-4 relative z-10">
        <div className="w-full max-w-sm mx-auto p-1.5 bg-[#1A1A1A]/90 backdrop-blur-md rounded-2xl flex items-center gap-2 shadow-xl border border-neutral-800/50">
          <motion.button 
            onClick={() => setActiveTab('pro')} 
            className={`w-1/2 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'pro' ? 'bg-gradient-to-r from-[#424242] to-[#2A2A2A] text-white shadow-lg' : 'text-neutral-400 hover:text-neutral-300'}`}
            whileTap={{ scale: 0.97 }}
          >
            Pro
          </motion.button>
          <motion.button 
            onClick={() => setActiveTab('vanguard')} 
            className={`w-1/2 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'vanguard' ? 'bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] text-white shadow-lg' : 'text-neutral-400 hover:text-neutral-300'}`}
            whileTap={{ scale: 0.97 }}
          >
            Pro Vanguard
          </motion.button>
        </div>
      </div>

      {/* Main Content - Mascot and header above list, centered, mobile first */}
      <main className="flex-1 px-4 sm:px-6 py-2 sm:py-4 overflow-hidden lg:overflow-y-auto relative z-10">
        <div className="h-full max-w-7xl mx-auto flex flex-col lg:block">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="h-full"
              initial={{ opacity: 0, x: activeTab === 'pro' ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === 'pro' ? 30 : -30 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Mobile Layout - Consistent structure for both tabs */}
              <div className="lg:hidden flex flex-col items-center justify-between h-full py-2 sm:py-4">
                {/* Top: Mascot and header */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <motion.div 
                    className="relative"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <div className={`absolute inset-0 ${isVanguard ? 'bg-amber-500/20' : 'bg-[#FF4D4D]/20'} rounded-2xl blur-2xl`}></div>
                    <img 
                      src={isVanguard ? '/images/mascot/vanguard-user.png' : '/images/mascot/pro-user.png'}
                      alt={isVanguard ? 'Vanguard Mascot' : 'Pro Mascot'}
                      className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 object-contain rounded-xl"
                      data-no-viewer="true"
                    />
                  </motion.div>
                  <motion.h2 
                    className={`mt-3 sm:mt-4 text-lg sm:text-xl md:text-2xl font-bold text-center ${
                      isVanguard 
                        ? 'bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300' 
                        : 'bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {isVanguard ? 'Founding Member' : 'Otagon Pro'}
                  </motion.h2>
                  
                  {/* Pricing Badge */}
                  <motion.div 
                    className={`mt-2 px-4 py-2 rounded-full ${
                      isVanguard 
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50' 
                        : 'bg-gradient-to-r from-[#FF4D4D]/20 to-[#FFAB40]/20 border border-[#FFAB40]/50'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className={`text-base sm:text-lg font-bold ${isVanguard ? 'text-amber-300' : 'text-[#FFAB40]'}`}>
                      {isVanguard ? (
                        <>$35<span className="ml-1">/year</span></>
                      ) : (
                        <>$5<span className="ml-1">/month</span></>
                      )}
                    </p>
                  </motion.div>
                  
                  <p className="text-xs sm:text-sm text-neutral-400 text-center mt-2 px-4">
                    {isVanguard ? 'Shape the future of gaming' : 'Your ultimate gaming companion'}
                  </p>
                </div>

                {/* Middle: Badge with consistent spacing */}
                <motion.div 
                  className="flex-shrink-0 my-3 sm:my-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {isVanguard && (
                    <div className="py-2 px-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-xl shadow-lg">
                      <p className="text-xs sm:text-sm font-semibold text-amber-300 text-center">✨ All Pro features included!</p>
                    </div>
                  )}
                  {!isVanguard && (
                    <div className="py-2 px-4 bg-gradient-to-r from-[#FF4D4D]/20 to-[#FFAB40]/20 border border-[#FFAB40]/40 rounded-xl shadow-lg">
                      <p className="text-xs sm:text-sm font-semibold text-[#FFAB40] text-center">✨ Everything you need to dominate</p>
                    </div>
                  )}
                </motion.div>

                {/* Bottom: Features list - aligned at same height */}
                <div className="flex-1 w-full flex flex-col justify-start overflow-hidden min-h-0">
                  <div className="space-y-2 sm:space-y-2.5 w-full max-w-md mx-auto overflow-y-auto px-2 py-1" style={{ maxHeight: '38vh' }}>
                    {currentFeatures.map((f, index) => (
                      <motion.div 
                        key={f.title} 
                        className={`flex items-center gap-3 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl ${
                          isVanguard 
                            ? 'bg-gradient-to-r from-[#1C1C1C]/90 to-[#0A0A0A]/80 border border-amber-500/20' 
                            : 'bg-gradient-to-r from-[#1C1C1C]/90 to-[#0A0A0A]/80 border border-neutral-800/40'
                        } backdrop-blur-sm shadow-md`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                      >
                        <svg className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${isVanguard ? 'text-amber-400' : 'text-[#FFAB40]'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm sm:text-base text-neutral-100 font-medium flex-1">{f.title}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop Layout - Full cards with mascot */}
              <div className="hidden lg:flex h-full gap-10 xl:gap-12 items-center py-4">
                {/* Mascot Side - Desktop */}
                <motion.div 
                  className="w-2/5 flex flex-col items-center justify-center"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="relative">
                    <div className={`absolute inset-0 ${isVanguard ? 'bg-amber-500/20' : 'bg-[#FF4D4D]/20'} rounded-3xl blur-3xl`}></div>
                    <img 
                      src={isVanguard ? '/images/mascot/vanguard-user.png' : '/images/mascot/pro-user.png'} 
                      alt={isVanguard ? 'Vanguard Mascot' : 'Pro Mascot'}
                      className="relative w-80 h-80 xl:w-96 xl:h-96 object-contain rounded-2xl"
                      data-no-viewer="true"
                    />
                  </div>
                  <h2 className={`mt-6 text-3xl xl:text-4xl font-bold text-center bg-clip-text text-transparent ${
                    isVanguard 
                      ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300' 
                      : 'bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40]'
                  }`}>
                    {isVanguard ? 'Become a Founding Member' : 'Supercharge with Pro'}
                  </h2>
                  
                  {/* Pricing Badge - Desktop */}
                  <div className={`mt-4 px-6 py-3 rounded-2xl shadow-2xl ${
                    isVanguard 
                      ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-2 border-amber-500/60' 
                      : 'bg-gradient-to-r from-[#FF4D4D]/30 to-[#FFAB40]/30 border-2 border-[#FFAB40]/60'
                  }`}>
                    <p className={`text-2xl font-bold text-center ${isVanguard ? 'text-amber-300' : 'text-white'}`}>
                      {isVanguard ? (
                        <>$35<span className="ml-1">/year</span></>
                      ) : (
                        <>$5<span className="ml-1">/month</span></>
                      )}
                    </p>
                    {isVanguard && (
                      <p className="text-xs text-amber-300/70 text-center mt-1">Locked in forever</p>
                    )}
                  </div>
                  
                  <p className="text-base text-neutral-400 text-center mt-4 max-w-sm">
                    {isVanguard ? 'Join the elite. Shape the future of gaming.' : 'Unlock the ultimate gaming companion.'}
                  </p>
                </motion.div>

                {/* Features Side - Desktop */}
                <motion.div 
                  className="w-3/5 flex flex-col justify-center"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {isVanguard && (
                    <motion.div 
                      className="mb-6 py-4 px-5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-2xl shadow-xl"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <p className="text-base font-semibold text-amber-300 text-center">✨ All Pro features are included!</p>
                    </motion.div>
                  )}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-5">
                    {currentFeatures.map((f, index) => (
                      <motion.div
                        key={f.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                      >
                        <FullFeature title={f.title} description={f.description}>{f.icon}</FullFeature>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer - Sticky */}
      <footer className="flex-shrink-0 bg-gradient-to-t from-[#0A0A0A]/95 via-[#0F0F0F]/90 to-transparent px-4 sm:px-6 md:px-8 pt-3 sm:pt-4 pb-5 sm:pb-6 md:pb-7 relative z-10 border-t border-neutral-800/30">
        <div className="w-full max-w-xl mx-auto space-y-2.5 sm:space-y-3">
          {/* Upgrade Button - Matching Initial Splash Primary Button */}
          <motion.button
            onClick={() => setShowPaymentModal(true)}
            className="w-full btn-primary-touch-safe text-sm sm:text-base flex items-center justify-center gap-2 sm:gap-2.5"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <svg className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-extrabold">
              {activeTab === 'pro' ? 'Upgrade to Pro - $5' : 'Join Vanguard - $35'}
              <span className="ml-0.5">{activeTab === 'pro' ? '/month' : '/year'}</span>
            </span>
          </motion.button>
          
          {/* Maybe Later Button - Matching Initial Splash Secondary Button */}
          <motion.button
            onClick={onComplete}
            className="w-full btn-secondary-touch-safe text-sm sm:text-base flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.99 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-bold">Maybe Later</span>
          </motion.button>
        </div>
      </footer>
      
      {/* Payment Modal */}
      {user && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          user={user}
          defaultTier={activeTab === 'pro' ? 'pro' : 'vanguard_pro'}
          onCheckoutSuccess={handleCheckoutSuccess}
          onCheckoutClose={handleCheckoutClose}
        />
      )}
    </div>
  );
};

export default React.memo(ProFeaturesSplashScreen);
