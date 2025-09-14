import { UserTier, Usage } from './types';
import { profileService } from './profileService';

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
};

const canMakeQuery = (type: 'text' | 'image', count: number = 1): boolean => {
    const { textCount, imageCount, textLimit, imageLimit } = getUsage();
    if (type === 'text') {
        return (textCount + count) <= textLimit;
    }
    // if type is 'image'
    return (imageCount + count) <= imageLimit;
};

const incrementQueryCount = (type: 'text' | 'image', count: number = 1) => {
    if (count === 0) return;
    checkAndResetUsage();
    if (type === 'text') {
        const currentCount = parseInt(localStorage.getItem(TEXT_COUNT_KEY) || '0', 10);
        localStorage.setItem(TEXT_COUNT_KEY, (currentCount + count).toString());
    } else {
        const currentCount = parseInt(localStorage.getItem(IMAGE_COUNT_KEY) || '0', 10);
        localStorage.setItem(IMAGE_COUNT_KEY, (currentCount + count).toString());
    }
};

const getDaysUntilReset = (): number => {
    const now = new Date();
    const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const timeDiff = firstOfNextMonth.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff > 0 ? daysDiff : 1; // Ensure it's at least 1 day
};

const upgradeToPro = () => {
    localStorage.setItem(TIER_KEY, 'pro');
    console.log('User upgraded to Pro tier. Resetting counts for new limits.');
    // Reset counts so user gets full pro limits immediately
    localStorage.setItem(TEXT_COUNT_KEY, '0');
    localStorage.setItem(IMAGE_COUNT_KEY, '0');
    localStorage.setItem(DATE_KEY, getThisMonth());
};

const upgradeToVanguard = () => {
    localStorage.setItem(TIER_KEY, 'vanguard_pro');
    console.log('User upgraded to Vanguard Pro tier.');
    localStorage.setItem(TEXT_COUNT_KEY, '0');
    localStorage.setItem(IMAGE_COUNT_KEY, '0');
    localStorage.setItem(DATE_KEY, getThisMonth());
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
    profileService.reset();
};

export const usageService = {
    getTier,
    getUsage,
    canMakeQuery,
    incrementQueryCount,
    getDaysUntilReset,
    upgradeToPro,
    upgradeToVanguard,
    switchToFree,
    switchToPro,
    switchToVanguard,
    reset,
};
