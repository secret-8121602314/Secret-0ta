import React, { useState, useEffect } from 'react';
import { WishlistItem } from '../services/types';
// Dynamic import to avoid circular dependency
// import { wishlistService } from '../services/wishlistService';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose
}) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGamePlatform, setNewGamePlatform] = useState('');
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [candidateGames, setCandidateGames] = useState<string[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadWishlist();
    }
  }, [isOpen]);

  const loadWishlist = async () => {
    setIsLoading(true);
    try {
      // Using static import instead of dynamic import for Firebase hosting compatibility
      const { wishlistService } = await import('../services/wishlistService');
      const items = await wishlistService.getWishlist();
      setWishlistItems(items);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGame = async () => {
    if (!newGameName.trim()) return;

    setIsAddingGame(true);
    try {
      // Using static import instead of dynamic import for Firebase hosting compatibility
      const { wishlistService } = await import('../services/wishlistService');
      const newItem = await wishlistService.addToWishlist({
        gameName: newGameName.trim(),
        platform: newGamePlatform || undefined,
        gameId: 'everything-else',
        source: 'user_input'
      });

      setWishlistItems(prev => [newItem, ...prev]);
      
      // Show success message
      setSuccessMessage(`"${newGameName.trim()}" added to wishlist!`);
      
      // Clear form
      setNewGameName('');
      setNewGamePlatform('');
      setIsAddingGame(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to add game to wishlist:', error);
      alert(`Failed to add game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingGame(false);
    }
  };

  const handleRemoveGame = async (itemId: string) => {
    if (window.confirm('Remove this game from your wishlist?')) {
      try {
        // Using static import instead of dynamic import for Firebase hosting compatibility
        const { wishlistService } = await import('../services/wishlistService');
        const success = await wishlistService.removeFromWishlist(itemId);
        if (success) {
          setWishlistItems(prev => prev.filter(item => item.id !== itemId));
        }
      } catch (error) {
        console.error('Failed to remove game from wishlist:', error);
        alert('Failed to remove game from wishlist');
      }
    }
  };

  // Build context-aware candidate games from conversations (Everything Else + game tabs)
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('otakonConversations') : null;
      if (!raw) { setCandidateGames([]); return; }
      const conversations = JSON.parse(raw) as Record<string, any>;
      const titles = new Set<string>();
      // Add all game conversation titles (exclude everything-else)
      Object.values(conversations).forEach((convo: any) => {
        if (convo && convo.id && convo.id !== 'everything-else' && typeof convo.title === 'string' && convo.title.trim().length > 0) {
          titles.add(convo.title.trim());
        }
      });
      // Also scan recent Everything Else messages for likely game mentions from suggestions array if present
      const ee = conversations['everything-else'];
      if (ee?.messages && Array.isArray(ee.messages)) {
        const recent = ee.messages.slice(-30);
        recent.forEach((m: any) => {
          if (m?.suggestions && Array.isArray(m.suggestions)) {
            m.suggestions.forEach((s: any) => {
              if (typeof s === 'string' && s.length >= 3 && s.length <= 60) titles.add(s.trim());
            });
          }
        });
      }
      // Exclude items already in wishlist
      const existing = new Set(wishlistItems.map(w => (w.gameName || '').trim().toLowerCase()));
      const candidates = Array.from(titles).filter(t => !existing.has(t.toLowerCase()));
      setCandidateGames(candidates);
    } catch (e) {
      console.warn('Failed to build wishlist suggestions from context:', e);
      setCandidateGames([]);
    }
  }, [isOpen, wishlistItems]);

  // Filter suggestions as user types
  useEffect(() => {
    const q = newGameName.trim().toLowerCase();
    if (!q) { setFilteredSuggestions([]); return; }
    const list = candidateGames
      .filter(name => name.toLowerCase().includes(q))
      .slice(0, 6);
    setFilteredSuggestions(list);
  }, [newGameName, candidateGames]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-[#1C1C1C] to-[#0A0A0A] border border-[#FF4D4D]/30 rounded-2xl shadow-2xl w-full max-w-2xl mx-auto relative animate-scale-in flex flex-col max-h-[90vh] hover:border-[#FF4D4D]/50 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Header */}
        <div className="bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Wishlist</h2>
                <p className="text-white/90 text-sm">Track games you're excited about</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-lg text-green-400 text-center text-sm">
              {successMessage}
            </div>
          )}

          {/* Brand Add Form */}
          <div className="bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] p-4 rounded-lg border border-[#FF4D4D]/25 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#FFAB40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Add New Game
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <label className="block text-sm font-medium text-[#CFCFCF] mb-2">Game Name *</label>
                <input
                  type="text"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#424242] rounded text-white text-sm focus:border-[#FFAB40] focus:outline-none transition-colors"
                  placeholder="Enter game name"
                />
                {filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-[#0F0F0F] border border-[#424242]/60 rounded-lg shadow-xl overflow-hidden">
                    {filteredSuggestions.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setNewGameName(s); setFilteredSuggestions([]); }}
                        className="w-full text-left px-3 py-2 text-sm text-[#E5E5E5] hover:bg-[#1C1C1C]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#CFCFCF] mb-2">Platform</label>
                <input
                  type="text"
                  value={newGamePlatform}
                  onChange={(e) => setNewGamePlatform(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#424242] rounded text-white text-sm focus:border-[#FFAB40] focus:outline-none transition-colors"
                  placeholder="PC, PS5, Xbox, Switch"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleAddGame}
                disabled={isAddingGame || !newGameName.trim()}
                className={`px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isAddingGame || !newGameName.trim()
                    ? 'bg-[#424242] text-[#8A8A8A] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#FF4D4D] to-[#FFAB40] text-white hover:from-[#FFAB40] hover:to-[#FF4D4D] hover:scale-105 shadow-lg shadow-[#FF4D4D]/25'
                }`}
              >
                {isAddingGame ? 'Adding...' : 'Add to Wishlist'}
              </button>
            </div>
          </div>

          {/* Wishlist Items */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#FFAB40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Your Games ({wishlistItems.length})
            </h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-6 h-6 border-2 border-[#FFAB40] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="text-center py-8 text-[#888888]">
                <svg className="w-12 h-12 mx-auto mb-3 text-[#666666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-base">Your wishlist is empty</p>
                <p className="text-sm">Add some games you're excited about!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlistItems.map((item) => (
                  <div key={item.id} className="bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] p-4 rounded-lg border border-[#FF4D4D]/25 hover:border-[#FFAB40]/50 hover:shadow-lg hover:shadow-[#FF4D4D]/15 transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-white mb-2">{item.gameName}</h4>
                        {item.platform && (
                          <div className="flex items-center gap-2 text-sm text-[#888888]">
                            <svg className="w-4 h-4 text-[#FFAB40]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            <span>{item.platform}</span>
                          </div>
                        )}
                        <div className="text-xs text-[#666666] mt-2">
                          Added {new Date(item.addedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveGame(item.id)}
                        className="text-[#888888] hover:text-red-400 transition-colors p-1 ml-3 hover:bg-red-500/10 rounded"
                        aria-label="Remove"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Brand Footer */}
        <div className="bg-gradient-to-r from-[#0A0A0A] to-[#1A1A1A] p-4 border-t border-[#FF4D4D]/25 text-center">
          <p className="text-xs text-[#666666] flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            Use chat to add more details like release dates, genres, and descriptions
          </p>
        </div>
      </div>
    </div>
  );
};

export default WishlistModal;
