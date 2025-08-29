import React, { useState, useEffect } from 'react';
import { useAdvancedCache, useUserPreferencesCache, useConversationsCache, useSuggestionsCache } from '../hooks/useAdvancedCache';

export default function CacheExampleComponent() {
  const [activeTab, setActiveTab] = useState<'basic' | 'specialized' | 'advanced'>('basic');
  const [newData, setNewData] = useState('');

  // ===== BASIC CACHING EXAMPLE =====
  const basicCache = useAdvancedCache({
    key: 'basic-example',
    strategy: 'conversations',
    fallbackValue: { message: 'No cached data available' },
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    enablePrediction: true
  });

  // ===== SPECIALIZED HOOKS EXAMPLES =====
  const userPrefs = useUserPreferencesCache('theme-settings', { theme: 'dark', language: 'en' });
  const conversations = useConversationsCache('recent-chats', []);
  const suggestions = useSuggestionsCache('ai-prompts', []);

  // ===== ADVANCED CACHING EXAMPLE =====
  const advancedCache = useAdvancedCache({
    key: 'advanced-example',
    strategy: 'suggestions',
    fallbackValue: [],
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
    enablePrediction: true,
    dependencies: [userPrefs.data?.theme] // Refresh when theme changes
  });

  // ===== DEMO DATA GENERATION =====
  const generateDemoData = () => {
    const demoData = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      content: `Demo data generated at ${new Date().toLocaleTimeString()}`,
      metadata: {
        source: 'demo',
        version: '1.0.0'
      }
    };
    return demoData;
  };

  const updateBasicCache = async () => {
    const data = generateDemoData();
    await basicCache.update(data);
  };

  const updateUserPrefs = async () => {
    const newPrefs = {
      theme: userPrefs.data?.theme === 'dark' ? 'light' : 'dark',
      language: userPrefs.data?.language || 'en'
    };
    await userPrefs.update(newPrefs);
  };

  const updateConversations = async () => {
    const newConversation = {
      id: `conv-${Date.now()}`,
      title: `Demo Conversation ${Date.now()}`,
      messages: [`Hello! This is demo conversation ${Date.now()}`],
      timestamp: new Date().toISOString()
    };
    await conversations.update([...conversations.data, newConversation]);
  };

  const updateSuggestions = async () => {
    const newSuggestion = {
      id: `sug-${Date.now()}`,
      text: `Demo suggestion ${Date.now()}`,
      category: 'demo',
      timestamp: new Date().toISOString()
    };
    await suggestions.update([...suggestions.data, newSuggestion]);
  };

  const updateAdvancedCache = async () => {
    const data = generateDemoData();
    await advancedCache.update(data);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🚀 Advanced Caching Strategies Demo
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Explore different caching strategies and see real-time performance metrics
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { id: 'basic', label: 'Basic Caching', icon: '⚡' },
          { id: 'specialized', label: 'Specialized Hooks', icon: '🎯' },
          { id: 'advanced', label: 'Advanced Features', icon: '🔮' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Caching Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Caching Example</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Cache Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Loading:</span>
                    <span className={basicCache.isLoading ? 'text-blue-600' : 'text-gray-600'}>
                      {basicCache.isLoading ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span className="text-gray-600">
                      {basicCache.lastUpdated ? basicCache.lastUpdated.toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expires At:</span>
                    <span className="text-gray-600">
                      {basicCache.expiresAt ? basicCache.expiresAt.toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error:</span>
                    <span className={basicCache.error ? 'text-red-600' : 'text-gray-600'}>
                      {basicCache.error || 'None'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Performance Metrics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Hit Rate:</span>
                    <span className="text-green-600">
                      {(basicCache.performanceMetrics.hitRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Miss Rate:</span>
                    <span className="text-red-600">
                      {(basicCache.performanceMetrics.missRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Response:</span>
                    <span className="text-blue-600">
                      {basicCache.performanceMetrics.averageResponseTime.toFixed(0)}ms
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <button
                onClick={updateBasicCache}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Update Cache Data
              </button>
              <button
                onClick={basicCache.refresh}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Refresh Cache
              </button>
              <button
                onClick={basicCache.invalidate}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Invalidate Cache
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="font-medium mb-3">Cached Data</h3>
            <pre className="bg-white dark:bg-gray-800 p-4 rounded border text-sm overflow-x-auto">
              {JSON.stringify(basicCache.data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Specialized Hooks Tab */}
      {activeTab === 'specialized' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Preferences */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-4">User Preferences</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span>Theme:</span>
                    <span className="font-medium">{userPrefs.data?.theme}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Language:</span>
                    <span className="font-medium">{userPrefs.data?.language}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Last Updated:</span>
                    <span className="text-gray-600">
                      {userPrefs.lastUpdated ? userPrefs.lastUpdated.toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={updateUserPrefs}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Toggle Theme
                </button>
              </div>
            </div>

            {/* Conversations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-4">Conversations</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span>Count:</span>
                    <span className="font-medium">{conversations.data?.length || 0}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Last Updated:</span>
                    <span className="text-gray-600">
                      {conversations.lastUpdated ? conversations.lastUpdated.toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={updateConversations}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Add Conversation
                </button>
              </div>
            </div>

            {/* Suggestions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold mb-4">AI Suggestions</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span>Count:</span>
                    <span className="font-medium">{suggestions.data?.length || 0}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Last Updated:</span>
                    <span className="text-gray-600">
                      {suggestions.lastUpdated ? suggestions.lastUpdated.toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={updateSuggestions}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Add Suggestion
                </button>
              </div>
            </div>
          </div>

          {/* Data Display */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="font-medium mb-3">All Cached Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">User Preferences</h4>
                <pre className="bg-white dark:bg-gray-800 p-3 rounded border text-xs overflow-x-auto">
                  {JSON.stringify(userPrefs.data, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">Conversations</h4>
                <pre className="bg-white dark:bg-gray-800 p-3 rounded border text-xs overflow-x-auto">
                  {JSON.stringify(conversations.data, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">Suggestions</h4>
                <pre className="bg-white dark:bg-gray-800 p-3 rounded border text-xs overflow-x-auto">
                  {JSON.stringify(suggestions.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Features Tab */}
      {activeTab === 'advanced' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4">Advanced Caching Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Dependency-Based Caching</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  This cache automatically refreshes when the user's theme preference changes.
                </p>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Current Theme:</span>
                    <span className="font-medium">{userPrefs.data?.theme}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache Key:</span>
                    <span className="font-medium">advanced-example</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Strategy:</span>
                    <span className="font-medium">suggestions</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Cache Operations</h3>
                <div className="space-y-3">
                  <button
                    onClick={updateAdvancedCache}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Update Advanced Cache
                  </button>
                  <button
                    onClick={advancedCache.refresh}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Refresh Cache
                  </button>
                  <button
                    onClick={advancedCache.invalidate}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Invalidate Cache
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="font-medium mb-3">Advanced Cache Data</h3>
            <pre className="bg-white dark:bg-gray-800 p-4 rounded border text-sm overflow-x-auto">
              {JSON.stringify(advancedCache.data, null, 2)}
            </pre>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">💡 Advanced Features Explained</h3>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <li>• <strong>Dependency Tracking</strong>: Cache automatically refreshes when dependencies change</li>
              <li>• <strong>Predictive Caching</strong>: System learns from access patterns and pre-caches content</li>
              <li>• <strong>Multi-Tier Storage</strong>: Data stored in memory, IndexedDB, and global cache</li>
              <li>• <strong>Smart Invalidation</strong>: Context-aware cache management based on rules</li>
              <li>• <strong>Performance Monitoring</strong>: Real-time metrics and optimization insights</li>
            </ul>
          </div>
        </div>
      )}

      {/* Cache Info Footer */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Cache System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Memory Cache:</span>
            <span className="ml-2 font-medium">{basicCache.cacheInfo.memorySize} entries</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Storage Cache:</span>
            <span className="ml-2 font-medium">{basicCache.cacheInfo.storageSize} entries</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Strategies:</span>
            <span className="ml-2 font-medium">{basicCache.cacheInfo.strategies.length}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total Entries:</span>
            <span className="ml-2 font-medium">
              {basicCache.cacheInfo.memorySize + basicCache.cacheInfo.storageSize}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
