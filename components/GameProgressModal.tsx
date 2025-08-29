import React, { useState, useEffect } from 'react';
import { XMarkIcon, ChartBarIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline';
import { progressTrackingService, GameProgress, GameEvent, ProgressHistory } from '../services/progressTrackingService';
import { supabase } from '../services/supabase';

interface GameProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  userId: string;
}

export default function GameProgressModal({ 
  isOpen, 
  onClose, 
  gameId, 
  gameTitle,
  userId 
}: GameProgressModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'history' | 'objectives'>('overview');
  const [selectedVersion, setSelectedVersion] = useState<string>('base_game');
  const [progressData, setProgressData] = useState<GameProgress | null>(null);
  const [availableEvents, setAvailableEvents] = useState<GameEvent[]>([]);
  const [progressHistory, setProgressHistory] = useState<ProgressHistory[]>([]);
  const [gameVersions, setGameVersions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && gameId && userId) {
      fetchGameData();
    }
  }, [isOpen, gameId, userId, selectedVersion]);

  const fetchGameData = async () => {
    setIsLoading(true);
    try {
      // Get available versions for this game
      const { data: versionData } = await supabase
        .from('game_progress_events')
        .select('game_version')
        .eq('game_id', gameId)
        .order('game_version');
      
      const versions = [...new Set(versionData?.map(v => v.game_version) || ['base_game'])];
      setGameVersions(versions);

      // Fetch progress data
      const progress = await progressTrackingService.getUserGameProgress(userId, gameId, selectedVersion);
      setProgressData(progress);

      // Fetch available events
      const events = await progressTrackingService.getAvailableEvents(gameId, progress.current_progress_level, selectedVersion);
      setAvailableEvents(events);

      // Fetch progress history
      const history = await progressTrackingService.getProgressHistory(userId, gameId, selectedVersion);
      setProgressHistory(history);

    } catch (error) {
      console.error('Error fetching game data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressPercentage = () => {
    if (!progressData) return 0;
    return Math.min((progressData.current_progress_level / 10) * 100, 100);
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">{gameTitle} - Progress Tracker</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Version Selector */}
          {gameVersions.length > 1 && (
            <div className="flex items-center space-x-3">
              <label className="text-blue-100 text-sm font-medium">Game Version:</label>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="bg-white/20 text-white border border-white/30 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                {gameVersions.map(version => (
                  <option key={version} value={version} className="text-gray-900">
                    {version === 'base_game' ? 'Base Game' : version.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <p className="text-blue-100 text-sm">
            Your gaming journey with AI-powered progress detection
            {selectedVersion !== 'base_game' && ` (${selectedVersion})`}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'events', label: 'Available Events', icon: StarIcon },
              { id: 'history', label: 'Progress History', icon: ClockIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && progressData && (
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Current Progress</h3>
                      <span className="text-2xl font-bold text-blue-600">Level {progressData.current_progress_level}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full transition-all duration-500 ${getProgressColor()}`}
                        style={{ width: `${getProgressPercentage()}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>Level 1</span>
                      <span>Level 10</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{progressData.completed_events.length}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Events Completed</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(progressData.progress_confidence * 100)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">AI Confidence</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {new Date(progressData.last_progress_update).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Last Updated</div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Recent Activity</h3>
                    <div className="space-y-2">
                      {progressHistory.slice(0, 5).map((entry) => (
                        <div key={entry.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              Level {entry.old_level} → Level {entry.new_level}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Available Events</h3>
                  <div className="space-y-3">
                    {availableEvents.map((event) => (
                      <div key={event.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{event.description}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.lore_context}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Type: {event.event_type.replace(/_/g, ' ')}</span>
                              <span>Difficulty: {event.difficulty_rating}/10</span>
                              <span>Unlocks: Level {event.unlocks_progress_level}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">Level {event.unlocks_progress_level}</div>
                            <div className="text-xs text-gray-500">Required</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Progress History</h3>
                  <div className="space-y-3">
                    {progressHistory.map((entry) => (
                      <div key={entry.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              Level {entry.old_level} → Level {entry.new_level}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Event: {entry.event_id}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {entry.ai_reasoning}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {Math.round(entry.ai_confidence * 100)}%
                            </div>
                            <div className="text-xs text-gray-500">Confidence</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {entry.user_feedback && (
                          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-800 dark:text-blue-200">
                            <strong>User Feedback:</strong> {entry.user_feedback}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
