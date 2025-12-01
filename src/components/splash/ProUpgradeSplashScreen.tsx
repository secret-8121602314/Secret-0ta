import React from 'react';

interface ProUpgradeSplashScreenProps {
  isOpen: boolean;
  onClose: () => void;
  tierName?: 'pro' | 'vanguard_pro';
}

// Pro features to highlight
const PRO_FEATURES = [
  {
    icon: '🚀',
    title: '1,583 Text Queries',
    description: 'Get answers to all your gaming questions'
  },
  {
    icon: '📸',
    title: '328 Image Queries',
    description: 'Analyze screenshots for instant help'
  },
  {
    icon: '⚡',
    title: 'Batch Screenshots (F2)',
    description: 'Capture multiple screenshots at once'
  },
  {
    icon: '🎮',
    title: 'Auto Game Insights',
    description: 'Get builds, tips & strategies for each game'
  },
  {
    icon: '🔍',
    title: 'Grounding Search',
    description: 'Real-time info from the web'
  },
  {
    icon: '🎤',
    title: 'Hands-Free Mode',
    description: 'AI reads responses while you play'
  }
];

const VANGUARD_EXTRAS = [
  {
    icon: '👑',
    title: 'VIP Support',
    description: 'Priority access to our team'
  },
  {
    icon: '🌟',
    title: 'Early Access',
    description: 'Try new features before anyone else'
  }
];

/**
 * Celebratory splash screen shown when a user upgrades from Free to Pro/Vanguard
 * for the first time. Shows all the new features they've unlocked.
 */
const ProUpgradeSplashScreen: React.FC<ProUpgradeSplashScreenProps> = ({ 
  isOpen, 
  onClose,
  tierName = 'pro'
}) => {
  if (!isOpen) {
    return null;
  }

  const isVanguard = tierName === 'vanguard_pro';
  const features = isVanguard ? [...PRO_FEATURES, ...VANGUARD_EXTRAS] : PRO_FEATURES;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/95 to-[#0A0A0A]/95 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
      <div className="text-center max-w-2xl w-full animate-scale-in my-8">
        {/* Celebration header */}
        <div className="relative mb-6">
          {/* Glow effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-32 h-32 ${isVanguard ? 'bg-purple-500/30' : 'bg-blue-500/30'} rounded-full blur-3xl animate-pulse`}></div>
          </div>
          
          {/* Crown/Star icon */}
          <div className="relative text-6xl sm:text-7xl animate-bounce" style={{ animationDuration: '1s' }}>
            {isVanguard ? '👑' : '⭐'}
          </div>
        </div>
        
        {/* Title */}
        <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${isVanguard ? 'text-purple-400' : 'text-blue-400'}`}>
          Welcome to {isVanguard ? 'Vanguard Pro' : 'Pro'}!
        </h1>
        <p className="text-lg text-[#CFCFCF] mb-6">
          You've unlocked the full Otagon experience
        </p>

        {/* Features grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="bg-gradient-to-r from-[#1C1C1C]/80 to-[#0A0A0A]/80 border border-[#424242]/40 rounded-xl p-3 text-left hover:border-[#5A5A5A]/60 transition-all duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h3 className="text-sm font-semibold text-[#F5F5F5] mb-1">{feature.title}</h3>
              <p className="text-xs text-[#A3A3A3] leading-tight">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Pro tips */}
        <div className="bg-gradient-to-r from-[#2E2E2E]/60 to-[#1A1A1A]/60 border border-[#424242]/40 rounded-xl p-4 mb-6 text-left">
          <h3 className="text-sm font-semibold text-[#FFAB40] mb-2 flex items-center gap-2">
            <span>💡</span> Pro Tips
          </h3>
          <ul className="text-xs text-[#CFCFCF] space-y-1">
            <li>• Press <span className="font-mono bg-[#2E2E2E] px-1 rounded">F2</span> on PC for batch screenshots</li>
            <li>• Game insights are auto-generated for each game tab</li>
            <li>• Toggle Hands-Free mode for voice responses while gaming</li>
          </ul>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-3 h-3 ${isVanguard ? 'bg-purple-400' : 'bg-blue-400'} rounded-full animate-pulse`}></div>
          <span className={`text-sm ${isVanguard ? 'text-purple-400' : 'text-blue-400'}`}>
            {isVanguard ? 'Vanguard Pro' : 'Pro'} Active
          </span>
        </div>

        {/* CTA Button */}
        <button
          onClick={onClose}
          className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-4 px-12 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#E53A3A]/25"
        >
          Let's Game! 🎮
        </button>
      </div>
    </div>
  );
};

export default React.memo(ProUpgradeSplashScreen);
