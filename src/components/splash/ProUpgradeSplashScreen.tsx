import React from 'react';

interface ProUpgradeSplashScreenProps {
  isOpen: boolean;
  onClose: () => void;
  tierName?: 'pro' | 'vanguard_pro';
}

// SVG Icons for features - responsive sizing
const TextIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFAB40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFAB40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BatchIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFAB40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const InsightsIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFAB40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFAB40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const HandsFreeIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFAB40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const CommandCentreIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFAB40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const VIPIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFAB40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const EarlyAccessIcon = () => (
  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#FFAB40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

// Pro features to highlight
const PRO_FEATURES = [
  {
    icon: <TextIcon />,
    title: '350 Text Queries',
    description: 'Get answers to all your gaming questions'
  },
  {
    icon: <ImageIcon />,
    title: '150 Image Queries',
    description: 'Analyze screenshots for instant help'
  },
  {
    icon: <BatchIcon />,
    title: 'Batch Screenshots',
    description: 'Capture multiple screenshots at once'
  },
  {
    icon: <InsightsIcon />,
    title: 'Auto Game Insights',
    description: 'Builds, tips & strategies for each game'
  },
  {
    icon: <SearchIcon />,
    title: 'Web Search',
    description: 'Real-time info from the web'
  },
  {
    icon: <HandsFreeIcon />,
    title: 'Hands-Free Mode',
    description: 'AI reads responses while you play'
  },
  {
    icon: <CommandCentreIcon />,
    title: 'Command Centre',
    description: 'Modify or delete tabs with @ commands'
  }
];

const VANGUARD_EXTRAS = [
  {
    icon: <VIPIcon />,
    title: 'VIP Support',
    description: 'Priority access to our team'
  },
  {
    icon: <EarlyAccessIcon />,
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
    <div className="fixed inset-0 bg-gradient-to-br from-black/95 to-[#0A0A0A]/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 md:p-6 z-50 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg mx-auto animate-scale-in">
        {/* Card container */}
        <div className="bg-gradient-to-b from-[#1A1A1A]/90 to-[#0D0D0D]/90 border border-[#2A2A2A] rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-2xl">
          
          {/* Mascot with glow - smaller on mobile */}
          <div className="relative flex justify-center mb-2 sm:mb-4">
            {/* Glow effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-20 h-20 sm:w-36 sm:h-36 ${isVanguard ? 'bg-purple-500/25' : 'bg-blue-500/25'} rounded-full blur-3xl animate-pulse`}></div>
            </div>
            
            {/* Pro mascot image */}
            <img
              src="/images/mascot/pro-user.png"
              alt="Pro User"
              className="relative w-16 h-16 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain animate-bounce"
              style={{ animationDuration: '1.5s' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          
          {/* Title */}
          <h1 className={`text-lg sm:text-2xl md:text-3xl font-bold text-center mb-0.5 sm:mb-2 ${isVanguard ? 'text-purple-400' : 'text-blue-400'}`}>
            Welcome to {isVanguard ? 'Vanguard Pro' : 'Pro'}!
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-[#CFCFCF] text-center mb-3 sm:mb-5">
            You've unlocked the full Otagon experience
          </p>

          {/* Features grid - 3 columns on mobile, 2 on tablet+ */}
          <div className="grid grid-cols-3 sm:grid-cols-2 gap-1.5 sm:gap-3 mb-3 sm:mb-5">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="bg-[#1E1E1E]/60 border border-[#333333]/60 rounded-lg sm:rounded-xl p-2 sm:p-3"
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2.5">
                  <div className="flex-shrink-0">{feature.icon}</div>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <h3 className="text-[10px] sm:text-sm font-semibold text-[#F5F5F5] leading-tight">{feature.title}</h3>
                    <p className="hidden sm:block text-xs text-[#A3A3A3] leading-tight mt-0.5">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pro tips - more compact on mobile */}
          <div className="bg-[#1E1E1E]/60 border border-[#333333]/60 rounded-lg sm:rounded-xl p-2.5 sm:p-4 mb-3 sm:mb-5">
            <h3 className="text-xs sm:text-sm font-semibold text-[#FFAB40] mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Pro Tips
            </h3>
            <ul className="text-[10px] sm:text-xs text-[#CFCFCF] space-y-0.5 sm:space-y-1">
              <li className="flex items-start gap-1.5">
                <span className="text-[#FFAB40] mt-0.5">•</span>
                <span>Press <span className="font-mono bg-[#2E2E2E] px-1 py-0.5 rounded text-[#FFAB40]">F2</span> on PC for batch screenshots</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#FFAB40] mt-0.5">•</span>
                <span>Game insights auto-generate for each game tab</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#FFAB40] mt-0.5">•</span>
                <span>Toggle Hands-Free mode for voice responses</span>
              </li>
            </ul>
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-5">
            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${isVanguard ? 'bg-purple-400' : 'bg-blue-400'} rounded-full animate-pulse`}></div>
            <span className={`text-xs sm:text-sm font-medium ${isVanguard ? 'text-purple-400' : 'text-blue-400'}`}>
              {isVanguard ? 'Vanguard Pro' : 'Pro'} Active
            </span>
          </div>

          {/* CTA Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-2.5 sm:py-4 px-6 rounded-xl text-sm sm:text-base transition-all duration-300 active:scale-[0.98] hover:shadow-lg hover:shadow-[#E53A3A]/25"
          >
            Let's Go!
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProUpgradeSplashScreen);
