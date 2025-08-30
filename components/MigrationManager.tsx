import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseDataService } from '../services/supabaseDataService';

interface MigrationResult {
  success: boolean;
  migratedTables: string[];
  errors: string[];
  totalItems: number;
}

interface MigrationManagerProps {
  supabase: SupabaseClient;
  onMigrationComplete?: (result: MigrationResult) => void;
}

export const MigrationManager: React.FC<MigrationManagerProps> = ({ 
  supabase, 
  onMigrationComplete 
}) => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    migrated: boolean;
    needsMigration: boolean;
  }>({ migrated: false, needsMigration: false });
  
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check migration status on mount
  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    try {
      const status = await supabaseDataService.checkMigrationStatus();
      setMigrationStatus({
        migrated: !status.needsMigration,
        needsMigration: status.needsMigration
      });
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
      // Start migration using supabaseDataService
      await supabaseDataService.migrateAllLocalStorageData();
      
      const result: MigrationResult = {
        success: true,
        migratedTables: ['user_preferences', 'app_state', 'user_analytics', 'session_data'],
        errors: [],
        totalItems: Object.keys(localStorage).length
      };
      
      setMigrationResult(result);
      
      // Update status
      await checkMigrationStatus();
      
      // Notify parent component
      if (onMigrationComplete) {
        onMigrationComplete(result);
      }
      
      console.log('Migration completed successfully!', result);
      
    } catch (error) {
      const result: MigrationResult = {
        success: false,
        migratedTables: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        totalItems: 0
      };
      
      setMigrationResult(result);
      setError(`Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClearLocalStorage = async () => {
    if (!migrationStatus.migrated) {
      setError('No data has been migrated yet. Please migrate first.');
      return;
    }

    if (window.confirm('Are you sure you want to clear localStorage? This action cannot be undone.')) {
      try {
        await supabaseDataService.clearAllLocalStorageData();
        console.log('localStorage cleared successfully');
        setError(null);
        await checkMigrationStatus();
      } catch (error) {
        setError(`Failed to clear localStorage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#2E2E2E] p-6 rounded-lg border border-[#424242]/20">
        <h3 className="text-lg font-semibold text-white mb-4">Data Migration</h3>
        
        {/* Migration Status */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${migrationStatus.migrated ? 'bg-green-500' : migrationStatus.needsMigration ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
            <span className="text-sm text-gray-300">
              {migrationStatus.migrated ? 'Data migrated to Supabase' : migrationStatus.needsMigration ? 'Migration needed' : 'Checking status...'}
            </span>
          </div>
        </div>

        {/* Migration Actions */}
        <div className="space-y-3">
          {migrationStatus.needsMigration && (
            <button
              onClick={handleMigration}
              disabled={isMigrating}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
            >
              {isMigrating ? 'Migrating...' : 'Start Migration'}
            </button>
          )}

          {migrationStatus.migrated && (
            <button
              onClick={handleClearLocalStorage}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Clear localStorage (after migration)
            </button>
          )}

          <button
            onClick={checkMigrationStatus}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Refresh Status
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-600/20 border border-red-600/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Migration Result */}
        {migrationResult && (
          <div className="mt-4 p-3 bg-blue-600/20 border border-blue-600/30 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2">Migration Result:</h4>
            <div className="text-blue-300 text-sm space-y-1">
              <p>Status: {migrationResult.success ? '✅ Success' : '❌ Failed'}</p>
              <p>Tables: {migrationResult.migratedTables.join(', ')}</p>
              <p>Total Items: {migrationResult.totalItems}</p>
              {migrationResult.errors.length > 0 && (
                <p>Errors: {migrationResult.errors.join(', ')}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
