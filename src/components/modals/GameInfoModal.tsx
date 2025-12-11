import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { 
  IGDBGameData, 
  fetchIGDBGameById,
  formatReleaseDate, 
  getDevelopers,
  getCombinedRating,
  getWebsiteCategoryName,
  getAgeRatingDisplay,
  getYouTubeThumbnailUrl
} from '../../services/igdbService';
import { 
  libraryStorage, 
  LibraryCategory 
} from '../../services/gamingExplorerStorage';
import { triggerGameKnowledgeFetch } from '../../services/gameKnowledgeFetcher';
import { toastService } from '../../services/toastService';
import { motion, AnimatePresence } from 'framer-motion';

interface GameInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameData: IGDBGameData | null;
  gameName: string;
  userTier?: string; // Add user tier for knowledge fetch gating
}

type TabType = 'overview' | 'media' | 'similar';

const GameInfoModal: React.FC<GameInfoModalProps> = ({ isOpen, onClose, gameData: initialGameData, gameName: _gameName, userTier }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentGameData, setCurrentGameData] = useState<IGDBGameData | null>(initialGameData);
  const [gameHistory, setGameHistory] = useState<IGDBGameData[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  // Force re-render when library changes
  const [libraryVersion, setLibraryVersion] = useState(0);

  // Library action definitions
  const libraryActions: { id: LibraryCategory; label: string; activeLabel: string; icon: JSX.Element; activeIcon: JSX.Element }[] = [
    {
      id: 'own',
      label: 'Own',
      activeLabel: 'Owned',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
      ),
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      activeLabel: 'Wishlisted',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ),
    },
    {
      id: 'favorite',
      label: 'Favorite',
      activeLabel: 'Favorited',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ),
    },
    {
      id: 'disliked',
      label: 'Dislike',
      activeLabel: 'Disliked',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
        </svg>
      ),
    },
  ];

  // Get current library categories for this game
  const gameCategories = useMemo(() => {
    if (!currentGameData) {
      return [];
    }
    // Use libraryVersion to trigger recalculation
    console.log('[GameInfoModal] Checking categories, version:', libraryVersion);
    return libraryStorage.getGameCategories(currentGameData.id);
  }, [currentGameData, libraryVersion]);

  // Handle adding/removing game from library
  const handleLibraryAction = useCallback((category: LibraryCategory) => {
    if (!currentGameData) {
      return;
    }

    const isInCategory = gameCategories.includes(category);
    
    if (isInCategory) {
      libraryStorage.removeGame(currentGameData.id, category);
      toastService.success(`Removed from ${category}`);
    } else {
      libraryStorage.addGame(
        currentGameData.id,
        currentGameData.name,
        category,
        currentGameData
      );
      toastService.success(`Added to ${category}`);
      
      // 🎯 GLOBAL CACHE TRIGGER: Fetch game knowledge when adding to 'own' category (ALL users)
      if (category === 'own') {
        triggerGameKnowledgeFetch(currentGameData.id, currentGameData.name);
        console.log('🎯 [GameInfoModal] Triggered background game knowledge fetch for:', {
          gameTitle: currentGameData.name,
          igdbId: currentGameData.id,
          tier: userTier || 'free'
        });
      }
    }
    
    // Force re-render
    setLibraryVersion(v => v + 1);
  }, [currentGameData, gameCategories, userTier]);

  // Update current game data when initial data changes
  useEffect(() => {
    setCurrentGameData(initialGameData);
    setGameHistory([]);
    setActiveTab('overview');
  }, [initialGameData]);

  // Enhanced close handler that resets state and returns to original game
  const handleClose = useCallback(() => {
    // Reset to initial game data when closing
    setCurrentGameData(initialGameData);
    setGameHistory([]);
    setActiveTab('overview');
    setSelectedImageIndex(null);
    onClose();
  }, [initialGameData, onClose]);

  // Handle clicking on a similar game
  const handleSimilarGameClick = useCallback(async (similarGame: { id: number; name: string }) => {
    if (isLoadingSimilar) {
      return;
    }
    
    setIsLoadingSimilar(true);
    try {
      const newGameData = await fetchIGDBGameById(similarGame.id);
      if (newGameData) {
        // Save current game to history for potential back navigation
        if (currentGameData) {
          setGameHistory(prev => [...prev, currentGameData]);
        }
        setCurrentGameData(newGameData);
        setActiveTab('overview');
        // Scroll to top when new game loads
        setTimeout(() => {
          const scrollContainer = document.querySelector('.max-h-\\[85vh\\]');
          if (scrollContainer) {
            scrollContainer.scrollTop = 0;
          }
        }, 0);
      }
    } catch (error) {
      console.error('Error fetching similar game:', error);
    } finally {
      setIsLoadingSimilar(false);
    }
  }, [currentGameData, isLoadingSimilar]);

  // Handle back navigation in game history
  // Future use: Will be used when implementing back button in UI
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleBack = useCallback(() => {
    if (gameHistory.length > 0) {
      const previousGame = gameHistory[gameHistory.length - 1];
      setGameHistory(prev => prev.slice(0, -1));
      setCurrentGameData(previousGame);
      setActiveTab('overview');
    }
  }, [gameHistory]);

  // Get all media (screenshots + artworks)
  const allMedia = [
    ...(currentGameData?.screenshots || []),
    ...(currentGameData?.artworks || [])
  ];

  // Render star rating
  const renderRating = (rating: number | null) => {
    if (rating === null) {
      return <span className="text-text-secondary">Not rated</span>;
    }
    const normalizedRating = rating / 20; // Convert 0-100 to 0-5
    const fullStars = Math.floor(normalizedRating);
    const hasHalfStar = normalizedRating - fullStars >= 0.5;
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`text-lg ${i < fullStars ? 'text-yellow-400' : i === fullStars && hasHalfStar ? 'text-yellow-400/50' : 'text-gray-600'}`}>
              ★
            </span>
          ))}
        </div>
        <span className="text-text-secondary text-sm">({Math.round(rating)}%)</span>
      </div>
    );
  };

  if (!currentGameData) {
    return null;
  }

  const developers = getDevelopers(currentGameData.involved_companies);
  const combinedRating = getCombinedRating(currentGameData);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title=""
      maxWidth="6xl"
      className="p-3 sm:p-4 md:p-6"
    >
      <div className="max-h-[85vh] overflow-hidden flex flex-col">
        {/* Loading overlay for similar games */}
        <AnimatePresence>
          {isLoadingSimilar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-text-secondary">Loading game info...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section (~30%) - Cover + Game Info Side by Side */}
        <div className="flex gap-3 sm:gap-4 md:gap-5 pb-3 sm:pb-4 border-b border-neutral-700/50 flex-shrink-0">
          {/* Cover Image */}
          {currentGameData.cover?.url && (
            <div className="w-32 sm:w-40 md:w-48 lg:w-56 xl:w-64 bg-neutral-900 rounded-lg shadow-lg flex-shrink-0 overflow-hidden flex items-center justify-center self-stretch">
              <img
                src={currentGameData.cover.url}
                alt={currentGameData.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          
          {/* Game Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
            <div className="space-y-1 sm:space-y-1.5">
              {/* Title */}
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-text-primary line-clamp-2">{currentGameData.name}</h3>
              
              {/* Rating */}
              <div>
                {renderRating(combinedRating)}
              </div>
              
              {/* Quick Info Row */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-text-secondary">
                <span>{formatReleaseDate(currentGameData.first_release_date)}</span>
                {developers.length > 0 && (
                  <>
                    <span className="text-neutral-600">•</span>
                    <span className="truncate max-w-[100px] sm:max-w-[140px]">{developers[0]}</span>
                  </>
                )}
              </div>
              
              {/* Genres */}
              {currentGameData.genres && currentGameData.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                  {currentGameData.genres.slice(0, 3).map(genre => (
                    <span
                      key={genre.id}
                      className="px-1.5 py-0.5 text-[10px] sm:text-xs rounded-md bg-primary/15 text-primary"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Library Action Buttons - Compact for smaller space */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {libraryActions.map((action) => {
                const isActive = gameCategories.includes(action.id);
                return (
                  <motion.button
                    key={action.id}
                    onClick={() => handleLibraryAction(action.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all min-h-[40px] ${
                      isActive
                        ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white shadow-lg shadow-[#E53A3A]/30 border border-[#E53A3A]/50'
                        : 'bg-neutral-800/80 text-text-secondary hover:bg-neutral-700/80 hover:text-text-primary border border-transparent hover:border-neutral-600'
                    }`}
                    title={isActive ? `Click to remove from ${action.activeLabel}` : `Click to add to ${action.label}`}
                  >
                    <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">{isActive ? action.activeIcon : action.icon}</span>
                    <span className="truncate">{isActive ? action.activeLabel : action.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 pt-2 pb-1 flex-shrink-0">
          {(['overview', 'media', 'similar'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 text-xs sm:text-sm font-medium transition-all rounded-lg capitalize ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 text-primary border border-primary/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {tab === 'similar' ? 'Similar' : tab}
              {tab === 'media' && allMedia.length > 0 && (
                <span className="ml-1 text-[10px] opacity-70">({allMedia.length})</span>
              )}
              {tab === 'similar' && currentGameData.similar_games && (
                <span className="ml-1 text-[10px] opacity-70">({currentGameData.similar_games.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content (~70%) */}
        <div className="flex-1 overflow-y-auto min-h-0 pt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Summary */}
                  {currentGameData.summary && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">About</h4>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {currentGameData.summary}
                      </p>
                    </div>
                  )}

                  {/* Storyline (if different from summary) */}
                  {currentGameData.storyline && currentGameData.storyline !== currentGameData.summary && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">Story</h4>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {currentGameData.storyline}
                      </p>
                    </div>
                  )}

                  {/* Platforms */}
                  {currentGameData.platforms && currentGameData.platforms.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">Platforms</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentGameData.platforms.map(platform => (
                          <span
                            key={platform.id}
                            className="px-2 py-1 text-xs rounded-md bg-neutral-800 text-text-secondary"
                          >
                            {platform.abbreviation || platform.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Game Modes */}
                  {currentGameData.game_modes && currentGameData.game_modes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">Game Modes</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentGameData.game_modes.map(mode => (
                          <span
                            key={mode.id}
                            className="px-2 py-1 text-xs rounded-md bg-neutral-800 text-text-secondary"
                          >
                            {mode.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Themes */}
                  {currentGameData.themes && currentGameData.themes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">Themes</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentGameData.themes.map(theme => (
                          <span
                            key={theme.id}
                            className="px-2 py-1 text-xs rounded-md bg-neutral-800/60 text-text-secondary"
                          >
                            {theme.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Age Ratings */}
                  {currentGameData.age_ratings && currentGameData.age_ratings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">Age Rating</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentGameData.age_ratings.map(rating => (
                          <span
                            key={rating.id}
                            className="px-2 py-1 text-xs rounded-md bg-neutral-800 text-text-secondary"
                          >
                            {getAgeRatingDisplay(rating.category, rating.rating)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Websites */}
                  {currentGameData.websites && currentGameData.websites.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">Links</h4>
                      <div className="flex flex-wrap gap-2">
                        {currentGameData.websites.slice(0, 6).map(website => (
                          <a
                            key={website.id}
                            href={website.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                          >
                            {getWebsiteCategoryName(website.category)}
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DLCs & Expansions */}
                  {(currentGameData.dlcs?.length || currentGameData.expansions?.length) && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">DLC & Expansions</h4>
                      <div className="space-y-1">
                        {currentGameData.dlcs?.slice(0, 5).map((dlc, i) => (
                          <p key={`dlc-${i}`} className="text-text-secondary text-sm">• {dlc.name}</p>
                        ))}
                        {currentGameData.expansions?.slice(0, 5).map((exp, i) => (
                          <p key={`exp-${i}`} className="text-text-secondary text-sm">• {exp.name}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <div className="space-y-4">
                  {/* Videos */}
                  {currentGameData.videos && currentGameData.videos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">Videos</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                        {currentGameData.videos.slice(0, 6).map(video => (
                          <a
                            key={video.id}
                            href={`https://www.youtube.com/watch?v=${video.video_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative group aspect-video rounded-lg overflow-hidden"
                          >
                            <img
                              src={getYouTubeThumbnailUrl(video.video_id, 'medium')}
                              alt={video.name || 'Video'}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </div>
                            </div>
                            {video.name && (
                              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-white text-xs truncate">{video.name}</p>
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Screenshots & Artworks */}
                  {allMedia.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">Screenshots & Artwork</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                        {allMedia.map((media, index) => (
                          <button
                            key={media.id}
                            onClick={() => setSelectedImageIndex(index)}
                            className="aspect-video rounded-lg overflow-hidden group"
                          >
                            <img
                              src={media.url}
                              alt={`Screenshot ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-text-secondary">
                      <p>No media available for this game</p>
                    </div>
                  )}

                  {/* Lightbox */}
                  <AnimatePresence>
                    {selectedImageIndex !== null && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
                        onClick={() => setSelectedImageIndex(null)}
                      >
                        <button
                          onClick={() => setSelectedImageIndex(null)}
                          className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors"
                        >
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        
                        {selectedImageIndex > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => (prev ?? 1) - 1); }}
                            className="absolute left-4 p-2 text-white hover:text-gray-300 transition-colors"
                          >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                        )}
                        
                        {selectedImageIndex < allMedia.length - 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(prev => (prev ?? 0) + 1); }}
                            className="absolute right-4 p-2 text-white hover:text-gray-300 transition-colors"
                          >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}

                        <motion.img
                          key={selectedImageIndex}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          src={allMedia[selectedImageIndex].url}
                          alt={`Screenshot ${selectedImageIndex + 1}`}
                          className="max-w-full max-h-full object-contain rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Similar Games Tab */}
              {activeTab === 'similar' && (
                <div>
                  {currentGameData.similar_games && currentGameData.similar_games.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {currentGameData.similar_games.slice(0, 12).map(game => (
                        <button
                          key={game.id}
                          onClick={() => handleSimilarGameClick(game)}
                          disabled={isLoadingSimilar}
                          className="group text-left bg-neutral-800/40 rounded-lg overflow-hidden hover:bg-neutral-800/60 transition-colors disabled:opacity-50"
                        >
                          <div className="aspect-[3/4] relative overflow-hidden">
                            {game.cover?.url ? (
                              <img
                                src={game.cover.url}
                                alt={game.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                                <span className="text-3xl">🎮</span>
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-text-primary text-sm font-medium truncate">{game.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-text-secondary">
                      <p>No similar games found</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
};

export default GameInfoModal;
