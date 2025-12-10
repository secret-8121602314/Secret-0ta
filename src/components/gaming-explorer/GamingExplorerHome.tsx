/**
 * Gaming Explorer Home
 * 
 * Home tab with gaming news, top games, categories, and stats.
 * Features:
 * - Stats display (owned games, favorites) - clickable to navigate to library
 * - Top/trending games from IGDB
 * - Game categories to browse
 * - 4 news prompt cards (2x2 grid) with 24-hour per-user cooldown
 * - Clicking news card sends query to Game Hub for AI grounding search
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../../types';
import { 
  newsCacheStorage, 
  NewsPromptType, 
  libraryStorage,
  userProfileStorage,
  igdbHomeCacheStorage,
  searchHistoryStorage,
} from '../../services/gamingExplorerStorage';
import { 
  fetchIGDBGameData,
  searchIGDBGames,
  IGDBGameData,
  getCoverUrl,
} from '../../services/igdbService';
import { toastService } from '../../services/toastService';

interface GamingExplorerHomeProps {
  user: User;
  onOpenGameInfo: (gameData: IGDBGameData, gameName: string) => void;
  onSendNewsQuery?: (query: string) => void;
  onSwitchToLibraryTab?: (section: LibraryCategory) => void;
}

// Import LibraryCategory type for proper typing
type LibraryCategory = 'own' | 'favorite' | 'wishlist' | 'disliked';

interface NewsPromptCard {
  id: NewsPromptType;
  title: string;
  description: string;
  prompt: string;
  gradient: string;
  icon: React.ReactNode;
}

const newsPrompts: NewsPromptCard[] = [
  {
    id: 'latest_news',
    title: 'Latest Gaming News',
    description: 'Breaking news from the gaming world',
    prompt: 'What are the latest gaming news and announcements from the past week? Include major game reveals, studio updates, and industry news.',
    gradient: 'from-[#E53A3A] to-[#D98C1F]',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    id: 'trending_games',
    title: 'Trending Games',
    description: 'Games everyone is talking about',
    prompt: 'What games are currently trending and most popular right now? Include games people are playing, discussing, and streaming the most.',
    gradient: 'from-[#FF4D4D] to-[#FFAB40]',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    id: 'upcoming_releases',
    title: 'Upcoming Releases',
    description: 'Games releasing soon',
    prompt: 'What are the most anticipated upcoming game releases in the next 3 months? Include release dates, platforms, and why they are exciting.',
    gradient: 'from-[#8B5CF6] to-[#3B82F6]',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'new_reviews',
    title: 'New Reviews',
    description: 'Latest game reviews and scores',
    prompt: 'What are the latest major game reviews? Include review scores, critical reception, and key points from recent game releases.',
    gradient: 'from-[#06B6D4] to-[#10B981]',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

// Game categories for browsing
const gameCategories = [
  { id: 'action', name: 'Action', query: 'best action games 2024' },
  { id: 'rpg', name: 'RPG', query: 'best rpg games 2024' },
  { id: 'adventure', name: 'Adventure', query: 'best adventure games' },
  { id: 'shooter', name: 'Shooter', query: 'best shooter games 2024' },
  { id: 'indie', name: 'Indie', query: 'best indie games 2024' },
  { id: 'strategy', name: 'Strategy', query: 'best strategy games' },
];

const GamingExplorerHome: React.FC<GamingExplorerHomeProps> = ({ user, onOpenGameInfo, onSendNewsQuery, onSwitchToLibraryTab }) => {
  // Featured games from IGDB
  const [featuredGames, setFeaturedGames] = useState<IGDBGameData[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  
  // Latest & Popular games (new releases and trending)
  const [latestGames, setLatestGames] = useState<IGDBGameData[]>([]);
  const [loadingLatest, setLoadingLatest] = useState(false);
  
  // Category browsing - preload all categories, default to 'action'
  const [selectedCategory, setSelectedCategory] = useState<string | null>('action');
  const [categoryGamesMap, setCategoryGamesMap] = useState<Record<string, IGDBGameData[]>>({});
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<IGDBGameData[]>(() => searchHistoryStorage.getGames());
  const [searchResults, setSearchResults] = useState<IGDBGameData[]>([]);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get library stats
  const stats = useMemo(() => {
    const profile = userProfileStorage.get();
    return profile.libraryStats;
  }, []);

  // Get owned and favorite games for display
  const ownedGames = useMemo(() => libraryStorage.getByCategory('own').slice(0, 6), []);
  const favoriteGames = useMemo(() => libraryStorage.getByCategory('favorite').slice(0, 6), []);

  // Fetch featured games and preload ALL category games on mount (with caching)
  useEffect(() => {
    const fetchAllGames = async () => {
      // Check cache first
      const cachedData = igdbHomeCacheStorage.get();
      if (cachedData) {
        console.log('[GamingExplorerHome] Using cached IGDB data');
        setFeaturedGames(cachedData.featuredGames);
        setLatestGames(cachedData.latestGames);
        setCategoryGamesMap(cachedData.categoryGamesMap);
        setLoadingFeatured(false);
        setLoadingLatest(false);
        setLoadingCategories(false);
        return;
      }

      console.log('[GamingExplorerHome] Fetching fresh IGDB data');
      setLoadingFeatured(true);
      setLoadingLatest(true);
      setLoadingCategories(true);
      
      try {
        // Fetch Latest & Popular games (2024-2025 releases)
        const latestTitles = [
          'Black Myth Wukong',
          'Indiana Jones and the Great Circle',
          'Dragon Age The Veilguard',
          'Silent Hill 2',
          'Metaphor ReFantazio',
          'S.T.A.L.K.E.R. 2',
        ];
        const latestPromises = latestTitles.map(title => fetchIGDBGameData(title));
        const latestResults = await Promise.all(latestPromises);
        const validLatest = latestResults.filter((g): g is IGDBGameData => g !== null);
        setLatestGames(validLatest.slice(0, 6));
        setLoadingLatest(false);
        
        // Fetch 5-8 featured/popular games (all-time classics)
        const popularTitles = [
          'Elden Ring', 
          'Baldur\'s Gate 3', 
          'The Legend of Zelda: Tears of the Kingdom',
          'God of War Ragnarok',
          'Cyberpunk 2077',
          'Hades II',
          'Final Fantasy VII Rebirth',
          'Horizon Forbidden West'
        ];
        const featuredPromises = popularTitles.map(title => fetchIGDBGameData(title));
        const featuredResults = await Promise.all(featuredPromises);
        const validFeatured = featuredResults.filter((g): g is IGDBGameData => g !== null);
        setFeaturedGames(validFeatured.slice(0, 8));
        setLoadingFeatured(false);
        
        // Preload games for ALL categories (5-8 games each)
        const categoryQueries: Record<string, string[]> = {
          action: ['Devil May Cry 5', 'Bayonetta 3', 'Armored Core VI', 'Sekiro', 'Nioh 2', 'Sifu'],
          rpg: ['Persona 5 Royal', 'Dragon Quest XI', 'Divinity Original Sin 2', 'Pillars of Eternity II', 'Disco Elysium', 'Octopath Traveler II'],
          adventure: ['The Last of Us Part II', 'Uncharted 4', 'A Plague Tale Requiem', 'Stray', 'It Takes Two', 'Ori and the Will of the Wisps'],
          shooter: ['Doom Eternal', 'Titanfall 2', 'Halo Infinite', 'Destiny 2', 'Borderlands 3', 'Metro Exodus'],
          indie: ['Hollow Knight', 'Celeste', 'Dead Cells', 'Cuphead', 'Shovel Knight', 'Undertale'],
          strategy: ['Civilization VI', 'Total War Warhammer III', 'XCOM 2', 'Age of Empires IV', 'Crusader Kings III', 'Stellaris'],
        };
        
        // Fetch all categories in parallel
        const categoryEntries = Object.entries(categoryQueries);
        const allCategoryPromises = categoryEntries.map(async ([catId, titles]) => {
          const promises = titles.map(title => fetchIGDBGameData(title));
          const results = await Promise.all(promises);
          return [catId, results.filter((g): g is IGDBGameData => g !== null).slice(0, 8)] as const;
        });
        
        const categoryResultsArray = await Promise.all(allCategoryPromises);
        const categoryResults: Record<string, IGDBGameData[]> = Object.fromEntries(categoryResultsArray);
        
        setCategoryGamesMap(categoryResults);

        // Cache the results
        igdbHomeCacheStorage.set({
          featuredGames: validFeatured.slice(0, 8),
          latestGames: validLatest.slice(0, 6),
          categoryGamesMap: categoryResults,
        });
        console.log('[GamingExplorerHome] Cached IGDB data for 24 hours');
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoadingFeatured(false);
        setLoadingCategories(false);
      }
    };
    
    fetchAllGames();
  }, []);

  // Debounced autocomplete search
  const handleSearchInputChange = useCallback((value: string) => {
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
    
    // Set searching state
    setIsSearching(true);
    
    // Debounce the search
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchIGDBGames(value);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
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

  // Handle clicking a search result
  const handleSearchResultClick = useCallback((game: IGDBGameData) => {
    // Add to search history
    searchHistoryStorage.add(game);
    setSearchHistory(searchHistoryStorage.getGames());
    // Open the game info modal
    onOpenGameInfo(game, game.name);
    // Clear search
    setSearchQuery('');
    setSearchResults([]);
  }, [onOpenGameInfo]);

  // Handle game search form submit
  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) { return; }

    setIsSearching(true);
    try {
      const gameData = await fetchIGDBGameData(searchQuery.trim());
      if (gameData) {
        // Add to search history
        searchHistoryStorage.add(gameData);
        setSearchHistory(searchHistoryStorage.getGames());
        // Open the game info modal
        onOpenGameInfo(gameData, gameData.name);
        // Clear search input
        setSearchQuery('');
        setSearchResults([]);
      } else {
        toastService.warning(`No game found for "${searchQuery}"`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toastService.error('Failed to search for game');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, isSearching, onOpenGameInfo]);

  // Handle category click - just toggle selection, games already preloaded
  const handleCategoryClick = useCallback((category: typeof gameCategories[0]) => {
    if (selectedCategory === category.id) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category.id);
    }
  }, [selectedCategory]);

  // Handle clicking on a news prompt card - sends query to Game Hub
  const handleNewsPromptClick = useCallback(async (prompt: NewsPromptCard) => {
    // Check Supabase global cache first
    const cachedNews = await newsCacheStorage.getAsync(prompt.id);
    if (cachedNews) {
      console.log('[GamingExplorerHome] Using cached news from Supabase/localStorage for:', prompt.id);
      // Could display cached news directly here if needed
    }
    
    // Check rate limit (24-hour per-user limit per prompt type)
    const canGenerate = newsCacheStorage.canGenerate(user.id, prompt.id);
    if (!canGenerate.allowed && canGenerate.nextAvailableAt) {
      const hoursRemaining = Math.ceil((canGenerate.nextAvailableAt - Date.now()) / (60 * 60 * 1000));
      toastService.warning(`You can generate ${prompt.title} again in ${hoursRemaining} hours`);
      return;
    }

    // Log the generation to track 24-hour limit
    newsCacheStorage.logGeneration(user.id, prompt.id);

    // If we have the callback, use it to send the query to Game Hub
    if (onSendNewsQuery) {
      onSendNewsQuery(prompt.prompt);
    } else {
      // Fallback: show toast that this feature needs the main app
      toastService.info('Please use this feature from the main app');
    }
  }, [user.id, onSendNewsQuery]);

  // Check if a prompt was used in last 24 hours
  const isPromptOnCooldown = useCallback((promptType: NewsPromptType): boolean => {
    const canGenerate = newsCacheStorage.canGenerate(user.id, promptType);
    return !canGenerate.allowed;
  }, [user.id]);

  // Get cooldown remaining for a prompt
  const getCooldownRemaining = useCallback((promptType: NewsPromptType): string | null => {
    const canGenerate = newsCacheStorage.canGenerate(user.id, promptType);
    if (canGenerate.allowed || !canGenerate.nextAvailableAt) {
      return null;
    }
    const hoursRemaining = Math.ceil((canGenerate.nextAvailableAt - Date.now()) / (60 * 60 * 1000));
    if (hoursRemaining <= 1) {
      return 'Available in <1h';
    }
    return `Available in ${hoursRemaining}h`;
  }, [user.id]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Stats Row - Clean Minimal Design */}
      <div className="flex items-center justify-between gap-2 py-2">
        {/* Games Owned */}
        <motion.button
          onClick={() => onSwitchToLibraryTab?.('own')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[#D98C1F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-lg sm:text-xl font-bold text-white">{stats.ownedCount}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-neutral-400 group-hover:text-neutral-300">Owned</span>
        </motion.button>

        <div className="w-px h-8 bg-neutral-700/50" />

        {/* Favorites */}
        <motion.button
          onClick={() => onSwitchToLibraryTab?.('favorite')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-lg sm:text-xl font-bold text-white">{stats.favoritesCount}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-neutral-400 group-hover:text-neutral-300">Favorites</span>
        </motion.button>

        <div className="w-px h-8 bg-neutral-700/50" />

        {/* Completed */}
        <motion.button
          onClick={() => onSwitchToLibraryTab?.('own')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg sm:text-xl font-bold text-white">{stats.completedCount}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-neutral-400 group-hover:text-neutral-300">Completed</span>
        </motion.button>

        <div className="w-px h-8 bg-neutral-700/50" />

        {/* Wishlist */}
        <motion.button
          onClick={() => onSwitchToLibraryTab?.('wishlist')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-lg sm:text-xl font-bold text-white">{stats.wishlistCount}</span>
          </div>
          <span className="text-[10px] sm:text-xs text-neutral-400 group-hover:text-neutral-300">Wishlist</span>
        </motion.button>
      </div>

      {/* Search Bar with Autocomplete */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            placeholder="Search for any game..."
            className="w-full px-4 py-3 pl-12 bg-[#1C1C1C] border border-[#424242]/50 rounded-xl text-[#F5F5F5] placeholder-[#6B7280] focus:outline-none focus:border-[#E53A3A]/50 focus:ring-1 focus:ring-[#E53A3A]/30 transition-all"
            autoComplete="off"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]">
            {isSearching ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth={2} className="opacity-25" />
                <path strokeWidth={2} d="M12 2a10 10 0 0110 10" className="opacity-75" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          {searchQuery && !isSearching && (
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        <AnimatePresence>
          {searchQuery.length >= 2 && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[#1C1C1C] border border-[#424242]/50 rounded-xl overflow-hidden shadow-xl z-50 max-h-96 overflow-y-auto"
            >
              {searchResults.map((game, index) => (
                <motion.button
                  key={game.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleSearchResultClick(game)}
                  className="w-full p-3 flex gap-3 items-center hover:bg-[#2A2A2A] transition-colors text-left border-b border-[#424242]/30 last:border-0"
                >
                  {game.cover?.url ? (
                    <img
                      src={getCoverUrl(game.cover.url, 'cover_small')}
                      alt={game.name}
                      className="w-10 h-14 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-[#2A2A2A] rounded flex-shrink-0 flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#424242]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#F5F5F5] truncate">{game.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {game.first_release_date && (
                        <span className="text-xs text-[#8F8F8F]">
                          {new Date(game.first_release_date * 1000).getFullYear()}
                        </span>
                      )}
                      {game.aggregated_rating && (
                        <>
                          <span className="text-[#424242]">•</span>
                          <span className="text-xs text-[#10B981] font-medium">
                            {Math.round(game.aggregated_rating)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Your Collection - Owned Games */}
      {ownedGames.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[#F5F5F5] mb-3 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-[#E53A3A] to-[#D98C1F] rounded-full" />
            Your Collection
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 lg:gap-3">
            {ownedGames.map((game) => (
              <motion.button
                key={game.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => game.igdbData && onOpenGameInfo(game.igdbData, game.gameName)}
                className="relative aspect-[3/4] rounded-lg overflow-hidden group"
              >
                {game.igdbData?.cover?.url ? (
                  <img
                    src={getCoverUrl(game.igdbData.cover.url, 'cover_big')}
                    alt={game.gameName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2A2A2A] flex items-center justify-center">
                    <span className="text-[#8F8F8F] text-xs text-center px-1">{game.gameName}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-white text-xs font-medium line-clamp-2">{game.gameName}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Favorites */}
      {favoriteGames.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-[#F5F5F5] mb-3 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gradient-to-b from-[#FFD700] to-[#FFA500] rounded-full" />
            Your Favorites
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 lg:gap-3">
            {favoriteGames.map((game) => (
              <motion.button
                key={game.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => game.igdbData && onOpenGameInfo(game.igdbData, game.gameName)}
                className="relative aspect-[3/4] rounded-lg overflow-hidden group"
              >
                {game.igdbData?.cover?.url ? (
                  <img
                    src={getCoverUrl(game.igdbData.cover.url, 'cover_big')}
                    alt={game.gameName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2A2A2A] flex items-center justify-center">
                    <span className="text-[#8F8F8F] text-xs text-center px-1">{game.gameName}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-white text-xs font-medium line-clamp-2">{game.gameName}</span>
                </div>
                <div className="absolute top-2 right-2 text-yellow-400">★</div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Recently Searched Games */}
      {searchHistory.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-[#06B6D4] to-[#0891B2] rounded-full" />
              Recently Searched
            </h2>
            <button
              onClick={() => {
                searchHistoryStorage.clear();
                setSearchHistory([]);
              }}
              className="text-xs text-[#6B7280] hover:text-[#E53A3A] transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 lg:gap-3">
            {searchHistory.map((game) => (
              <motion.button
                key={game.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onOpenGameInfo(game, game.name)}
                className="relative aspect-[3/4] rounded-lg overflow-hidden group"
              >
                {game.cover?.url ? (
                  <img
                    src={getCoverUrl(game.cover.url, 'cover_big')}
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2A2A2A] flex items-center justify-center">
                    <span className="text-[#8F8F8F] text-xs text-center px-1">{game.name}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-white text-xs font-medium line-clamp-2">{game.name}</span>
                </div>
                <div className="absolute top-2 right-2 text-[#06B6D4]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Latest & Popular Games - New releases and trending */}
      <section>
        <h2 className="text-lg font-bold text-[#F5F5F5] mb-3 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gradient-to-b from-[#FF4D4D] to-[#FFAB40] rounded-full" />
          Latest & Popular
        </h2>
        {loadingLatest ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-[#E53A3A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : latestGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 lg:gap-3">
            {latestGames.map((game) => (
              <motion.button
                key={game.id}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenGameInfo(game, game.name)}
                className="bg-[#1C1C1C] rounded-xl overflow-hidden border border-[#424242]/40 hover:border-[#FF4D4D]/50 transition-all text-left"
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  {game.cover?.url ? (
                    <img
                      src={getCoverUrl(game.cover.url, 'cover_big')}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#2A2A2A]" />
                  )}
                  {/* NEW badge for recent releases */}
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] px-2 py-0.5 rounded text-[10px] font-bold text-white">
                    NEW
                  </div>
                  {game.aggregated_rating && (
                    <div className="absolute top-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-bold text-[#10B981]">
                      {Math.round(game.aggregated_rating)}%
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <h3 className="font-medium text-[#F5F5F5] text-xs line-clamp-1">{game.name}</h3>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-[#8F8F8F] text-sm">
            Loading latest games...
          </div>
        )}
      </section>

      {/* Featured/Top Games */}
      <section>
        <h2 className="text-lg font-bold text-[#F5F5F5] mb-3 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gradient-to-b from-[#3B82F6] to-[#8B5CF6] rounded-full" />
          Featured Games
        </h2>
        {loadingFeatured ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-[#E53A3A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : featuredGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredGames.map((game) => (
              <motion.button
                key={game.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenGameInfo(game, game.name)}
                className="bg-[#1C1C1C] rounded-xl overflow-hidden border border-[#424242]/40 hover:border-[#E53A3A]/50 transition-all text-left"
              >
                <div className="aspect-video relative">
                  {game.cover?.url ? (
                    <img
                      src={getCoverUrl(game.cover.url, 'cover_big')}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#2A2A2A]" />
                  )}
                  {game.aggregated_rating && (
                    <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-bold text-[#10B981]">
                      {Math.round(game.aggregated_rating)}%
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-[#F5F5F5] text-sm line-clamp-1">{game.name}</h3>
                  {game.genres && (
                    <p className="text-xs text-[#8F8F8F] mt-1 line-clamp-1">
                      {game.genres.slice(0, 2).map(g => g.name).join(', ')}
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#8F8F8F]">
            Browse categories below to discover games
          </div>
        )}
      </section>

      {/* Game Categories - Preloaded with 5-8 games each */}
      <section>
        <h2 className="text-lg font-bold text-[#F5F5F5] mb-3 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gradient-to-b from-[#10B981] to-[#059669] rounded-full" />
          Browse Categories
        </h2>
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 mb-4">
          {gameCategories.map((cat) => {
            const gamesCount = categoryGamesMap[cat.id]?.length || 0;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                className={`px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center sm:justify-start gap-1 sm:gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white shadow-lg'
                    : 'bg-[#1C1C1C] text-[#8F8F8F] hover:bg-[#2A2A2A] hover:text-[#CFCFCF] border border-[#424242]/40'
                }`}
                style={selectedCategory === cat.id ? { boxShadow: '0 4px 12px rgba(229, 58, 58, 0.25)' } : {}}
              >
                <span className="truncate">{cat.name}</span>
                {gamesCount > 0 && (
                  <span className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    selectedCategory === cat.id ? 'bg-white/25' : 'bg-[#424242]'
                  }`}>
                    {gamesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Category results - show preloaded games */}
        {loadingCategories && !Object.keys(categoryGamesMap).length && (
          <div className="flex items-center justify-center py-6">
            <div className="w-6 h-6 border-2 border-[#E53A3A] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* Show games for selected category OR show all categories with their games */}
        {selectedCategory && categoryGamesMap[selectedCategory]?.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 lg:gap-4"
          >
            {categoryGamesMap[selectedCategory].map((game) => (
              <motion.button
                key={game.id}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenGameInfo(game, game.name)}
                className="bg-[#1C1C1C] rounded-xl overflow-hidden border border-[#424242]/40 hover:border-[#E53A3A]/50 text-left transition-all"
              >
                <div className="aspect-[3/4] relative overflow-hidden">
                  {game.cover?.url ? (
                    <img
                      src={getCoverUrl(game.cover.url, 'cover_big')}
                      alt={game.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#2A2A2A] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#424242]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                    </div>
                  )}
                  {game.aggregated_rating && (
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold bg-black/80 backdrop-blur-sm ${
                      game.aggregated_rating >= 75 ? 'text-[#10B981]' : game.aggregated_rating >= 50 ? 'text-[#F59E0B]' : 'text-[#EF4444]'
                    }`}>
                      {Math.round(game.aggregated_rating)}%
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-[#F5F5F5] text-sm line-clamp-1">{game.name}</h3>
                  {game.genres && (
                    <p className="text-xs text-[#6B7280] mt-1 line-clamp-1">
                      {game.genres.slice(0, 2).map(g => g.name).join(' • ')}
                    </p>
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
        
        {/* Show hint when no category selected */}
        {!selectedCategory && !loadingCategories && Object.keys(categoryGamesMap).length > 0 && (
          <div className="text-center py-6 text-[#8F8F8F]">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Select a category to browse games
          </div>
        )}
      </section>

      {/* News Section Header */}
      <section>
        <h2 className="text-lg font-bold text-[#F5F5F5] mb-3 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gradient-to-b from-[#FF4D4D] to-[#FFAB40] rounded-full" />
          Gaming News
        </h2>

        {/* News Prompt Cards - 2x2 grid on all screen sizes */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {newsPrompts.map((prompt) => {
          const onCooldown = isPromptOnCooldown(prompt.id);
          const cooldownText = getCooldownRemaining(prompt.id);

          return (
            <motion.button
              key={prompt.id}
              whileHover={!onCooldown ? { scale: 1.02 } : undefined}
              whileTap={!onCooldown ? { scale: 0.98 } : undefined}
              onClick={() => handleNewsPromptClick(prompt)}
              disabled={onCooldown}
              className={`relative overflow-hidden rounded-xl p-3 sm:p-5 text-left transition-all ${
                onCooldown ? 'opacity-60' : ''
              }`}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${prompt.gradient} opacity-20`} />
              <div className="absolute inset-0 bg-[#1C1C1C]/80" />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${prompt.gradient}`}>
                    <div className="w-5 h-5 sm:w-8 sm:h-8">
                      {prompt.icon}
                    </div>
                  </div>
                  {onCooldown && cooldownText && (
                    <span className="text-[10px] sm:text-xs text-[#FF4D4D] bg-[#2A2A2A] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      {cooldownText}
                    </span>
                  )}
                </div>
                
                <h3 className="font-semibold text-[#F5F5F5] text-sm sm:text-base mb-0.5 sm:mb-1 line-clamp-1">{prompt.title}</h3>
                <p className="text-xs sm:text-sm text-[#8F8F8F] line-clamp-2 hidden sm:block">{prompt.description}</p>

                {/* Ready to use indicator */}
                {!onCooldown && (
                  <div className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-[#10B981]">
                    Tap to ask AI
                  </div>
                )}
              </div>

              {/* Hover border effect */}
              <div className={`absolute inset-0 rounded-xl border-2 border-transparent ${!onCooldown ? 'hover:border-[#E53A3A]/50' : ''} transition-colors`} />
            </motion.button>
          );
        })}
        </div>
      </section>
    </div>
  );
};

export default GamingExplorerHome;
