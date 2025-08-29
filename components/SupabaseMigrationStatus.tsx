import React, { useState, useEffect } from 'react';
import { supabaseDataService } from '../services/supabaseDataService';

const SupabaseMigrationStatus: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMigrationStatus = async () => {
      try {
        const status = await supabaseDataService.checkMigrationStatus();
        setMigrationStatus(status);
      } catch (error) {
        console.warn('Failed to check migration status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkMigrationStatus();
  }, []);

  // 🚨 DEVELOPER MODE ONLY: Only show in development environment
  if (process.env.NODE_ENV !== 'development' && !import.meta.env.DEV) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <p className="text-lg font-semibold">🔒 Migration Dashboard</p>
          <p className="text-sm">This feature is only available in developer mode.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <p className="text-lg font-semibold">🔄 Checking Migration Status...</p>
        </div>
      </div>
    );
  }

  const needsMigration = migrationStatus?.needsMigration || false;
  const lastMigration = migrationStatus?.lastMigration || null;
  const migrationProgress = migrationStatus?.progress || 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🚀 Supabase Migration Status</h3>
        <p className="text-gray-300 mb-4">
          {needsMigration 
            ? "Your data will be automatically migrated to Supabase on the next app restart."
            : "All data has been successfully migrated to Supabase! 🎉"
          }
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-blue-400 font-medium mb-2">Migration Status</h4>
            <div className="text-2xl font-bold text-white">
              {needsMigration ? '🔄 Pending' : '✅ Complete'}
            </div>
            <div className="text-sm text-blue-300 mt-1">
              {needsMigration ? 'Will auto-migrate on restart' : 'All data synced'}
            </div>
          </div>
          
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <h4 className="text-green-400 font-medium mb-2">Progress</h4>
            <div className="text-2xl font-bold text-white">{migrationProgress}%</div>
            <div className="w-full bg-green-900/30 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${migrationProgress}%` }}></div>
            </div>
          </div>
          
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="text-yellow-400 font-medium mb-2">Last Migration</h4>
            <div className="text-2xl font-bold text-white">
              {lastMigration ? '✅ Done' : '⏳ Never'}
            </div>
            <div className="text-sm text-yellow-300 mt-1">
              {lastMigration 
                ? new Date(lastMigration).toLocaleDateString()
                : 'First time setup'
              }
            </div>
          </div>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-400 font-medium mb-2">ℹ️ Automatic Migration</h4>
          <p className="text-gray-300 text-sm">
            Data migration now happens automatically when you start the app. 
            No manual intervention required! 🚀
          </p>
        </div>
      </div>
      
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Migration Details</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
            <div className={`w-3 h-3 ${needsMigration ? 'bg-yellow-500' : 'bg-green-500'} rounded-full`}></div>
            <span className={`${needsMigration ? 'text-yellow-400' : 'text-green-400'} text-sm`}>
              {needsMigration ? 'Migration pending - will auto-run on restart' : 'Migration complete'}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-blue-400 text-sm">
              {needsMigration ? 'Ready for automatic migration' : 'All services using Supabase'}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-400 text-sm">
              localStorage fallback enabled for offline support
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseMigrationStatus;
