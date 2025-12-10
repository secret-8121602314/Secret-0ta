/**
 * Gaming Explorer Library
 * 
 * Game library management with IGDB search.
 * Features:
 * - Filter tabs: Own, Wishlist, Favorites, Disliked
 * - Game grid with IGDB covers
 * - IGDB search modal for adding games
 * - Cached library stats
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types';
import { 
  libraryStorage, 
  userProfileStorage,
  LibraryCategory,
  GameLibraryItem,
  CompletionStatus,
} from '../../services/gamingExplorerStorage';
import { 
  fetchIGDBGameData, 
  searchIGDBGames,
  IGDBGameData,
  getCoverUrl 
} from '../../services/igdbService';
import { toastService } from '../../services/toastService';

interface GamingExplorerLibraryProps {
  user: User;
  onOpenGameInfo: (gameData: IGDBGameData, gameName: string) => void;
  initialCategory?: LibraryCategory;
}

const categories: { id: LibraryCategory; label: string; icon: React.ReactNode }[] = [
  {
    id: 'own',
    label: 'Own',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: 'favorite',
    label: 'Favorites',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    id: 'disliked',
    label: 'Disliked',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
      </svg>
    ),
  },
];

const completionStatusLabels: Record<CompletionStatus, string> = {
  not_started: 'Not Started',
  playing: 'Playing',
  completed: 'Completed',
  abandoned: 'Abandoned',
};

const GamingExplorerLibrary: React.FC<GamingExplorerLibraryProps> = ({ user: _user, onOpenGameInfo, initialCategory }) => {
  const [activeCategory, setActiveCategory] = useState<LibraryCategory>(initialCategory || 'own');
  const [games, setGames] = useState<GameLibraryItem[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<IGDBGameData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameLibraryItem | null>(null);
  
  // Debounce timer ref for autocomplete
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load games on mount and category change
  useEffect(() => {
    const loadedGames = libraryStorage.getByCategory(activeCategory);
    console.log('[GamingExplorerLibrary] Loading games for category:', activeCategory, 'Found:', loadedGames.length);
    console.log('[GamingExplorerLibrary] Games:', loadedGames.map(g => g.gameName));
    setGames(loadedGames);
  }, [activeCategory]);

  // Update active category when initialCategory prop changes
  useEffect(() => {
    if (initialCategory) {
      console.log('[GamingExplorerLibrary] Switching to category:', initialCategory);
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  // Force reload games when component mounts to ensure fresh data
  useEffect(() => {
    const allGames = libraryStorage.getAll();
    console.log('[GamingExplorerLibrary] Total games in library:', allGames.length);
    console.log('[GamingExplorerLibrary] Games by category:', {
      own: libraryStorage.getByCategory('own').length,
      wishlist: libraryStorage.getByCategory('wishlist').length,
      favorite: libraryStorage.getByCategory('favorite').length,
      disliked: libraryStorage.getByCategory('disliked').length,
    });
  }, []);

  // Get library stats
  const stats = useMemo(() => {
    const profile = userProfileStorage.get();
    return profile.libraryStats;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games]); // Re-calculate when games change

  // Debounced autocomplete search - triggers as user types
  const handleSearchInputChange = useCallback((value: string) => {
    console.log('[GamingExplorerLibrary] Search query changed:', value);
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // If query is too short, clear results
    if (value.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    // Set searching state immediately for visual feedback
    setIsSearching(true);
    
    // Debounce the search - wait 200ms after user stops typing (reduced for faster response)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('[GamingExplorerLibrary] Searching IGDB for:', value);
        const results = await searchIGDBGames(value);
        console.log('[GamingExplorerLibrary] Search results:', results.length, 'games');
        setSearchResults(results);
      } catch (error) {
        console.error('[GamingExplorerLibrary] Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle IGDB search (fallback for Enter key)
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      const result = await fetchIGDBGameData(searchQuery);
      if (result) {
        setSearchResults([result]);
      } else {
        setSearchResults([]);
        toastService.info('No games found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toastService.error('Failed to search games');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Add game to library
  const handleAddGame = useCallback((gameData: IGDBGameData, category: LibraryCategory) => {
    console.log('[GamingExplorerLibrary] Adding game to library:', gameData.name, 'Category:', category);
    libraryStorage.addGame(
      gameData.id,
      gameData.name,
      category,
      gameData
    );
    
    // Refresh games for the active category
    const updatedGames = libraryStorage.getByCategory(activeCategory);
    console.log('[GamingExplorerLibrary] Updated games count for', activeCategory, ':', updatedGames.length);
    setGames(updatedGames);
    
    // Don't close modal, keep it open for adding more games
    // Clear search to allow new search
    setSearchQuery('');
    setSearchResults([]);
    
    toastService.success(`Added ${gameData.name} to ${category}`);
    
    // TODO: Trigger game knowledge extraction if category is 'own'
    if (category === 'own') {
      console.log('[GamingExplorerLibrary] Should trigger knowledge extraction for:', gameData.name);
    }
  }, [activeCategory]);

  // Remove game from library
  const handleRemoveGame = useCallback((igdbGameId: number, category: LibraryCategory) => {
    libraryStorage.removeGame(igdbGameId, category);
    setGames(libraryStorage.getByCategory(activeCategory));
    toastService.success('Game removed from library');
  }, [activeCategory]);

  // Update game status
  const handleUpdateStatus = useCallback((gameId: string, status: CompletionStatus) => {
    libraryStorage.updateGame(gameId, { completionStatus: status });
    setGames(libraryStorage.getByCategory(activeCategory));
  }, [activeCategory]);

  // Update game rating
  const handleUpdateRating = useCallback((gameId: string, rating: number) => {
    libraryStorage.updateGame(gameId, { personalRating: rating });
    setGames(libraryStorage.getByCategory(activeCategory));
  }, [activeCategory]);

  const getCompletionBadgeColor = (status?: CompletionStatus) => {
    switch (status) {
      case 'completed': return 'from-[#10B981] to-[#059669]';
      case 'playing': return 'from-[#3B82F6] to-[#1D4ED8]';
      case 'abandoned': return 'from-[#EF4444] to-[#DC2626]';
      default: return 'from-[#6B7280] to-[#4B5563]';
    }
  };

  const getCompletionIcon = (status?: CompletionStatus) => {
    switch (status) {
      case 'completed': 
        return <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
      case 'playing': 
        return <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>;
      case 'abandoned': 
        return <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      default: 
        return <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      {/* Stats Header - Enhanced with Card-based Grid Layout */}
      <div className="flex-shrink-0 bg-gradient-to-r from-[#1C1C1C] to-[#0A0A0A] border-b border-[#424242]/40 px-3 sm:px-4 py-3 sm:py-4">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-8">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 bg-[#1C1C1C]/60 sm:bg-transparent rounded-xl p-2.5 sm:p-0 border border-[#424242]/30 sm:border-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#E53A3A]/20 to-[#D98C1F]/20 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-lg sm:text-xl font-bold text-[#F5F5F5]">{stats.ownedCount}</p>
              <p className="text-[10px] sm:text-xs text-[#8F8F8F]">{stats.ownedCount === 1 ? 'Game' : 'Games'}</p>
            </div>
          </motion.div>
          
          <div className="hidden sm:block w-px h-10 bg-[#424242]" />
          
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 bg-[#1C1C1C]/60 sm:bg-transparent rounded-xl p-2.5 sm:p-0 border border-[#424242]/30 sm:border-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#10B981]/20 to-[#059669]/20 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-lg sm:text-xl font-bold text-[#10B981]">{stats.completedCount}</p>
              <p className="text-[10px] sm:text-xs text-[#8F8F8F]">Done</p>
            </div>
          </motion.div>
          
          <div className="hidden sm:block w-px h-10 bg-[#424242]" />
          
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 bg-[#1C1C1C]/60 sm:bg-transparent rounded-xl p-2.5 sm:p-0 border border-[#424242]/30 sm:border-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/20 flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-lg sm:text-xl font-bold text-[#F59E0B]">{stats.wishlistCount}</p>
              <p className="text-[10px] sm:text-xs text-[#8F8F8F]">Wishlist</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Category Tabs - Enhanced with pills style */}
      <div className="flex-shrink-0 bg-[#0A0A0A] border-b border-[#424242]/40 px-4 py-3">
        <div className="grid grid-cols-2 sm:flex sm:flex-row sm:justify-center gap-2">
          {categories.map((cat, index) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`relative flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white shadow-lg'
                  : 'bg-[#1C1C1C] text-[#8F8F8F] hover:bg-[#2A2A2A] hover:text-[#CFCFCF] border border-[#424242]/40'
              }`}
              style={activeCategory === cat.id ? { boxShadow: '0 4px 15px rgba(229, 58, 58, 0.25)' } : {}}
            >
              {cat.icon}
              <span>{cat.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeCategory === cat.id ? 'bg-white/25' : 'bg-[#424242]'
              }`}>
                {libraryStorage.getByCategory(cat.id).length}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Game Grid - Enhanced */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 pb-28 lg:pb-20">
        {games.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {games.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative bg-[#1C1C1C] rounded-xl overflow-hidden border border-[#424242]/40 hover:border-[#E53A3A]/60 transition-all cursor-pointer shadow-lg hover:shadow-xl"
                style={{ boxShadow: 'hover:0 12px 30px rgba(0,0,0,0.4)' }}
                onClick={() => game.igdbData && onOpenGameInfo(game.igdbData, game.gameName)}
              >
                {/* Cover Image */}
                <div className="aspect-[3/4] relative overflow-hidden">
                  {game.igdbData?.cover?.url ? (
                    <img
                      src={getCoverUrl(game.igdbData.cover.url, 'cover_big')}
                      alt={game.gameName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#2A2A2A] to-[#1C1C1C] flex items-center justify-center">
                      <svg className="w-12 h-12 text-[#424242] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* IGDB Rating Badge - Enhanced */}
                  {game.igdbData?.aggregated_rating && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold bg-black/80 backdrop-blur-sm border border-white/10">
                      <span className={`${game.igdbData.aggregated_rating >= 75 ? 'text-[#10B981]' : game.igdbData.aggregated_rating >= 50 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>
                        {Math.round(game.igdbData.aggregated_rating)}%
                      </span>
                    </div>
                  )}

                  {/* Completion Badge - Enhanced */}
                  {game.completionStatus && (
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium text-white bg-gradient-to-r ${getCompletionBadgeColor(game.completionStatus)} shadow-lg flex items-center gap-1`}>
                      {getCompletionIcon(game.completionStatus)}
                      {completionStatusLabels[game.completionStatus]}
                    </div>
                  )}

                  {/* Hover Overlay with Actions */}
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGame(game);
                      }}
                      className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm"
                      title="Quick edit"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveGame(game.igdbGameId, activeCategory);
                      }}
                      className="p-3 bg-red-500/20 rounded-xl hover:bg-red-500/40 transition-colors backdrop-blur-sm"
                      title="Remove"
                    >
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {/* Game Info - Enhanced */}
                <div className="p-2 sm:p-3 bg-gradient-to-t from-[#0A0A0A] to-[#1C1C1C] min-w-0 overflow-hidden">
                  <h3 className="font-semibold text-[#F5F5F5] text-xs sm:text-sm truncate">{game.gameName}</h3>

                  {/* Genres - Enhanced */}
                  {game.igdbData?.genres && (
                    <p className="text-[10px] sm:text-xs text-[#6B7280] mt-1 truncate">
                      {game.igdbData.genres.slice(0, 2).map(g => g.name).join(' • ')}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center text-center py-16 px-4"
          >
            <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-[#E53A3A]/20 to-[#D98C1F]/20 flex items-center justify-center">
              {activeCategory === 'own' ? (
                <svg className="w-12 h-12 text-[#E53A3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
              ) : activeCategory === 'wishlist' ? (
                <svg className="w-12 h-12 text-[#D98C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
              ) : activeCategory === 'favorite' ? (
                <svg className="w-12 h-12 text-[#F59E0B]" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384" />
                </svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-2">
              {activeCategory === 'own' ? 'Your collection is empty' : 
               activeCategory === 'wishlist' ? 'No games in wishlist' :
               activeCategory === 'favorite' ? 'No favorite games yet' : 'No disliked games'}
            </h3>
            <p className="text-[#8F8F8F] text-sm mb-6 max-w-md">
              {activeCategory === 'own' ? 'Start building your game library by searching and adding games you own!' :
               activeCategory === 'wishlist' ? 'Add games you want to play in the future!' :
               activeCategory === 'favorite' ? 'Mark your all-time favorite games!' : 'Track games you didn\'t enjoy'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSearchModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              style={{ boxShadow: '0 4px 15px rgba(229, 58, 58, 0.3)' }}
            >
              Search & Add Games
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Floating Add Button - Left side, aligned with Chat button */}
      {games.length > 0 && (
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSearchModal(true)}
          className="fixed bottom-24 lg:bottom-8 left-4 lg:left-8 w-14 h-14 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white rounded-full flex items-center justify-center z-[80]"
          style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(229, 58, 58, 0.4)' }}
          title="Add Game"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>
      )}

      {/* Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-20 bg-black/80"
            onClick={() => {
              setShowSearchModal(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1C1C1C] rounded-xl w-full max-w-lg overflow-hidden"
            >
              {/* Search Input */}
              <div className="p-4 border-b border-[#424242]/40">
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchInputChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Start typing to search games..."
                        className="w-full bg-[#0A0A0A] border border-[#424242] rounded-lg px-4 py-3 pr-10 text-[#F5F5F5] focus:outline-none focus:border-[#E53A3A] placeholder:text-[#6B7280]"
                        autoFocus
                      />
                      {/* Typing indicator */}
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-[#E53A3A] border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setShowSearchModal(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="p-3 bg-[#2A2A2A] text-[#CFCFCF] rounded-lg hover:bg-[#3A3A3A] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {/* Search hint */}
                  {searchQuery.length > 0 && searchQuery.length < 2 && (
                    <p className="mt-2 text-xs text-[#8F8F8F]">Type at least 2 characters to search</p>
                  )}
                </div>
              </div>

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {searchResults.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {searchResults.map((game, index) => (
                        <motion.div
                          key={game.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 border-b border-[#424242]/40 hover:bg-[#2A2A2A] transition-colors cursor-pointer"
                          onClick={() => {
                            // Open game info modal when clicking the game card
                            onOpenGameInfo(game, game.name);
                          }}
                        >
                          <div className="flex gap-4">
                            {game.cover?.url ? (
                              <img
                                src={getCoverUrl(game.cover.url, 'cover_small')}
                                alt={game.name}
                                className="w-14 h-18 object-cover rounded-lg flex-shrink-0 shadow-lg"
                              />
                            ) : (
                              <div className="w-14 h-18 bg-[#2A2A2A] rounded-lg flex-shrink-0 flex items-center justify-center">
                                <svg className="w-6 h-6 text-[#424242]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-[#F5F5F5] line-clamp-1">{game.name}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                {game.first_release_date && (
                                  <span className="text-sm text-[#8F8F8F]">
                                    {new Date(game.first_release_date * 1000).getFullYear()}
                                  </span>
                                )}
                                {game.aggregated_rating && (
                                  <>
                                    <span className="text-[#424242]">•</span>
                                    <span className="text-sm text-[#10B981] font-medium">
                                      {Math.round(game.aggregated_rating)}%
                                    </span>
                                  </>
                                )}
                              </div>
                              {game.genres && (
                                <p className="text-xs text-[#6B7280] truncate mt-0.5">
                                  {game.genres.slice(0, 3).map(g => g.name).join(' • ')}
                                </p>
                              )}

                              {/* Add to category buttons - compact row */}
                              <div className="flex flex-wrap gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                                {categories.map((cat) => {
                                  const isInCategory = libraryStorage.getGameCategories(game.id).includes(cat.id);
                                  return (
                                    <button
                                      key={cat.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddGame(game, cat.id);
                                      }}
                                      disabled={isInCategory}
                                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                                        isInCategory
                                          ? 'bg-[#10B981]/20 text-[#10B981] cursor-not-allowed'
                                          : 'bg-[#2A2A2A] text-[#CFCFCF] hover:bg-gradient-to-r hover:from-[#E53A3A] hover:to-[#D98C1F] hover:text-white active:scale-95'
                                      }`}
                                    >
                                      {isInCategory ? (
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                        </svg>
                                      ) : (
                                        cat.icon
                                      )}
                                      <span>{cat.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : searchQuery.length >= 2 && !isSearching ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-8 text-center"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2A2A2A] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#424242]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-[#8F8F8F]">No games found for "{searchQuery}"</p>
                      <p className="text-sm text-[#6B7280] mt-1">Try a different search term</p>
                    </motion.div>
                  ) : !searchQuery ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-8 text-center"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#E53A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <p className="text-[#F5F5F5] font-medium">Search for games</p>
                      <p className="text-sm text-[#8F8F8F] mt-1">Type to find games from IGDB</p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Detail Modal */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80"
            onClick={() => setSelectedGame(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1C1C1C] rounded-xl w-full max-w-md overflow-hidden"
            >
              {/* Header with cover */}
              <div className="relative h-48">
                {selectedGame.igdbData?.cover?.url ? (
                  <img
                    src={getCoverUrl(selectedGame.igdbData.cover.url, 'cover_big')}
                    alt={selectedGame.gameName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2A2A2A]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C] to-transparent" />
                <button
                  onClick={() => setSelectedGame(null)}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 -mt-8 relative z-10">
                <h2 className="text-xl font-bold text-[#F5F5F5] mb-4">{selectedGame.gameName}</h2>

                {/* Status Selector (for owned games) */}
                {selectedGame.category === 'own' && (
                  <div className="mb-4">
                    <label className="block text-sm text-[#8F8F8F] mb-2">Completion Status</label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(completionStatusLabels) as CompletionStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(selectedGame.id, status)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            selectedGame.completionStatus === status
                              ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white'
                              : 'bg-[#2A2A2A] text-[#CFCFCF] hover:bg-[#3A3A3A]'
                          }`}
                        >
                          {completionStatusLabels[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating */}
                <div className="mb-4">
                  <label className="block text-sm text-[#8F8F8F] mb-2">Your Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleUpdateRating(selectedGame.id, star)}
                        className={`text-2xl ${
                          (selectedGame.personalRating || 0) >= star ? 'text-yellow-400' : 'text-[#424242]'
                        } hover:scale-110 transition-transform`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Game Info */}
                {selectedGame.igdbData && (
                  <div className="space-y-2 text-sm">
                    {selectedGame.igdbData.genres && (
                      <p className="text-[#8F8F8F]">
                        <span className="text-[#CFCFCF]">Genres:</span>{' '}
                        {selectedGame.igdbData.genres.map(g => g.name).join(', ')}
                      </p>
                    )}
                    {selectedGame.igdbData.platforms && (
                      <p className="text-[#8F8F8F]">
                        <span className="text-[#CFCFCF]">Platforms:</span>{' '}
                        {selectedGame.igdbData.platforms.map(p => p.abbreviation || p.name).join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      handleRemoveGame(selectedGame.igdbGameId, selectedGame.category);
                      setSelectedGame(null);
                    }}
                    className="flex-1 py-2 px-4 bg-red-500/20 text-red-400 rounded-lg font-medium hover:bg-red-500/30 transition-colors"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="flex-1 py-2 px-4 bg-[#424242] text-[#CFCFCF] rounded-lg font-medium hover:bg-[#525252] transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GamingExplorerLibrary;
