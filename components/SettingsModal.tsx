import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Usage, UserTier } from '../services/types';
import { ResponsiveModal, ResponsiveContainer, ResponsiveFlex, ResponsiveText } from './layout/ResponsiveComponents';
import { useResponsive } from '../utils/responsive';
import UserCircleIcon from './UserCircleIcon';
import CreditCardIcon from './CreditCardIcon';
import QuestionMarkCircleIcon from './QuestionMarkCircleIcon';
import SettingsIcon from './SettingsIcon';
import GeneralSettingsTab from './GeneralSettingsTab';
import SubscriptionSettingsTab from './SubscriptionSettingsTab';
import HelpGuideTab from './HelpGuideTab';
import UserPreferencesTab from './UserPreferencesTab';
import { canAccessDeveloperFeatures } from '../config/developer';
import { fixedErrorHandlingService } from '../services/fixedErrorHandlingService';

// Lazy load PerformanceDashboard to avoid duplication
const LazyPerformanceDashboard = lazy(() => 
  import('./PerformanceDashboard').then(module => ({ default: module.PerformanceDashboard }))
);

// Dynamic import to avoid circular dependency
// import { apiCostService } from '../services/apiCostService';
// import { APICostSummary } from '../services/apiCostService';



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
  onClearFirstRunCache?: () => void;
  refreshUsage?: () => void;
}

type ActiveTab = 'general' | 'preferences' | 'subscription' | 'help' | 'admin' | 'performance';

// Admin Tab Content Component
const AdminTabContent: React.FC<{ onClearFirstRunCache?: () => void }> = ({ onClearFirstRunCache }) => {
    const [costSummary, setCostSummary] = useState<any | null>(null);
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadCostData();
    }, []);

    const loadCostData = async () => {
        setIsLoading(true);
        try {
            const { apiCostService } = await import('../services/apiCostService');
        const [summary, recs] = await Promise.all([
                apiCostService.getCostSummary(),
                apiCostService.getCostOptimizationRecommendations()
            ]);
            setCostSummary(summary);
            setRecommendations(recs);
        } catch (error) {
            await fixedErrorHandlingService.handleError(error, {
                operation: 'load_cost_data',
                component: 'SettingsModal'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportData = async () => {
        try {
            const { apiCostService } = await import('../services/apiCostService');
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
                        {onClearFirstRunCache && (
                            <button
                                onClick={() => {
                                    if (window.confirm('This will clear all first run experience cache and force a fresh onboarding flow. Continue?')) {
                                        onClearFirstRunCache();
                                    }
                                }}
                                className="btn-primary"
                                title="Clear first run experience cache"
                            >
                                🧹 Clear First Run Cache
                            </button>
                        )}
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

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, usage, onShowUpgrade, onShowVanguardUpgrade, onLogout, onResetApp, onShowHowToUse, userEmail, onClearFirstRunCache, refreshUsage }) => {
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
  const handleTabChange = useCallback((tabId: ActiveTab) => {
    setActiveTab(tabId);
  }, []);

  // Memoized TabButton component to prevent recreation on every render
  const TabButton = useCallback(({ id, label, icon }: { id: ActiveTab; label: string; icon: React.ReactNode }) => {
    const isActive = activeTab === id;
    
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleTabChange(id);
    };
    
    return (
      <button
        onClick={handleClick}
        className={`w-full flex items-center justify-center md:justify-start gap-1 sm:gap-2 md:gap-4 px-2 py-2 sm:px-3 sm:py-3 md:px-5 md:py-5 text-xs sm:text-sm md:text-base font-medium rounded-lg sm:rounded-xl transition-all duration-300 ${
          isActive
            ? 'bg-gradient-to-r from-[#E53A3A]/20 to-[#D98C1F]/20 text-white border-2 border-[#E53A3A]/40 shadow-lg shadow-[#E53A3A]/10'
            : 'text-neutral-400 hover:bg-gradient-to-r hover:from-neutral-700/50 hover:to-neutral-600/50 hover:text-white hover:scale-105'
        }`}
      >
        <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 flex-shrink-0">
          {icon}
        </div>
        <span className="hidden sm:inline md:inline">{label}</span>
      </button>
    );
  }, [activeTab, handleTabChange]);

  return (
    <ResponsiveModal isOpen={isOpen} onClose={onClose}>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 md:top-6 md:right-6 text-neutral-400 hover:text-white transition-all duration-300 z-20 hover:scale-110 p-2"
        aria-label="Close settings"
      >
        <svg className="w-8 h-8 md:w-9 md:h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>

      <ResponsiveFlex direction={{ mobile: 'col', tablet: 'row' }} className="flex-1 overflow-hidden">
        <nav className="flex-shrink-0 w-full md:w-72 p-3 sm:p-4 md:p-6 lg:p-8 border-b-2 md:border-b-0 md:border-r-2 border-neutral-800/60 flex flex-row md:flex-col justify-between">
                <div className="w-full">
                    <h2 id="settings-title" className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-6 md:mb-8 px-2 hidden md:block leading-tight">Settings</h2>
                    <ul className="grid grid-cols-4 md:flex md:flex-col gap-1 sm:gap-2 md:gap-4 w-full pr-16 sm:pr-20 md:pr-0 mt-4 sm:mt-6 md:mt-8 md:mt-0">
                        <li className="md:flex-none"><TabButton id="general" label="General" icon={<UserCircleIcon className="w-6 h-6 md:w-7 md:h-7" />} /></li>
                        <li className="md:flex-none"><TabButton id="preferences" label="AI Preferences" icon={<SettingsIcon className="w-6 h-6 md:w-7 md:h-7" />} /></li>
                        <li className="md:flex-none"><TabButton id="subscription" label="Subscription" icon={<CreditCardIcon className="w-6 h-6 md:w-7 md:h-7" />} /></li>
                        <li className="md:flex-none"><TabButton id="help" label="Help Guide" icon={<QuestionMarkCircleIcon className="w-6 h-6 md:w-7 md:h-7" />} /></li>
                        {/* Admin tabs - only show for developer accounts or in developer mode */}
                        {canAccessDeveloperFeatures(userEmail) && (
                            <>
                                <li className="md:flex-none">
                                    <TabButton id="admin" label="Admin" icon={
                                        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    } />
                                </li>
                                <li className="md:flex-none">
                                    <TabButton id="performance" label="Performance" icon={
                                        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    } />
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </nav>

            <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12">

                {activeTab === 'general' && (
                    <GeneralSettingsTab
                        usage={usage}
                        onShowUpgrade={() => { onShowUpgrade(); onClose(); }}
                        onShowVanguardUpgrade={() => { onShowVanguardUpgrade(); onClose(); }}
                        onResetApp={() => { onResetApp(); onClose(); }}
                        onLogout={() => { onLogout(); onClose(); }}
                        onShowHowToUse={() => { onShowHowToUse(); onClose(); }}
                        userEmail={userEmail}
                        isDeveloperMode={canAccessDeveloperFeatures(userEmail)}
                        onTierChanged={refreshUsage}
                    />
                )}
                {activeTab === 'preferences' && <UserPreferencesTab />}
                {activeTab === 'subscription' && <SubscriptionSettingsTab usage={usage} refreshUsage={refreshUsage} userEmail={userEmail} />}
                {activeTab === 'help' && <HelpGuideTab />}
                {activeTab === 'admin' && canAccessDeveloperFeatures(userEmail) && (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-6">💰 API Cost Dashboard</h2>
                        <AdminTabContent onClearFirstRunCache={onClearFirstRunCache} />
                    </div>
                )}
                {activeTab === 'performance' && canAccessDeveloperFeatures(userEmail) && (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-6">⚡ Performance Dashboard</h2>
                        <Suspense fallback={
                            <div className="flex items-center justify-center p-8">
                                <div className="w-8 h-8 border-2 border-gray-300 border-t-[#E53A3A] rounded-full animate-spin"></div>
                                <span className="ml-3 text-gray-400">Loading performance dashboard...</span>
                            </div>
                        }>
                            <LazyPerformanceDashboard />
                        </Suspense>
                    </div>
                )}
            </main>
          </ResponsiveFlex>
        </ResponsiveModal>
      );
    };

export default React.memo(SettingsModal);