import React from 'react';
import KeyboardIcon from '../ui/KeyboardIcon';
import ScreenshotIcon from '../ui/ScreenshotIcon';
import { HandsFreeIcon } from '../ui/HandsFreeIcon';
import PauseIcon from '../ui/PauseIcon';
import PlayIcon from '../ui/PlayIcon';

interface HowToUseSplashScreenProps {
  onComplete: () => void;
}

const InsightsIcon = ({ className = 'w-12 h-12' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);

const ProBadge = () => (
  <span className="text-xs font-bold bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white px-2 py-0.5 rounded-full uppercase tracking-wider ml-2">
    PRO
  </span>
);

const FeatureItem: React.FC<{ icon: React.ReactNode; title: React.ReactNode; children: React.ReactNode }> = ({ icon, title, children }) => {
  return (
    <div className="flex items-start gap-8 p-8 transition-all duration-500 hover:scale-105 bg-gradient-to-r from-[#1C1C1C]/40 to-[#0A0A0A]/40 border border-neutral-800/60 rounded-2xl backdrop-blur-sm">
      <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 mt-1 rounded-xl bg-gradient-to-br from-[#FF4D4D]/20 to-[#FFAB40]/20 border-2 border-neutral-700/60 backdrop-blur-sm">
        {icon}
      </div>
      <div className="flex-grow">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">{title}</h3>
        <div className="text-neutral-300 text-base leading-relaxed space-y-3">{children}</div>
      </div>
    </div>
  );
};

const HowToUseSplashScreen: React.FC<HowToUseSplashScreenProps> = ({ onComplete }) => {
  return (
    <div className="h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] text-[#F5F5F5] flex flex-col font-inter">
      {/* Fixed Header */}
      <header className="flex-shrink-0 px-4 sm:px-6 md:px-8 pt-3 sm:pt-4 md:pt-6 pb-2 sm:pb-3 text-center z-10 bg-gradient-to-br from-[#111111] to-[#0A0A0A]">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white leading-normal">You're Connected!</h1>
          <p className="text-base text-neutral-300 leading-relaxed mt-2">Master Otagon in four easy steps.</p>
        </div>
      </header>

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 pb-3 sm:pb-4 md:pb-6 how-to-use-scrollbar">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 py-2 sm:py-3">
          {/* Item 1: Capture */}
          <FeatureItem
            icon={<KeyboardIcon className="w-6 h-6 text-[#FFAB40]" />}
            title="1. Instant Capture"
          >
            <p className="mb-4">Use hotkeys to instantly analyze your game screen. Toggle the 
              <span className="inline-flex items-center align-middle mx-2 px-2 py-1 rounded-lg bg-black/50 border-2 border-neutral-700/60">
                <PauseIcon className="w-4 h-4 text-sky-400" />
                <span className="text-white mx-1">/</span>
                <PlayIcon className="w-4 h-4 text-neutral-400" />
              </span>
               button to switch between auto-sending and manual review.</p>
            <div className="space-y-3 text-sm p-4 bg-gradient-to-r from-black/40 to-neutral-900/40 rounded-xl border border-neutral-700/60 backdrop-blur-sm">
              <p><strong className="text-neutral-200">Single Shot:</strong> <kbd className="px-3 py-1.5 mx-2 font-sans font-semibold text-neutral-200 bg-gradient-to-r from-neutral-900/60 to-neutral-800/60 border-2 border-neutral-700/60 rounded-lg">F1</kbd></p>
              <p><strong className="text-neutral-200">Multi Shot:</strong> <kbd className="px-3 py-1.5 mx-2 font-sans font-semibold text-neutral-200 bg-gradient-to-r from-neutral-900/60 to-neutral-800/60 border-2 border-neutral-700/60 rounded-lg">F2</kbd></p>
              <p className="text-xs text-neutral-400 mt-2">
                💡 <strong>Custom Hotkeys:</strong> You can configure your own hotkeys in the PC client settings
              </p>
            </div>
          </FeatureItem>

          {/* Item 2: Screenshot Quality */}
          <FeatureItem
            icon={<ScreenshotIcon className="w-6 h-6 text-[#FFAB40]" />}
            title="2. The Perfect Screenshot"
          >
            <p>For the best hints, capture clear, full-screen views of:</p>
            <ul className="list-disc list-inside mt-3 space-y-2">
              <li>Your inventory, skill tree, or map screen.</li>
              <li>The entire boss arena, including the boss.</li>
              <li>The specific puzzle or object you're stuck on.</li>
            </ul>
          </FeatureItem>

          {/* Item 3: Insights */}
          <FeatureItem
            icon={<InsightsIcon className="w-6 h-6 text-[#FFAB40]" />}
            title={<>3. Manage Insights<ProBadge /></>}
          >
            <p className="mb-4">
              Take direct control of your game wiki with natural language commands.
            </p>
            <div className="space-y-4 text-sm p-4 bg-gradient-to-r from-black/40 to-neutral-900/40 rounded-xl border border-neutral-700/60 backdrop-blur-sm">
              <p>
                <strong className="text-neutral-200">Add new tab:</strong><br/>
                <kbd className="px-3 py-1.5 mt-2 inline-block font-sans font-semibold text-neutral-200 bg-gradient-to-r from-neutral-900/60 to-neutral-800/60 border-2 border-neutral-700/60 rounded-lg w-full text-left">"add tab [title]"</kbd>
              </p>
              <p>
                <strong className="text-neutral-200">Modify existing tab:</strong><br/>
                <kbd className="px-3 py-1.5 mt-1 inline-block font-sans font-semibold text-neutral-200 bg-gradient-to-r from-neutral-900/60 to-neutral-800/60 border-2 border-neutral-700/60 rounded-lg w-full text-left">"modify tab [id] to [new title]"</kbd>
              </p>
              <p>
                <strong className="text-neutral-200">Delete a tab:</strong><br/>
                <kbd className="px-3 py-1.5 mt-1 inline-block font-sans font-semibold text-neutral-200 bg-gradient-to-r from-neutral-900/60 to-neutral-800/60 border-2 border-neutral-700/60 rounded-lg w-full text-left">"delete tab [id] confirm"</kbd>
              </p>
              <p className="text-xs text-neutral-400 mt-2">
                💡 <strong>Examples:</strong> "add tab Game Progress", "modify tab tab_123 to Current Objectives"
              </p>
            </div>
          </FeatureItem>

          {/* Item 4: Hands-Free */}
          <FeatureItem
            icon={<HandsFreeIcon isActive={true} className="w-6 h-6 text-[#FFAB40]" />}
            title={<>4. Go Hands-Free<ProBadge /></>}
          >
            <p>Stay immersed in the action. Enable Hands-Free mode to have hints and lore read aloud to you, keeping you focused on your game.</p>
          </FeatureItem>
        </div>
      </main>

      {/* Fixed Footer */}
      <footer className="flex-shrink-0 p-6 sm:p-8 z-10 bg-gradient-to-br from-[#111111] to-[#0A0A0A]">
        <div className="w-full max-w-4xl mx-auto text-center">
          <button
            onClick={onComplete}
            className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#E53A3A] hover:to-[#D98C1F] text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 text-lg flex items-center justify-center mx-auto"
          >
            Let's Begin
          </button>
        </div>
      </footer>
    </div>
  );
};

export default React.memo(HowToUseSplashScreen);
