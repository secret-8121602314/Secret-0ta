import React, { useState } from 'react';

interface WelcomeScreenProps {
  onStartChat: () => void;
  onAddGame?: () => void;
}

type TabType = 'overview' | 'features' | 'hotkeys' | 'best-practices';

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartChat, onAddGame: _onAddGame }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview' },
    { id: 'features' as TabType, label: 'Features' },
    { id: 'hotkeys' as TabType, label: 'PC Hotkeys' },
    { id: 'best-practices' as TabType, label: 'Best Practices' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-background rounded-2xl shadow-2xl border border-transparent bg-clip-padding flex flex-col overflow-hidden" style={{ backgroundImage: 'linear-gradient(#1a1a1a, #1a1a1a), linear-gradient(135deg, #FF4D4D, #FFAB40)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }}>
        {/* Close Button */}
        <button
          onClick={onStartChat}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Close guide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Tabs */}
        <div className="flex-shrink-0 border-b border-gray-700 px-3 sm:px-6 pt-6">
          <div className="flex justify-center gap-2 sm:gap-3 overflow-x-auto pr-12">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center px-4 sm:px-6 py-3 min-h-[48px] text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 flex-shrink-0 ${
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
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'features' && <FeaturesTab />}
            {activeTab === 'hotkeys' && <HotkeysTab />}
            {activeTab === 'best-practices' && <BestPracticesTab />}
          </div>
        </div>

        {/* CTA Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 py-3 sm:py-4 px-3 sm:px-6 border-t border-gray-700 bg-background">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center justify-center">
            {/* Close Guide Button */}
            <button
              onClick={onStartChat}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <span>Got It!</span>
              <svg 
                className="w-5 h-5 flex-shrink-0" 
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
  <div className="space-y-6">
    <div className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-[#FF4D4D]/30 rounded-xl p-6 shadow-xl">
      <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 flex items-center">
        <span className="mr-3">🎯</span>
        What is Otagon?
      </h2>
      <p className="text-sm sm:text-base text-text-muted leading-relaxed mb-4">
        Otagon is your intelligent gaming companion powered by AI. It helps you overcome challenges, 
        discover secrets, and master any game without spoiling the experience. Whether you're stuck 
        on a boss, need strategic advice, or want to understand game mechanics, Otagon has your back.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-lg p-4">
          <div className="text-3xl mb-2">📸</div>
          <h3 className="font-semibold text-text-primary mb-2">Screenshot Analysis</h3>
          <p className="text-sm text-text-muted">Upload any game screenshot for instant insights</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-lg p-4">
          <div className="text-3xl mb-2">🎮</div>
          <h3 className="font-semibold text-text-primary mb-2">Game-Specific Tabs</h3>
          <p className="text-sm text-text-muted">Auto-organized tabs for each game you play</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-4">
          <div className="text-3xl mb-2">📚</div>
          <h3 className="font-semibold text-text-primary mb-2">Smart Insights</h3>
          <p className="text-sm text-text-muted">Story, tips, builds auto-generated for you</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-lg p-4">
          <div className="text-3xl mb-2">⚡</div>
          <h3 className="font-semibold text-text-primary mb-2">Dual Modes</h3>
          <p className="text-sm text-text-muted">Playing vs Planning for different needs</p>
        </div>
      </div>
    </div>

    <div className="bg-surface/50 border border-surface-light/30 rounded-xl p-6">
      <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-4 flex items-center">
        <span className="mr-3">🚀</span>
        Quick Start Guide
      </h2>
      <ol className="space-y-4">
        <li className="flex items-start">
          <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">1</span>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Start in Game Hub</h3>
            <p className="text-sm text-text-muted">Ask general gaming questions or upload screenshots</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">2</span>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Create Game Tabs</h3>
            <p className="text-sm text-text-muted">Mention a game or upload its screenshot to create a dedicated tab</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">3</span>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Explore Insight Tabs</h3>
            <p className="text-sm text-text-muted">AI auto-generates Story, Tips, Builds tabs as you ask questions</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">4</span>
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Toggle Modes</h3>
            <p className="text-sm text-text-muted">Switch between Playing (active help) and Planning (strategy)</p>
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
      description: 'AI automatically generates and updates specialized tabs for story, tips, builds, and more.',
      tips: [
        'Story tab: Spoiler-free lore and character backgrounds',
        'Tips tab: Combat strategies, secrets, and optimizations',
        'Builds tab: Character builds, skill trees, and equipment loadouts'
      ]
    },
    {
      icon: '⚡',
      title: 'Playing vs Planning Mode',
      description: 'Toggle between active gameplay help and strategic planning modes.',
      tips: [
        'Playing Mode: Real-time tactical advice during active gameplay',
        'Planning Mode: Strategic planning, builds, and long-term goals',
        'AI adapts its responses based on your current mode'
      ]
    },
    {
      icon: '🔗',
      title: 'PC Connection',
      description: 'Connect your PC client to send screenshots with a single hotkey press.',
      tips: [
        'No alt-tabbing required - stay in your game',
        'Instant screenshot capture with F1 or F2',
        'Automatic image upload and AI analysis'
      ]
    },
    {
      icon: '🎤',
      title: 'Hands-Free Mode',
      description: 'Have AI responses read aloud while you focus on the game.',
      tips: [
        'Perfect for action games where you can\'t look away',
        'Natural voice synthesis for comfortable listening',
        'Toggle on/off anytime from the header'
      ]
    },
    {
      icon: '💬',
      title: 'Command Centre',
      description: 'Use @ commands to manage insight tabs with natural language.',
      tips: [
        'Add new tabs: "add tab Boss Strategies"',
        'Update existing: "update @Tips with this strategy"',
        'Delete tabs: "delete @Builds tab"'
      ]
    },
    {
      icon: '🎯',
      title: 'Context-Aware AI',
      description: 'AI remembers your conversation history and game progress.',
      tips: [
        'Follows up on previous questions naturally',
        'Tracks your game progress across sessions',
        'Provides personalized recommendations based on your playstyle'
      ]
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      {features.map((feature, index) => (
        <div
          key={index}
          className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-surface-light/30 rounded-xl p-5 sm:p-6 hover:border-[#FF4D4D]/50 transition-all duration-300"
        >
          <div className="flex items-start space-x-4">
            <div className="text-3xl sm:text-4xl flex-shrink-0">{feature.icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm sm:text-base text-text-muted mb-4 leading-relaxed">{feature.description}</p>
              <div className="space-y-2">
                {feature.tips.map((tip, tipIndex) => (
                  <div key={tipIndex} className="flex items-start text-xs sm:text-sm">
                    <span className="text-[#FF4D4D] mr-2 mt-0.5 flex-shrink-0">▸</span>
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

// Hotkeys Tab Component
const HotkeysTab = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-[#FF4D4D]/10 to-[#FFAB40]/10 border-2 border-[#FF4D4D]/30 rounded-xl p-6 shadow-xl">
      <div className="flex items-start space-x-4 mb-6">
        <div className="text-4xl">🖥️</div>
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">Download PC Client</h2>
          <p className="text-sm sm:text-base text-text-muted mb-4">
            Get the Otagon PC client to enable hotkey screenshot capture. Stay in your game and send screenshots instantly!
          </p>
          <a
            href="https://github.com/readmet3xt/otakon-pc-client/releases/tag/v1.0.0"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] hover:from-[#D42A2A] hover:to-[#C87A1A] text-white font-bold rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg text-sm sm:text-base"
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
        <div className="flex items-center justify-between p-4 bg-surface/30 rounded-lg border border-surface-light/20">
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Single Screenshot</h3>
            <p className="text-sm text-text-muted">Capture current game screen</p>
          </div>
          <kbd className="px-4 py-2 font-mono font-bold text-white bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-lg shadow-lg text-lg">F1</kbd>
        </div>

        <div className="flex items-center justify-between p-4 bg-surface/30 rounded-lg border border-surface-light/20">
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary mb-1">Batch Screenshot (PRO)</h3>
            <p className="text-sm text-text-muted">Capture last 5 minutes of gameplay</p>
          </div>
          <kbd className="px-4 py-2 font-mono font-bold text-white bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-lg shadow-lg text-lg">F2</kbd>
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

    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">💡</div>
        <div className="flex-1">
          <h3 className="font-semibold text-text-primary mb-2">Pro Tip</h3>
          <p className="text-sm text-text-muted leading-relaxed">
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
    }
  ];

  return (
    <div className="space-y-6">
      {practices.map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-surface-light/30 rounded-xl p-5 sm:p-6"
        >
          <h2 className="text-lg sm:text-xl font-bold text-text-primary mb-6">{section.category}</h2>
          <div className="space-y-5">
            {section.tips.map((tip, tipIndex) => (
              <div key={tipIndex} className="bg-surface/30 border border-surface-light/20 rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-2">
                  <span className="text-[#FF4D4D] text-xl font-bold mt-0.5">▸</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary mb-1">{tip.title}</h3>
                    <p className="text-sm text-text-muted mb-2">{tip.description}</p>
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
