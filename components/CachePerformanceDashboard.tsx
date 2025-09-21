import React, { useState, useEffect, useCallback } from 'react';
// Restored unifiedCacheService for advanced caching
import { unifiedCacheService } from '../services/unifiedCacheService';

interface CachePerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  averageResponseTime: number;
  memoryUsage?: number;
  storageUsage?: number;
  lastUpdated: Date;
}

export default function CachePerformanceDashboard({ isOpen, onClose }: CachePerformanceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'strategies' | 'performance' | 'management'>('overview');
  const [metrics, setMetrics] = useState<CachePerformanceMetrics>(() => ({
    hitRate: 0,
    missRate: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    storageUsage: 0,
    lastUpdated: new Date() // ✅ FIX: Initialize once, don't create new Date() on every render
  }));
  const [cacheInfo, setCacheInfo] = useState({
    memorySize: 0,
    storageSize: 0,
    strategies: [] as string[]
  });

  // Simple cache usage for demonstration
  const [cacheData, setCacheData] = useState({
    userPrefs: null as any,
    conversations: null as any,
    suggestions: null as any
  });

  // ===== METRICS UPDATES =====

  const updateMetrics = useCallback(async () => {
    // Using restored unifiedCacheService
    try {
      const newMetrics = unifiedCacheService().getPerformanceMetrics();
      const newCacheInfo = unifiedCacheService().getCacheInfo();
      
      setMetrics(newMetrics);
      setCacheInfo(newCacheInfo);
      
      // Load some example cache data
      const userPrefs = await unifiedCacheService().get('user_preferences_demo', 'user_preferences');
      const conversations = await unifiedCacheService().get('conversations_demo', 'conversations');
      const suggestions = await unifiedCacheService().get('suggestions_demo', 'suggestions');
      
      setCacheData({
        userPrefs: userPrefs || null,
        conversations: conversations || null,
        suggestions: suggestions || null
      });
      
    } catch (error) {
      console.error('Error updating cache metrics:', error);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isOpen, updateMetrics]);

  // ===== CACHE MANAGEMENT =====

  const clearAllCache = async () => {
    try {
      await unifiedCacheService().clear();
      updateMetrics();
      console.log('🗑️ All cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const clearStrategyCache = async (strategy: string) => {
    try {
      await unifiedCacheService().clearStrategy(strategy);
      updateMetrics();
      console.log(`🗑️ Cache cleared for strategy: ${strategy}`);
    } catch (error) {
      console.error(`Failed to clear ${strategy} cache:`, error);
    }
  };

  const triggerPrediction = async () => {
    try {
      await unifiedCacheService().predictAndPrecache();
      console.log('🔮 Predictive caching triggered');
    } catch (error) {
      console.error('Predictive caching failed:', error);
    }
  };

  // ===== UTILITY FUNCTIONS =====

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getPerformanceColor = (value: number, threshold: number): string => {
    if (value >= threshold) return 'text-green-500';
    if (value >= threshold * 0.8) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">🚀 Advanced Cache Performance Dashboard</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'strategies', label: 'Strategies', icon: '⚡' },
              { id: 'performance', label: 'Performance', icon: '📈' },
              { id: 'management', label: 'Management', icon: '🔧' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Hit Rate</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(metrics.hitRate, 0.8)}`}>
                        {formatPercentage(metrics.hitRate)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-500 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Miss Rate</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(1 - metrics.missRate, 0.8)}`}>
                        {formatPercentage(metrics.missRate)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Avg Response</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(1 / (metrics.averageResponseTime + 1), 0.1)}`}>
                        {formatTime(metrics.averageResponseTime)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Memory Usage</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {formatBytes(metrics.memoryUsage || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cache Status */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Cache Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Memory Cache</p>
                    <p className="text-xl font-bold">{cacheInfo.memorySize} entries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Storage Cache</p>
                    <p className="text-xl font-bold">{cacheInfo.storageSize} entries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Strategies</p>
                    <p className="text-xl font-bold">{cacheInfo.strategies.length}</p>
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Last updated: {metrics.lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          )}

          {activeTab === 'strategies' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Cache Strategies</h3>
              
              {/* Strategy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    name: 'user_preferences',
                    title: 'User Preferences',
                    description: 'High-priority user settings and preferences',
                    priority: 'High',
                    ttl: '24 hours',
                    maxSize: '10 MB',
                    color: 'from-green-500 to-green-600'
                  },
                  {
                    name: 'conversations',
                    title: 'Conversations',
                    description: 'Chat history and conversation data',
                    priority: 'Medium',
                    ttl: '6 hours',
                    maxSize: '50 MB',
                    color: 'from-blue-500 to-blue-600'
                  },
                  {
                    name: 'suggestions',
                    title: 'Suggestions',
                    description: 'AI-generated suggestions and prompts',
                    priority: 'Low',
                    ttl: '2 hours',
                    maxSize: '20 MB',
                    color: 'from-purple-500 to-purple-600'
                  }
                ].map((strategy) => (
                  <div key={strategy.name} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                    <div className={`w-16 h-16 bg-gradient-to-r ${strategy.color} rounded-lg flex items-center justify-center mb-4`}>
                      <span className="text-white text-2xl">⚡</span>
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{strategy.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{strategy.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Priority:</span>
                        <span className="font-medium">{strategy.priority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">TTL:</span>
                        <span className="font-medium">{strategy.ttl}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Max Size:</span>
                        <span className="font-medium">{strategy.maxSize}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => clearStrategyCache(strategy.name)}
                      className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Clear Strategy Cache
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Performance Analytics</h3>
              
              {/* Performance Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hit Rate Chart */}
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                  <h4 className="text-lg font-semibold mb-4">Cache Hit Rate</h4>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200 dark:bg-green-800 dark:text-green-200">
                          Performance
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-green-600 dark:text-green-400">
                          {formatPercentage(metrics.hitRate)}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200 dark:bg-green-800">
                      <div
                        style={{ width: `${metrics.hitRate * 100}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Response Time Chart */}
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                  <h4 className="text-lg font-semibold mb-4">Average Response Time</h4>
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${getPerformanceColor(1 / (metrics.averageResponseTime + 1), 0.1)}`}>
                      {formatTime(metrics.averageResponseTime)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Target: &lt; 100ms
                    </p>
                  </div>
                </div>
              </div>

              {/* Cache Usage Examples */}
              <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                <h4 className="text-lg font-semibold mb-4">Cache Usage Examples</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                    <div>
                      <p className="font-medium">User Preferences</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {cacheData.userPrefs ? 'Cached' : 'Not cached'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Strategy</p>
                      <p className="font-medium">simple_cache</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                    <div>
                      <p className="font-medium">Conversations</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {cacheData.conversations ? 'Cached' : 'Not cached'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Strategy</p>
                      <p className="font-medium">simple_cache</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                    <div>
                      <p className="font-medium">Suggestions</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {cacheData.suggestions ? 'Cached' : 'Not cached'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Strategy</p>
                      <p className="font-medium">simple_cache</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'management' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Cache Management</h3>
              
              {/* Management Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                  <h4 className="text-lg font-semibold mb-4">Cache Operations</h4>
                  <div className="space-y-3">
                    <button
                      onClick={clearAllCache}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear All Cache
                    </button>
                    
                    <button
                      onClick={triggerPrediction}
                      className="w-full btn-primary flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Trigger Predictive Caching
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
                  <h4 className="text-lg font-semibold mb-4">Cache Statistics</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Cache Entries:</span>
                      <span className="font-medium">{cacheInfo.memorySize + cacheInfo.storageSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Memory Cache:</span>
                      <span className="font-medium">{cacheInfo.memorySize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Storage Cache:</span>
                      <span className="font-medium">{cacheInfo.storageSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Active Strategies:</span>
                      <span className="font-medium">{cacheInfo.strategies.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Tips */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">💡 Performance Tips</h4>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li>• Use appropriate cache strategies for different content types</li>
                  <li>• Enable predictive caching for frequently accessed content</li>
                  <li>• Monitor hit rates and adjust TTL values accordingly</li>
                  <li>• Clear expired cache entries regularly</li>
                  <li>• Use memory cache for high-priority, frequently accessed data</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
