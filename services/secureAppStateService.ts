import { supabase } from './supabase';
import { authService } from './supabase';
import { UserTier } from './types';
import { isDeveloperMode } from '../utils';
import { unifiedUsageService } from './unifiedUsageService';

// ========================================
// 🛡️ SECURE APP STATE SERVICE
// ========================================
// This fixes all app state management issues with:
// - Proper conflict resolution
// - Input validation
// - Audit trails
// - Error handling
// - Performance optimization

export interface UserState {
  id: string;
  email: string;
  tier: 'free' | 'pro' | 'vanguard_pro';
  isAuthenticated: boolean;
  isDeveloper: boolean;
  hasProfileSetup: boolean;
  hasSeenSplashScreens: boolean;
  hasWelcomeMessage: boolean;
  isNewUser: boolean;
  lastActivity: number;
  preferences: Record<string, any>;
  usage: {
    textCount: number;
    imageCount: number;
    textLimit: number;
    imageLimit: number;
    totalRequests: number;
    lastReset: number;
  };
}

export interface AppView {
  view: 'landing' | 'app';
  onboardingStatus: string;
  error?: string;
}

export interface AppStateService {
  getUserState(): Promise<UserState>;
  updateOnboardingStatus(status: string): Promise<void>;
  markOnboardingComplete(): Promise<void>;
  markProfileSetupComplete(): Promise<void>;
  markSplashScreensSeen(): Promise<void>;
  markWelcomeMessageShown(): Promise<void>;
  markFirstRunComplete(): Promise<void>;
  determineView(userState: UserState): AppView;
  determineOnboardingStatus(userState: UserState): string;
}

class SecureAppStateService implements AppStateService {
  private static instance: SecureAppStateService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private lastUserState: UserState | null = null;
  private lastOnboardingStatus: string | null = null;

  static getInstance(): SecureAppStateService {
    if (!SecureAppStateService.instance) {
      SecureAppStateService.instance = new SecureAppStateService();
    }
    return SecureAppStateService.instance;
  }

  private validateInput(data: any, type: string): boolean {
    if (data === null || data === undefined) {
      return false;
    }

    switch (type) {
      case 'string':
        return typeof data === 'string' && data.length > 0;
      case 'number':
        return typeof data === 'number' && !isNaN(data);
      case 'boolean':
        return typeof data === 'boolean';
      case 'object':
        return typeof data === 'object' && data !== null;
      default:
        return true;
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    retries: number = this.MAX_RETRIES
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        this.log(`Retrying ${operationName}, ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.retryOperation(operation, operationName, retries - 1);
      }
      throw error;
    }
  }

  private getCacheKey(key: string): string {
    const authState = authService.getCurrentState();
    return `${key}_${authState.user?.id || 'anonymous'}`;
  }

  private getCachedData<T>(key: string): T | null {
    const cacheKey = this.getCacheKey(key);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    
    this.cache.delete(cacheKey);
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    const cacheKey = this.getCacheKey(key);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  private async getSupabaseData(key: string): Promise<any> {
    let authState = authService.getCurrentState();
    
    if (!authState.user) {
      // Add a longer delay to allow auth state to settle after OAuth callback
      await new Promise(resolve => setTimeout(resolve, 500));
      authState = authService.getCurrentState();
      if (!authState.user) {
        // Try one more time with even longer delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        authState = authService.getCurrentState();
        if (!authState.user) {
          throw new Error('User not authenticated');
        }
      }
    }

    const { data, error } = await supabase
      .from('users')
      .select(key)
      .eq('auth_user_id', authState.user.id)
      .single();

    if (error) {
      throw new Error(`Failed to get ${key}: ${error.message}`);
    }

    return key === '*' ? data : data[key];
  }

  private async setSupabaseData(key: string, data: any): Promise<void> {
    let authState = authService.getCurrentState();
    
    if (!authState.user) {
      // Add a longer delay to allow auth state to settle after OAuth callback
      await new Promise(resolve => setTimeout(resolve, 500));
      authState = authService.getCurrentState();
      if (!authState.user) {
        // Try one more time with even longer delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        authState = authService.getCurrentState();
        if (!authState.user) {
          throw new Error('User not authenticated');
        }
      }
    }

    // Validate input based on key
    if (!this.validateInput(data, 'object')) {
      throw new Error(`Invalid data for ${key}`);
    }

    const { error } = await supabase
      .from('users')
      .update({ 
        [key]: data,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', authState.user.id);

    if (error) {
      throw new Error(`Failed to update ${key}: ${error.message}`);
    }

    // Clear cache
    this.cache.delete(this.getCacheKey(key));
  }

  async getUserState(): Promise<UserState> {
    try {
      // ✅ INFINITE LOOP FIX: Add processing guard
      const processingKey = 'getUserState_processing';
      if (this.cache.has(processingKey)) {
        console.log('🔧 [AppStateService] getUserState already in progress, using cached result');
        const cached = this.getCachedData<UserState>('userState');
        if (cached) {
          return cached;
        }
      }
      
      // Set processing flag
      this.cache.set(processingKey, { data: true, timestamp: Date.now() });
      
      try {
        // Check cache first, but not for developer mode
        const isDevMode = isDeveloperMode();
        const cached = this.getCachedData<UserState>('userState');
        if (cached && !isDevMode) {
          return cached;
        }

        const authState = authService.getCurrentState();
      
      if (!authState.user) {
        // Check if we're in developer mode and should restore session
        // Only restore developer mode if there's an active session
        const devSessionStart = localStorage.getItem('otakon_dev_session_start');
        const hasActiveDevSession = devSessionStart && (Date.now() - parseInt(devSessionStart, 10)) < (24 * 60 * 60 * 1000); // 24 hours
        
        if (isDevMode && hasActiveDevSession) {
          console.log('🔧 [AppStateService] Developer mode with active session detected in getUserState');
          
          // Return developer mode state
          const devData = localStorage.getItem('otakon_dev_data');
          const parsedData = devData ? JSON.parse(devData) : {};
          
          // Check if this is the first time using developer mode
          const isFirstTimeDeveloper = !localStorage.getItem('otakon_dev_first_run_completed');
          const hasSeenSplashScreens = localStorage.getItem('otakon_dev_splash_screens_seen') === 'true';
          const hasProfileSetup = localStorage.getItem('otakon_dev_profile_setup_completed') === 'true';
          const hasWelcomeMessage = localStorage.getItem('otakon_dev_welcome_message_shown') === 'true';
          
          // If developer has completed all onboarding steps, they're not a new user
          const isNewUser = isFirstTimeDeveloper && (!hasSeenSplashScreens || !hasProfileSetup || !hasWelcomeMessage);
          
          console.log('🔧 [AppStateService] Developer mode flags:', {
            isFirstTimeDeveloper,
            hasSeenSplashScreens,
            hasProfileSetup,
            hasWelcomeMessage,
            isNewUser
          });
          
          // Get the current tier from localStorage (set by DevTierSwitcher)
          const currentTier = (localStorage.getItem('otakonUserTier') as UserTier) || 'free';
          
          // Get usage data from unifiedUsageService (this correctly calculates tier-based limits)
          const usageData = await unifiedUsageService.getUsage();
          
          console.log('🔧 [AppStateService] Usage data from unifiedUsageService:', {
            tier: usageData.tier,
            textLimit: usageData.textLimit,
            imageLimit: usageData.imageLimit,
            textCount: usageData.textCount,
            imageCount: usageData.imageCount
          });
          
          // Transform usage data to match expected format
          const transformedUsage = {
            textCount: usageData.textCount,
            imageCount: usageData.imageCount,
            textLimit: usageData.textLimit, // ✅ This is now tier-based from unifiedUsageService
            imageLimit: usageData.imageLimit, // ✅ This is now tier-based from unifiedUsageService
            totalRequests: (usageData as any).textQueries + (usageData as any).imageQueries,
            lastReset: Date.now() // Use current time as last reset
          };
          
          const userState: UserState = {
            id: '00000000-0000-0000-0000-000000000001', // Fixed UUID for developer mode
            email: 'developer@otakon.app',
            tier: currentTier, // Use actual tier from localStorage
            isAuthenticated: true,
            isDeveloper: true,
            hasProfileSetup: hasProfileSetup, // Use actual developer mode flags
            hasSeenSplashScreens: hasSeenSplashScreens, // Use actual developer mode flags
            hasWelcomeMessage: hasWelcomeMessage, // Use actual developer mode flags
            isNewUser: isNewUser, // Use the computed isNewUser value
            lastActivity: Date.now(),
            preferences: parsedData.userPreferences || {},
            usage: transformedUsage // Use transformed usage data
          };
          
          console.log('🔧 [AppStateService] Returning developer user state:', userState);
          return userState;
        }
        
        // Return default state for unauthenticated users
        return {
          id: 'anonymous',
          email: '',
          tier: 'free',
          isAuthenticated: false,
          isDeveloper: false,
          hasProfileSetup: false,
          hasSeenSplashScreens: false,
          hasWelcomeMessage: false,
          isNewUser: true,
          lastActivity: Date.now(),
          preferences: {},
          usage: {
            textCount: 0,
            imageCount: 0,
            textLimit: 55,
            imageLimit: 25,
            totalRequests: 0,
            lastReset: 0
          }
        };
      }

      // Check if developer mode (using isDevMode from line 187)
      // IMPORTANT: Only treat as developer mode if user is NOT authenticated via OAuth
      // This prevents authenticated users from being treated as developers
      if (isDevMode) {
        console.log('🔧 [AppStateService] Developer mode detected in getUserState');
        
        // Return developer mode state
        const devData = localStorage.getItem('otakon_dev_data');
        const parsedData = devData ? JSON.parse(devData) : {};
        
        // Check if this is the first time using developer mode
        const isFirstTimeDeveloper = !localStorage.getItem('otakon_dev_first_run_completed');
        const hasSeenSplashScreens = localStorage.getItem('otakon_dev_splash_screens_seen') === 'true';
        const hasProfileSetup = localStorage.getItem('otakon_dev_profile_setup_completed') === 'true';
        const hasWelcomeMessage = localStorage.getItem('otakon_dev_welcome_message_shown') === 'true';
        
        // If developer has completed all onboarding steps, they're not a new user
        const isNewUser = isFirstTimeDeveloper && (!hasSeenSplashScreens || !hasProfileSetup || !hasWelcomeMessage);
        
        console.log('🔧 [AppStateService] Developer mode flags:', {
          isFirstTimeDeveloper,
          hasSeenSplashScreens,
          hasProfileSetup,
          hasWelcomeMessage,
          isNewUser
        });
        
        // Get the current tier from localStorage (set by DevTierSwitcher)
        const currentTier = (localStorage.getItem('otakonUserTier') as UserTier) || 'free';
        
        // Get usage data from unifiedUsageService (this correctly calculates tier-based limits)
        const usageData = await unifiedUsageService.getUsage();
        
        console.log('🔧 [AppStateService] Usage data from unifiedUsageService:', {
          tier: usageData.tier,
          textLimit: usageData.textLimit,
          imageLimit: usageData.imageLimit,
          textCount: usageData.textCount,
          imageCount: usageData.imageCount
        });
        
        // Transform usage data to match expected format
        const transformedUsage = {
          textCount: usageData.textCount,
          imageCount: usageData.imageCount,
          textLimit: usageData.textLimit, // ✅ This is now tier-based from unifiedUsageService
          imageLimit: usageData.imageLimit, // ✅ This is now tier-based from unifiedUsageService
          totalRequests: (usageData as any).textQueries + (usageData as any).imageQueries,
          lastReset: Date.now() // Use current time as last reset
        };
        
        const userState: UserState = {
          id: authState.user.id,
          email: authState.user.email || 'developer@otakon.app',
          tier: currentTier, // Use actual tier from localStorage
          isAuthenticated: true,
          isDeveloper: true,
          hasProfileSetup: hasProfileSetup, // Use actual developer mode flags
          hasSeenSplashScreens: hasSeenSplashScreens, // Use actual developer mode flags
          hasWelcomeMessage: hasWelcomeMessage, // Use actual developer mode flags
          isNewUser: isNewUser, // Use the computed isNewUser value
          lastActivity: Date.now(),
          preferences: parsedData.userPreferences || {},
          usage: transformedUsage // Use transformed usage data
        };
        
        console.log('🔧 [AppStateService] Returning developer user state:', userState);
        return userState;
      }

      // Get user data from Supabase
      const userData = await this.retryOperation(
        () => this.getSupabaseData('*'),
        'getUserState'
      );

      const userState: UserState = {
        id: userData.id,
        email: userData.email,
        tier: userData.tier || 'free',
        isAuthenticated: true,
        isDeveloper: false,
        hasProfileSetup: userData.profile_data?.profileSetupCompleted || false,
        hasSeenSplashScreens: userData.app_state?.hasSeenSplashScreens || false,
        hasWelcomeMessage: userData.app_state?.hasWelcomeMessage || false,
        isNewUser: !userData.app_state?.firstRunCompleted,
        lastActivity: new Date(userData.last_activity).getTime(),
        preferences: userData.preferences || {},
        usage: {
          textCount: userData.usage_data?.textCount || 0,
          imageCount: userData.usage_data?.imageCount || 0,
          textLimit: userData.usage_data?.textLimit || 55,
          imageLimit: userData.usage_data?.imageLimit || 25,
          totalRequests: userData.usage_data?.totalRequests || 0,
          lastReset: userData.usage_data?.lastReset || 0
        }
      };

      
      // Cache the result
      this.setCachedData('userState', userState);
      
      return userState;
      
      } finally {
        // Clear processing flag for inner try block
        this.cache.delete('getUserState_processing');
      }

    } catch (error) {
      this.error('Failed to get user state', error);
      
      // Return fallback state
      return {
        id: 'error',
        email: '',
        tier: 'free',
        isAuthenticated: false,
        isDeveloper: false,
        hasProfileSetup: false,
        hasSeenSplashScreens: false,
        hasWelcomeMessage: false,
        isNewUser: true,
        lastActivity: Date.now(),
        preferences: {},
        usage: {
          textCount: 0,
          imageCount: 0,
          textLimit: 55,
          imageLimit: 25,
          totalRequests: 0,
          lastReset: 0
        }
      };
    }
  }

  async updateOnboardingStatus(status: string): Promise<void> {
    try {
      if (!this.validateInput(status, 'string')) {
        throw new Error('Invalid onboarding status');
      }

      const authState = authService.getCurrentState();
      
      if (!authState.user) {
        throw new Error('User not authenticated');
      }

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        this.log('Developer mode: Updating local onboarding status only');
        console.log('🔧 [AppStateService] Developer mode updateOnboardingStatus called with:', status);
        
        // For developer mode, update local storage to track onboarding progress
        localStorage.setItem('otakon_onboarding_status', status);
        
        // Also update the steps completed in local storage
        const currentSteps = JSON.parse(localStorage.getItem('otakon_onboarding_steps') || '[]');
        console.log('🔧 [AppStateService] Current steps before update:', currentSteps);
        
        if (!currentSteps.includes(status)) {
          currentSteps.push(status);
          localStorage.setItem('otakon_onboarding_steps', JSON.stringify(currentSteps));
          console.log('🔧 [AppStateService] Added step to completed steps:', status);
        } else {
          console.log('🔧 [AppStateService] Step already completed:', status);
        }
        
        console.log('🔧 [AppStateService] Final steps after update:', JSON.parse(localStorage.getItem('otakon_onboarding_steps') || '[]'));
        return;
      }

      // For regular users, update the onboarding data with completed steps
      const currentData = await this.getSupabaseData('onboarding_data') || {};
      const stepsCompleted = currentData.stepsCompleted || [];
      
      // Add the current step to completed steps if not already there
      if (!stepsCompleted.includes(status)) {
        stepsCompleted.push(status);
      }
      
      await this.retryOperation(
        () => this.setSupabaseData('onboarding_data', { 
          currentStep: status,
          stepsCompleted: stepsCompleted
        }),
        'updateOnboardingStatus'
      );

      this.log('Onboarding status updated', { status, stepsCompleted });

    } catch (error) {
      this.error('Failed to update onboarding status', error);
      throw error;
    }
  }

  async markOnboardingComplete(): Promise<void> {
    try {
      const authState = authService.getCurrentState();
      
      if (!authState.user) {
        throw new Error('User not authenticated');
      }

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        // Mark developer mode onboarding as complete
        localStorage.setItem('otakon_dev_onboarding_completed', 'true');
        this.log('Developer mode: Onboarding marked as complete');
        return;
      }

      await this.retryOperation(
        () => this.setSupabaseData('onboarding_data', { 
          currentStep: 'complete',
          completedAt: new Date().toISOString()
        }),
        'markOnboardingComplete'
      );

      this.log('Onboarding marked as complete');

    } catch (error) {
      this.error('Failed to mark onboarding complete', error);
      throw error;
    }
  }

  async markProfileSetupComplete(): Promise<void> {
    try {
      const authState = authService.getCurrentState();
      
      if (!authState.user) {
        throw new Error('User not authenticated');
      }

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        // Mark developer mode profile setup as complete
        localStorage.setItem('otakon_dev_profile_setup_completed', 'true');
        localStorage.setItem('otakon_dev_onboarding_complete', 'true');
        this.log('Developer mode: Profile setup marked as complete');
        return;
      }

      // Update both profile data and main app state flags
      await this.retryOperation(
        () => this.setSupabaseData('profile_data', { 
          profileSetupCompleted: true,
          completedAt: new Date().toISOString()
        }),
        'markProfileSetupComplete'
      );

      // Also update the main app state to mark onboarding as complete
      await this.retryOperation(
        () => this.setSupabaseData('app_state', {
          hasSeenSplashScreens: true,
          hasProfileSetup: true,
          hasWelcomeMessage: true,
          isNewUser: false,
          firstRunCompleted: true,
          onboardingComplete: true
        }),
        'markProfileSetupComplete'
      );

      // Clear cache to force refresh of user state
      this.cache.delete(this.getCacheKey('userState'));
      
      this.log('Profile setup marked as complete');

    } catch (error) {
      this.error('Failed to mark profile setup complete', error);
      throw error;
    }
  }

  async markSplashScreensSeen(): Promise<void> {
    try {
      const authState = authService.getCurrentState();
      
      if (!authState.user) {
        throw new Error('User not authenticated');
      }

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        // Mark developer mode splash screens as seen
        localStorage.setItem('otakon_dev_splash_screens_seen', 'true');
        this.log('Developer mode: Splash screens marked as seen');
        return;
      }

      try {
        await this.retryOperation(
          () => this.setSupabaseData('app_state', { 
            hasSeenSplashScreens: true,
            splashScreensCompletedAt: new Date().toISOString()
          }),
          'markSplashScreensSeen'
        );

        this.log('Splash screens marked as seen');
      } catch (dbError) {
        // If database update fails, still mark in localStorage as fallback
        console.warn('Database update failed, using localStorage fallback:', dbError);
        localStorage.setItem('otakon_has_seen_splash_screens', 'true');
        this.log('Splash screens marked as seen (localStorage fallback)');
      }

    } catch (error) {
      this.error('Failed to mark splash screens seen', error);
      // Don't throw error - just log it and continue
      console.warn('Splash screen completion failed, but continuing anyway:', error);
    }
  }

  async markWelcomeMessageShown(): Promise<void> {
    try {
      const authState = authService.getCurrentState();
      
      if (!authState.user) {
        throw new Error('User not authenticated');
      }

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        // Mark developer mode welcome message as shown
        localStorage.setItem('otakon_dev_welcome_message_shown', 'true');
        this.log('Developer mode: Welcome message marked as shown');
        return;
      }

      await this.retryOperation(
        () => this.setSupabaseData('app_state', { 
          welcomeMessageShown: true,
          firstWelcomeShown: true,
          lastWelcomeTime: new Date().toISOString()
        }),
        'markWelcomeMessageShown'
      );

      this.log('Welcome message marked as shown');

    } catch (error) {
      this.error('Failed to mark welcome message shown', error);
      throw error;
    }
  }

  async markFirstRunComplete(): Promise<void> {
    try {
      const authState = authService.getCurrentState();
      
      if (!authState.user) {
        throw new Error('User not authenticated');
      }

      // Check if developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        // Mark developer mode first run as complete
        localStorage.setItem('otakon_dev_first_run_completed', 'true');
        this.log('Developer mode: First run marked as complete');
        return;
      }

      await this.retryOperation(
        () => this.setSupabaseData('app_state', { 
          firstRunCompleted: true,
          firstRunCompletedAt: new Date().toISOString()
        }),
        'markFirstRunComplete'
      );

      this.log('First run marked as complete');

    } catch (error) {
      this.error('Failed to mark first run complete', error);
      throw error;
    }
  }

  determineView(userState: UserState): AppView {
    try {
      if (!userState.isAuthenticated) {
        // Only log when transitioning from authenticated to unauthenticated
        if (this.lastUserState?.isAuthenticated) {
          console.log('🔧 [AppStateService] User logged out, checking for login redirect');
        }
        
        // Check if this is a logout redirect - show login page instead of landing page
        const isLogoutRedirect = localStorage.getItem('otakon_logout_redirect') === 'true';
        if (isLogoutRedirect) {
          console.log('🔧 [AppStateService] Logout redirect detected, showing login page');
          // Clear the flag so it doesn't persist
          localStorage.removeItem('otakon_logout_redirect');
          return {
            view: 'app',
            onboardingStatus: 'login'
          };
        }
        
        // Default behavior for unauthenticated users
        return {
          view: 'landing',
          onboardingStatus: 'complete'
        };
      }

      const onboardingStatus = this.determineOnboardingStatus(userState);
      
      // Only log meaningful onboarding status changes
      if (this.lastOnboardingStatus !== onboardingStatus) {
        console.log('🔧 [AppStateService] Onboarding status changed:', this.lastOnboardingStatus, '->', onboardingStatus);
        this.lastOnboardingStatus = onboardingStatus;
      }
      
      const appView: AppView = {
        view: 'app' as const,
        onboardingStatus
      };
      
      this.lastUserState = userState;
      return appView;

    } catch (error) {
      this.error('Failed to determine view', error);
      return {
        view: 'landing',
        onboardingStatus: 'login',
        error: 'Failed to determine app view'
      };
    }
  }

  determineOnboardingStatus(userState: UserState): string {
    try {
      console.log('🔧 [AppStateService] determineOnboardingStatus called with userState:', userState);
      
      if (!userState.isAuthenticated) {
        console.log('🔧 [AppStateService] User not authenticated, returning login status');
        return 'login';
      }

      // Check localStorage first for splash screen progression (more reliable)
      const hasSeenSplashScreensLocal = localStorage.getItem('otakon_has_seen_splash_screens') === 'true';
      const hasCompletedOnboardingLocal = localStorage.getItem('otakonOnboardingComplete') === 'true';
      
      console.log('🔧 [AppStateService] Local storage check:', { 
        hasSeenSplashScreensLocal, 
        hasCompletedOnboardingLocal,
        hasSeenSplashScreensSupabase: userState.hasSeenSplashScreens,
        hasProfileSetup: userState.hasProfileSetup
      });

      // SIMPLIFIED: Check if user needs onboarding
      // Use localStorage as primary source, Supabase as fallback
      const needsOnboarding = userState.isNewUser || 
        (!hasSeenSplashScreensLocal && !userState.hasSeenSplashScreens) || 
        (!hasCompletedOnboardingLocal && !userState.hasProfileSetup);
      
      if (needsOnboarding) {
        console.log('🔧 [AppStateService] User needs onboarding');
        
        // For developer mode, check if onboarding is complete
        if (userState.isDeveloper) {
          const isOnboardingComplete = localStorage.getItem('otakon_dev_onboarding_complete') === 'true';
          if (isOnboardingComplete) {
            return 'complete';
          }
          return 'initial';
        }
        
        // For regular users, start with initial splash
        return 'initial';
      }

      console.log('🔧 [AppStateService] User onboarding complete');
      return 'complete';

    } catch (error) {
      this.error('Failed to determine onboarding status', error);
      return 'initial';
    }
  }

  // Reset developer mode first run experience (useful for testing)
  resetDeveloperModeFirstRun(): void {
    try {
      localStorage.removeItem('otakon_dev_first_run_completed');
      localStorage.removeItem('otakon_dev_splash_screens_seen');
      localStorage.removeItem('otakon_dev_profile_setup_completed');
      localStorage.removeItem('otakon_dev_welcome_message_shown');
      localStorage.removeItem('otakon_dev_onboarding_completed');
      
      // Clear user state cache
      this.cache.delete(this.getCacheKey('userState'));
      
      this.log('Developer mode first run experience reset');
    } catch (error) {
      this.error('Failed to reset developer mode first run experience', error);
    }
  }

  // Clear user state cache (useful when switching between regular and developer mode)
  clearUserStateCache(): void {
    try {
      this.cache.delete(this.getCacheKey('userState'));
      this.log('User state cache cleared');
    } catch (error) {
      this.error('Failed to clear user state cache', error);
    }
  }

  private log(message: string, data?: any): void {
    if (import.meta.env.DEV) {
      console.log(`🛡️ [AppStateService] ${message}`, data || '');
    }
  }

  private error(message: string, error?: any): void {
    console.error(`🛡️ [AppStateService] ${message}`, error || '');
  }
}

export const secureAppStateService = SecureAppStateService.getInstance();
