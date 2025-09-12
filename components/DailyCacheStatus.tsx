import React, { useState, useEffect } from 'react';
// Dynamic import to avoid circular dependency
// import { dailyNewsCacheService } from '../services/dailyNewsCacheService';

const DailyCacheStatus: React.FC = () => {
  const [cacheStatus, setCacheStatus] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    updateCacheStatus();
  }, []);

  const updateCacheStatus = async () => {
    try {
      const { dailyNewsCacheService } = await import('../services/dailyNewsCacheService');
      const status = await dailyNewsCacheService.getDetailedCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.warn('Failed to get detailed cache status:', error);
      // Fallback to basic status
      const { dailyNewsCacheService } = await import('../services/dailyNewsCacheService');
      const basicStatus = dailyNewsCacheService.getCacheStatus();
      setCacheStatus(basicStatus);
    }
  };

  const clearCache = async () => {
    const { dailyNewsCacheService } = await import('../services/dailyNewsCacheService');
    await dailyNewsCacheService.clearCache();
    updateCacheStatus();
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm shadow-lg z-50"
        title="Show Daily Cache Status"
      >
        📰 Cache Status
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-2xl z-50 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold text-sm">📰 Daily News Cache Status</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-lg"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        {Object.entries(cacheStatus).map(([key, status]: [string, any]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 capitalize">
                {key.replace(/_/g, ' ')}:
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                status.hasCache 
                  ? 'bg-green-600 text-white' 
                  : 'bg-red-600 text-white'
              }`}>
                {status.hasCache ? status.age : 'No Cache'}
              </span>
            </div>
            
            {status.hasCache && (
              <div className="text-gray-400 text-xs ml-2">
                <div>Source: {status.source}</div>
                <div>Triggered by: {status.triggeredBy}</div>
                {status.freeUserWindowActive !== undefined && (
                  <div className={status.freeUserWindowActive ? 'text-green-400' : 'text-red-400'}>
                    {status.freeWindowStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-700 flex gap-2">
        <button
          onClick={updateCacheStatus}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
        >
          🔄 Refresh
        </button>
        <button
          onClick={clearCache}
          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
        >
          🗑️ Clear
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-400">
        💡 Cache expires every 24 hours
      </div>
    </div>
  );
};

export default DailyCacheStatus;
