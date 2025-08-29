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
    free: { text: 55, image: 60 },
    pro: { text: 1583, image: 328 },
    vanguard_pro: { text: 1583, image: 328 },
};

const checkAndResetUsage = () => {
    const lastMonth = localStorage.getItem(DATE_KEY);
    const thisMonth = getThisMonth();
    if (lastMonth !== thisMonth) {
        console.log('New month, resetting query counts.');
        localStorage.setItem(TEXT_COUNT_KEY, '0');
        localStorage.setItem(IMAGE_COUNT_KEY, '0');
        localStorage.setItem(DATE_KEY, thisMonth);
    }
};

const getTier = (): UserTier => {
    return (localStorage.getItem(TIER_KEY) as UserTier) || 'free';
};

const getUsage = (): Usage => {
    checkAndResetUsage();
    const tier = getTier();
    const textCount = parseInt(localStorage.getItem(TEXT_COUNT_KEY) || '0', 10);
    const imageCount = parseInt(localStorage.getItem(IMAGE_COUNT_KEY) || '0', 10);
    const { text: textLimit, image: imageLimit } = LIMITS[tier];
    return { textCount, imageCount, textLimit, imageLimit, tier };
};

const canMakeQuery = (type: 'text' | 'image', count: number = 1): boolean => {
    const { textCount, imageCount, textLimit, imageLimit } = getUsage();
    if (type === 'text') {
        return (textCount + count) <= textLimit;
    }
    // if type is 'image'
    return (imageCount + count) <= imageLimit;
};

const incrementQueryCount = async (type: 'text' | 'image', count: number = 1) => {
    if (count === 0) return;
    checkAndResetUsage();
    
    if (type === 'text') {
        const currentCount = parseInt(localStorage.getItem(TEXT_COUNT_KEY) || '0', 10);
        localStorage.setItem(TEXT_COUNT_KEY, (currentCount + count).toString());
    } else {
        const currentCount = parseInt(localStorage.getItem(IMAGE_COUNT_KEY) || '0', 10);
        localStorage.setItem(IMAGE_COUNT_KEY, (currentCount + count).toString());
    }

    // Sync to Supabase if user is authenticated
    try {
        const authState = authService.getAuthState();
        if (authState.user) {
            const currentUsage = getUsage();
            await databaseService.saveUsage(currentUsage, authState.user.id);
        }
    } catch (error) {
        console.error('Error syncing usage to Supabase:', error);
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
        // Update in Supabase
        await supabaseDataService.updateUserUsage('tier', 'pro');
        await supabaseDataService.updateUserUsage('textCount', 0);
        await supabaseDataService.updateUserUsage('imageCount', 0);
        await supabaseDataService.updateUserUsage('lastMonth', getThisMonth());
        
        // Also update localStorage as backup
        localStorage.setItem(TIER_KEY, 'pro');
        localStorage.setItem(TEXT_COUNT_KEY, '0');
        localStorage.setItem(TEXT_COUNT_KEY, '0');
        localStorage.setItem(DATE_KEY, getThisMonth());
        
        console.log('User upgraded to Pro tier. Resetting counts for new limits.');
    } catch (error) {
        console.warn('Failed to upgrade to Pro in Supabase, using localStorage only:', error);
        
        // Fallback to localStorage only
        localStorage.setItem(TIER_KEY, 'pro');
        localStorage.setItem(TEXT_COUNT_KEY, '0');
        localStorage.setItem(IMAGE_COUNT_KEY, '0');
        localStorage.setItem(DATE_KEY, getThisMonth());
        console.log('User upgraded to Pro tier (localStorage fallback). Resetting counts for new limits.');
    }
};

const upgradeToVanguard = async () => {
    try {
        // Update in Supabase
        await supabaseDataService.updateUserUsage('tier', 'vanguard_pro');
        await supabaseDataService.updateUserUsage('textCount', 0);
        await supabaseDataService.updateUserUsage('imageCount', 0);
        await supabaseDataService.updateUserUsage('lastMonth', getThisMonth());
        
        // Also update localStorage as backup
        localStorage.setItem(TIER_KEY, 'vanguard_pro');
        localStorage.setItem(TEXT_COUNT_KEY, '0');
        localStorage.setItem(IMAGE_COUNT_KEY, '0');
        localStorage.setItem(DATE_KEY, getThisMonth());
        
        console.log('User upgraded to Vanguard Pro tier.');
    } catch (error) {
        console.warn('Failed to upgrade to Vanguard in Supabase, using localStorage only:', error);
        
        // Fallback to localStorage only
        localStorage.setItem(TIER_KEY, 'vanguard_pro');
        localStorage.setItem(TEXT_COUNT_KEY, '0');
        localStorage.setItem(IMAGE_COUNT_KEY, '0');
        localStorage.setItem(DATE_KEY, getThisMonth());
        console.log('User upgraded to Vanguard Pro tier (localStorage fallback).');
    }
};

const switchToFree = () => {
    localStorage.setItem(TIER_KEY, 'free');
    localStorage.setItem(TEXT_COUNT_KEY, '0');
    localStorage.setItem(IMAGE_COUNT_KEY, '0');
    localStorage.setItem(DATE_KEY, getThisMonth());
    console.log('Switched to Free tier for testing.');
};

const switchToPro = () => {
    localStorage.setItem(TIER_KEY, 'pro');
    localStorage.setItem(TEXT_COUNT_KEY, '0');
    localStorage.setItem(IMAGE_COUNT_KEY, '0');
    localStorage.setItem(DATE_KEY, getThisMonth());
    console.log('Switched to Pro tier for testing.');
};

const switchToVanguard = () => {
    localStorage.setItem(TIER_KEY, 'vanguard_pro');
    localStorage.setItem(TEXT_COUNT_KEY, '0');
    localStorage.setItem(IMAGE_COUNT_KEY, '0');
    localStorage.setItem(DATE_KEY, getThisMonth());
    console.log('Switched to Vanguard tier for testing.');
};

const reset = () => {
    localStorage.removeItem(TIER_KEY);
    localStorage.removeItem(TEXT_COUNT_KEY);
    localStorage.removeItem(IMAGE_COUNT_KEY);
    localStorage.removeItem(DATE_KEY);
};

/**
 * Load usage from Supabase and sync with local storage
 */
const syncFromSupabase = async (): Promise<Usage | null> => {
    try {
        const authState = authService.getAuthState();
        if (!authState.user) {
            return null;
        }

        const supabaseUsage = await databaseService.loadUsage(authState.user.id);
        if (supabaseUsage) {
            // Update local storage with Supabase data
            localStorage.setItem(TIER_KEY, supabaseUsage.tier);
            localStorage.setItem(TEXT_COUNT_KEY, supabaseUsage.textCount.toString());
            localStorage.setItem(IMAGE_COUNT_KEY, supabaseUsage.imageCount.toString());
            
            // Return the synced usage
            return {
                textCount: supabaseUsage.textCount,
                imageCount: supabaseUsage.imageCount,
                textLimit: supabaseUsage.textLimit,
                imageLimit: supabaseUsage.imageLimit,
                tier: supabaseUsage.tier as UserTier,
            };
        }
        return null;
    } catch (error) {
        console.error('Error syncing from Supabase:', error);
        return null;
    }
};

/**
 * Get usage, prioritizing Supabase if available
 */
const getUsageWithSync = async (): Promise<Usage> => {
    // Try to sync from Supabase first
    const supabaseUsage = await syncFromSupabase();
    if (supabaseUsage) {
        return supabaseUsage;
    }
    
    // Fall back to local storage
    return getUsage();
};

export const unifiedUsageService = {
    getTier,
    getUsage,
    getUsageWithSync,
    canMakeQuery,
    incrementQueryCount,
    getDaysUntilReset,
    upgradeToPro,
    upgradeToVanguard,
    switchToFree,
    switchToPro,
    switchToVanguard,
    reset,
    syncFromSupabase,
};
