import React, { useState, useEffect } from 'react';
// Dynamic imports to avoid circular dependencies
// import { apiCostService } from '../services/apiCostService';
// import { APICostSummary } from '../services/apiCostService';

interface AdminCostDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

interface APICostSummary {
    totalCost: number;
    monthlyCost: number;
    dailyCost: number;
    costByService: Record<string, number>;
    usageMetrics: Record<string, number>;
    totalCalls: number;
    callsByModel: Record<string, number>;
    callsByPurpose: Record<string, number>;
    callsByTier: Record<string, number>;
    estimatedMonthlyCost: number;
    // Add any missing properties that the service might return
    [key: string]: any;
}

export const AdminCostDashboard: React.FC<AdminCostDashboardProps> = ({ isOpen, onClose }) => {
    const [costSummary, setCostSummary] = useState<APICostSummary | null>(null);
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [exportData, setExportData] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            loadCostData();
        }
    }, [isOpen]);

    const loadCostData = async () => {
        setIsLoading(true);
        try {
            const { apiCostService } = await import('../services/apiCostService');
            const [summary, recs] = await Promise.all([
                apiCostService.getCostSummary(),
                apiCostService.getCostOptimizationRecommendations()
            ]);
            setCostSummary(summary as unknown as APICostSummary);
            setRecommendations(recs);
        } catch (error) {
            console.error('Error loading cost data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportData = async () => {
        try {
            const { apiCostService } = await import('../services/apiCostService');
            const csvData = await apiCostService.exportCostData();
            setExportData(csvData);
            
            // Create download link
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `api-cost-data-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    };

    const handleCleanup = async () => {
        if (window.confirm('This will delete API cost records older than 90 days. Continue?')) {
            try {
                const { apiCostService } = await import('../services/apiCostService');
                await apiCostService.cleanupOldRecords(90);
                await loadCostData(); // Reload data
                alert('Cleanup completed successfully');
            } catch (error) {
                console.error('Error during cleanup:', error);
                alert('Cleanup failed');
            }
        }
    };

    const handleReset = async () => {
        if (window.confirm('This will delete ALL API cost records. This action cannot be undone. Continue?')) {
            try {
                const { apiCostService } = await import('../services/apiCostService');
                await apiCostService.resetCostTracking();
                await loadCostData(); // Reload data
                alert('Cost tracking reset successfully');
            } catch (error) {
                console.error('Error during reset:', error);
                alert('Reset failed');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">💰 API Cost Dashboard</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="text-gray-400 mt-4">Loading cost data...</p>
                        </div>
                    ) : costSummary ? (
                        <>
                            {/* Cost Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <h3 className="text-gray-400 text-sm font-medium">Total Calls (30d)</h3>
                                    <p className="text-2xl font-bold text-white">{costSummary.totalCalls}</p>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <h3 className="text-gray-400 text-sm font-medium">Total Cost (30d)</h3>
                                    <p className="text-2xl font-bold text-green-400">${costSummary.totalCost.toFixed(6)}</p>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <h3 className="text-gray-400 text-sm font-medium">Flash Model</h3>
                                    <p className="text-2xl font-bold text-blue-400">{costSummary.callsByModel.flash}</p>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <h3 className="text-gray-400 text-sm font-medium">Pro Model</h3>
                                    <p className="text-2xl font-bold text-purple-400">{costSummary.callsByModel.pro}</p>
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Model Usage */}
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <h3 className="text-lg font-semibold text-white mb-4">Model Usage</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300">Flash (2.5 Flash)</span>
                                            <span className="text-blue-400 font-medium">{costSummary.callsByModel.flash} calls</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300">Pro (2.5 Pro)</span>
                                            <span className="text-purple-400 font-medium">{costSummary.callsByModel.pro} calls</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Purpose Breakdown */}
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <h3 className="text-lg font-semibold text-white mb-4">Purpose Breakdown</h3>
                                    <div className="space-y-2">
                                        {Object.entries(costSummary.callsByPurpose).map(([purpose, count]) => (
                                            <div key={purpose} className="flex justify-between items-center">
                                                <span className="text-gray-300 capitalize">{purpose.replace(/_/g, ' ')}</span>
                                                <span className="text-white font-medium">{String(count)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* User Tier Breakdown */}
                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                <h3 className="text-lg font-semibold text-white mb-4">User Tier Breakdown</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-green-400">{costSummary.callsByTier.paid}</p>
                                        <p className="text-gray-400 text-sm">Paid Users</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-yellow-400">{costSummary.callsByTier.free}</p>
                                        <p className="text-gray-400 text-sm">Free Users</p>
                                    </div>
                                </div>
                            </div>

                            {/* Monthly Projection */}
                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                <h3 className="text-lg font-semibold text-white mb-2">Monthly Cost Projection</h3>
                                <p className="text-3xl font-bold text-orange-400">${costSummary.estimatedMonthlyCost.toFixed(6)}</p>
                                <p className="text-gray-400 text-sm">Based on last 30 days usage</p>
                            </div>

                            {/* Recommendations */}
                            {recommendations.length > 0 && (
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <h3 className="text-lg font-semibold text-white mb-4">💡 Cost Optimization Recommendations</h3>
                                    <ul className="space-y-2">
                                        {recommendations.map((rec, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <span className="text-blue-400 mt-1">•</span>
                                                <span className="text-gray-300">{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-700">
                                <button
                                    onClick={handleExportData}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    📊 Export CSV Data
                                </button>
                                <button
                                    onClick={handleCleanup}
                                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                                >
                                    🧹 Cleanup Old Records
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                >
                                    🔄 Reset All Data
                                </button>
                                <button
                                    onClick={loadCostData}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                >
                                    🔄 Refresh Data
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-400">No cost data available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
