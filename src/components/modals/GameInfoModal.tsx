import React, { useState, useCallback, useEffect } from 'react';
import Modal from '../ui/Modal';
import { 
  IGDBGameData, 
  fetchIGDBGameById,
  formatReleaseDate, 
  getDevelopers, 
  getPublishers,
  getCombinedRating,
  getWebsiteCategoryName,
  getAgeRatingDisplay,
  getYouTubeThumbnailUrl
} from '../../services/igdbService';
import { motion, AnimatePresence } from 'framer-motion';

interface GameInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameData: IGDBGameData | null;
  gameName: string;
}

type TabType = 'overview' | 'media' | 'similar';

const GameInfoModal: React.FC<GameInfoModalProps> = ({ isOpen, onClose, gameData: initialGameData, gameName }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentGameData, setCurrentGameData] = useState<IGDBGameData | null>(initialGameData);
  const [gameHistory, setGameHistory] = useState<IGDBGameData[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Update current game data when initial data changes
  useEffect(() => {
    setCurrentGameData(initialGameData);
    setGameHistory([]);
    setActiveTab('overview');
  }, [initialGameData]);

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
      }
    } catch (error) {
      console.error('Error fetching similar game:', error);
    } finally {
      setIsLoadingSimilar(false);
    }
  }, [currentGameData, isLoadingSimilar]);

  // Handle back navigation in game history
  const handleBack = useCallback(() => {
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
  const publishers = getPublishers(currentGameData.involved_companies);
  const combinedRating = getCombinedRating(currentGameData);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={gameName || 'Game Info'}
      maxWidth="lg"
    >
      {/* Back button if we have history */}
      {gameHistory.length > 0 && (
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 p-1 hover:bg-white/10 rounded-lg transition-colors z-10"
          title="Back to previous game"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <div className="space-y-4 max-h-[70vh] overflow-hidden flex flex-col">\n        {/* Loading overlay for similar games */}
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

        {/* Cover and Quick Info */}
        <div className="flex gap-4">
          {currentGameData.cover?.url && (
            <img
              src={currentGameData.cover.url}
              alt={currentGameData.name}
              className="w-24 h-32 sm:w-48 sm:h-64 md:w-64 md:h-80 object-cover rounded-lg shadow-lg flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-text-primary truncate">{currentGameData.name}</h3>
            
            {/* Rating */}
            <div className="mt-1">
              {renderRating(combinedRating)}
            </div>
            
            {/* Release Date */}
            <p className="text-text-secondary text-sm mt-2">
              <span className="font-medium">Released:</span> {formatReleaseDate(currentGameData.first_release_date)}
            </p>
            
            {/* Developer/Publisher */}
            {developers.length > 0 && (
              <p className="text-text-secondary text-sm">
                <span className="font-medium">Developer:</span> {developers.slice(0, 2).join(', ')}
              </p>
            )}
            {publishers.length > 0 && (
              <p className="text-text-secondary text-sm">
                <span className="font-medium">Publisher:</span> {publishers.slice(0, 2).join(', ')}
              </p>
            )}
            
            {/* Genres */}
            {currentGameData.genres && currentGameData.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {currentGameData.genres.slice(0, 4).map(genre => (
                  <span
                    key={genre.id}
                    className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-neutral-700">
          {(['overview', 'media', 'similar'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary -mb-px'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab === 'similar' ? 'Similar Games' : tab}
              {tab === 'media' && allMedia.length > 0 && (
                <span className="ml-1 text-xs text-text-secondary">({allMedia.length})</span>
              )}
              {tab === 'similar' && currentGameData.similar_games && (
                <span className="ml-1 text-xs text-text-secondary">({currentGameData.similar_games.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
