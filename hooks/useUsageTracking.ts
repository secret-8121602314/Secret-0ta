import { useCallback } from 'react';
import { Usage } from '../services/types';
import { unifiedUsageService } from '../services/unifiedUsageService';

interface UseUsageTrackingProps {
  usage: Usage;
  setUsage: (usage: Usage) => void;
}

export const useUsageTracking = ({ usage, setUsage }: UseUsageTrackingProps) => {
  
  const refreshUsage = useCallback(async () => {
    try {
      // Add a small delay to ensure any pending backend updates have propagated
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Get the current tier directly without calling getUsage (which calls checkAndResetUsage)
      const currentTier = await unifiedUsageService.getCurrentTier();
      
      // Get the current usage data
      const syncedUsage = await unifiedUsageService.getUsage();
      
      // Ensure the tier is correct
      const updatedUsage = {
        ...syncedUsage,
        tier: currentTier
      };
      
      console.log('🔄 Refreshing usage with verified tier:', currentTier);
      setUsage(updatedUsage);
    } catch (error) {
      console.error('Failed to refresh usage:', error);
    }
  }, [setUsage]);

  const loadUsageData = useCallback(async () => {
    try {
      const usageData = await unifiedUsageService.getUsage();
      setUsage(usageData);
    } catch (error) {
      console.error('Failed to load usage data:', error);
    }
  }, [setUsage]);

  const handleUpgrade = useCallback(async () => {
    await unifiedUsageService.upgradeToPro();
    await refreshUsage();
  }, [refreshUsage]);

  const handleUpgradeToVanguard = useCallback(async () => {
    await unifiedUsageService.upgradeToVanguard();
    await refreshUsage();
  }, [refreshUsage]);

  const canMakeQuery = useCallback(async (type: 'text' | 'image', count: number = 1): Promise<boolean> => {
    try {
      return await unifiedUsageService.canMakeQuery(type, count);
    } catch (error) {
      console.error('Failed to check query limits:', error);
      return false;
    }
  }, []);

  const recordQuery = useCallback(async (type: 'text' | 'image', count: number = 1) => {
    try {
      // await unifiedUsageService.recordQuery(type, count); // Method not available
      await refreshUsage();
    } catch (error) {
      console.error('Failed to record query:', error);
    }
  }, [refreshUsage]);

  return {
    refreshUsage,
    loadUsageData,
    handleUpgrade,
    handleUpgradeToVanguard,
    canMakeQuery,
    recordQuery,
  };
};
