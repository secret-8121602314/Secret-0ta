import { Usage, UserTier } from './types';
import { usageService } from './usageService';
import { databaseService } from './databaseService';
import { authService } from './supabase';
import { supabaseDataService } from './supabaseDataService';

const TIER_KEY = 'otakonUserTier';
const TEXT_COUNT_KEY = 'otakonTextQueryCount';
const IMAGE_COUNT_KEY = 'otakonImageQueryCount';
const DATE_KEY = 'otakonLastUsageDate';

// Use YYYY-MM format to reset monthly
const getThisMonth = () => new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit' });

const LIMITS: Record<UserTier, { text: number; image: number }> = {
    free: { text: 55, image: 25 },
    pro: { text: 1583, image: 328 },
    vanguard_pro: { text: 1583, image: 328 },
};

// Check if we should reset usage based on month change
const checkAndResetUsage = async (): Promise<void> => {
    try {
        // Try to get usage from Supabase first
        const supabaseUsage = await supabaseDataService.getUserUsageData();
        const lastMonth = supabaseUsage.lastMonth;
        const thisMonth = getThisMonth();
        
        if (lastMonth !== thisMonth) {
            console.log('New month, resetting query counts in Supabase.');
            await supabaseDataService.updateUserUsage('textCount', 0);
            await supabaseDataService.updateUserUsage('imageCount', 0);
            await supabaseDataService.updateUserUsage('lastMonth', thisMonth);
            
            // Also update localStorage as backup
            localStorage.setItem(TEXT_COUNT_KEY, '0');
            localStorage.setItem(IMAGE_COUNT_KEY, '0');
            localStorage.setItem(DATE_KEY, thisMonth);
        }
    } catch (error) {
        console.warn('Supabase usage reset failed, using localStorage fallback:', error);
        // Fallback to localStorage
        const lastMonth = localStorage.getItem(DATE_KEY);
        const thisMonth = getThisMonth();
        if (lastMonth !== thisMonth) {
            localStorage.setItem(TEXT_COUNT_KEY, '0');
            localStorage.setItem(IMAGE_COUNT_KEY, '0');
            localStorage.setItem(DATE_KEY, thisMonth);
        }
    }
};

const getTier = async (): Promise<UserTier> => {
    try {
        // Try to get tier from Supabase first
        const supabaseUsage = await supabaseDataService.getUserUsageData();
        return (supabaseUsage.tier as UserTier) || 'free';
    } catch (error) {
        console.warn('Supabase tier fetch failed, using localStorage fallback:', error);
        return (localStorage.getItem(TIER_KEY) as UserTier) || 'free';
    }
};

const getUsage = async (): Promise<Usage> => {
    await checkAndResetUsage();
    
    try {
        // Try to get usage from Supabase first
        const supabaseUsage = await supabaseDataService.getUserUsageData();
        const tier = (supabaseUsage.tier as UserTier) || 'free';
        const textCount = supabaseUsage.textCount || 0;
        const imageCount = supabaseUsage.imageCount || 0;
        const { text: textLimit, image: imageLimit } = LIMITS[tier];
        
        return { textCount, imageCount, textLimit, imageLimit, tier };
    } catch (error) {
        console.warn('Supabase usage fetch failed, using localStorage fallback:', error);
        // Fallback to localStorage
        const tier = (localStorage.getItem(TIER_KEY) as UserTier) || 'free';
        const textCount = parseInt(localStorage.getItem(TEXT_COUNT_KEY) || '0', 10);
        const imageCount = parseInt(localStorage.getItem(IMAGE_COUNT_KEY) || '0', 10);
        const { text: textLimit, image: imageLimit } = LIMITS[tier];
        
        return { textCount, imageCount, textLimit, imageLimit, tier };
    }
};

const canMakeQuery = async (type: 'text' | 'image', count: number = 1): Promise<boolean> => {
    const { textCount, imageCount, textLimit, imageLimit } = await getUsage();
    if (type === 'text') {
        return (textCount + count) <= textLimit;
    }
    // if type is 'image'
    return (imageCount + count) <= imageLimit;
};

const incrementQueryCount = async (type: 'text' | 'image', count: number = 1) => {
    if (count === 0) return;
    await checkAndResetUsage();
    
    try {
        // Update in Supabase first
        const currentUsage = await supabaseDataService.getUserUsageData();
        const field = type === 'text' ? 'textCount' : 'imageCount';
        const newCount = (currentUsage[field] || 0) + count;
        
        await supabaseDataService.updateUserUsage(field, newCount);
        
        // Also update localStorage as backup
        if (type === 'text') {
            localStorage.setItem(TEXT_COUNT_KEY, newCount.toString());
        } else {
            localStorage.setItem(IMAGE_COUNT_KEY, newCount.toString());
        }
        
        console.log(`✅ ${type} query count incremented in Supabase: ${newCount}`);
    } catch (error) {
        console.error('Supabase usage update failed, using localStorage fallback:', error);
        // Fallback to localStorage
        if (type === 'text') {
            const currentCount = parseInt(localStorage.getItem(TEXT_COUNT_KEY) || '0', 10);
            localStorage.setItem(TEXT_COUNT_KEY, (currentCount + count).toString());
        } else {
            const currentCount = parseInt(localStorage.getItem(IMAGE_COUNT_KEY) || '0', 10);
            localStorage.setItem(IMAGE_COUNT_KEY, (currentCount + count).toString());
        }
    }
};

const getDaysUntilReset = (): number => {
    const now = new Date();
    const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const timeDiff = firstOfNextMonth.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff > 0 ? daysDiff : 1; // Ensure it's at least 1 day
};

const upgradeToPro = async () => {
    try {
        console.log('🔄 Starting Pro tier upgrade...');
        
        // Update in Supabase
        console.log('🔄 Updating tier in Supabase...');
        await supabaseDataService.updateUserUsage('tier', 'pro');
        console.log('🔄 Updating text count in Supabase...');
        await supabaseDataService.updateUserUsage('textCount', 0);
        console.log('🔄 Updating image count in Supabase...');
        await supabaseDataService.updateUserUsage('imageCount', 0);
        console.log('🔄 Updating last month in Supabase...');
        await supabaseDataService.updateUserUsage('lastMonth', getThisMonth());
        
        // Also update localStorage as backup
        console.log('🔄 Updating localStorage backup...');
        localStorage.setItem(TIER_KEY, 'pro');
        localStorage.setItem(TEXT_COUNT_KEY, '0');
        localStorage.setItem(IMAGE_COUNT_KEY, '0');
        localStorage.setItem(DATE_KEY, getThisMonth());
        
        console.log('✅ User upgraded to Pro tier in Supabase. Resetting counts for new limits.');
        console.log('📍 localStorage TIER_KEY now set to:', localStorage.getItem(TIER_KEY));
    } catch (error) {
        console.error('❌ Failed to upgrade to Pro tier:', error);
        throw error;
    }
};

const upgradeToVanguardPro = async () => {
    try {
        console.log('🔄 Starting Vanguard Pro tier upgrade...');
        
        // Update in Supabase
        console.log('🔄 Updating tier in Supabase...');
        await supabaseDataService.updateUserUsage('tier', 'vanguard_pro');
        console.log('🔄 Updating text count in Supabase...');
        await supabaseDataService.updateUserUsage('textCount', 0);
        console.log('🔄 Updating image count in Supabase...');
        await supabaseDataService.updateUserUsage('imageCount', 0);
        console.log('🔄 Updating last month in Supabase...');
        await supabaseDataService.updateUserUsage('lastMonth', getThisMonth());
        
        // Also update localStorage as backup
        console.log('🔄 Updating localStorage backup...');
        localStorage.setItem(TIER_KEY, 'vanguard_pro');
        localStorage.setItem(TEXT_COUNT_KEY, '0');
        localStorage.setItem(IMAGE_COUNT_KEY, '0');
        localStorage.setItem(DATE_KEY, getThisMonth());
        
        console.log('✅ User upgraded to Vanguard Pro tier in Supabase. Resetting counts for new limits.');
        console.log('📍 localStorage TIER_KEY now set to:', localStorage.getItem(TIER_KEY));
    } catch (error) {
        console.error('❌ Failed to upgrade to Vanguard Pro tier:', error);
        throw error;
    }
};

const downgradeToFree = async () => {
    try {
        // Update in Supabase
        await supabaseDataService.updateUserUsage('tier', 'free');
        await supabaseDataService.updateUserUsage('textCount', 0);
        
        // Also update localStorage as backup
        localStorage.setItem(TIER_KEY, 'free');
        localStorage.setItem(TEXT_COUNT_KEY, '0');
        
        console.log('✅ User downgraded to Free tier in Supabase. Resetting counts for new limits.');
    } catch (error) {
        console.error('❌ Failed to downgrade to Free tier:', error);
        throw error;
    }
};

// Export the refactored functions
export {
    getUsage,
    canMakeQuery,
    incrementQueryCount,
    getDaysUntilReset,
    upgradeToPro,
    upgradeToVanguardPro,
    downgradeToFree,
    getTier
};

// Maintain backward compatibility with old interface
export const unifiedUsageService = {
  getTier: async () => {
    try {
      return await getTier();
    } catch (error) {
      console.warn('getTier failed, returning free tier:', error);
      return 'free' as UserTier;
    }
  },
  getUsage: async () => {
    try {
      return await getUsage();
    } catch (error) {
      console.warn('getUsage failed, returning default usage:', error);
      return {
        textCount: 0,
        imageCount: 0,
        textLimit: 55,
        imageLimit: 25,
        tier: 'free' as UserTier
      };
    }
  },
  canMakeQuery: async (type: 'text' | 'image', count: number = 1) => {
    try {
      return await canMakeQuery(type, count);
    } catch (error) {
      console.warn('canMakeQuery failed, returning false:', error);
      return false;
    }
  },
  incrementQueryCount: async (type: 'text' | 'image', count: number = 1) => {
    try {
      await incrementQueryCount(type, count);
    } catch (error) {
      console.warn('incrementQueryCount failed:', error);
    }
  },
  getDaysUntilReset,
  upgradeToPro,
  upgradeToVanguardPro,
  downgradeToFree,
  // Add missing methods for backward compatibility
  reset: async () => {
    try {
      await downgradeToFree();
      console.log('✅ Usage reset to free tier');
    } catch (error) {
      console.warn('Failed to reset usage:', error);
    }
  },
  switchToFree: async () => {
    try {
      await downgradeToFree();
      console.log('✅ Switched to free tier');
    } catch (error) {
      console.warn('Failed to switch to free tier:', error);
    }
  },
  switchToPro: async () => {
    try {
      await upgradeToPro();
      console.log('✅ Switched to pro tier');
    } catch (error) {
      console.warn('Failed to switch to pro tier:', error);
    }
  },
  switchToVanguard: async () => {
    try {
      await upgradeToVanguardPro();
      console.log('✅ Switched to vanguard pro tier');
    } catch (error) {
      console.warn('Failed to switch to vanguard pro tier:', error);
    }
  },
  upgradeToVanguard: async () => {
    try {
      await upgradeToVanguardPro();
      console.log('✅ Upgraded to vanguard pro tier');
    } catch (error) {
      console.warn('Failed to upgrade to vanguard pro tier:', error);
    }
  }
};
