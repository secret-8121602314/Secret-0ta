import React, { useState, useEffect } from 'react';
import { Usage, UserTier } from '../services/types';
import StarIcon from './StarIcon';
import { TierUpgradeModal } from './TierUpgradeModal';
import DevTierSwitcher from './DevTierSwitcher';
import { devModeMigrationService, MigrationResult } from '../services/devModeMigrationService';
// Dynamic import to avoid circular dependency
// import { profileService } from '../services/profileService';

interface GeneralSettingsTabProps {
    usage: Usage;
    onShowUpgrade: () => void;
    onShowVanguardUpgrade: () => void;
    onResetApp: () => void;
    onLogout: () => void;
    onShowHowToUse: () => void;
    userEmail?: string;
    isDeveloperMode?: boolean;
    onTierChanged?: () => void; // Add callback for tier changes
}

const TIER_NAMES: Record<UserTier, string> = {
    free: 'Adventurer (Free)',
    pro: 'Legend (Pro)',
    vanguard_pro: 'Founder (Vanguard Pro)'
};

const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({ usage, onShowUpgrade, onShowVanguardUpgrade, onResetApp, onLogout, onShowHowToUse, userEmail, isDeveloperMode = false, onTierChanged }) => {
    const [showTierUpgrade, setShowTierUpgrade] = useState(false);
    const [displayName, setDisplayName] = useState<string>('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [isLoadingName, setIsLoadingName] = useState(true);
    const [nameError, setNameError] = useState<string>('');
    
    // Developer mode management state
    const [devDataInfo, setDevDataInfo] = useState({ conversations: 0, lastModified: 0, size: 0 });
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<MigrationResult | null>(null);
    const [exportData, setExportData] = useState<string>('');
    const [showDevManager, setShowDevManager] = useState(false);
    
    const displayEmail = userEmail || (localStorage.getItem('otakonAuthMethod') !== 'skip' 
      ? `user@${localStorage.getItem('otakonAuthMethod') || 'local'}.com`
      : 'Anonymous User');

    // Check if user signed in with email (not OAuth)
    const isEmailUser = !localStorage.getItem('otakonAuthMethod') || localStorage.getItem('otakonAuthMethod') === 'email';

    // Load display name on component mount
    useEffect(() => {
        const loadDisplayName = async () => {
            try {
                setIsLoadingName(true);
                const { profileService } = await import('../services/profileService');
                const name = await profileService.getName();
                setDisplayName(name || '');
            } catch (error) {
                console.error('Failed to load display name:', error);
                setDisplayName('');
            } finally {
                setIsLoadingName(false);
            }
        };

        loadDisplayName();
    }, []);

    // Load developer data info when in developer mode
    useEffect(() => {
        if (isDeveloperMode) {
            updateDevDataInfo();
        }
    }, [isDeveloperMode]);

    // Developer mode management functions
    const updateDevDataInfo = () => {
        const info = devModeMigrationService.getDeveloperDataInfo();
        setDevDataInfo(info);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data = devModeMigrationService.exportDeveloperData();
            setExportData(data);
            console.log('✅ Developer data exported successfully');
        } catch (error) {
            console.error('❌ Failed to export developer data:', error);
            alert('Failed to export developer data: ' + error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async () => {
        if (!exportData.trim()) {
            alert('Please paste the exported data first');
            return;
        }

        setIsImporting(true);
        setImportResult(null);
        
        try {
            const result = await devModeMigrationService.importDeveloperData(exportData);
            setImportResult(result);
            
            if (result.success) {
                console.log('✅ Developer data imported successfully');
                updateDevDataInfo();
                setExportData(''); // Clear the input
            } else {
                console.error('❌ Import failed:', result.errors);
            }
        } catch (error) {
            console.error('❌ Failed to import developer data:', error);
            setImportResult({
                success: false,
                migratedConversations: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                warnings: []
            });
        } finally {
            setIsImporting(false);
        }
    };

    const handleClearDevData = () => {
        if (confirm('Are you sure you want to clear all developer data? This cannot be undone.')) {
            devModeMigrationService.clearDeveloperData();
            updateDevDataInfo();
            setExportData('');
            setImportResult(null);
            console.log('🗑️ Developer data cleared');
        }
    };

    const handleSwitchToProduction = () => {
        if (confirm('Switch to production mode? This will clear all developer data.')) {
            devModeMigrationService.switchToProductionMode();
            window.location.reload(); // Reload to switch modes
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (timestamp: number): string => {
        if (timestamp === 0) return 'Never';
        return new Date(timestamp).toLocaleString();
    };

    // Handle name save
    const handleSaveName = async () => {
        if (!displayName.trim()) {
            setNameError('Name cannot be empty');
            return;
        }

        try {
            setNameError('');
            const { profileService } = await import('../services/profileService');
            await profileService.setName(displayName.trim());
            setIsEditingName(false);
            console.log('✅ Display name saved successfully');
        } catch (error) {
            console.error('Failed to save display name:', error);
            setNameError('Failed to save name. Please try again.');
        }
    };

    // Handle name cancel
    const handleCancelName = async () => {
        try {
            const { profileService } = await import('../services/profileService');
            const currentName = await profileService.getName();
            setDisplayName(currentName || '');
            setIsEditingName(false);
            setNameError('');
        } catch (error) {
            console.error('Failed to reload display name:', error);
        }
    };

    return (
        <div className="space-y-8">
            {/* Account Info */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Account</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-400">Email</label>
                        <p className="text-base text-neutral-200">{displayEmail}</p>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-neutral-400">Display Name</label>
                        {isLoadingName ? (
                            <div className="w-full mt-1 bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-neutral-400">
                                Loading...
                            </div>
                        ) : isEditingName ? (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Enter your display name"
                                    className="w-full mt-1 bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5] placeholder-[#6E6E6E] focus:outline-none focus:ring-2 focus:ring-[#FFAB40]"
                                />
                                {nameError && (
                                    <p className="text-red-400 text-sm">{nameError}</p>
                                )}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleSaveName}
                                        className="px-3 py-1 bg-[#FFAB40] text-black rounded-md text-sm font-medium hover:bg-[#FF9800] transition-colors"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancelName}
                                        className="px-3 py-1 bg-[#424242] text-white rounded-md text-sm font-medium hover:bg-[#525252] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-[#2E2E2E] border border-[#424242] rounded-md py-2 px-3 text-[#F5F5F5]">
                                    {displayName || 'No name set'}
                                </div>
                                {isEmailUser && (
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="px-3 py-1 bg-[#FFAB40] text-black rounded-md text-sm font-medium hover:bg-[#FF9800] transition-colors"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                        )}
                        {!isEmailUser && displayName && (
                            <p className="text-xs text-neutral-500 mt-1">
                                Name from {localStorage.getItem('otakonAuthMethod') === 'google' ? 'Google' : 'Discord'} account
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Plan Info */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Active Plan</h2>
                <div className="bg-[#2E2E2E]/60 p-4 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold text-white">{TIER_NAMES[usage.tier]}</p>
                            <p className="text-sm text-neutral-400">
                                {localStorage.getItem('otakonAuthMethod') === 'skip' 
                                    ? 'Development Mode - You can switch tiers for testing'
                                    : 'Your current subscription plan.'
                                }
                            </p>
                        </div>
                        {usage.tier === 'free' && (
                            <button onClick={() => setShowTierUpgrade(true)} className="flex items-center gap-2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                                <StarIcon className="w-4 h-4" />
                                {localStorage.getItem('otakonAuthMethod') === 'skip' ? 'Switch to Pro' : 'Upgrade'}
                            </button>
                        )}
                        {usage.tier === 'pro' && (
                             <button onClick={() => setShowTierUpgrade(true)} className="flex items-center gap-2 bg-gradient-to-r from-[#E53A3A] to-[#D98C1F] text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">
                                <StarIcon className="w-4 h-4" />
                                {localStorage.getItem('otakonAuthMethod') === 'skip' ? 'Switch to Vanguard' : 'Upgrade to Vanguard'}
                            </button>
                        )}
                    </div>
                    
                    {/* Usage Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#424242]">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{usage.textCount}</p>
                            <p className="text-sm text-neutral-400">Text Queries Used</p>
                            <p className="text-xs text-neutral-500">Limit: {usage.textLimit}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{usage.imageCount}</p>
                            <p className="text-sm text-neutral-400">Image Queries Used</p>
                            <p className="text-xs text-neutral-500">Limit: {usage.imageLimit}</p>
                        </div>
                    </div>

                    {/* Development Mode Notice */}
                    {localStorage.getItem('otakonAuthMethod') === 'skip' && (
                        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                <p className="text-sm text-yellow-300 font-medium">Development Mode</p>
                            </div>
                            <p className="text-xs text-yellow-200 mt-1">
                                You're in testing mode. Tier switching is enabled for development purposes.
                            </p>
                            
                            {/* Dev Mode Tier Switcher */}
                            <div className="mt-3 pt-3 border-t border-yellow-500/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-yellow-200 font-medium">Quick Tier Switch</p>
                                        <p className="text-xs text-yellow-300">Click to cycle through tiers for testing</p>
                                    </div>
                                    <DevTierSwitcher currentTier={usage.tier} onSwitch={() => {
                                        // Call the tier changed callback to refresh app state
                                        if (onTierChanged) {
                                            onTierChanged();
                                        }
                                        console.log('🔄 Tier switched, refreshing app state...');
                                    }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Developer Mode Management */}
            {isDeveloperMode && (
                <div>
                    <h2 className="text-xl font-bold text-yellow-400 mb-4">Developer Mode Management</h2>
                    <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded-lg space-y-4">
                        {/* Developer Data Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-400">Conversations:</span>
                                <span className="text-white ml-2">{devDataInfo.conversations}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Size:</span>
                                <span className="text-white ml-2">{formatBytes(devDataInfo.size)}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Last Modified:</span>
                                <span className="text-white ml-2">{formatDate(devDataInfo.lastModified)}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Mode:</span>
                                <span className="text-green-400 ml-2">Developer</span>
                            </div>
                        </div>

                        {/* Export/Import Section */}
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                                >
                                    {isExporting ? 'Exporting...' : 'Export Data'}
                                </button>
                                <button
                                    onClick={updateDevDataInfo}
                                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                                >
                                    Refresh Info
                                </button>
                            </div>

                            {/* Import Section */}
                            <div className="space-y-2">
                                <textarea
                                    value={exportData}
                                    onChange={(e) => setExportData(e.target.value)}
                                    placeholder="Paste exported data here to import..."
                                    className="w-full h-20 p-2 bg-[#1A1A1A] border border-gray-600 rounded-lg text-white text-xs font-mono resize-none"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleImport}
                                        disabled={isImporting || !exportData.trim()}
                                        className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                                    >
                                        {isImporting ? 'Importing...' : 'Import Data'}
                                    </button>
                                    <button
                                        onClick={() => setExportData('')}
                                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Import Result */}
                            {importResult && (
                                <div className={`p-2 rounded-lg text-xs ${
                                    importResult.success ? 'bg-green-900/30 border border-green-500/50' : 'bg-red-900/30 border border-red-500/50'
                                }`}>
                                    <div className={`font-semibold ${importResult.success ? 'text-green-400' : 'text-red-400'}`}>
                                        {importResult.success ? '✅ Import Successful' : '❌ Import Failed'}
                                    </div>
                                    <div className="text-gray-300">
                                        Migrated {importResult.migratedConversations} conversations
                                    </div>
                                    {importResult.errors.length > 0 && (
                                        <div className="text-red-400 mt-1">
                                            <div className="font-semibold">Errors:</div>
                                            <ul className="list-disc list-inside ml-2">
                                                {importResult.errors.map((error, index) => (
                                                    <li key={index}>{error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {importResult.warnings.length > 0 && (
                                        <div className="text-yellow-400 mt-1">
                                            <div className="font-semibold">Warnings:</div>
                                            <ul className="list-disc list-inside ml-2">
                                                {importResult.warnings.map((warning, index) => (
                                                    <li key={index}>{warning}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t border-yellow-500/30">
                            <button
                                onClick={handleClearDevData}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                            >
                                Clear All Data
                            </button>
                            <button
                                onClick={handleSwitchToProduction}
                                className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm"
                            >
                                Switch to Production
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Help & Support */}
            <div>
                <h2 className="text-xl font-bold text-blue-400 mb-4">Help & Support</h2>
                <div className="space-y-4">
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-white">How to Use Guide</p>
                            <p className="text-sm text-neutral-400">Learn about hotkeys, screenshot modes, and app features.</p>
                        </div>
                        <button onClick={onShowHowToUse} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex-shrink-0">
                            Open Guide
                        </button>
                    </div>
                </div>
            </div>

             {/* Danger Zone */}
            <div>
                <h2 className="text-xl font-bold text-red-500 mb-4">Danger Zone</h2>
                <div className="space-y-4">
                    <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-white">Logout</p>
                            <p className="text-sm text-neutral-400">
                                {isDeveloperMode 
                                    ? "Sign out of developer mode and return to login screen." 
                                    : "Sign out of your account and return to login screen."
                                }
                            </p>
                        </div>
                        <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex-shrink-0">
                            Logout
                        </button>
                    </div>
                    
                    {/* Reset Application - Only available in developer mode */}
                    {isDeveloperMode && (
                        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-white">Reset Application</p>
                                <p className="text-sm text-neutral-400">This will permanently delete all data and log you out. (Developer mode only)</p>
                            </div>
                            <button onClick={onResetApp} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex-shrink-0">
                                Reset
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <TierUpgradeModal
                isOpen={showTierUpgrade}
                onClose={() => setShowTierUpgrade(false)}
                onUpgradeSuccess={() => {
                    setShowTierUpgrade(false);
                    // Instead of reloading, we'll let the parent component handle the state update
                    // The tier info will be refreshed through the normal data flow
                }}
            />
        </div>
    );
};

export default GeneralSettingsTab;
