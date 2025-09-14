// ========================================
// 🎯 SIMPLE RELIABLE STATE MANAGER
// ========================================
// Keeps all original features but fixes bugs

export type UserType = 'google' | 'discord' | 'email' | 'dev';

export interface SimpleUser {
  id: string;
  email: string;
  type: UserType;
  tier: 'free' | 'pro' | 'vanguard_pro';
  isFirstTime: boolean;
  hasCompletedOnboarding: boolean;
  hasCompletedProfileSetup: boolean;
}

export type SimpleAppState = 
  | { status: 'loading' }
  | { status: 'landing' }
  | { status: 'auth' }
  | { status: 'onboarding'; user: SimpleUser; step: OnboardingStep }
  | { status: 'chat'; user: SimpleUser; conversationId: string }
  | { status: 'error'; message: string };

export type OnboardingStep = 'splash1' | 'splash2' | 'splash3' | 'splash4' | 'splash5' | 'profile-setup';

class SimpleStateManager {
  private state: SimpleAppState = { status: 'loading' };
  private listeners: Set<(state: SimpleAppState) => void> = new Set();

  // Get current state
  getState(): SimpleAppState {
    return this.state;
  }

  // Subscribe to state changes
  subscribe(listener: (state: SimpleAppState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Update state and notify listeners
  private updateState(newState: SimpleAppState): void {
    console.log('🔄 [SimpleStateManager] State update:', newState);
    this.state = newState;
    this.listeners.forEach(listener => listener(this.state));
  }

  // Initialize app
  async initialize(): Promise<void> {
    this.updateState({ status: 'loading' });
    
    try {
      // Check if user is authenticated
      const user = await this.checkAuthentication();
      
      if (user) {
        // User is authenticated - check if they need onboarding
        if (user.isFirstTime || !user.hasCompletedOnboarding) {
          // First-time user - start onboarding
          this.updateState({ 
            status: 'onboarding', 
            user, 
            step: 'splash1' 
          });
        } else if (!user.hasCompletedProfileSetup) {
          // Returning user who needs profile setup
          this.updateState({ 
            status: 'onboarding', 
            user, 
            step: 'profile-setup' 
          });
        } else {
          // Returning user ready for chat
          this.updateState({ 
            status: 'chat', 
            user, 
            conversationId: 'default' 
          });
        }
      } else {
        // No user - show landing page
        this.updateState({ status: 'landing' });
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.updateState({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Initialization failed' 
      });
    }
  }

  // Handle authentication
  async authenticate(userType: UserType, credentials?: any): Promise<void> {
    try {
      const user = await this.performAuthentication(userType, credentials);
      
      // After authentication, check if user needs onboarding
      if (user.isFirstTime || !user.hasCompletedOnboarding) {
        this.updateState({ 
          status: 'onboarding', 
          user, 
          step: 'splash1' 
        });
      } else if (!user.hasCompletedProfileSetup) {
        this.updateState({ 
          status: 'onboarding', 
          user, 
          step: 'profile-setup' 
        });
      } else {
        this.updateState({ 
          status: 'chat', 
          user, 
          conversationId: 'default' 
        });
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      this.updateState({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Authentication failed' 
      });
    }
  }

  // Progress through onboarding steps
  nextOnboardingStep(): void {
    if (this.state.status !== 'onboarding') return;
    
    const steps: OnboardingStep[] = ['splash1', 'splash2', 'splash3', 'splash4', 'splash5', 'profile-setup'];
    const currentIndex = steps.indexOf(this.state.step);
    const nextStep = steps[currentIndex + 1];
    
    if (nextStep) {
      this.updateState({ 
        ...this.state, 
        step: nextStep 
      });
    } else {
      // Onboarding complete - go to chat
      this.updateState({ 
        status: 'chat', 
        user: this.state.user, 
        conversationId: 'default' 
      });
    }
  }

  // Complete onboarding
  completeOnboarding(): void {
    if (this.state.status !== 'onboarding') return;
    
    // Mark onboarding as complete
    this.markOnboardingComplete(this.state.user);
    
    // Go to chat
    this.updateState({ 
      status: 'chat', 
      user: this.state.user, 
      conversationId: 'default' 
    });
  }

  // Complete profile setup
  completeProfileSetup(): void {
    if (this.state.status !== 'onboarding') return;
    
    // Mark profile setup as complete
    this.markProfileSetupComplete(this.state.user);
    
    // Go to chat
    this.updateState({ 
      status: 'chat', 
      user: this.state.user, 
      conversationId: 'default' 
    });
  }

  // Go to landing page
  goToLanding(): void {
    this.updateState({ status: 'landing' });
  }

  // Enter chat
  enterChat(conversationId: string = 'default'): void {
    if (this.state.status === 'onboarding' || this.state.status === 'chat') {
      this.updateState({ 
        status: 'chat', 
        user: this.state.user, 
        conversationId 
      });
    }
  }

  // Private helper methods
  private async checkAuthentication(): Promise<SimpleUser | null> {
    // Check Supabase authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Check for developer mode
      if (localStorage.getItem('otakon_developer_mode') === 'true') {
        return {
          id: 'dev-user',
          email: 'developer@otakon.app',
          type: 'dev',
          tier: 'vanguard_pro',
          isFirstTime: !localStorage.getItem('otakon_dev_onboarding_complete'),
          hasCompletedOnboarding: localStorage.getItem('otakon_dev_onboarding_complete') === 'true',
          hasCompletedProfileSetup: localStorage.getItem('otakon_dev_profile_setup') === 'true'
        };
      }
      return null;
    }

    // Get user data from database
    const userData = await this.getUserData(user.id);
    
    return {
      id: user.id,
      email: user.email || '',
      type: this.determineUserType(user),
      tier: userData?.tier || 'free',
      isFirstTime: !userData?.onboarding_complete,
      hasCompletedOnboarding: userData?.onboarding_complete || false,
      hasCompletedProfileSetup: userData?.profile_setup_complete || false
    };
  }

  private async performAuthentication(userType: UserType, credentials?: any): Promise<SimpleUser> {
    // Implement authentication based on type
    switch (userType) {
      case 'google':
        await supabase.auth.signInWithOAuth({ provider: 'google' });
        break;
      case 'discord':
        await supabase.auth.signInWithOAuth({ provider: 'discord' });
        break;
      case 'email':
        if (credentials) {
          await supabase.auth.signInWithPassword(credentials);
        }
        break;
      case 'dev':
        localStorage.setItem('otakon_developer_mode', 'true');
        return {
          id: 'dev-user',
          email: 'developer@otakon.app',
          type: 'dev',
          tier: 'vanguard_pro',
          isFirstTime: true,
          hasCompletedOnboarding: false,
          hasCompletedProfileSetup: false
        };
    }
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication failed');
    
    return {
      id: user.id,
      email: user.email || '',
      type: this.determineUserType(user),
      tier: 'free',
      isFirstTime: true,
      hasCompletedOnboarding: false,
      hasCompletedProfileSetup: false
    };
  }

  private determineUserType(user: any): UserType {
    const provider = user.app_metadata?.provider;
    switch (provider) {
      case 'google': return 'google';
      case 'discord': return 'discord';
      default: return 'email';
    }
  }

  private async getUserData(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.warn('Failed to get user data:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  }

  private markOnboardingComplete(user: SimpleUser): void {
    if (user.type === 'dev') {
      localStorage.setItem('otakon_dev_onboarding_complete', 'true');
    } else {
      // Update database for regular users
      supabase
        .from('users')
        .update({ onboarding_complete: true })
        .eq('id', user.id);
    }
  }

  private markProfileSetupComplete(user: SimpleUser): void {
    if (user.type === 'dev') {
      localStorage.setItem('otakon_dev_profile_setup', 'true');
    } else {
      // Update database for regular users
      supabase
        .from('users')
        .update({ profile_setup_complete: true })
        .eq('id', user.id);
    }
  }
}

// Export singleton instance
export const simpleStateManager = new SimpleStateManager();

// Import Supabase
import { supabase } from './supabase';
