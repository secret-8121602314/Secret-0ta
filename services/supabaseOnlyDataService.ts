import { supabase } from './supabase';

export interface UserData {
  onboardingComplete: boolean;
  profileSetupCompleted: boolean;
  hasSeenSplashScreens: boolean;
  welcomeMessageShown: boolean;
  firstWelcomeShown: boolean;
  hasConversations: boolean;
  hasInteractedWithChat: boolean;
  lastSessionDate: string;
  lastWelcomeTime: string;
  appClosedTime: string;
  firstRunCompleted: boolean;
  hasConnectedBefore: boolean;
  installDismissed: boolean;
  showSplashAfterLogin: boolean;
  lastSuggestedPromptsShown: string;
  conversations: any[];
  conversationsOrder: string[];
  activeConversation: string;
  appState: any;
  preferences: any;
}

export class SupabaseOnlyDataService {
  private static instance: SupabaseOnlyDataService;
  private userId: string | null = null;
  private userData: UserData | null = null;

  private constructor() {}

  static getInstance(): SupabaseOnlyDataService {
    if (!SupabaseOnlyDataService.instance) {
      SupabaseOnlyDataService.instance = new SupabaseOnlyDataService();
    }
    return SupabaseOnlyDataService.instance;
  }

  // Initialize with current user
  async initialize(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id || null;
    
    if (this.userId) {
      await this.loadUserData();
    }
  }

  // Load user data from Supabase
  private async loadUserData(): Promise<void> {
    if (!this.userId) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('app_state, preferences')
        .eq('auth_user_id', this.userId)
        .single();

      if (error) {
        console.warn('Failed to load user data:', error);
        this.userData = this.getDefaultUserData();
        return;
      }

      this.userData = {
        onboardingComplete: data.app_state?.onboardingComplete || false,
        profileSetupCompleted: data.app_state?.profileSetupCompleted || false,
        hasSeenSplashScreens: data.app_state?.hasSeenSplashScreens || false,
        welcomeMessageShown: data.app_state?.welcomeMessageShown || false,
        firstWelcomeShown: data.app_state?.firstWelcomeShown || false,
        hasConversations: data.app_state?.hasConversations || false,
        hasInteractedWithChat: data.app_state?.hasInteractedWithChat || false,
        lastSessionDate: data.app_state?.lastSessionDate || '',
        lastWelcomeTime: data.app_state?.lastWelcomeTime || '',
        appClosedTime: data.app_state?.appClosedTime || '',
        firstRunCompleted: data.app_state?.firstRunCompleted || false,
        hasConnectedBefore: data.app_state?.hasConnectedBefore || false,
        installDismissed: data.app_state?.installDismissed || false,
        showSplashAfterLogin: data.app_state?.showSplashAfterLogin || false,
        lastSuggestedPromptsShown: data.app_state?.lastSuggestedPromptsShown || '',
        conversations: data.app_state?.conversations || [],
        conversationsOrder: data.app_state?.conversationsOrder || [],
        activeConversation: data.app_state?.activeConversation || '',
        appState: data.app_state || {},
        preferences: data.preferences || {}
      };
    } catch (error) {
      console.warn('Failed to load user data:', error);
      this.userData = this.getDefaultUserData();
    }
  }

  // Get default user data
  private getDefaultUserData(): UserData {
    return {
      onboardingComplete: false,
      profileSetupCompleted: false,
      hasSeenSplashScreens: false,
      welcomeMessageShown: false,
      firstWelcomeShown: false,
      hasConversations: false,
      hasInteractedWithChat: false,
      lastSessionDate: '',
      lastWelcomeTime: '',
      appClosedTime: '',
      firstRunCompleted: false,
      hasConnectedBefore: false,
      installDismissed: false,
      showSplashAfterLogin: false,
      lastSuggestedPromptsShown: '',
      conversations: [],
      conversationsOrder: [],
      activeConversation: '',
      appState: {},
      preferences: {}
    };
  }

  // Save user data to Supabase
  private async saveUserData(): Promise<void> {
    if (!this.userId || !this.userData) return;

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          auth_user_id: this.userId,
          app_state: this.userData.appState,
          preferences: this.userData.preferences,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to save user data:', error);
      }
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }

  // Generic getter for user data
  get<K extends keyof UserData>(key: K): UserData[K] {
    return this.userData?.[key] ?? this.getDefaultUserData()[key];
  }

  // Generic setter for user data
  async set<K extends keyof UserData>(key: K, value: UserData[K]): Promise<void> {
    if (!this.userData) {
      this.userData = this.getDefaultUserData();
    }
    
    this.userData[key] = value;
    this.userData.appState[key] = value;
    
    await this.saveUserData();
  }

  // Specific methods for common operations
  async setOnboardingComplete(value: boolean): Promise<void> {
    await this.set('onboardingComplete', value);
  }

  async setProfileSetupCompleted(value: boolean): Promise<void> {
    await this.set('profileSetupCompleted', value);
  }

  async setHasSeenSplashScreens(value: boolean): Promise<void> {
    await this.set('hasSeenSplashScreens', value);
  }

  async setWelcomeMessageShown(value: boolean): Promise<void> {
    await this.set('welcomeMessageShown', value);
  }

  async setFirstWelcomeShown(value: boolean): Promise<void> {
    await this.set('firstWelcomeShown', value);
  }

  async setHasConversations(value: boolean): Promise<void> {
    await this.set('hasConversations', value);
  }

  async setHasInteractedWithChat(value: boolean): Promise<void> {
    await this.set('hasInteractedWithChat', value);
  }

  async setLastSessionDate(value: string): Promise<void> {
    await this.set('lastSessionDate', value);
  }

  async setLastWelcomeTime(value: string): Promise<void> {
    await this.set('lastWelcomeTime', value);
  }

  async setAppClosedTime(value: string): Promise<void> {
    await this.set('appClosedTime', value);
  }

  async setFirstRunCompleted(value: boolean): Promise<void> {
    await this.set('firstRunCompleted', value);
  }

  async setHasConnectedBefore(value: boolean): Promise<void> {
    await this.set('hasConnectedBefore', value);
  }

  async setInstallDismissed(value: boolean): Promise<void> {
    await this.set('installDismissed', value);
  }

  // REMOVED: setShowSplashAfterLogin - no longer needed
  // Users who log back in should go directly to main app, not see splash screens

  async setLastSuggestedPromptsShown(value: string): Promise<void> {
    await this.set('lastSuggestedPromptsShown', value);
  }

  async setConversations(value: any[]): Promise<void> {
    await this.set('conversations', value);
  }

  async setConversationsOrder(value: string[]): Promise<void> {
    await this.set('conversationsOrder', value);
  }

  async setActiveConversation(value: string): Promise<void> {
    await this.set('activeConversation', value);
  }

  // Clear all user data (for reset/logout with delete)
  async clearAllData(): Promise<void> {
    this.userData = this.getDefaultUserData();
    await this.saveUserData();
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.userId;
  }

  // Get user ID
  getUserId(): string | null {
    return this.userId;
  }
}

export const supabaseOnlyDataService = SupabaseOnlyDataService.getInstance();
