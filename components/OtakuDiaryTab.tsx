import React, { useState, useEffect } from 'react';
import type { DiaryTask, DiaryFavorite } from '../services/types';
// Dynamic import to avoid circular dependency
// import { unifiedUsageService } from '../services/unifiedUsageService';
import ToDoListTab from './ToDoListTab';
import FavoritesTab from './FavoritesTab';
// Dynamic import to avoid circular dependency
// import { otakuDiaryService } from '../services/otakuDiaryService';

interface OtakuDiaryTabProps {
  gameId: string;
  gameTitle: string;
}

type DiaryTabType = 'todo' | 'favorites';

const OtakuDiaryTab: React.FC<OtakuDiaryTabProps> = ({ gameId, gameTitle }) => {
  const [activeTab, setActiveTab] = useState<DiaryTabType>('todo');
  const [tasks, setTasks] = useState<DiaryTask[]>([]);
  const [favorites, setFavorites] = useState<DiaryFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usage, setUsage] = useState<any>(null);

  // Load data when component mounts
  useEffect(() => {
    loadDiaryData();
    loadUsageData();
  }, [gameId]);

  const loadUsageData = async () => {
    try {
      const { unifiedUsageService } = await import('../services/unifiedUsageService');
      const usageData = await unifiedUsageService.getUsage();
      setUsage(usageData);
    } catch (error) {
      console.warn('Failed to load usage data:', error);
      setUsage({ tier: 'free' });
    }
  };

  const loadDiaryData = async () => {
    setIsLoading(true);
    try {
      // Using dynamic import to avoid circular dependency
      const { otakuDiaryService } = await import('../services/otakuDiaryService');
      const [tasksData, favoritesData] = await Promise.all([
        otakuDiaryService.getTasks(gameId),
        otakuDiaryService.getFavorites(gameId)
      ]);
      
      setTasks(tasksData);
      setFavorites(favoritesData);
    } catch (error) {
      console.error('Error loading diary data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskUpdate = async () => {
    await loadDiaryData();
  };

  const handleFavoriteUpdate = async () => {
    await loadDiaryData();
  };

  const handleTabChange = (tab: DiaryTabType) => {
    // For free users, show upgrade splash when trying to access AI Suggested Tasks
    if (tab === 'todo' && usage?.tier === 'free') {
      // This will be handled by the ToDoListTab component
    }
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-[#FFAB40] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header - Responsive Design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-[#E53A3A]/20 gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Otaku Diary</h2>
          <p className="text-xs sm:text-sm text-[#8A8A8A] mt-1">Track your progress in {gameTitle}</p>
        </div>
        
        {/* Progress Summary - Responsive Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
          <div className="text-center">
            <div className="text-sm sm:text-base lg:text-lg font-bold text-white">{tasks.filter(t => t.status === 'completed').length}</div>
            <div className="text-xs text-[#8A8A8A]">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-sm sm:text-base lg:text-lg font-bold text-[#FFAB40]">{tasks.filter(t => t.status === 'pending').length}</div>
            <div className="text-xs text-[#8A8A8A]">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-sm sm:text-base lg:text-lg font-bold text-[#E53A3A]">{tasks.filter(t => t.status === 'need_help').length}</div>
            <div className="text-xs text-[#8A8A8A]">Need Help</div>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation - Better Hierarchy */}
      <div className="bg-gradient-to-r from-[#1A1A1A] to-[#0F0F0F] px-3 sm:px-4 lg:px-6 py-3 sm:py-4 rounded-t-xl border-b border-[#E53A3A]/20 mb-4 sm:mb-6">
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => handleTabChange('todo')}
            className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 ${
              activeTab === 'todo'
                ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white shadow-lg shadow-[#E53A3A]/30'
                : 'bg-[#2A2A2A] text-[#CFCFCF] hover:bg-[#3A3A3A] hover:text-white'
            }`}
          >
            To-Do List
          </button>
          <button
            onClick={() => handleTabChange('favorites')}
            className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 ${
              activeTab === 'favorites'
                ? 'bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white shadow-lg shadow-[#E53A3A]/30'
                : 'bg-[#2A2A2A] text-[#CFCFCF] hover:bg-[#3A3A3A] hover:text-white'
            }`}
          >
            Favorites
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'todo' && (
          <ToDoListTab
            gameId={gameId}
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
            userTier={usage?.tier || 'free'}
          />
        )}
        {activeTab === 'favorites' && (
          <FavoritesTab
            gameId={gameId}
            favorites={favorites}
            onFavoriteUpdate={handleFavoriteUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default OtakuDiaryTab;
