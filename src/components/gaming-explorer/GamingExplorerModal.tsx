/**
 * Gaming Explorer Modal
 * 
 * Main overlay component for the Gaming Explorer mini-app.
 * Accessed by clicking the Otagon logo in the chat header.
 * 
 * Features:
 * - Full-screen overlay with 3 tabs: Home, Timeline, Library
 * - Brand-consistent styling with Otagon colors
 * - Responsive design (bottom tabs mobile, sidebar desktop)
 * - Smooth animations and transitions
 * - Floating chat button to return to chat
 * - GameInfoModal integration for game cards
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types';
import { userProfileStorage } from '../../services/gamingExplorerStorage';
import { IGDBGameData } from '../../services/igdbService';
import { authService } from '../../services/authService';
import GamingExplorerHome from './GamingExplorerHome';
import GamingExplorerTimeline from './GamingExplorerTimeline';
import GamingExplorerLibrary from './GamingExplorerLibrary';
import GamingExplorerGallery from './GamingExplorerGallery';
import GamingExplorerOnboarding from './GamingExplorerOnboarding';
import GameInfoModal from '../modals/GameInfoModal';
import Logo from '../ui/Logo';

type ExplorerTab = 'home' | 'gallery' | 'timeline' | 'library';

interface GamingExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSendNewsQuery?: (query: string) => void;
  onNavigateToLibrary?: (section: 'own' | 'favorite' | 'wishlist' | 'completed') => void;
}

const GamingExplorerModal: React.FC<GamingExplorerModalProps> = ({
  isOpen,
  onClose,
  user,
  onSendNewsQuery,
  onNavigateToLibrary: _onNavigateToLibrary,
}) => {
  const [activeTab, setActiveTab] = useState<ExplorerTab>('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [librarySection, setLibrarySection] = useState<'own' | 'favorite' | 'wishlist' | 'disliked'>('own');
  
  // GameInfoModal state
  const [gameInfoModalOpen, setGameInfoModalOpen] = useState(false);
  const [selectedGameData, setSelectedGameData] = useState<IGDBGameData | null>(null);

  // Check if user needs onboarding (gaming start year not set)
  useEffect(() => {
    if (isOpen) {
      // Check both Supabase (source of truth) and localStorage
      const supabaseHasYear = user.profileData?.gamingStartYear !== undefined;
      const localStorageHasYear = !userProfileStorage.needsOnboarding();
      
      // If Supabase has it but localStorage doesn't, sync it
      if (supabaseHasYear && !localStorageHasYear) {
        userProfileStorage.setGamingStartYear(user.profileData.gamingStartYear!);
      }
      
      // Show onboarding only if both don't have it
      const needsOnboarding = !supabaseHasYear && !localStorageHasYear;
      setShowOnboarding(needsOnboarding);
    }
  }, [isOpen, user.profileData?.gamingStartYear]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOnboardingComplete = useCallback(async (startYear: number) => {
    // Save to localStorage first for immediate access
    userProfileStorage.setGamingStartYear(startYear);
    
    // Save to Supabase for cross-device sync
    try {
      await authService.updateUserProfile(user.authUserId, {
        gamingStartYear: startYear
      });
      console.log('🎮 [Gaming Explorer] Gaming start year saved to Supabase:', startYear);
    } catch (error) {
      console.error('Failed to save gaming start year to Supabase:', error);
      // Don't block onboarding if save fails - localStorage still works
    }
    
    setShowOnboarding(false);
  }, [user.authUserId]);

  // Open GameInfoModal for a game
  const handleOpenGameInfo = useCallback((gameData: IGDBGameData, _gameName: string) => {
    setSelectedGameData(gameData);
    setGameInfoModalOpen(true);
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const tabs: { id: ExplorerTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'gallery',
      label: 'Gallery',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'timeline',
      label: 'Timeline',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'library',
      label: 'Library',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal Container */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full h-full bg-[#0A0A0A] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Dark themed matching chat app */}
            <header className="flex-shrink-0 bg-[#0A0A0A] border-b border-[#1C1C1C] px-3 sm:px-4 py-2.5 sm:py-3 safe-area-inset-top">
              <div className="flex items-center justify-between lg:justify-between">
                {/* Spacer for mobile/tablet to center logo */}
                <div className="w-10 h-10 sm:w-9 sm:h-9 lg:hidden" />
                
                {/* Logo with title - centered on mobile/tablet, left on desktop */}
                <div className="flex items-center gap-2 sm:gap-3 absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 blur-lg rounded-full" />
                    <Logo size="md" userTier={user.tier} />
                  </div>
                  <span className="text-base sm:text-lg font-semibold text-[#F5F5F5]">
                    {tabs.find(tab => tab.id === activeTab)?.label || 'Home'}
                  </span>
                </div>
                
                {/* Close button - right side, properly aligned */}
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-[#1C1C1C] hover:bg-[#E53A3A]/20 border border-[#424242]/40 hover:border-[#E53A3A]/40 transition-all group active:scale-95"
                  title="Close Explorer"
                >
                  <svg className="w-5 h-5 text-[#8F8F8F] group-hover:text-[#E53A3A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Desktop Sidebar Navigation */}
              <nav className="hidden lg:flex flex-col w-56 bg-[#1C1C1C] border-r border-[#424242]/60 py-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 text-[#F5F5F5] border-l-2 border-[#E53A3A]'
                        : 'text-[#8F8F8F] hover:bg-[#424242]/30 hover:text-[#CFCFCF]'
                    }`}
                  >
                    {tab.icon}
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}

                {/* Stats Summary */}
                <div className="mt-auto px-4 py-4 border-t border-[#424242]/40">
                  <div className="text-xs text-[#8F8F8F] space-y-1">
                    <p>Quick Stats</p>
                    <div className="text-[#CFCFCF]">
                      {userProfileStorage.get().libraryStats.ownedCount} games owned
                    </div>
                  </div>
                </div>
              </nav>

              {/* Tab Content */}
              <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
                <AnimatePresence mode="wait">
                  {showOnboarding ? (
                    <GamingExplorerOnboarding
                      key="onboarding"
                      onComplete={handleOnboardingComplete}
                    />
                  ) : (
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      {activeTab === 'home' && (
                        <GamingExplorerHome 
                          user={user} 
                          onOpenGameInfo={handleOpenGameInfo}
                          onSendNewsQuery={onSendNewsQuery}
                          onSwitchToLibraryTab={(section: 'own' | 'favorite' | 'wishlist' | 'disliked') => {
                            // Switch to library tab and set the active category
                            setActiveTab('library');
                            // The library component will handle the section via a ref or state
                            setLibrarySection(section);
                          }}
                        />
                      )}
                      {activeTab === 'gallery' && (
                        <GamingExplorerGallery user={user} />
                      )}
                      {activeTab === 'timeline' && (
                        <GamingExplorerTimeline user={user} />
                      )}
                      {activeTab === 'library' && (
                        <GamingExplorerLibrary user={user} onOpenGameInfo={handleOpenGameInfo} initialCategory={librarySection} />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </main>
            </div>

            {/* Floating Chat Button - Always visible */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 w-14 h-14 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] rounded-full flex items-center justify-center z-[80]"
              style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(229, 58, 58, 0.4)' }}
              title="Back to Chat"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </motion.button>

            {/* Mobile Bottom Tab Bar - Chat input inspired design */}
            <nav className="lg:hidden flex-shrink-0 bg-[#0A0A0A]/80 backdrop-blur-md border-t border-[#1C1C1C]/50 px-3 py-2 safe-area-inset-bottom">
              <div className="flex items-center justify-around bg-[#1C1C1C]/90 rounded-2xl p-1.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white shadow-lg'
                        : 'text-[#8F8F8F] hover:text-[#CFCFCF] active:bg-[#2A2A2A]'
                    }`}
                    style={activeTab === tab.id ? { boxShadow: '0 4px 12px rgba(229, 58, 58, 0.25)' } : {}}
                  >
                    <div className="w-5 h-5">
                      {tab.icon}
                    </div>
                    <span className="text-[10px] font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </motion.div>

          {/* GameInfoModal */}
          <GameInfoModal
            isOpen={gameInfoModalOpen}
            onClose={() => setGameInfoModalOpen(false)}
            gameData={selectedGameData}
            gameName={selectedGameData?.name || ''}
            userTier={user.tier}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GamingExplorerModal;
