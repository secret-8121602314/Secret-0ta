import { StorageService } from './storageService';
import { User, Usage, UserTier } from '../types';
import { STORAGE_KEYS, TIER_LIMITS, USER_TIERS } from '../constants';

export class UserService {
  static getCurrentUser(): User | null {
    return StorageService.get(STORAGE_KEYS.USER, null);
  }

  static setCurrentUser(user: User): void {
    StorageService.set(STORAGE_KEYS.USER, user);
  }

  static createUser(email: string, tier: UserTier = USER_TIERS.FREE): User {
    const now = Date.now();
    const limits = TIER_LIMITS[tier];
    
    return {
      id: `user_${now}`,
      authUserId: `user_${now}`,
      email,
      tier,
      hasProfileSetup: false,
      hasSeenSplashScreens: false,
      hasSeenHowToUse: false,
      hasSeenFeaturesConnected: false,
      hasSeenProFeatures: false,
      pcConnected: false,
      pcConnectionSkipped: false,
      onboardingCompleted: false,
      hasWelcomeMessage: false,
      isNewUser: true,
      hasUsedTrial: false,
      lastActivity: now,
      preferences: {},
      // Add these required fields from User interface
      textCount: 0,
      imageCount: 0,
      textLimit: limits.text,
      imageLimit: limits.image,
      totalRequests: 0,
      lastReset: now,
      usage: {
        textCount: 0,
        imageCount: 0,
        textLimit: limits.text,
        imageLimit: limits.image,
        totalRequests: 0,
        lastReset: now,
        tier,
      },
      appState: {},
      profileData: {},
      onboardingData: {},
      behaviorData: {},
      feedbackData: {},
      usageData: {},
      createdAt: now,
      updatedAt: now,
    };
  }

  static updateUser(updates: Partial<User>): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const updatedUser = {
      ...currentUser,
      ...updates,
      updatedAt: Date.now(),
    };

    this.setCurrentUser(updatedUser);
  }

  static updateUsage(usage: Partial<Usage>): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return;
    }

    this.updateUser({
      usage: {
        ...currentUser.usage,
        ...usage,
      },
    });
  }

  static resetUsage(): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const limits = TIER_LIMITS[currentUser.tier];
    this.updateUsage({
      textCount: 0,
      imageCount: 0,
      totalRequests: 0,
      lastReset: Date.now(),
      textLimit: limits.text,
      imageLimit: limits.image,
    });
  }

  static canMakeRequest(type: 'text' | 'image'): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return false;
    }

    const { usage } = currentUser;
    if (type === 'text') {
      return usage.textCount < usage.textLimit;
    } else {
      return usage.imageCount < usage.imageLimit;
    }
  }

  static incrementUsage(type: 'text' | 'image'): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const updates: Partial<Usage> = {
      totalRequests: currentUser.usage.totalRequests + 1,
    };

    if (type === 'text') {
      updates.textCount = currentUser.usage.textCount + 1;
    } else {
      updates.imageCount = currentUser.usage.imageCount + 1;
    }

    this.updateUsage(updates);
  }

  static logout(): void {
    StorageService.remove(STORAGE_KEYS.USER);
  }
}

