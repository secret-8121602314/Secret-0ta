import React, { useState } from 'react';

interface WelcomeScreenProps {
  onStartChat: () => void;
  onAddGame?: () => void;
}

type TabType = 'overview' | 'features' | 'advanced' | 'hotkeys' | 'best-practices';

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartChat, onAddGame: _onAddGame }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'features' as TabType, label: 'Features' },
    { id: 'advanced' as TabType, label: 'Advanced' },
    { id: 'hotkeys' as TabType, label: 'PC Hotkeys' },
    { id: 'best-practices' as TabType, label: 'Best Practices' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-[95vh] sm:max-h-[90vh] bg-background rounded-xl sm:rounded-2xl shadow-2xl bg-clip-padding flex flex-col overflow-hidden" style={{ backgroundImage: 'linear-gradient(#1a1a1a, #1a1a1a), linear-gradient(135deg, #FF4D4D, #FFAB40)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }}>

        {/* Tabs */}
        <div className="flex-shrink-0 border-b border-gray-700 px-2 sm:px-3 md:px-6 pt-3 sm:pt-6">
          <div className="flex justify-start sm:justify-center gap-1 sm:gap-2 md:gap-3 overflow-x-auto pr-8 sm:pr-12 pb-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 min-h-[44px] text-xs sm:text-sm md:text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-[#FF4D4D] text-white bg-gradient-to-b from-[#FF4D4D]/10 to-transparent'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'features' && <FeaturesTab />}
            {activeTab === 'advanced' && <AdvancedFeaturesTab />}
            {activeTab === 'hotkeys' && <HotkeysTab />}
            {activeTab === 'best-practices' && <BestPracticesTab />}
          </div>
        </div>

        {/* CTA Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 py-2 sm:py-3 md:py-4 px-3 sm:px-4 md:px-6 border-t border-gray-700 bg-background">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center justify-center">
            {/* Close Guide Button */}
            <button
              onClick={onStartChat}
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] md:hover:from-[#D42A2A] md:hover:to-[#C87A1A] rounded-lg shadow-lg md:hover:shadow-xl transition-all duration-200 md:hover:scale-105 active:scale-95 min-h-[44px]"
            >
              <span>Got It!</span>
              <svg 
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = () => (
  <div className="space-y-4 sm:space-y-6">
    <div className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-[#FF4D4D]/30 rounded-xl p-4 sm:p-6 shadow-xl">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary mb-3 sm:mb-4 flex items-center">
        <span className="mr-2 sm:mr-3">🎯</span>
        Welcome to Otagon
      </h2>
      <p className="text-xs sm:text-sm md:text-base text-text-muted leading-relaxed mb-3 sm:mb-4">
        Otagon is your intelligent gaming companion powered by AI. It helps you overcome challenges, 
        discover secrets, and master any game without spoiling the experience. Whether you're stuck 
        on a boss, need strategic advice, or want to understand game mechanics, Otagon has your back.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-4 sm:mt-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
          <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📸</div>
          <h3 className="font-semibold text-text-primary mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">Screenshot Analysis</h3>
          <p className="text-[10px] sm:text-xs md:text-sm text-text-muted">Upload any game screenshot for instant insights</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-lg p-3 sm:p-4">
          <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🎮</div>
          <h3 className="font-semibold text-text-primary mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">Game-Specific Tabs</h3>
          <p className="text-[10px] sm:text-xs md:text-sm text-text-muted">Auto-organized tabs for each game you play</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-3 sm:p-4">
          <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📚</div>
          <h3 className="font-semibold text-text-primary mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">Smart Insights</h3>
          <p className="text-[10px] sm:text-xs md:text-sm text-text-muted">Story, tips, builds auto-generated for you</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-lg p-3 sm:p-4">
          <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">⚡</div>
          <h3 className="font-semibold text-text-primary mb-1 sm:mb-2 text-xs sm:text-sm md:text-base">Dual Modes</h3>
          <p className="text-[10px] sm:text-xs md:text-sm text-text-muted">Playing vs Planning for different needs</p>
        </div>
      </div>
    </div>

    <div className="bg-surface/50 border border-surface-light/30 rounded-xl p-4 sm:p-6">
      <h2 className="text-base sm:text-lg md:text-xl font-bold text-text-primary mb-3 sm:mb-4 flex items-center">
        <span className="mr-2 sm:mr-3">🚀</span>
        Quick Start Guide
      </h2>
      <ol className="space-y-3 sm:space-y-4">
        <li className="flex items-start">
          <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm mr-2 sm:mr-3">1</span>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-0.5 sm:mb-1 text-sm sm:text-base">Start in Game Hub</h3>
            <p className="text-xs sm:text-sm text-text-muted">Ask general gaming questions or upload screenshots</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm mr-2 sm:mr-3">2</span>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-0.5 sm:mb-1 text-sm sm:text-base">Create Game Tabs</h3>
            <p className="text-xs sm:text-sm text-text-muted">Mention a game or upload its screenshot to create a dedicated tab</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm mr-2 sm:mr-3">3</span>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-0.5 sm:mb-1 text-sm sm:text-base">Explore Insight Tabs</h3>
            <p className="text-xs sm:text-sm text-text-muted">AI auto-generates Story, Tips, Builds tabs as you ask questions</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm mr-2 sm:mr-3">4</span>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-0.5 sm:mb-1 text-sm sm:text-base">Toggle Modes</h3>
            <p className="text-xs sm:text-sm text-text-muted">Switch between Playing (active help) and Planning (strategy)</p>
          </div>
        </li>
      </ol>
    </div>
  </div>
);

// Features Tab Component
const FeaturesTab = () => {
  const features = [
    {
      icon: '📸',
      title: 'Screenshot Analysis',
      description: 'Upload any game screenshot and get instant tactical advice, lore explanations, and hidden secrets.',
      tips: [
        'Works with any game - from AAA titles to indie gems',
        'AI analyzes HUD elements, enemy types, inventory, and environment',
        'Get tactical positioning advice and item recommendations'
      ]
    },
    {
      icon: '🎮',
      title: 'Game-Specific Tabs',
      description: 'Otagon automatically creates dedicated tabs for each game you mention or screenshot.',
      tips: [
        'Each game gets its own organized conversation space',
        'Tabs persist across sessions - your knowledge builds over time',
        'Easily switch between multiple games you\'re playing'
      ]
    },
    {
      icon: '📚',
      title: 'Smart Insight Tabs',
      isPro: true,
      description: 'AI automatically generates and updates specialized tabs for story, tips, builds, and more.',
      tips: [
        'Story tab: Spoiler-free lore and character backgrounds',
        'Tips tab: Combat strategies, secrets, and optimizations',
        'Builds tab: Character builds, skill trees, and equipment loadouts',
        'Genre-aware: Different tab types for RPGs, shooters, puzzles, etc.'
      ]
    },
    {
      icon: '⚡',
      title: 'Playing vs Planning Mode',
      description: 'Toggle between active gameplay help and strategic planning modes.',
      tips: [
        'Playing Mode: Real-time tactical advice during active gameplay',
        'Planning Mode: Strategic planning, builds, and long-term goals',
        'AI adapts its responses based on your current mode',
        'Session summaries capture key learnings when you switch modes'
      ]
    },
    {
      icon: '🔗',
      title: 'PC Connection',
      description: 'Connect your PC client to send screenshots with a single hotkey press.',
      tips: [
        'No alt-tabbing required - stay in your game',
        'Instant screenshot capture with F1 or F2',
        'Auto-send or Pause mode for different workflows'
      ]
    },
    {
      icon: '🤖',
      title: 'AI Mode Toggle',
      isPro: true,
      description: 'Control whether screenshots are analyzed by AI or just saved.',
      tips: [
        'AI ON: Screenshots analyzed automatically (default)',
        'AI OFF: Screenshots saved without analysis - no credits used',
        'Perfect for capturing moments to share without spending queries',
        'Toggle anytime from the header AI button'
      ]
    },
    {
      icon: '🌐',
      title: 'Web Search',
      isPro: true,
      description: 'Get real-time information with Google-powered web search.',
      tips: [
        'Latest patch notes, updates, and meta changes',
        'Current event information and limited-time content',
        'Essential for games released after January 2025',
        'Toggle on/off per query with web search button'
      ]
    },
    {
      icon: '📸',
      title: 'Batch Screenshot Capture',
      isPro: true,
      description: 'Capture multiple screenshots from recent gameplay with F2 hotkey.',
      tips: [
        'Captures last 5 minutes of gameplay screenshots',
        'AI analyzes all images for comprehensive context',
        'Perfect for complex boss fights or puzzle sequences',
        'Requires PC connection'
      ]
    },
    {
      icon: '🎤',
      title: 'Hands-Free Voice Mode',
      isPro: true,
      description: 'Have AI responses read aloud while you focus on the game.',
      tips: [
        'Perfect for action games where you can\'t look away',
        'Choose from multiple voices and adjust speed',
        'Toggle on/off anytime from the header (headphones icon)',
        'Customize voice settings in Voice Settings modal'
      ]
    },
    {
      icon: '💬',
      title: 'Chat Input Controls',
      description: 'Powerful chat input with upload, voice, and mode controls.',
      tips: [
        'Upload button: Manually upload screenshots or images',
        'Voice mode indicator: Shows when hands-free is active',
        'Playing/Planning toggle: Switch modes directly from input',
        'Image preview: See queued screenshots before sending'
      ]
    },
    {
      icon: '➕',
      title: 'Add Game Manually',
      description: 'Create game tabs without screenshots - just type the game name.',
      tips: [
        'Use "Add Game" button in sidebar or type game name in Game Hub',
        'IGDB integration provides cover art and game metadata',
        'Perfect for planning before you start playing'
      ]
    },
    {
      icon: '🔮',
      title: 'Unreleased Game Support',
      description: 'Discuss upcoming games before they release with special Discuss mode.',
      tips: [
        'Pre-release games detected automatically from screenshots',
        'Discuss Mode: Talk about trailers, news, and expectations',
        'Playing mode unlocks automatically after release date'
      ]
    },
    {
      icon: '💡',
      title: 'Suggested Prompts',
      description: 'AI generates contextual follow-up suggestions after each response.',
      tips: [
        'One-tap to ask common follow-up questions',
        'Suggestions adapt to your current game and conversation',
        'Great for discovering new strategies and hidden content'
      ]
    },
    {
      icon: '🎯',
      title: 'Context-Aware AI',
      description: 'AI remembers your conversation history and game progress.',
      tips: [
        'Follows up on previous questions naturally',
        'Tracks your game progress across sessions (0-100%)',
        'Provides personalized recommendations based on your playstyle'
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6">
      {features.map((feature, index) => (
        <div
          key={index}
          className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-surface-light/30 rounded-xl p-4 sm:p-6 hover:border-[#FF4D4D]/50 transition-all duration-300"
        >
          <div className="flex items-start space-x-3 sm:space-x-4">
            <div className="text-2xl sm:text-3xl md:text-4xl flex-shrink-0">{feature.icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-text-primary mb-1 sm:mb-2 flex items-center flex-wrap gap-2">
                <span>{feature.title}</span>
                {feature.isPro && (
                  <span className="px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded text-[10px] sm:text-xs font-medium">PRO</span>
                )}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-text-muted mb-2 sm:mb-4 leading-relaxed">{feature.description}</p>
              <div className="space-y-1 sm:space-y-2">
                {feature.tips.map((tip, tipIndex) => (
                  <div key={tipIndex} className="flex items-start text-[10px] sm:text-xs md:text-sm">
                    <span className="text-[#FF4D4D] mr-1 sm:mr-2 mt-0.5 flex-shrink-0">▸</span>
                    <span className="text-text-secondary">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Advanced Features Tab Component
const AdvancedFeaturesTab = () => (
  <div className="space-y-6">
    {/* Command Centre Section */}
    <div className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-[#FF4D4D]/30 rounded-xl p-4 sm:p-6 shadow-xl">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary mb-3 sm:mb-4 flex items-center flex-wrap">
        <span className="mr-3">💬</span>
        Command Centre - @Commands
      </h2>
      <p className="text-sm sm:text-base text-text-muted leading-relaxed mb-6">
        Use @commands to directly update, modify, or delete your insight tabs. This gives you full control 
        over your game knowledge base using natural language.
      </p>
      
      <div className="space-y-4">
        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-4">
          <h3 className="font-semibold text-text-primary mb-3 flex items-center">
            <span className="text-green-400 mr-2">✏️</span>
            Update Tab Content
          </h3>
          <p className="text-sm text-text-muted mb-3">Add or replace content in any insight tab:</p>
          <div className="space-y-2">
            <div className="bg-surface/50 rounded px-3 py-2">
              <code className="text-xs sm:text-sm text-[#FFAB40]">@Tips</code>
              <span className="text-xs sm:text-sm text-text-secondary ml-2">Add this boss weakness strategy...</span>
            </div>
            <div className="bg-surface/50 rounded px-3 py-2">
              <code className="text-xs sm:text-sm text-[#FFAB40]">@Builds</code>
              <span className="text-xs sm:text-sm text-text-secondary ml-2">Update with this new loadout...</span>
            </div>
          </div>
        </div>

        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-4">
          <h3 className="font-semibold text-text-primary mb-3 flex items-center">
            <span className="text-blue-400 mr-2">🔄</span>
            Rename Tabs
          </h3>
          <p className="text-sm text-text-muted mb-3">Change the name of existing tabs:</p>
          <div className="bg-surface/50 rounded px-3 py-2">
            <code className="text-xs sm:text-sm text-[#FFAB40]">@Tips \modify</code>
            <span className="text-xs sm:text-sm text-text-secondary ml-2">Combat Strategies</span>
          </div>
        </div>

        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-4">
          <h3 className="font-semibold text-text-primary mb-3 flex items-center">
            <span className="text-red-400 mr-2">🗑️</span>
            Delete Tabs
          </h3>
          <p className="text-sm text-text-muted mb-3">Remove tabs you no longer need:</p>
          <div className="bg-surface/50 rounded px-3 py-2">
            <code className="text-xs sm:text-sm text-[#FFAB40]">@OldGuide \delete</code>
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-text-primary mb-3 flex items-center">
            <span className="text-purple-400 mr-2">📸</span>
            Update Tabs with Images
          </h3>
          <p className="text-sm text-text-muted mb-3">
            Combine images with @commands for visual updates:
          </p>
          <ol className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">1.</span>
              <span>Set PC connection to <strong className="text-text-primary">Pause Mode</strong> or use the <strong className="text-text-primary">Upload Button</strong></span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">2.</span>
              <span>Capture/upload image - it will queue in the chat input</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">3.</span>
              <span>Add your @command: <code className="text-[#FFAB40]">@Builds</code> Save this loadout screenshot</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">4.</span>
              <span>Send - image and command are processed together</span>
            </li>
          </ol>
        </div>
      </div>
    </div>

    {/* PC Connection Modes Section */}
    <div className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-surface-light/30 rounded-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary mb-3 sm:mb-4 flex items-center">
        <span className="mr-2 sm:mr-3">🔗</span>
        PC Connection Modes
      </h2>
      <p className="text-xs sm:text-sm md:text-base text-text-muted leading-relaxed mb-4 sm:mb-6">
        Control how screenshots are handled. Toggle using the play/pause button.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 sm:p-4">
          <div className="flex items-center mb-2 sm:mb-3">
            <span className="text-xl sm:text-2xl mr-2">▶️</span>
            <h3 className="font-semibold text-text-primary text-sm sm:text-base">Auto-Send</h3>
          </div>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-text-muted">
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Screenshots sent instantly when captured</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Fastest response during active gameplay</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Best for real-time help during boss fights</span>
            </li>
          </ul>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 sm:p-4">
          <div className="flex items-center mb-2 sm:mb-3">
            <span className="text-xl sm:text-2xl mr-2">⏸️</span>
            <h3 className="font-semibold text-text-primary text-sm sm:text-base">Pause Mode</h3>
          </div>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-text-muted">
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <span>Screenshots queue in input</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <span>Review before sending</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <span>Combine with @commands</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    {/* Playing vs Planning Toggle Section */}
    <div className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-surface-light/30 rounded-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary mb-3 sm:mb-4 flex items-center">
        <span className="mr-2 sm:mr-3">⚡</span>
        Playing vs Planning
      </h2>
      <p className="text-xs sm:text-sm md:text-base text-text-muted leading-relaxed mb-4 sm:mb-6">
        Switch between active gameplay help and strategic planning modes.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 sm:p-4">
          <div className="flex items-center mb-2 sm:mb-3">
            <span className="text-xl sm:text-2xl mr-2">🎮</span>
            <h3 className="font-semibold text-text-primary text-sm sm:text-base">Playing Mode</h3>
          </div>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-text-muted">
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Real-time tactical advice</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Quick, actionable tips</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Focus on immediate challenges</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
          <div className="flex items-center mb-2 sm:mb-3">
            <span className="text-xl sm:text-2xl mr-2">📋</span>
            <h3 className="font-semibold text-text-primary text-sm sm:text-base">Planning Mode</h3>
          </div>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-text-muted">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Long-term strategy and builds</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Detailed explanations</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Character optimization</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-xl">💡</div>
          <div>
            <h3 className="font-semibold text-text-primary mb-1 text-sm">Session Summaries</h3>
            <p className="text-xs text-text-muted">
              When you switch from Playing to Planning mode, OTAKON creates a summary of your 
              playing session's key learnings. These are saved to your insight tabs automatically.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Insight Tabs (Subtabs) Section */}
    <div className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-surface-light/30 rounded-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary mb-3 sm:mb-4 flex items-center">
        <span className="mr-2 sm:mr-3">📚</span>
        Insight Tabs
      </h2>
      <p className="text-xs sm:text-sm md:text-base text-text-muted leading-relaxed mb-4 sm:mb-6">
        Each game tab has insight tabs that auto-update as you chat.
      </p>

      <div className="space-y-3 sm:space-y-4">
        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-3 sm:p-4">
          <h3 className="font-semibold text-text-primary mb-2 sm:mb-3 text-sm sm:text-base">How They Work</h3>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-text-muted">
            <li className="flex items-start">
              <span className="text-[#FF4D4D] mr-2">1.</span>
              <span><strong>Auto-Created:</strong> AI detects relevant topics and creates tabs (Story, Tips, Builds, etc.)</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FF4D4D] mr-2">2.</span>
              <span><strong>Progressive Updates:</strong> Content is added as you ask questions</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FF4D4D] mr-2">3.</span>
              <span><strong>Genre-Aware:</strong> Different tab types based on game genre (RPG, FPS, Puzzle, etc.)</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#FF4D4D] mr-2">4.</span>
              <span><strong>Manual Control:</strong> Use @commands to update, rename, or delete tabs</span>
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          <div className="bg-surface/30 rounded-lg p-2 sm:p-3 text-center">
            <span className="text-lg sm:text-xl">📖</span>
            <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 sm:mt-1">Story</p>
          </div>
          <div className="bg-surface/30 rounded-lg p-2 sm:p-3 text-center">
            <span className="text-lg sm:text-xl">💡</span>
            <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 sm:mt-1">Tips</p>
          </div>
          <div className="bg-surface/30 rounded-lg p-2 sm:p-3 text-center">
            <span className="text-lg sm:text-xl">⚔️</span>
            <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 sm:mt-1">Builds</p>
          </div>
          <div className="bg-surface/30 rounded-lg p-2 sm:p-3 text-center">
            <span className="text-lg sm:text-xl">🗺️</span>
            <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 sm:mt-1">Maps</p>
          </div>
        </div>
      </div>
    </div>

    {/* Message Migration Section */}
    <div className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-surface-light/30 rounded-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary mb-3 sm:mb-4 flex items-center">
        <span className="mr-2 sm:mr-3">📤</span>
        Message Migration
      </h2>
      <p className="text-xs sm:text-sm md:text-base text-text-muted leading-relaxed mb-4 sm:mb-6">
        When you mention a new game, OTAKON creates a tab and moves messages automatically.
      </p>

      <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-3 sm:p-4">
        <h3 className="font-semibold text-text-primary mb-2 sm:mb-3 text-sm sm:text-base">How It Works</h3>
        <ol className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-text-muted">
          <li className="flex items-start">
            <span className="text-[#FFAB40] mr-2">1.</span>
            <span>Ask about a game in Game Hub or upload a screenshot</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#FFAB40] mr-2">2.</span>
            <span>OTAKON detects the game and creates a dedicated tab</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#FFAB40] mr-2">3.</span>
            <span>Your message and AI response are moved to the new tab</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#FFAB40] mr-2">4.</span>
            <span>Game Hub stays clean for general gaming questions</span>
          </li>
        </ol>
      </div>
    </div>

    {/* Teach OTAKON Section */}
    <div className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-surface-light/30 rounded-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary mb-3 sm:mb-4 flex items-center">
        <span className="mr-2 sm:mr-3">🧠</span>
        Teach OTAKON - Corrections System
      </h2>
      <p className="text-xs sm:text-sm md:text-base text-text-muted leading-relaxed mb-4 sm:mb-6">
        When OTAKON makes a mistake or you want to adjust its behavior, use the Teach OTAKON feature 
        to submit corrections. OTAKON learns from your feedback!
      </p>

      <div className="space-y-3 sm:space-y-4">
        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-3 sm:p-4">
          <h3 className="font-semibold text-text-primary mb-2 sm:mb-3 text-sm sm:text-base">Correction Types</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start">
              <span className="text-blue-400 mr-2">📝</span>
              <div>
                <span className="font-medium text-text-primary text-sm">Factual</span>
                <p className="text-xs text-text-muted">Fix wrong game info, stats, or mechanics</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-purple-400 mr-2">🎨</span>
              <div>
                <span className="font-medium text-text-primary text-sm">Style</span>
                <p className="text-xs text-text-muted">Adjust response tone or format</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-green-400 mr-2">📚</span>
              <div>
                <span className="font-medium text-text-primary text-sm">Terminology</span>
                <p className="text-xs text-text-muted">Correct game-specific terms or names</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-orange-400 mr-2">⚙️</span>
              <div>
                <span className="font-medium text-text-primary text-sm">Behavior</span>
                <p className="text-xs text-text-muted">Change how OTAKON approaches responses</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-3 sm:p-4">
          <h3 className="font-semibold text-text-primary mb-2 sm:mb-3 text-sm sm:text-base">Correction Scope</h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 sm:p-3">
              <span className="font-medium text-text-primary text-sm">🎮 Game-Specific</span>
              <p className="text-xs text-text-muted mt-1">Applies only to the current game</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2 sm:p-3">
              <span className="font-medium text-text-primary text-xs sm:text-sm">🌍 Global</span>
              <p className="text-xs text-text-muted mt-1">Applies across all games</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 sm:p-4">
          <div className="flex items-start space-x-2 sm:space-x-3">
            <div className="text-lg sm:text-xl">💡</div>
            <div>
              <h3 className="font-semibold text-text-primary mb-1 text-sm">How to Access</h3>
              <p className="text-xs text-text-muted">
                Hover over any AI message and click the "Teach OTAKON" button to submit a correction. 
                All corrections are AI-validated to ensure quality before being applied.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Player Profile Section */}
    <div className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-surface-light/30 rounded-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary mb-3 sm:mb-4 flex items-center">
        <span className="mr-2 sm:mr-3">👤</span>
        Player Profile Settings
      </h2>
      <p className="text-xs sm:text-sm md:text-base text-text-muted leading-relaxed mb-4 sm:mb-6">
        Customize how OTAKON responds to you by adjusting your Player Profile in Settings. 
        These preferences influence all AI responses.
      </p>

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center mb-1 sm:mb-2">
            <span className="text-lg sm:text-xl mr-1 sm:mr-2">💡</span>
            <h3 className="font-semibold text-text-primary text-xs sm:text-sm">Hint Style</h3>
          </div>
          <p className="text-xs text-text-muted mb-2">How direct should hints be?</p>
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-0.5 bg-surface/50 rounded text-xs text-text-secondary">Subtle</span>
            <span className="px-2 py-0.5 bg-surface/50 rounded text-xs text-text-secondary">Moderate</span>
            <span className="px-2 py-0.5 bg-surface/50 rounded text-xs text-text-secondary">Direct</span>
          </div>
        </div>

        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center mb-1 sm:mb-2">
            <span className="text-lg sm:text-xl mr-1 sm:mr-2">🎯</span>
            <h3 className="font-semibold text-text-primary text-xs sm:text-sm">Player Focus</h3>
          </div>
          <p className="text-xs text-text-muted mb-2">What matters most to you?</p>
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-0.5 bg-surface/50 rounded text-xs text-text-secondary">Story</span>
            <span className="px-2 py-0.5 bg-surface/50 rounded text-xs text-text-secondary">Gameplay</span>
            <span className="px-2 py-0.5 bg-surface/50 rounded text-xs text-text-secondary">Challenge</span>
          </div>
        </div>

        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center mb-1 sm:mb-2">
            <span className="text-lg sm:text-xl mr-1 sm:mr-2">🎭</span>
            <h3 className="font-semibold text-text-primary text-xs sm:text-sm">Preferred Tone</h3>
          </div>
          <p className="text-xs text-text-muted mb-2">How should OTAKON talk?</p>
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-0.5 bg-surface/50 rounded text-xs text-text-secondary">Casual</span>
            <span className="px-2 py-0.5 bg-surface/50 rounded text-xs text-text-secondary">Balanced</span>
            <span className="px-2 py-0.5 bg-surface/50 rounded text-xs text-text-secondary">Professional</span>
          </div>
        </div>

        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-3 sm:p-4">
          <div className="flex items-center mb-1 sm:mb-2">
            <span className="text-lg sm:text-xl mr-1 sm:mr-2">🔮</span>
            <h3 className="font-semibold text-text-primary text-xs sm:text-sm">Spoiler Tolerance</h3>
          </div>
          <p className="text-xs text-text-muted mb-2">How careful with spoilers?</p>
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-0.5 bg-surface/50 rounded text-xs text-text-secondary">No Spoilers</span>
            <span className="px-2 py-0.5 bg-surface/50 rounded text-xs text-text-secondary">Mild OK</span>
            <span className="px-2 py-0.5 bg-surface/50 rounded text-xs text-text-secondary">Don't Mind</span>
          </div>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 sm:p-4">
        <div className="flex items-start space-x-2 sm:space-x-3">
          <div className="text-lg sm:text-xl">⚙️</div>
          <div>
            <h3 className="font-semibold text-text-primary mb-1 text-sm">Access Player Profile</h3>
            <p className="text-xs text-text-muted">
              Open Settings (gear icon in header) → Player Profile to customize these preferences.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Pro Features Section */}
    <div className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-[#FFAB40]/30 rounded-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary mb-3 sm:mb-4 flex items-center">
        <span className="mr-2 sm:mr-3">⭐</span>
        Pro Features
        <span className="ml-2 px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded text-[10px] sm:text-xs font-medium">PRO</span>
      </h2>
      <p className="text-xs sm:text-sm md:text-base text-text-muted leading-relaxed mb-4 sm:mb-6">
        These features are available for Pro and Vanguard Pro subscribers.
      </p>

      <div className="space-y-3 sm:space-y-4">
        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-3 sm:p-4">
          <h3 className="font-semibold text-text-primary mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
            <span className="text-blue-400 mr-1 sm:mr-2">🤖</span>
            AI Mode Toggle
          </h3>
          <p className="text-xs sm:text-sm text-text-muted mb-2 sm:mb-3">
            Turn off AI analysis for screenshots to save them without using credits.
          </p>
          <ul className="space-y-1 text-xs text-text-secondary">
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span><strong>AI ON:</strong> Screenshots analyzed by AI (default)</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span><strong>AI OFF:</strong> Screenshots saved to your library without analysis</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <span>Great for capturing moments to share on social media</span>
            </li>
          </ul>
        </div>

        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-3 sm:p-4">
          <h3 className="font-semibold text-text-primary mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
            <span className="text-green-400 mr-1 sm:mr-2">🌐</span>
            Web Search
          </h3>
          <p className="text-xs sm:text-sm text-text-muted mb-2 sm:mb-3">
            Get up-to-date information with real-time web search integration.
          </p>
          <ul className="space-y-1 text-xs text-text-secondary">
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Latest patch notes, updates, and meta changes</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Current event information and limited-time content</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              <span>Recent game news and community discoveries</span>
            </li>
          </ul>
        </div>

        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-3 sm:p-4">
          <h3 className="font-semibold text-text-primary mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
            <span className="text-purple-400 mr-1 sm:mr-2">📸</span>
            Batch Screenshot Capture
          </h3>
          <p className="text-xs sm:text-sm text-text-muted mb-2 sm:mb-3">
            Capture multiple screenshots from your recent gameplay with F2.
          </p>
          <ul className="space-y-1 text-xs text-text-secondary">
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Captures last 5 minutes of gameplay screenshots</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>AI analyzes all images for comprehensive context</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-400 mr-2">•</span>
              <span>Perfect for complex boss fights or puzzle sequences</span>
            </li>
          </ul>
        </div>

        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-3 sm:p-4">
          <h3 className="font-semibold text-text-primary mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
            <span className="text-orange-400 mr-1 sm:mr-2">🎧</span>
            Hands-Free Voice Settings
          </h3>
          <p className="text-xs sm:text-sm text-text-muted mb-2 sm:mb-3">
            Customize how OTAKON reads responses aloud.
          </p>
          <ul className="space-y-1 text-xs text-text-secondary">
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <span>Choose from multiple voice options</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <span>Adjust speech speed (0.5x - 2x)</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <span>Test voice before enabling</span>
            </li>
            <li className="flex items-start">
              <span className="text-orange-400 mr-2">•</span>
              <span>Access via headphones icon in header</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    {/* IGDB Integration Section */}
    <div className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-surface-light/30 rounded-xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary mb-3 sm:mb-4 flex items-center">
        <span className="mr-2 sm:mr-3">🎲</span>
        IGDB Game Database
      </h2>
      <p className="text-xs sm:text-sm md:text-base text-text-muted leading-relaxed mb-3 sm:mb-4">
        Otagon uses the IGDB database to enrich your game tabs with official metadata.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-2 sm:p-4 text-center">
          <span className="text-xl sm:text-2xl">🖼️</span>
          <h3 className="font-semibold text-text-primary mt-1 sm:mt-2 text-xs sm:text-sm">Cover Art</h3>
          <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 sm:mt-1 hidden sm:block">Official game covers</p>
        </div>
        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-2 sm:p-4 text-center">
          <span className="text-xl sm:text-2xl">📅</span>
          <h3 className="font-semibold text-text-primary mt-1 sm:mt-2 text-xs sm:text-sm">Release Dates</h3>
          <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 sm:mt-1 hidden sm:block">Detect unreleased</p>
        </div>
        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-2 sm:p-4 text-center">
          <span className="text-xl sm:text-2xl">🏷️</span>
          <h3 className="font-semibold text-text-primary mt-1 sm:mt-2 text-xs sm:text-sm">Genres</h3>
          <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 sm:mt-1 hidden sm:block">Genre-aware tabs</p>
        </div>
        <div className="bg-surface/30 border border-surface-light/20 rounded-lg p-2 sm:p-4 text-center">
          <span className="text-xl sm:text-2xl">⭐</span>
          <h3 className="font-semibold text-text-primary mt-1 sm:mt-2 text-xs sm:text-sm">Ratings</h3>
          <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 sm:mt-1 hidden sm:block">Critic scores</p>
        </div>
      </div>
    </div>

    {/* Quick Reference Card */}
    <div className="bg-gradient-to-r from-[#FF4D4D]/10 to-[#FFAB40]/10 border-2 border-[#FF4D4D]/30 rounded-xl p-4 sm:p-6">
      <h2 className="text-base sm:text-lg md:text-xl font-bold text-text-primary mb-3 sm:mb-4 flex items-center">
        <span className="mr-2 sm:mr-3">⚡</span>
        Quick Reference
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
        <div>
          <h3 className="font-semibold text-text-primary mb-2">@Commands</h3>
          <ul className="space-y-1 text-text-muted">
            <li><code className="text-[#FFAB40]">@TabName</code> + text → Update tab</li>
            <li><code className="text-[#FFAB40]">@TabName \modify</code> → Rename tab</li>
            <li><code className="text-[#FFAB40]">@TabName \delete</code> → Delete tab</li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-text-primary mb-2">PC Hotkeys</h3>
          <ul className="space-y-1 text-text-muted">
            <li><kbd className="px-1.5 py-0.5 bg-surface rounded text-xs">F1</kbd> Single screenshot</li>
            <li><kbd className="px-1.5 py-0.5 bg-surface rounded text-xs">F2</kbd> Batch capture (PRO)</li>
            <li><kbd className="px-1.5 py-0.5 bg-surface rounded text-xs">⏸️</kbd> Toggle pause mode</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

// Hotkeys Tab Component
const HotkeysTab = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-[#FF4D4D]/10 to-[#FFAB40]/10 border-2 border-[#FF4D4D]/30 rounded-xl p-4 sm:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
        <div className="text-3xl sm:text-4xl">🖥️</div>
        <div className="flex-1">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary mb-2">Download PC Client</h2>
          <p className="text-xs sm:text-sm md:text-base text-text-muted mb-3 sm:mb-4">
            Get the Otagon PC client for hotkey screenshot capture. Stay in your game!
          </p>
          <a
            href="https://github.com/readmet3xt/otakon-pc-client/releases/tag/v1.0.0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] md:hover:from-[#D42A2A] md:hover:to-[#C87A1A] text-white font-bold rounded-lg transition-all duration-300 md:hover:scale-105 active:scale-95 shadow-lg text-xs sm:text-sm md:text-base"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download PC Client
          </a>
        </div>
      </div>
    </div>

    <div className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-surface-light/30 rounded-xl p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6 flex items-center">
        <span className="mr-3">⌨️</span>
        Default Hotkeys
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 sm:p-4 bg-surface/30 rounded-lg border border-surface-light/20 gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary mb-0.5 sm:mb-1 text-sm sm:text-base">Single Screenshot</h3>
            <p className="text-xs sm:text-sm text-text-muted truncate">Capture current screen</p>
          </div>
          <kbd className="px-3 sm:px-4 py-1.5 sm:py-2 font-mono font-bold text-white bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-lg shadow-lg text-base sm:text-lg flex-shrink-0">F1</kbd>
        </div>

        <div className="flex items-center justify-between p-3 sm:p-4 bg-surface/30 rounded-lg border border-surface-light/20 gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary mb-0.5 sm:mb-1 text-sm sm:text-base">Batch Screenshot <span className="text-[10px] sm:text-xs text-[#FFAB40]">(PRO)</span></h3>
            <p className="text-xs sm:text-sm text-text-muted truncate">Last 5 min of gameplay</p>
          </div>
          <kbd className="px-3 sm:px-4 py-1.5 sm:py-2 font-mono font-bold text-white bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-lg shadow-lg text-base sm:text-lg flex-shrink-0">F2</kbd>
        </div>
      </div>
    </div>

    <div className="bg-surface/50 border border-surface-light/30 rounded-xl p-6">
      <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-4 flex items-center">
        <span className="mr-3">🔧</span>
        Setup Instructions
      </h2>
      <ol className="space-y-4">
        <li className="flex items-start">
          <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">1</span>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Download & Install</h3>
            <p className="text-sm text-text-muted">Download the PC client from the link above and run the installer</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">2</span>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Connect to Otagon</h3>
            <p className="text-sm text-text-muted">Click the connection icon in Otagon and enter the 6-digit code from the PC client</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">3</span>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Start Gaming</h3>
            <p className="text-sm text-text-muted">Launch your game and press F1 or F2 to capture screenshots</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">4</span>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Customize (Optional)</h3>
            <p className="text-sm text-text-muted">Configure custom hotkeys in the PC client settings</p>
          </div>
        </li>
      </ol>
    </div>

    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 sm:p-5">
      <div className="flex items-start space-x-2 sm:space-x-3">
        <div className="text-xl sm:text-2xl">💡</div>
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary mb-1 sm:mb-2 text-sm sm:text-base">Pro Tip</h3>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Toggle between manual and auto-send mode using the pause/play button in Otagon. 
            Manual mode lets you review screenshots before sending, while auto mode sends them instantly for faster help.
          </p>
        </div>
      </div>
    </div>
  </div>
);

// Best Practices Tab Component
const BestPracticesTab = () => {
  const practices = [
    {
      category: '📸 Screenshot Best Practices',
      tips: [
        {
          title: 'Capture Full Screen',
          description: 'Include the entire game screen with HUD visible for better context',
          example: '✅ Full arena view with health/mana bars visible'
        },
        {
          title: 'Focus on the Problem',
          description: 'Center the area you need help with in the screenshot',
          example: '✅ Boss in frame, puzzle clearly visible, skill tree fully shown'
        },
        {
          title: 'Include UI Elements',
          description: 'Don\'t crop out menus, inventories, or skill trees',
          example: '✅ Show entire inventory screen, full skill tree, complete map'
        },
        {
          title: 'Timing Matters',
          description: 'Capture at the right moment for best results',
          example: '✅ Before engaging boss, at decision points, when stuck'
        }
      ]
    },
    {
      category: '💬 Asking Questions',
      tips: [
        {
          title: 'Be Specific',
          description: 'Clear questions get better answers',
          example: '✅ "How do I beat the second phase of Margit?" vs ❌ "Help with boss"'
        },
        {
          title: 'Provide Context',
          description: 'Mention your character level, gear, and what you\'ve tried',
          example: '✅ "I\'m level 25 with +3 sword, tried dodge rolling but still dying"'
        },
        {
          title: 'Ask Follow-ups',
          description: 'Otagon remembers conversation history',
          example: '✅ "What about for mage builds?" after asking about warrior strategies'
        },
        {
          title: 'Use Natural Language',
          description: 'Talk to Otagon like a gaming buddy',
          example: '✅ "I keep dying to this attack, any tips?"'
        }
      ]
    },
    {
      category: '🎮 Tab Management',
      tips: [
        {
          title: 'One Game Per Tab',
          description: 'Create separate tabs for each game you play',
          example: '✅ "Elden Ring" tab, "Baldur\'s Gate 3" tab, etc.'
        },
        {
          title: 'Use @ Commands',
          description: 'Manage insight tabs with natural language',
          example: '✅ "add tab Boss Strategies", "update @Tips with this info"'
        },
        {
          title: 'Keep Game Hub Clean',
          description: 'Use Game Hub for general questions, create game tabs for specific games',
          example: '✅ Game Hub: "Best RPGs of 2024?" → Game-specific tab: actual gameplay'
        },
        {
          title: 'Pin Important Tabs',
          description: 'Pin up to 3 frequently used tabs for quick access',
          example: '✅ Pin your current main game and frequently referenced guides'
        }
      ]
    },
    {
      category: '⚡ Mode Usage',
      tips: [
        {
          title: 'Playing Mode',
          description: 'Use during active gameplay for real-time tactical help',
          example: '✅ Boss fights, difficult platforming, combat encounters'
        },
        {
          title: 'Planning Mode',
          description: 'Use when planning builds, routes, or long-term strategy',
          example: '✅ Character builds, quest routing, gear optimization'
        },
        {
          title: 'Switch Freely',
          description: 'Toggle between modes based on your current needs',
          example: '✅ Playing during raid, Planning during downtime'
        },
        {
          title: 'Session Summaries',
          description: 'AI creates summaries when you switch modes',
          example: '✅ Captures key learnings from your playing session'
        }
      ]
    },
    {
      category: '📝 Chat Input Controls',
      tips: [
        {
          title: 'Upload Button',
          description: 'Manually upload screenshots from your device',
          example: '📎 Click the attachment icon to select images from your device'
        },
        {
          title: 'Play/Pause Toggle',
          description: 'Control PC screenshot flow (Auto-send vs Queue)',
          example: '▶️ Auto-send | ⏸️ Queue screenshots to review before sending'
        },
        {
          title: 'Send with Enter',
          description: 'Press Enter to send, Shift+Enter for new line',
          example: '⌨️ Type message → Enter to send | Shift+Enter for line break'
        },
        {
          title: 'Image Preview',
          description: 'See queued images above the input before sending',
          example: '🖼️ Images appear as thumbnails, click X to remove'
        }
      ]
    },
    {
      category: '🖱️ Context Menus & Accessibility',
      tips: [
        {
          title: 'Game Tab Options',
          description: 'Right-click (desktop) or long-press (mobile) on game tabs',
          example: '📋 Options: Rename, Pin/Unpin, Delete, View Game Info'
        },
        {
          title: 'Message Actions',
          description: 'Hover (desktop) or tap (mobile) on messages for actions',
          example: '💬 Copy, Teach OTAKON (corrections), Regenerate response'
        },
        {
          title: 'Insight Tab Management',
          description: 'Click on subtabs to view, use @commands to update',
          example: '📚 Click subtab → View content | @TabName → Update content'
        },
        {
          title: 'Sidebar Navigation',
          description: 'Swipe or click to open/close sidebar',
          example: '📱 Mobile: Swipe right to open | 🖥️ Desktop: Always visible'
        }
      ]
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {practices.map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-surface-light/30 rounded-xl p-4 sm:p-6"
        >
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-text-primary mb-4 sm:mb-6">{section.category}</h2>
          <div className="space-y-3 sm:space-y-5">
            {section.tips.map((tip, tipIndex) => (
              <div key={tipIndex} className="bg-surface/30 border border-surface-light/20 rounded-lg p-3 sm:p-4">
                <div className="flex items-start space-x-2 sm:space-x-3 mb-1 sm:mb-2">
                  <span className="text-[#FF4D4D] text-lg sm:text-xl font-bold mt-0.5">▸</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary mb-0.5 sm:mb-1 text-sm sm:text-base">{tip.title}</h3>
                    <p className="text-xs sm:text-sm text-text-muted mb-1 sm:mb-2">{tip.description}</p>
                    <div className="bg-surface/50 border border-surface-light/10 rounded px-3 py-2 mt-2">
                      <p className="text-xs text-text-secondary font-mono">{tip.example}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-5">
        <div className="flex items-start space-x-3">
          <div className="text-3xl">🎯</div>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-2 text-lg">Remember</h3>
            <p className="text-sm text-text-muted leading-relaxed mb-3">
              Otagon learns your playstyle over time. The more you interact, the better it gets at providing 
              personalized advice. Don't be afraid to ask for clarification or alternative strategies!
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-300">
                ✓ Be specific
              </span>
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-300">
                ✓ Provide context
              </span>
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-300">
                ✓ Use screenshots
              </span>
              <span className="px-3 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-xs text-green-300">
                ✓ Ask follow-ups
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
