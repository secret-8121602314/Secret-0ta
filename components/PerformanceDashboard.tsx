import React, { useState, useEffect } from 'react';
import { performanceMonitoringService } from '../services/performanceMonitoringService';

interface PerformanceMetrics {
  CLS: number;
  FID: number;
  FCP: number;
  LCP: number;
  TTFB: number;
  timestamp: number;
}

interface PerformanceSummary {
  latestMetrics: Partial<PerformanceMetrics>;
  errorCount: number;
  averageMetrics: Partial<PerformanceMetrics>;
}

export const PerformanceDashboard: React.FC = () => {
  // 🚨 DEVELOPER MODE ONLY: Only show in development environment
  if (process.env.NODE_ENV !== 'development' && !import.meta.env.DEV) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <p className="text-lg font-semibold">🔒 Performance Dashboard</p>
          <p className="text-sm">This feature is only available in developer mode.</p>
        </div>
      </div>
    );
  }

  const [performanceSummary, setPerformanceSummary] = useState<PerformanceSummary | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        updatePerformanceData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    updatePerformanceData();
  }, []);

  const updatePerformanceData = () => {
    try {
      const summary = performanceMonitoringService.getPerformanceSummary();
      setPerformanceSummary(summary);
    } catch (error) {
      console.error('Failed to update performance data:', error);
    }
  };

  const getMetricStatus = (value: number | undefined, type: string): 'good' | 'needs-improvement' | 'poor' => {
    if (value === undefined) return 'good';
    
    const thresholds: Record<string, { good: number; needsImprovement: number }> = {
      CLS: { good: 0.1, needsImprovement: 0.25 },
      FID: { good: 100, needsImprovement: 300 },
      FCP: { good: 1800, needsImprovement: 3000 },
      LCP: { good: 2500, needsImprovement: 4000 },
      TTFB: { good: 800, needsImprovement: 1800 }
    };

    const threshold = thresholds[type];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: 'good' | 'needs-improvement' | 'poor') => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: 'good' | 'needs-improvement' | 'poor') => {
    switch (status) {
      case 'good': return '✅';
      case 'needs-improvement': return '⚠️';
      case 'poor': return '❌';
      default: return '❓';
    }
  };

  const formatMetricValue = (value: number | undefined, type: string): string => {
    if (value === undefined) return 'N/A';
    
    switch (type) {
      case 'CLS': return value.toFixed(3);
      case 'FID': return `${Math.round(value)}ms`;
      case 'FCP': return `${Math.round(value)}ms`;
      case 'LCP': return `${Math.round(value)}ms`;
      case 'TTFB': return `${Math.round(value)}ms`;
      default: return value.toString();
    }
  };

  const exportPerformanceData = () => {
    try {
      const data = performanceMonitoringService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export performance data:', error);
    }
  };

  const clearPerformanceData = () => {
    if (confirm('Are you sure you want to clear all performance data? This action cannot be undone.')) {
      try {
        performanceMonitoringService.clearData();
        updatePerformanceData();
      } catch (error) {
        console.error('Failed to clear performance data:', error);
      }
    }
  };

  if (!performanceSummary) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          ⚡ Performance Dashboard
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
          <button
            onClick={updatePerformanceData}
            className="text-sm text-green-600 hover:text-green-800"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Auto-refresh controls */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>
          
          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={2000}>2 seconds</option>
              <option value={5000}>5 seconds</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
            </select>
          )}
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {(['CLS', 'FID', 'FCP', 'LCP', 'TTFB'] as const).map((metric) => {
          const value = performanceSummary.latestMetrics[metric];
          const status = getMetricStatus(value, metric);
          
          return (
            <div key={metric} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">{metric}</div>
              <div className="text-lg font-semibold mb-1">
                {formatMetricValue(value, metric)}
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                <span className="mr-1">{getStatusIcon(status)}</span>
                {status.replace('-', ' ')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Summary */}
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-semibold">🚨 Errors</span>
            <span className="text-red-600">{performanceSummary.errorCount}</span>
          </div>
          {performanceSummary.errorCount > 0 && (
            <button
              onClick={() => console.log('Performance errors:', performanceMonitoringService.exportData().errors)}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              View Details
            </button>
          )}
        </div>
      </div>

      {/* Detailed Metrics */}
      {isExpanded && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Detailed Metrics:</h4>
          
          {/* Average Metrics */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Average Metrics (Last 100 measurements):</h5>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              {(['CLS', 'FID', 'FCP', 'LCP', 'TTFB'] as const).map((metric) => {
                const value = performanceSummary.averageMetrics[metric];
                return (
                  <div key={metric} className="p-2 bg-gray-50 rounded">
                    <div className="text-gray-600">{metric}</div>
                    <div className="font-medium">{formatMetricValue(value, metric)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Actions */}
          <div className="flex gap-3">
            <button
              onClick={exportPerformanceData}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              📊 Export Data
            </button>
            <button
              onClick={clearPerformanceData}
              className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            >
              🗑️ Clear Data
            </button>
          </div>
        </div>
      )}

      {/* Performance Tips */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Performance Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• CLS: Keep below 0.1 for good user experience</li>
          <li>• FID: Aim for under 100ms for responsive interactions</li>
          <li>• FCP: Target under 1.8s for fast content display</li>
          <li>• LCP: Keep below 2.5s for optimal loading</li>
          <li>• TTFB: Aim for under 800ms for quick server response</li>
        </ul>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
