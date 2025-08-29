import { useState, useEffect } from 'react';
import { progressTrackingService } from '../services/progressTrackingService';
import { feedbackLearningEngine } from '../services/feedbackLearningEngine';

export interface ProgressTrackingState {
  isEnabled: boolean;
  currentGame: string | null;
  currentVersion: string;
  lastProgressUpdate: any | null;
}

export const useProgressTracking = (userId: string | undefined) => {
  const [state, setState] = useState<ProgressTrackingState>({
    isEnabled: false,
    currentGame: null,
    currentVersion: 'base_game',
    lastProgressUpdate: null
  });

  // Enable progress tracking when user is authenticated
  useEffect(() => {
    if (userId) {
      setState(prev => ({ ...prev, isEnabled: true }));
    }
  }, [userId]);

  // Detect progress from user message
  const detectProgress = async (message: string, gameContext?: string) => {
    if (!userId || !state.isEnabled) return null;

    console.log('🎮 Hook: Attempting progress detection', { message, gameContext, userId, isEnabled: state.isEnabled });

    try {
      // Simple keyword-based progress detection
      const progressIndicators = [
        { phrase: 'defeated', eventType: 'boss_defeat', confidence: 0.7, level: 4 },
        { phrase: 'completed', eventType: 'quest_completion', confidence: 0.8, level: 3 },
        { phrase: 'found', eventType: 'item_acquisition', confidence: 0.6, level: 2 },
        { phrase: 'discovered', eventType: 'location_discovery', confidence: 0.7, level: 3 },
        { phrase: 'reached', eventType: 'story_progression', confidence: 0.6, level: 3 },
        { phrase: 'unlocked', eventType: 'story_progression', confidence: 0.8, level: 4 },
        { phrase: 'finished', eventType: 'quest_completion', confidence: 0.9, level: 5 },
        { phrase: 'beat', eventType: 'boss_defeat', confidence: 0.8, level: 4 }
      ];

      for (const indicator of progressIndicators) {
        if (message.toLowerCase().includes(indicator.phrase.toLowerCase())) {
          console.log('🎮 Hook: Progress keyword detected', { keyword: indicator.phrase, eventType: indicator.eventType, level: indicator.level });
          
          // Determine game ID from context or use a default
          const gameId = gameContext || 'universal';
          console.log('🎮 Hook: Game ID resolved', { gameId, gameContext });
          
          const result = await progressTrackingService.updateProgressForAnyGame(
            userId,
            gameId,
            indicator.eventType,
            `AI-detected ${indicator.eventType} from user message`,
            indicator.level,
            state.currentVersion,
            indicator.confidence,
            'Progress detected from user message',
            [message]
          );

          console.log('🎮 Hook: Progress update result', { result });

          if (result.success) {
            setState(prev => ({ ...prev, lastProgressUpdate: result }));
            return result;
          }
          break;
        }
      }
      
      console.log('🎮 Hook: No progress detected in message');
    } catch (error) {
      console.error('🎮 Hook: Progress detection failed', error);
    }

    return null;
  };

  // Get user's current progress for a game
  const getCurrentProgress = async (gameId: string, version: string = 'base_game') => {
    if (!userId) return null;

    console.log('🎮 Hook: Getting current progress', { gameId, version, userId });

    try {
      const progress = await progressTrackingService.getUserGameProgress(userId, gameId, version);
      console.log('🎮 Hook: Current progress retrieved', { progress });
      return progress;
    } catch (error) {
      console.error('🎮 Hook: Failed to get current progress', error);
      return null;
    }
  };

  // Get available events for a game
  const getAvailableEvents = async (gameId: string, currentLevel: number) => {
    if (!userId) return [];

    console.log('🎮 Hook: Getting available events', { gameId, currentLevel, version: state.currentVersion, userId });

    try {
      const events = await progressTrackingService.getAvailableEvents(gameId, currentLevel, state.currentVersion);
      console.log('🎮 Hook: Available events retrieved', { count: events.length, events });
      return events;
    } catch (error) {
      console.error('🎮 Hook: Failed to get available events', error);
      return [];
    }
  };

  // Set current game context
  const setCurrentGame = (gameId: string, version: string = 'base_game') => {
    setState(prev => ({ ...prev, currentGame: gameId, currentVersion: version }));
  };

  // Clear progress update notification
  const clearProgressUpdate = () => {
    setState(prev => ({ ...prev, lastProgressUpdate: null }));
  };

  return {
    ...state,
    detectProgress,
    getCurrentProgress,
    getAvailableEvents,
    setCurrentGame,
    clearProgressUpdate
  };
};
