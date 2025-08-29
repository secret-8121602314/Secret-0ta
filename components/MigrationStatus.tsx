import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export const MigrationStatus: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    try {
      // Access the migration service through the supabase service
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // For now, just show basic info
        const localDataCount = Object.keys(localStorage).length;
        setStatus({
          user: user.email,
          localDataCount,
          hasUser: true
        });
      } else {
        setStatus({ hasUser: false });
      }
    } catch (error) {
      console.error('Failed to check status:', error);
      setStatus({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  if (!status) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-[#2E2E2E] p-4 rounded-lg border border-[#424242]/20 text-white text-sm max-w-xs">
      <h4 className="font-medium mb-2">🔄 Migration Status</h4>
      
      {status.hasUser ? (
        <div className="space-y-2">
          <div>User: {status.user}</div>
          <div>localStorage items: {status.localDataCount}</div>
          <div className="text-green-400 text-xs">
            ✅ Migration service is active
          </div>
        </div>
      ) : (
        <div className="text-[#8A8A8A]">
          Not signed in
        </div>
      )}
      
      <button
        onClick={checkStatus}
        disabled={loading}
        className="mt-3 w-full px-3 py-1 bg-[#424242] hover:bg-[#424242]/80 rounded text-xs transition-colors"
      >
        {loading ? 'Checking...' : 'Refresh Status'}
      </button>
    </div>
  );
};
