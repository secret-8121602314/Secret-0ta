import { supabaseDataService } from './supabaseDataService';

const NAME_KEY = 'otakonUserName';

const getName = async (): Promise<string | null> => {
    try {
        // Try to get name from Supabase first
        const preferences = await supabaseDataService.getUserPreferences();
        if (preferences.profileName) {
            return preferences.profileName;
        }
        
        // Fallback to localStorage
        return localStorage.getItem(NAME_KEY);
    } catch (error) {
        console.warn('Failed to get profile name from Supabase, using localStorage fallback:', error);
        return localStorage.getItem(NAME_KEY);
    }
};

const setName = async (name: string): Promise<void> => {
    if (name.trim()) {
        try {
            // Update in Supabase
            await supabaseDataService.updateUserPreferences('profileName', name.trim());
            
            // Also update localStorage as backup
            localStorage.setItem(NAME_KEY, name.trim());
            
            console.log('✅ Profile name updated in Supabase');
        } catch (error) {
            console.warn('Failed to update profile name in Supabase, using localStorage only:', error);
            // Fallback to localStorage only
            localStorage.setItem(NAME_KEY, name.trim());
        }
    } else {
        try {
            // Clear from Supabase
            await supabaseDataService.updateUserPreferences('profileName', null);
            
            // Also clear localStorage
            localStorage.removeItem(NAME_KEY);
            
            console.log('✅ Profile name cleared from Supabase');
        } catch (error) {
            console.warn('Failed to clear profile name from Supabase, using localStorage only:', error);
            // Fallback to localStorage only
            localStorage.removeItem(NAME_KEY);
        }
    }
};

const reset = async (): Promise<void> => {
    try {
        // Clear from Supabase
        await supabaseDataService.updateUserPreferences('profileName', null);
        
        // Also clear localStorage
        localStorage.removeItem(NAME_KEY);
        
        console.log('✅ Profile reset in Supabase');
    } catch (error) {
        console.warn('Failed to reset profile in Supabase, using localStorage only:', error);
        // Fallback to localStorage only
        localStorage.removeItem(NAME_KEY);
    }
};

export const profileService = {
    getName,
    setName,
    reset,
};
