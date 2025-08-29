import React, { useState } from 'react';
import { otakuDiaryService, DiaryFavorite } from '../services/otakuDiaryService';

interface FavoritesTabProps {
  gameId: string;
  favorites: DiaryFavorite[];
  onFavoriteUpdate: () => void;
}

const FavoritesTab: React.FC<FavoritesTabProps> = ({ gameId, favorites, onFavoriteUpdate }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteFavorite = async (favoriteId: string) => {
    if (window.confirm('Are you sure you want to remove this from favorites?')) {
      setDeletingId(favoriteId);
      try {
        await otakuDiaryService.removeFavorite(gameId, favoriteId);
        onFavoriteUpdate();
      } catch (error) {
        console.error('Error removing favorite:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleFindMore = async (favorite: DiaryFavorite) => {
    // This will trigger an AI query for deeper lore
    // For now, we'll log it and could integrate with the chat system later
    console.log('Find more about:', favorite.content);
    
    // TODO: Integrate with chat system to send a query like:
    // "Tell me more about: [favorite.content]"
    // This could open a new chat or add to existing conversation
    
    // For now, show a notification
    alert(`Query prepared: "Tell me more about: ${favorite.content.substring(0, 50)}..."`);
  };

  const getTypeIcon = (type: DiaryFavorite['type']) => {
    switch (type) {
      case 'ai_response':
        return '🤖';
      case 'insight':
        return '💡';
      case 'lore':
        return '📚';
      default:
        return '⭐';
    }
  };

  const getTypeLabel = (type: DiaryFavorite['type']) => {
    switch (type) {
      case 'ai_response':
        return 'AI Response';
      case 'insight':
        return 'Insight';
      case 'lore':
        return 'Lore';
      default:
        return 'Favorite';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4">⭐</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Favorites Yet</h3>
        <p className="text-[#8A8A8A] max-w-md">
          Start favoriting AI responses and insights to build your personal collection of helpful information!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto p-3 sm:p-4">
      <div className="space-y-4">
        {favorites.map((favorite) => (
          <div
            key={favorite.id}
            className="p-4 bg-[#2E2E2E] rounded-lg border border-[#424242]/30 hover:border-[#FFAB40]/30 transition-all duration-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getTypeIcon(favorite.type)}</span>
                <span className="text-xs text-[#8A8A8A] bg-[#424242]/50 px-2 py-1 rounded">
                  {getTypeLabel(favorite.type)}
                </span>
                <span className="text-xs text-[#8A8A8A]">
                  {formatDate(favorite.createdAt)}
                </span>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleFindMore(favorite)}
                  className="px-3 py-1 bg-[#FFAB40] text-[#181818] rounded text-sm hover:bg-[#FFB74D] transition-all duration-200"
                  title="Find more about this"
                >
                  🔍 Find More
                </button>
                <button
                  onClick={() => handleDeleteFavorite(favorite.id)}
                  disabled={deletingId === favorite.id}
                  className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-all duration-200 disabled:opacity-50"
                  title="Remove from favorites"
                >
                  {deletingId === favorite.id ? '...' : '🗑️ Delete'}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="mb-3">
              <p className="text-white leading-relaxed">
                {favorite.content}
              </p>
            </div>

            {/* Context */}
            {favorite.context && (
              <div className="text-xs text-[#8A8A8A] bg-[#1C1C1C] px-2 py-1 rounded">
                {favorite.context}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-[#1C1C1C] rounded-lg border border-[#424242]/30">
        <div className="text-center">
          <p className="text-[#8A8A8A] text-sm">
            You have <span className="text-[#FFAB40] font-semibold">{favorites.length}</span> favorites
          </p>
          <p className="text-[#8A8A8A] text-xs mt-1">
            Use the "Find More" button to dive deeper into any favorite topic
          </p>
        </div>
      </div>
    </div>
  );
};

export default FavoritesTab;
