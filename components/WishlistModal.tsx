import React, { useState, useEffect } from 'react';
import { WishlistItem } from '../services/wishlistService';
// Dynamic import to avoid bundle conflicts
let wishlistService: any = null;
const getWishlistService = async () => {
  if (!wishlistService) {
    const module = await import('../services/wishlistService');
    wishlistService = module.wishlistService;
  }
  return wishlistService;
};

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
  const [newGameReleaseDate, setNewGameReleaseDate] = useState('');
  const [newGamePlatform, setNewGamePlatform] = useState('');
  const [newGameGenre, setNewGameGenre] = useState('');
  const [newGameDescription, setNewGameDescription] = useState('');
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newlyReleasedCount, setNewlyReleasedCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadWishlist();
    }
  }, [isOpen]);

  const loadWishlist = async () => {
    setIsLoading(true);
    try {
      const items = await wishlistService.getWishlist();
      setWishlistItems(items);
      
      // Get count of newly released games
      const newlyReleased = wishlistService.getNewlyReleasedCount();
      setNewlyReleasedCount(newlyReleased);
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
      const newItem = await wishlistService.addToWishlist({
        gameName: newGameName.trim(),
        releaseDate: newGameReleaseDate || undefined,
        platform: newGamePlatform || undefined,
        genre: newGameGenre || undefined,
        description: newGameDescription || undefined,
        gameId: 'everything-else',
        source: 'user_input'
      });

      setWishlistItems(prev => [newItem, ...prev]);
      
      // Show success message
      setSuccessMessage(`"${newGameName.trim()}" added to wishlist!`);
      
      // Clear form
      setNewGameName('');
      setNewGameReleaseDate('');
      setNewGamePlatform('');
      setNewGameGenre('');
      setNewGameDescription('');
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
    if (window.confirm('Are you sure you want to remove this game from your wishlist?')) {
      try {
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

  const formatReleaseDate = (dateString?: string) => {
    if (!dateString) return 'TBA';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-gradient-to-br from-[#0A0A0A] via-[#1C1C1C] to-[#0F0F0F] border-2 border-[#E53A3A]/40 rounded-3xl shadow-2xl w-full max-w-6xl mx-auto relative animate-scale-in flex flex-col max-h-[95vh] h-auto hover:border-[#E53A3A]/60 transition-all duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header - Responsive Design */}
        <div className="bg-gradient-to-r from-[#E53A3A] via-[#D98C1F] to-[#E53A3A] p-4 sm:p-6 rounded-t-3xl relative overflow-hidden">
          {/* Background Pattern - Subtle */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-2xl backdrop-blur-sm">
                  <span className="text-xl sm:text-2xl">🎮</span>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg flex items-center gap-3">
                    Game Wishlist
                    {newlyReleasedCount > 0 && (
                      <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold leading-none text-white bg-[#5CBB7B] rounded-full animate-pulse">
                        {newlyReleasedCount} New!
                      </span>
                    )}
                  </h2>
                  <p className="text-white/90 mt-1 text-sm sm:text-base lg:text-lg">Track unreleased games you're excited about</p>
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-1">
                      <span className="inline-block bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full border border-yellow-500/30">
                        🔧 Dev Mode - localStorage
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-white/80 transition-all duration-300 hover:scale-110 bg-white/10 hover:bg-white/20 p-2 sm:p-3 rounded-2xl backdrop-blur-sm self-end sm:self-auto"
                aria-label="Close Wishlist"
              >
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area - Responsive Layout */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl text-green-400 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">✅</span>
                <span className="font-semibold">{successMessage}</span>
              </div>
            </div>
          )}

          {/* Newly Released Games with Notifications */}
          {newlyReleasedCount > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-[#5CBB7B]/20 to-[#4CAF50]/20 border border-[#5CBB7B]/30 rounded-xl">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-[#5CBB7B]">🎉</span>
                Newly Released Games
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-[#5CBB7B] rounded-full">
                  {newlyReleasedCount}
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {wishlistItems
                  .filter(item => item.isReleased && !item.releaseNotificationShown)
                  .slice(0, 4)
                  .map((item) => (
                    <div key={item.id} className="bg-white/10 p-3 rounded-lg border border-[#5CBB7B]/40">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white text-sm">{item.gameName}</h4>
                        <span className="text-[#5CBB7B] text-xs font-bold bg-[#5CBB7B]/20 px-2 py-1 rounded-full">
                          AVAILABLE NOW!
                        </span>
                      </div>
                      <div className="text-xs text-white/80">
                        {item.platform && <span className="mr-3">🎮 {item.platform}</span>}
                        {item.genre && <span>🏷️ {item.genre}</span>}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Add New Game Form */}
          <div className="bg-gradient-to-r from-[#1A1A1A] to-[#0F0F0F] p-4 sm:p-6 rounded-2xl border border-[#E53A3A]/20 mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Add New Game to Wishlist</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-[#CFCFCF] mb-2">Game Name *</label>
                <input
                  type="text"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#424242] rounded text-white text-sm"
                  placeholder="Enter game name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#CFCFCF] mb-2">Release Date</label>
                <input
                  type="date"
                  value={newGameReleaseDate}
                  onChange={(e) => setNewGameReleaseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#424242] rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#CFCFCF] mb-2">Platform</label>
                <input
                  type="text"
                  value={newGamePlatform}
                  onChange={(e) => setNewGamePlatform(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#424242] rounded text-white text-sm"
                  placeholder="PC, PS5, Xbox, Switch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#CFCFCF] mb-2">Genre</label>
                <input
                  type="text"
                  value={newGameGenre}
                  onChange={(e) => setNewGameGenre(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#424242] rounded text-white text-sm"
                  placeholder="RPG, Action, Strategy"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-[#CFCFCF] mb-2">Description</label>
                <textarea
                  value={newGameDescription}
                  onChange={(e) => setNewGameDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#424242] rounded text-white text-sm"
                  placeholder="Why are you excited about this game?"
                  rows={2}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddGame}
                disabled={isAddingGame || !newGameName.trim()}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 ${
                  isAddingGame || !newGameName.trim()
                    ? 'bg-[#424242] text-[#8A8A8A] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white hover:from-[#D98C1F] hover:to-[#E53A3A] hover:scale-105'
                }`}
              >
                {isAddingGame ? 'Adding...' : 'Add to Wishlist'}
              </button>
            </div>
          </div>

          {/* Wishlist Items */}
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-bold text-white">Your Wishlist ({wishlistItems.length})</h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-[#FFAB40] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="text-center py-8 text-[#8A8A8A]">
                <div className="text-4xl mb-4">🎮</div>
                <p className="text-lg">Your wishlist is empty</p>
                <p className="text-sm">Add some unreleased games you're excited about!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {wishlistItems.map((item) => (
                  <div key={item.id} className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] p-4 rounded-xl border border-[#E53A3A]/20 hover:border-[#E53A3A]/40 transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-lg font-bold text-white">{item.gameName}</h4>
                      <button
                        onClick={() => handleRemoveGame(item.id)}
                        className="text-[#E53A3A] hover:text-[#FF6B6B] transition-colors duration-200 p-1"
                        aria-label="Remove from wishlist"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {item.releaseDate && (
                        <div className="flex items-center gap-2">
                          <span className="text-[#FFAB40]">📅</span>
                          <span className="text-[#CFCFCF]">Release: {formatReleaseDate(item.releaseDate)}</span>
                        </div>
                      )}
                      {item.platform && (
                        <div className="flex items-center gap-2">
                          <span className="text-[#FFAB40]">🎮</span>
                          <span className="text-[#CFCFCF]">{item.platform}</span>
                        </div>
                      )}
                      {item.genre && (
                        <div className="flex items-center gap-2">
                          <span className="text-[#FFAB40]">🏷️</span>
                          <span className="text-[#CFCFCF]">{item.genre}</span>
                        </div>
                      )}
                      {item.description && (
                        <div className="flex items-start gap-2">
                          <span className="text-[#FFAB40] mt-1">💭</span>
                          <span className="text-[#CFCFCF]">{item.description}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-[#E53A3A]/20">
                      <span className="text-xs text-[#8A8A8A]">
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Responsive */}
        <div className="bg-gradient-to-r from-[#0F0F0F] to-[#1A1A1A] px-3 sm:px-4 lg:px-6 py-3 sm:py-4 rounded-b-3xl border-t border-[#E53A3A]/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-[#888888]">
            <span className="text-center sm:text-left">🎮 Track your most anticipated games</span>
            <span className="text-center sm:text-right">✨ Never miss a release • Stay organized • Plan your gaming</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistModal;
