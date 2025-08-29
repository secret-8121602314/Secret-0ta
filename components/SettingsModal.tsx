import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Usage, UserTier } from '../services/types';
import UserCircleIcon from './UserCircleIcon';
import CreditCardIcon from './CreditCardIcon';
import QuestionMarkCircleIcon from './QuestionMarkCircleIcon';
import StarIcon from './StarIcon';
import GeneralSettingsTab from './GeneralSettingsTab';
import SubscriptionSettingsTab from './SubscriptionSettingsTab';
import HelpGuideTab from './HelpGuideTab';
import UserPreferencesTab from './UserPreferencesTab';
import SupabaseMigrationStatus from './SupabaseMigrationStatus';
import { PerformanceDashboard } from './PerformanceDashboard';

import { apiCostService } from '../services/apiCostService';
import { APICostSummary } from '../services/apiCostService';



interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  usage: Usage;
  onShowUpgrade: () => void;
  onShowVanguardUpgrade: () => void;
  onLogout: () => void;
  onResetApp: () => void;
  onShowHowToUse: () => void;
  userEmail?: string;
}

type ActiveTab = 'general' | 'preferences' | 'subscription' | 'help' | 'admin' | 'migration' | 'performance';

// Admin Tab Content Component
const AdminTabContent: React.FC = () => {
    const [costSummary, setCostSummary] = useState<APICostSummary | null>(null);
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadCostData();
    }, []);

    const loadCostData = async () => {
        setIsLoading(true);
        try {
            const [summary, recs] = await Promise.all([
                apiCostService.getCostSummary(),
                apiCostService.getCostOptimizationRecommendations()
            ]);
            setCostSummary(summary);
            setRecommendations(recs);
        } catch (error) {
            console.error('Error loading cost data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportData = async () => {
        try {
            const csvData = await apiCostService.exportCostData();
            
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
                await apiCostService.resetCostTracking();
                await loadCostData(); // Reload data
                alert('Cost tracking reset successfully');
            } catch (error) {
                console.error('Error during reset:', error);
                alert('Reset failed');
            }
        }
    };

    return (
        <div className="space-y-6">
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

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={handleExportData}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            📊 Export Data
                        </button>
                        <button
                            onClick={loadCostData}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            🔄 Refresh
                        </button>
                        <button
                            onClick={handleCleanup}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            🧹 Cleanup Old (90d+)
                        </button>
                        <button
                            onClick={handleReset}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            ⚠️ Reset All Data
                        </button>
                    </div>

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <h3 className="text-lg font-semibold text-white mb-4">💡 Optimization Recommendations</h3>
                            <ul className="space-y-2">
                                {recommendations.map((rec, index) => (
                                    <li key={index} className="text-gray-300 flex items-start">
                                        <span className="text-yellow-400 mr-2">•</span>
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-400">No cost data available</p>
                    <button
                        onClick={loadCostData}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Load Data
                    </button>
                </div>
            )}
        </div>
    );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, usage, onShowUpgrade, onShowVanguardUpgrade, onLogout, onResetApp, onShowHowToUse, userEmail }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset active tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('general');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  // Initial focus and focus trap
  useEffect(() => {
    if (!isOpen) return;
    const container = modalRef.current;
    if (!container) return;
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    ));
    if (focusable.length > 0) {
      // Focus the first interactive element
      focusable[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const elements = Array.from(container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      ));
      if (elements.length === 0) return;
      const firstEl = elements[0];
      const lastEl = elements[elements.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!e.shiftKey) {
        // Tab forward
        if (active === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      } else {
        // Shift+Tab backward
        if (active === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Memoized tab change handler to prevent unnecessary re-renders
  const handleTabChange = (tabId: ActiveTab) => {
    setActiveTab(tabId);
  };

  // Memoized TabButton component to prevent recreation on every render
  const TabButton = React.useCallback(({ id, label, icon }: { id: ActiveTab; label: string; icon: React.ReactNode }) => {
    const isActive = activeTab === id;
    
    return (
      <button
        onClick={() => handleTabChange(id)}
        className={`w-full flex items-center justify-center md:justify-start gap-4 px-4 py-3 text-base font-medium rounded-xl transition-all duration-300 ${
          isActive
            ? 'bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 text-white border-2 border-[#E53A3A]/40 shadow-lg shadow-[#E53A3A]/10'
            : 'text-neutral-400 hover:bg-gradient-to-r hover:from-neutral-700/50 hover:to-neutral-600/50 hover:text-white hover:scale-105'
        }`}
      >
        {icon}
        <span className="hidden md:inline">{label}</span>
      </button>
    );
  }, [activeTab, handleTabChange]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/80 to-[#0A0A0A]/80 backdrop-blur-xl flex items-center justify-center z-50 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div
        className="bg-gradient-to-r from-[#1C1C1C]/95 to-[#0A0A0A]/95 backdrop-blur-xl border-2 border-[#424242]/60 rounded-3xl shadow-2xl w-full max-w-5xl m-6 relative animate-scale-in flex flex-col max-h-[90vh] h-auto md:h-[75vh] hover:border-[#424242]/80 transition-all duration-500"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-white transition-all duration-300 z-10 md:hidden hover:scale-110"
          aria-label="Close settings"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            <nav className="flex-shrink-0 w-full md:w-64 p-6 border-b-2 md:border-b-0 md:border-r-2 border-neutral-800/60 flex flex-row md:flex-col justify-between">
                <div>
                    <h2 id="settings-title" className="text-xl font-bold text-white mb-6 px-2 hidden md:block leading-tight">Settings</h2>
                    <ul className="flex flex-row md:flex-col gap-2 w-full">
                        <li className="flex-1 md:flex-none"><TabButton id="general" label="General" icon={<UserCircleIcon className="w-6 h-6" />} /></li>
                        <li className="flex-1 md:flex-none"><TabButton id="preferences" label="AI Preferences" icon={<StarIcon className="w-6 h-6" />} /></li>
                        <li className="flex-1 md:flex-none"><TabButton id="subscription" label="Subscription" icon={<CreditCardIcon className="w-6 h-6" />} /></li>
                        <li className="flex-1 md:flex-none"><TabButton id="help" label="Help Guide" icon={<QuestionMarkCircleIcon className="w-6 h-6" />} /></li>
                        {/* Admin tab - only show for admin users */}
                        <li className="flex-1 md:flex-none">
                            <TabButton id="admin" label="Admin" icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            } />
                        </li>
                        <li className="flex-1 md:flex-none">
                            <TabButton id="migration" label="Migration" icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            } />
                        </li>
                        <li className="flex-1 md:flex-none">
                            <TabButton id="performance" label="Performance" icon={
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            } />
                        </li>
                    </ul>
                </div>
            </nav>

            <main className="flex-1 overflow-y-auto p-8 sm:p-10">
                
                {activeTab === 'general' && (
                    <GeneralSettingsTab
                        usage={usage}
                        onShowUpgrade={() => { onShowUpgrade(); onClose(); }}
                        onShowVanguardUpgrade={() => { onShowVanguardUpgrade(); onClose(); }}
                        onResetApp={() => { onResetApp(); onClose(); }}
                        onLogout={() => { onLogout(); onClose(); }}
                        onShowHowToUse={() => { onShowHowToUse(); onClose(); }}
                        userEmail={userEmail}
                    />
                )}
                {activeTab === 'preferences' && <UserPreferencesTab />}
                {activeTab === 'subscription' && <SubscriptionSettingsTab usage={usage} />}
                {activeTab === 'help' && <HelpGuideTab />}
                {activeTab === 'admin' && (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">💰 API Cost Dashboard</h2>
                        <AdminTabContent />
                    </div>
                )}
                {activeTab === 'migration' && (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">🚀 Supabase Migration</h2>
                        <SupabaseMigrationStatus />
                    </div>
                )}
                {activeTab === 'performance' && (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4">⚡ Performance Dashboard</h2>
                        <PerformanceDashboard />
                    </div>
                )}
            </main>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SettingsModal);