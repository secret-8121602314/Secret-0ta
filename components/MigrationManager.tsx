import React, { useState, useEffect } from 'react';
import { LocalStorageMigrationService, MigrationResult } from '../services/localStorageMigrationService';
import { DualStorageService } from '../services/dualStorageService';
import { SupabaseClient } from '@supabase/supabase-js';

interface MigrationManagerProps {
  supabase: SupabaseClient;
  onMigrationComplete?: (result: MigrationResult) => void;
}

export const MigrationManager: React.FC<MigrationManagerProps> = ({ 
  supabase, 
  onMigrationComplete 
}) => {
  const [migrationService] = useState(() => new LocalStorageMigrationService(supabase));
  const [dualStorageService] = useState(() => new DualStorageService(supabase));
  
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    migrated: boolean;
    tables: string[];
  }>({ migrated: false, tables: [] });
  
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check migration status on mount
  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      const status = await migrationService.getMigrationStatus();
      setMigrationStatus(status);
    } catch (error) {
      console.warn('Failed to check migration status:', error);
    }
  };

  const handleMigration = async () => {
    if (isMigrating) return;

    setIsMigrating(true);
    setError(null);
    setMigrationResult(null);

    try {
      // Start migration
      const result = await migrationService.migrateAllData();
      setMigrationResult(result);
      
      // Update status
      await checkMigrationStatus();
      
      // Notify parent component
      if (onMigrationComplete) {
        onMigrationComplete(result);
      }
      
      // Show success message
      if (result.success) {
        console.log('Migration completed successfully!', result);
      } else {
        setError(`Migration failed: ${result.errors.join(', ')}`);
      }
      
    } catch (error) {
      setError(`Migration error: ${error}`);
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSyncLocalToSupabase = async () => {
    try {
      const result = await dualStorageService.syncLocalToSupabase();
      if (result.success) {
        console.log(`Synced ${result.synced} items to Supabase`);
        await checkMigrationStatus();
      } else {
        setError(`Sync failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      setError(`Sync error: ${error}`);
    }
  };

  const handleClearLocalStorage = async () => {
    if (!migrationStatus.migrated) {
      setError('No data has been migrated yet. Please migrate first.');
      return;
    }

    if (window.confirm('Are you sure you want to clear localStorage? This action cannot be undone.')) {
      try {
        await migrationService.clearMigratedLocalStorage();
        console.log('localStorage cleared successfully');
        setError(null);
      } catch (error) {
        setError(`Failed to clear localStorage: ${error}`);
      }
    }
  };

  const getMigrationButtonText = () => {
    if (isMigrating) return 'Migrating...';
    if (migrationStatus.migrated) return 'Re-migrate Data';
    return 'Start Migration';
  };

  const getStatusColor = () => {
    if (migrationStatus.migrated) return 'text-green-500';
    if (isMigrating) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <div className="bg-[#2E2E2E] rounded-lg p-6 border border-[#424242]/20">
      <h3 className="text-lg font-semibold text-white mb-4">
        🚀 Data Migration Manager
      </h3>
      
      {/* Migration Status */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            Status: {migrationStatus.migrated ? 'Migrated' : isMigrating ? 'Migrating' : 'Not Started'}
          </span>
          {migrationStatus.migrated && (
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
              ✓ Complete
            </span>
          )}
        </div>
        
        {migrationStatus.tables.length > 0 && (
          <div className="text-sm text-[#8A8A8A]">
            Migrated tables: {migrationStatus.tables.join(', ')}
          </div>
        )}
      </div>

      {/* Migration Actions */}
      <div className="space-y-3">
        <button
          onClick={handleMigration}
          disabled={isMigrating}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isMigrating
              ? 'bg-[#424242] text-[#8A8A8A] cursor-not-allowed'
              : 'bg-[#FFAB40] hover:bg-[#FFAB40]/80 text-white hover:scale-105'
          }`}
        >
          {getMigrationButtonText()}
        </button>

        <button
          onClick={handleSyncLocalToSupabase}
          disabled={isMigrating}
          className="w-full px-4 py-2 rounded-lg font-medium bg-[#424242] hover:bg-[#424242]/80 text-white transition-all duration-200 hover:scale-105"
        >
          🔄 Sync localStorage to Supabase
        </button>

        {migrationStatus.migrated && (
          <button
            onClick={handleClearLocalStorage}
            className="w-full px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-all duration-200 hover:scale-105"
          >
            🗑️ Clear Migrated localStorage
          </button>
        )}
      </div>

      {/* Migration Results */}
      {migrationResult && (
        <div className="mt-6 p-4 bg-[#1C1C1C] rounded-lg border border-[#424242]/20">
          <h4 className="text-sm font-medium text-white mb-2">Migration Results</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8A8A8A]">Success:</span>
              <span className={migrationResult.success ? 'text-green-400' : 'text-red-400'}>
                {migrationResult.success ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-[#8A8A8A]">Tables Migrated:</span>
              <span className="text-white">{migrationResult.migratedTables.length}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-[#8A8A8A]">Total Items:</span>
              <span className="text-white">{migrationResult.totalItems}</span>
            </div>
            
            {migrationResult.errors.length > 0 && (
              <div className="mt-3">
                <span className="text-[#8A8A8A]">Errors:</span>
                <div className="mt-1 space-y-1">
                  {migrationResult.errors.map((error, index) => (
                    <div key={index} className="text-red-400 text-xs bg-red-400/10 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-600/10 border border-red-600/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
        <h4 className="text-sm font-medium text-blue-400 mb-2">ℹ️ How This Works</h4>
        <ul className="text-xs text-blue-300 space-y-1">
          <li>• Migration copies localStorage data to Supabase</li>
          <li>• Your app continues working normally during migration</li>
          <li>• Data is preserved in both locations until you're ready</li>
          <li>• You can safely clear localStorage after verification</li>
        </ul>
      </div>
    </div>
  );
};
