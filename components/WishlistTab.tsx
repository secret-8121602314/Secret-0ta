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

interface WishlistTabProps {
  onOpenWishlistModal: () => void;
}

const WishlistTab: React.FC<WishlistTabProps> = ({ onOpenWishlistModal }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newlyReleasedCount, setNewlyReleasedCount] = useState(0);

  useEffect(() => {
    loadWishlist();
  }, []);

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

  const formatReleaseDate = (dateString?: string) => {
    if (!dateString) return 'TBA';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
    } catch {
      return dateString;
    }
  };

  const upcomingReleases = wishlistItems.filter(item => item.releaseDate && new Date(item.releaseDate) > new Date());
  const tbaReleases = wishlistItems.filter(item => !item.releaseDate);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-[#E53A3A]/20 gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-3">
            Game Wishlist
            {newlyReleasedCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-[#5CBB7B] rounded-full animate-pulse">
                {newlyReleasedCount} New!
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-[#8A8A8A] mt-1">Track unreleased games you're excited about</p>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
          <div className="text-center">
            <div className="text-sm sm:text-base lg:text-lg font-bold text-white">{wishlistItems.length}</div>
            <div className="text-xs text-[#8A8A8A]">Total</div>
          </div>
          <div className="text-center">
            <div className="text-sm sm:text-base lg:text-lg font-bold text-[#FFAB40]">{upcomingReleases.length}</div>
            <div className="text-xs text-[#8A8A8A]">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-sm sm:text-base lg:text-lg font-bold text-[#E53A3A]">{tbaReleases.length}</div>
            <div className="text-xs text-[#8A8A8A]">TBA</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-[#FFAB40] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Your wishlist is empty</h3>
            <p className="text-[#CFCFCF] mb-6 text-sm sm:text-lg">
              Start building your wishlist of unreleased games you're excited about!
            </p>
            <button
              onClick={onOpenWishlistModal}
              className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:from-[#D98C1F] hover:to-[#E53A3A] transition-all duration-300 hover:scale-105 shadow-lg shadow-[#E53A3A]/30"
            >
              Add Your First Game
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="flex justify-center">
              <button
                onClick={onOpenWishlistModal}
                className="bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:from-[#D98C1F] hover:to-[#E53A3A] transition-all duration-300 hover:scale-105 shadow-lg shadow-[#E53A3A]/30"
              >
                Manage Wishlist
              </button>
            </div>

            {/* Newly Released Games with Notifications */}
            {newlyReleasedCount > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-[#5CBB7B]">🎉</span>
                  Newly Released Games
                  <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-[#5CBB7B] rounded-full">
                    {newlyReleasedCount}
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                  {wishlistItems
                    .filter(item => item.isReleased && !item.releaseNotificationShown)
                    .slice(0, 6)
                    .map((item) => (
                      <div key={item.id} className="bg-gradient-to-br from-[#5CBB7B]/20 to-[#4CAF50]/20 p-3 sm:p-4 rounded-xl border border-[#5CBB7B]/40 hover:border-[#5CBB7B]/60 transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-white text-sm sm:text-base">{item.gameName}</h4>
                          <span className="text-[#5CBB7B] text-xs font-bold bg-[#5CBB7B]/20 px-2 py-1 rounded-full">
                            AVAILABLE NOW!
                          </span>
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm">
                          {item.platform && (
                            <div className="flex items-center gap-2">
                              <span className="text-[#5CBB7B]">🎮</span>
                              <span className="text-[#CFCFCF]">{item.platform}</span>
                            </div>
                          )}
                          {item.genre && (
                            <div className="flex items-center gap-2">
                              <span className="text-[#5CBB7B]">🏷️</span>
                              <span className="text-[#CFCFCF]">{item.genre}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-[#5CBB7B]/20">
                          <span className="text-xs text-[#8A8A8A]">
                            Released {item.releaseDate ? new Date(item.releaseDate).toLocaleDateString() : 'recently'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Upcoming Releases */}
            {upcomingReleases.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-[#FFAB40]">📅</span>
                  Upcoming Releases
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {upcomingReleases.slice(0, 6).map((item) => (
                    <div key={item.id} className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] p-3 sm:p-4 rounded-xl border border-[#FFAB40]/20 hover:border-[#FFAB40]/40 transition-all duration-300">
                      <h4 className="font-bold text-white text-sm sm:text-base mb-2">{item.gameName}</h4>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-[#FFAB40]">📅</span>
                          <span className="text-[#CFCFCF]">{formatReleaseDate(item.releaseDate)}</span>
                        </div>
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
                      </div>
                    </div>
                  ))}
                </div>
                {upcomingReleases.length > 6 && (
                  <div className="text-center mt-4">
                    <p className="text-[#8A8A8A] text-sm">
                      +{upcomingReleases.length - 6} more upcoming releases
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TBA Releases */}
            {tbaReleases.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-[#E53A3A]">❓</span>
                  Release Date TBA
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {tbaReleases.slice(0, 6).map((item) => (
                    <div key={item.id} className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] p-3 sm:p-4 rounded-xl border border-[#E53A3A]/20 hover:border-[#E53A3A]/40 transition-all duration-300">
                      <h4 className="font-bold text-white text-sm sm:text-base mb-2">{item.gameName}</h4>
                      <div className="space-y-1 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-[#E53A3A]">📅</span>
                          <span className="text-[#CFCFCF]">Release Date TBA</span>
                        </div>
                        {item.platform && (
                          <div className="flex items-center gap-2">
                            <span className="text-[#E53A3A]">🎮</span>
                            <span className="text-[#CFCFCF]">{item.platform}</span>
                          </div>
                        )}
                        {item.genre && (
                          <div className="flex items-center gap-2">
                            <span className="text-[#E53A3A]">🏷️</span>
                            <span className="text-[#CFCFCF]">{item.genre}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {tbaReleases.length > 6 && (
                  <div className="text-center mt-4">
                    <p className="text-[#8A8A8A] text-sm">
                      +{tbaReleases.length - 6} more TBA releases
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* View All Button */}
            <div className="text-center pt-4">
              <button
                onClick={onOpenWishlistModal}
                className="bg-[#2A2A2A] text-[#CFCFCF] px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg hover:bg-[#3A3A3A] hover:text-white transition-all duration-300"
              >
                View Full Wishlist ({wishlistItems.length} games)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistTab;
