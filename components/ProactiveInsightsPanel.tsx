import React, { useState, useEffect } from 'react';
// Dynamic imports to avoid circular dependencies
// import { proactiveInsightService, ProactiveInsightSuggestion } from '../services/proactiveInsightService';
// import { playerProfileService } from '../services/playerProfileService';

interface ProactiveInsightsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onInsightAction?: (insight: ProactiveInsightSuggestion) => void;
}

interface ProactiveInsightSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'tip' | 'warning' | 'suggestion';
  priority: 'low' | 'medium' | 'high';
  gameId?: string;
  createdAt: number;
  isRead: boolean;
  timestamp?: number;
  content?: string;
  actionRequired?: boolean;
  actionText?: string;
}

export const ProactiveInsightsPanel: React.FC<ProactiveInsightsPanelProps> = ({
  isOpen,
  onClose,
  onInsightAction
}) => {
  const [insights, setInsights] = useState<ProactiveInsightSuggestion[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread' | 'high-priority'>('all');
    const [isLoading, setIsLoading] = useState(false);

    // Load insights when panel opens
    useEffect(() => {
        if (isOpen) {
            loadInsights();
        }
    }, [isOpen]);

    const loadInsights = async () => {
        setIsLoading(true);
        try {
            const { proactiveInsightService } = await import('../services/proactiveInsightService');
            const allInsights = proactiveInsightService.getProactiveInsights();
            setInsights(allInsights as unknown as ProactiveInsightSuggestion[]);
        } catch (error) {
            console.error('Error loading insights:', error);
        } finally {
            setIsLoading(false);
        }
    };

  const handleInsightAction = async (insight: ProactiveInsightSuggestion) => {
    try {
      const { proactiveInsightService } = await import('../services/proactiveInsightService');
      await proactiveInsightService.markInsightAsRead(insight.id);
      
      // Reload insights
      loadInsights();
      
      // Call parent action handler if provided
      if (onInsightAction) {
        onInsightAction(insight);
      }
    } catch (error) {
      console.error('Failed to handle insight action:', error);
    }
  };

  const handleDeleteInsight = async (insightId: string) => {
    try {
      const { proactiveInsightService } = await import('../services/proactiveInsightService');
      await proactiveInsightService.deleteInsight(insightId);
      loadInsights();
    } catch (error) {
      console.error('Failed to delete insight:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { proactiveInsightService } = await import('../services/proactiveInsightService');
      for (const insight of insights) {
        if (!insight.isRead) {
          await proactiveInsightService.markInsightAsRead(insight.id);
        }
      }
      loadInsights();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

    const getFilteredInsights = () => {
        switch (filter) {
            case 'unread':
                return insights.filter(insight => !insight.isRead);
            case 'high-priority':
                return insights.filter(insight => insight.priority === 'high');
            default:
                return insights;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'text-red-400 border-red-400';
            case 'medium':
                return 'text-yellow-400 border-yellow-400';
            case 'low':
                return 'text-green-400 border-green-400';
            default:
                return 'text-gray-400 border-gray-400';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high':
                return '🔴';
            case 'medium':
                return '🟡';
            case 'low':
                return '🟢';
            default:
                return '⚪';
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else {
            return `${days}d ago`;
        }
    };

    const filteredInsights = getFilteredInsights();
    const unreadCount = insights.filter(insight => !insight.isRead).length;
    const highPriorityCount = insights.filter(insight => insight.priority === 'high' && !insight.isRead).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1C1C1C] border border-[#424242]/40 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#424242]/40">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-[#F5F5F5]">💡 Proactive Insights</h2>
                        {unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                        {highPriorityCount > 0 && (
                            <span className="bg-red-600 text-white text-sm px-2 py-1 rounded-full">
                                {highPriorityCount} urgent
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#A3A3A3] hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Filters and Actions */}
                <div className="flex items-center justify-between p-4 border-b border-[#424242]/40">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-[#2A2A2A] text-[#A3A3A3] hover:bg-[#3A3A3A]'
                            }`}
                        >
                            All ({insights.length})
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === 'unread'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-[#2A2A2A] text-[#A3A3A3] hover:bg-[#3A3A3A]'
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                        <button
                            onClick={() => setFilter('high-priority')}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === 'high-priority'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-[#2A2A2A] text-[#A3A3A3] hover:bg-[#3A3A3A]'
                            }`}
                        >
                            High Priority ({highPriorityCount})
                        </button>
                    </div>
                    
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                            Mark All as Read
                        </button>
                    )}
                </div>

                {/* Insights List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredInsights.length === 0 ? (
                        <div className="text-center py-8 text-[#A3A3A3]">
                            {filter === 'all' ? 'No insights yet' : `No ${filter} insights`}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredInsights.map((insight) => (
                                <div
                                    key={insight.id}
                                    className={`bg-[#2A2A2A] border rounded-xl p-4 transition-all ${
                                        insight.isRead
                                            ? 'border-[#424242]/40 opacity-75'
                                            : 'border-blue-500/40 shadow-lg shadow-blue-500/20'
                                    }`}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(insight.priority)}`}>
                                                {getPriorityIcon(insight.priority)} {insight.priority}
                                            </span>
                                            {!insight.isRead && (
                                                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-[#A3A3A3]">
                                                {formatTimestamp(insight.timestamp)}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteInsight(insight.id)}
                                                className="text-[#A3A3A3] hover:text-red-400 transition-colors"
                                                title="Delete insight"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">
                                        {insight.title}
                                    </h3>

                                    {/* Content */}
                                    <div className="text-[#CFCFCF] text-sm leading-relaxed mb-4 whitespace-pre-line">
                                        {insight.content}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {insight.actionRequired && insight.actionText && (
                                                <button
                                                    onClick={() => handleInsightAction(insight)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                                >
                                                    {insight.actionText}
                                                </button>
                                            )}
                                        </div>
                                        
                                        {!insight.isRead && (
                                            <button
                                                onClick={() => handleInsightAction(insight)}
                                                className="text-[#A3A3A3] hover:text-white transition-colors text-sm"
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#424242]/40 text-center text-[#A3A3A3] text-sm">
                    Insights are generated based on your gaming activity and preferences
                </div>
            </div>
        </div>
    );
};
