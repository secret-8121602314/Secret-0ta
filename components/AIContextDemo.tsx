import React, { useState, useEffect } from 'react';
// Dynamic imports to avoid circular dependencies
// import { aiContextService } from '../services/aiContextService';
// import { unifiedUsageService } from '../services/unifiedUsageService';

const AIContextDemo: React.FC = () => {
  const [userContext, setUserContext] = useState<any>(null);
  const [globalLearning, setGlobalLearning] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [demoMessage, setDemoMessage] = useState('');

  useEffect(() => {
    loadContextData();
  }, []);

  const loadContextData = async () => {
    setIsLoading(true);
    try {
      const { aiContextService } = await import('../services/aiContextService');
      const [contexts, patterns] = await Promise.all([
        aiContextService.getUserContext(),
        aiContextService.getGlobalLearningPatterns()
      ]);
      
      setUserContext(contexts);
      setGlobalLearning(patterns);
    } catch (error) {
      console.error('Failed to load context data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateUserBehavior = async () => {
    try {
      const { aiContextService } = await import('../services/aiContextService');
      await aiContextService.trackUserBehavior(
        'demo_action',
        { action: 'demo_click', timestamp: Date.now() },
        { demo: true, component: 'AIContextDemo' }
      );
      
      await aiContextService.storeUserContext('preferences', {
        preferred_game_genres: ['RPG', 'Action'],
        preferred_response_length: 'detailed',
        last_updated: Date.now()
      });
      
      setDemoMessage('Demo behavior tracked! Check the context data below.');
      loadContextData(); // Refresh data
    } catch (error) {
      console.error('Failed to simulate behavior:', error);
      setDemoMessage('Failed to track behavior. Check console for details.');
    }
  };

  const generateAIContext = async () => {
    try {
      const { aiContextService } = await import('../services/aiContextService');
      const contextString = await aiContextService.generateUserContextForAI();
      setDemoMessage(`Generated AI Context:\n${contextString}`);
    } catch (error) {
      console.error('Failed to generate AI context:', error);
      setDemoMessage('Failed to generate context. Check console for details.');
    }
  };

  const clearCache = async () => {
    const { aiContextService } = await import('../services/aiContextService');
    aiContextService.clearCache();
    setDemoMessage('Cache cleared! Refresh to see changes.');
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-center mt-2 text-gray-300">Loading context data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-800 rounded-lg">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">🤖 AI Context Awareness Demo</h2>
        <p className="text-gray-300">
          This component demonstrates how Gemini AI now has context awareness of user data and global learning patterns.
        </p>
      </div>

      {/* Demo Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={simulateUserBehavior}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          🎯 Simulate User Behavior
        </button>
        
        <button
          onClick={generateAIContext}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          🧠 Generate AI Context
        </button>
        
        <button
          onClick={clearCache}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          🗑️ Clear Cache
        </button>
      </div>

      {/* Demo Message */}
      {demoMessage && (
        <div className="bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Demo Result:</h3>
          <pre className="text-sm text-gray-200 whitespace-pre-wrap">{demoMessage}</pre>
        </div>
      )}

      {/* User Context Display */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">👤 User Context Data</h3>
        {userContext && userContext.length > 0 ? (
          <div className="space-y-3">
            {userContext.map((context: any, index: number) => (
              <div key={index} className="bg-gray-600 p-3 rounded">
                <h4 className="font-medium text-blue-300 capitalize">{context.context_type}</h4>
                <pre className="text-xs text-gray-200 mt-1 overflow-x-auto">
                  {JSON.stringify(context.context_data, null, 2)}
                </pre>
                <p className="text-xs text-gray-400 mt-1">
                  Updated: {new Date(context.updated_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No user context data available yet.</p>
        )}
      </div>

      {/* Global Learning Patterns */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">🌍 Global AI Learning Patterns</h3>
        {globalLearning && globalLearning.length > 0 ? (
          <div className="space-y-3">
            {globalLearning.map((pattern: any, index: number) => (
              <div key={index} className="bg-gray-600 p-3 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-green-300 capitalize">{pattern.learning_type}</h4>
                  <div className="text-right">
                    <div className="text-sm text-yellow-300">
                      Confidence: {(pattern.confidence_score * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-400">
                      Used: {pattern.usage_count} times
                    </div>
                  </div>
                </div>
                <pre className="text-xs text-gray-200 overflow-x-auto">
                  {JSON.stringify(pattern.pattern_data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No global learning patterns available yet.</p>
        )}
      </div>

      {/* Current User Info */}
      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">📊 Current User Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Tier:</span>
            <span className="ml-2 text-white font-medium">Loading...</span>
          </div>
          <div>
            <span className="text-gray-400">Text Queries:</span>
            <span className="ml-2 text-white font-medium">Loading...</span>
          </div>
          <div>
            <span className="text-gray-400">Image Queries:</span>
            <span className="ml-2 text-white font-medium">Loading...</span>
          </div>
          <div>
            <span className="text-gray-400">Session ID:</span>
            <span className="ml-2 text-white font-medium text-xs">
              {sessionStorage.getItem('otakon_session_id')?.slice(0, 8)}...
            </span>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-300 mb-3">🔍 How Context Awareness Works</h3>
        <div className="text-sm text-blue-200 space-y-2">
          <p>1. <strong>User Behavior Tracking:</strong> Every AI interaction is tracked and analyzed</p>
          <p>2. <strong>Feedback Learning:</strong> User feedback improves AI responses globally</p>
          <p>3. <strong>Personalization:</strong> AI adapts to individual user preferences and patterns</p>
          <p>4. <strong>Global Improvement:</strong> Successful patterns are shared across all users</p>
          <p>5. <strong>Real-time Context:</strong> Gemini receives user context before generating responses</p>
        </div>
      </div>
    </div>
  );
};

export default AIContextDemo;
