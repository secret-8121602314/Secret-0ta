import React, { useState, useEffect } from 'react';
import { taskDetectionService } from '../services/taskDetectionService';
import { unifiedUsageService } from '../services/unifiedUsageService';

interface ActionButtonsProps {
  content: string;
  messageId?: string;
  insightId?: string;
  gameId: string;
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  thumbsUpActive: boolean;
  thumbsDownActive: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = React.memo(({
  content,
  messageId,
  insightId,
  gameId,
  onThumbsUp,
  onThumbsDown,
  thumbsUpActive,
  thumbsDownActive
}) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const usage = unifiedUsageService.getUsage();

  // Check if content is already favorited
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (messageId || insightId) {
        const { otakuDiaryService } = await import('../services/otakuDiaryService');
        const type = messageId ? 'message' : 'insight';
        const sourceId = messageId || insightId || '';
        const favorited = await otakuDiaryService.isFavorited(gameId, sourceId, type);
        setIsFavorited(favorited);
      }
    };

    checkFavoriteStatus();
  }, [gameId, messageId, insightId]);

  const handleFavorite = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { otakuDiaryService } = await import('../services/otakuDiaryService');
      
      if (isFavorited) {
        // Remove from favorites
        const favorites = await otakuDiaryService.getFavorites(gameId);
        const favorite = favorites.find(fav => 
          (messageId && fav.sourceMessageId === messageId) ||
          (insightId && fav.sourceInsightId === insightId)
        );
        
        if (favorite) {
          await otakuDiaryService.removeFavorite(gameId, favorite.id);
          setIsFavorited(false);
        }
      } else {
        // Add to favorites
        const type = messageId ? 'ai_response' : 'insight';
        await otakuDiaryService.addFavorite({
          content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          type,
          gameId,
          sourceMessageId: messageId,
          sourceInsightId: insightId,
          context: `From ${type === 'ai_response' ? 'AI response' : 'insight'}`
        });
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error handling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToTasks = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { otakuDiaryService } = await import('../services/otakuDiaryService');
      
      // Detect tasks from content
      const detectedTasks = taskDetectionService.detectTasksFromText(content);
      
      if (detectedTasks.length > 0) {
        // Add each detected task directly to user created tasks
        for (const detectedTask of detectedTasks) {
          await otakuDiaryService.createTask({
            title: detectedTask.title,
            description: detectedTask.description,
            type: 'user_created',
            status: 'pending',
            category: detectedTask.category,
            gameId,
            source: content.substring(0, 100) + '...',
            sourceMessageId: messageId,
            priority: 'medium'
          });
        }
        
        // Show success feedback
        console.log(`Added ${detectedTasks.length} tasks to your diary`);
      } else {
        // If no tasks detected, create a custom task from the content
        await otakuDiaryService.createTask({
          title: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          description: `Custom task from ${messageId ? 'AI response' : 'insight'}`,
          type: 'user_created',
          status: 'pending',
          category: 'custom',
          gameId,
          source: content.substring(0, 100) + '...',
          sourceMessageId: messageId,
          priority: 'medium'
        });
        
        console.log('Added custom task to your diary');
      }
    } catch (error) {
      console.error('Error adding to tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-1.5 md:gap-1 mt-1 sm:mt-1.5 pt-0.5 sm:pt-0.5 border-t border-[#424242]/20">
      {/* Thumbs Up */}
      <button
        onClick={onThumbsUp}
        disabled={isLoading}
        className={`p-2 sm:p-1.5 md:p-1 rounded-lg transition-all duration-200 hover:scale-105 ${
          thumbsUpActive 
            ? 'text-green-400 bg-green-400/10 border border-green-400/30' 
            : 'text-[#8A8A8A] hover:text-green-400 hover:bg-green-400/10'
        }`}
        title="Thumbs up"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 9V5a3 3 0 0 0-6 0v4H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2z"/>
        </svg>
      </button>

      {/* Thumbs Down */}
      <button
        onClick={onThumbsDown}
        disabled={isLoading}
        className={`p-2 sm:p-1.5 md:p-1 rounded-lg transition-all duration-200 hover:scale-105 ${
          thumbsDownActive 
            ? 'text-red-400 bg-red-400/10 border border-red-400/30' 
            : 'text-[#8A8A8A] hover:text-red-400 hover:bg-red-400/10'
        }`}
        title="Thumbs down"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 15v4a3 3 0 0 0 6 0v-4h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-12a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2z"/>
        </svg>
      </button>

      {/* Heart (Favorite) */}
      <button
        onClick={handleFavorite}
        disabled={isLoading}
        className={`p-2 sm:p-1.5 md:p-1 rounded-lg transition-all duration-200 hover:scale-105 ${
          isFavorited 
            ? 'text-pink-400 bg-pink-400/10 border border-pink-400/30' 
            : 'text-[#8A8A8A] hover:text-pink-400 hover:bg-pink-400/10'
        }`}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg className="w-4 h-4" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Plus (Add to Tasks) */}
      <button
        onClick={handleAddToTasks}
        disabled={isLoading}
        className="p-2 sm:p-1.5 md:p-1 rounded-lg transition-all duration-200 hover:scale-105 text-[#8A8A8A] hover:text-[#FFAB40] hover:bg-[#FFAB40]/10"
        title="Add to tasks"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Loading indicator */}
      {isLoading && (
        <div className="ml-2">
          <div className="w-4 h-4 border-2 border-[#FFAB40] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
});

export default ActionButtons;
