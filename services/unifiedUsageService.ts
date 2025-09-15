import { Usage, UserTier } from './types';
import { usageService } from './usageService';
import { databaseService } from './databaseService';
import { authService } from './supabase';
import { supabaseDataService } from './supabaseDataService';
import { unifiedDataService, STORAGE_KEYS } from './unifiedDataService';

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
    // Skip Supabase calls in developer mode
    const isDevMode = localStorage.getItem('otakon_developer_mode') === 'true';
    
    if (isDevMode) {
        console.log('🔧 Developer mode: Using localStorage for usage reset');
        const lastMonth = localStorage.getItem(DATE_KEY);
        const thisMonth = getThisMonth();
        if (lastMonth !== thisMonth) {
            localStorage.setItem(TEXT_COUNT_KEY, '0');
            localStorage.setItem(IMAGE_COUNT_KEY, '0');
            localStorage.setItem(DATE_KEY, thisMonth);
        }
        return;
    }
    
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
    // Skip Supabase calls in developer mode
    const isDevMode = localStorage.getItem('otakon_developer_mode') === 'true';
    
    if (isDevMode) {
        console.log('🔧 Developer mode: Using localStorage for tier');
        return (localStorage.getItem(TIER_KEY) as UserTier) || 'free';
    }
    
    try {
        // Try to get tier from Supabase first
        const supabaseUsage = await supabaseDataService.getUserUsageData();
        return (supabaseUsage.tier as UserTier) || 'free';
    } catch (error) {
        console.warn('Supabase tier fetch failed, using localStorage fallback:', error);
        return (localStorage.getItem(TIER_KEY) as UserTier) || 'free';
    }
};

// New function to get current tier without calling checkAndResetUsage
const getCurrentTier = async (): Promise<UserTier> => {
    // Skip Supabase calls in developer mode
    const isDevMode = localStorage.getItem('otakon_developer_mode') === 'true';
    
    if (isDevMode) {
        console.log('🔧 Developer mode: Using localStorage for current tier');
        return (localStorage.getItem(STORAGE_KEYS.USER_TIER) as UserTier) || 'free';
    }
    
    try {
        // Use the unified data service for consistent pattern
        const result = await unifiedDataService.getUserUsageData();
        const tier = (result.data.tier as UserTier) || 'free';
        console.log(`📊 Current tier from ${result.source}: ${tier}`);
        return tier;
    } catch (error) {
        console.warn('Failed to get current tier, using fallback:', error);
        const tier = (localStorage.getItem(STORAGE_KEYS.USER_TIER) as UserTier) || 'free';
        console.log(`📊 Current tier from localStorage fallback: ${tier}`);
        return tier;
    }
};

const getUsage = async (): Promise<Usage> => {
    await checkAndResetUsage();
    
    // Skip Supabase calls in developer mode
    const isDevMode = localStorage.getItem('otakon_developer_mode') === 'true';
    
    if (isDevMode) {
        console.log('🔧 Developer mode: Using localStorage for usage data');
        const tier = (localStorage.getItem(TIER_KEY) as UserTier) || 'free';
        const textCount = parseInt(localStorage.getItem(TEXT_COUNT_KEY) || '0', 10);
        const imageCount = parseInt(localStorage.getItem(IMAGE_COUNT_KEY) || '0', 10);
        const { text: textLimit, image: imageLimit } = LIMITS[tier];
        
        return { 
            textQueries: textCount,
            imageQueries: imageCount,
            insights: 0, // Not tracked in this service
            textCount, 
            imageCount, 
            textLimit, 
            imageLimit, 
            tier 
        };
    }
    
    try {
        // Try to get usage from Supabase first
        const supabaseUsage = await supabaseDataService.getUserUsageData();
        const tier = (supabaseUsage.tier as UserTier) || 'free';
        const textCount = supabaseUsage.textCount || 0;
        const imageCount = supabaseUsage.imageCount || 0;
        const { text: textLimit, image: imageLimit } = LIMITS[tier];
        
        return { 
            textQueries: textCount,
            imageQueries: imageCount,
            insights: 0, // Not tracked in this service
            textCount, 
            imageCount, 
            textLimit, 
            imageLimit, 
            tier 
        };
    } catch (error) {
        console.warn('Supabase usage fetch failed, using localStorage fallback:', error);
        // Fallback to localStorage
        const tier = (localStorage.getItem(TIER_KEY) as UserTier) || 'free';
        const textCount = parseInt(localStorage.getItem(TEXT_COUNT_KEY) || '0', 10);
        const imageCount = parseInt(localStorage.getItem(IMAGE_COUNT_KEY) || '0', 10);
        const { text: textLimit, image: imageLimit } = LIMITS[tier];
        
        return { 
            textQueries: textCount,
            imageQueries: imageCount,
            insights: 0, // Not tracked in this service
            textCount, 
            imageCount, 
            textLimit, 
            imageLimit, 
            tier 
        };
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
        
        // Use unified data service for consistent pattern
        const result = await unifiedDataService.setData(
            'userUsageData',
            undefined,
            async () => {
                await supabaseDataService.updateUserUsage('tier', 'pro');
                await supabaseDataService.updateUserUsage('textCount', 0);
                await supabaseDataService.updateUserUsage('imageCount', 0);
                await supabaseDataService.updateUserUsage('lastMonth', getThisMonth());
            },
            STORAGE_KEYS.USER_TIER
        );
        
        // Update localStorage directly for immediate effect
        localStorage.setItem(STORAGE_KEYS.USER_TIER, 'pro');
        localStorage.setItem(STORAGE_KEYS.TEXT_COUNT, '0');
        localStorage.setItem(STORAGE_KEYS.IMAGE_COUNT, '0');
        localStorage.setItem(STORAGE_KEYS.LAST_USAGE_DATE, getThisMonth());
        
        console.log(`✅ User upgraded to Pro tier via ${result.source}`);
        console.log('📍 localStorage verification after Pro upgrade:', {
            TIER_KEY: localStorage.getItem(STORAGE_KEYS.USER_TIER),
            TEXT_COUNT_KEY: localStorage.getItem(STORAGE_KEYS.TEXT_COUNT),
            IMAGE_COUNT_KEY: localStorage.getItem(STORAGE_KEYS.IMAGE_COUNT)
        });
    } catch (error) {
        console.error('❌ Failed to upgrade to Pro tier:', error);
        throw error;
    }
};

const upgradeToVanguardPro = async () => {
    try {
        console.log('🔄 Starting Vanguard Pro tier upgrade...');
        
        // Use unified data service for consistent pattern
        const result = await unifiedDataService.setData(
            'userUsageData',
            undefined,
            async () => {
                await supabaseDataService.updateUserUsage('tier', 'vanguard_pro');
                await supabaseDataService.updateUserUsage('textCount', 0);
                await supabaseDataService.updateUserUsage('imageCount', 0);
                await supabaseDataService.updateUserUsage('lastMonth', getThisMonth());
            },
            STORAGE_KEYS.USER_TIER
        );
        
        // Update localStorage directly for immediate effect
        localStorage.setItem(STORAGE_KEYS.USER_TIER, 'vanguard_pro');
        localStorage.setItem(STORAGE_KEYS.TEXT_COUNT, '0');
        localStorage.setItem(STORAGE_KEYS.IMAGE_COUNT, '0');
        localStorage.setItem(STORAGE_KEYS.LAST_USAGE_DATE, getThisMonth());
        
        console.log(`✅ User upgraded to Vanguard Pro tier via ${result.source}`);
        console.log('📍 localStorage verification after Vanguard Pro upgrade:', {
            TIER_KEY: localStorage.getItem(STORAGE_KEYS.USER_TIER),
            TEXT_COUNT_KEY: localStorage.getItem(STORAGE_KEYS.TEXT_COUNT),
            IMAGE_COUNT_KEY: localStorage.getItem(STORAGE_KEYS.IMAGE_COUNT)
        });
    } catch (error) {
        console.error('❌ Failed to upgrade to Vanguard Pro tier:', error);
        throw error;
    }
};

const downgradeToFree = async () => {
    try {
        console.log('🔄 Starting Free tier downgrade...');
        
        // Use unified data service for consistent pattern
        const result = await unifiedDataService.setData(
            'userUsageData',
            undefined,
            async () => {
                await supabaseDataService.updateUserUsage('tier', 'free');
                await supabaseDataService.updateUserUsage('textCount', 0);
                await supabaseDataService.updateUserUsage('imageCount', 0);
            },
            STORAGE_KEYS.USER_TIER
        );
        
        // Update localStorage directly for immediate effect
        localStorage.setItem(STORAGE_KEYS.USER_TIER, 'free');
        localStorage.setItem(STORAGE_KEYS.TEXT_COUNT, '0');
        localStorage.setItem(STORAGE_KEYS.IMAGE_COUNT, '0');
        
        console.log(`✅ User downgraded to Free tier via ${result.source}`);
        console.log('🔍 localStorage verification after Free downgrade:', {
            TIER_KEY: localStorage.getItem(STORAGE_KEYS.USER_TIER),
            TEXT_COUNT_KEY: localStorage.getItem(STORAGE_KEYS.TEXT_COUNT),
            IMAGE_COUNT_KEY: localStorage.getItem(STORAGE_KEYS.IMAGE_COUNT)
        });
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
    getTier,
    getCurrentTier
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
  getCurrentTier: async () => {
    try {
      return await getCurrentTier();
    } catch (error) {
      console.warn('getCurrentTier failed, returning free tier:', error);
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