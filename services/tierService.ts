import { supabase } from './supabase';
import { UserTier } from './types';

export interface TierInfo {
  tier: UserTier;
  textLimit: number;
  imageLimit: number;
  price?: number;
  features: string[];
}

export class TierService {
  private static instance: TierService;

  static getInstance(): TierService {
    if (!TierService.instance) {
      TierService.instance = new TierService();
    }
    return TierService.instance;
  }

  private readonly TIER_LIMITS: Record<UserTier, { text: number; image: number }> = {
    free: { text: 55, image: 25 },
    pro: { text: 1583, image: 328 },
    vanguard_pro: { text: 1583, image: 328 },
  };

  private readonly TIER_FEATURES: Record<UserTier, string[]> = {
    free: [
      '55 text queries per month',
      '25 image queries per month',
      'Basic conversation features',
      'Standard response quality'
    ],
    pro: [
      '1,583 text queries per month',
      '328 image queries per month',
      'Enhanced conversation features',
      'Improved response quality',
      'Priority support',
      'No ads'
    ],
    vanguard_pro: [
      '1,583 text queries per month',
      '328 image queries per month',
      'All Pro features',
      'Exclusive Vanguard content',
      'VIP support',
      'Early access to new features'
    ],
  };

  private readonly TIER_PRICES: Record<UserTier, number | undefined> = {
    free: undefined,
    pro: 3.99,
    vanguard_pro: 20.00,
  };

  /**
   * Automatically assign free tier to new users
   */
  async assignFreeTier(userId: string): Promise<boolean> {
    try {
      // Check if user already has a tier assigned in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('tier')
        .eq('auth_user_id', userId)
        .single();

      if (existingUser?.tier) {
        console.log('User already has tier assigned:', existingUser.tier);
        return true;
      }

      // Update user tier in new consolidated users table
      const { error } = await supabase
        .from('users')
        .upsert({
          auth_user_id: userId,
          tier: 'free'
        });

      if (error) {
        console.error('Error assigning free tier:', error);
        return false;
      }

      console.log('Successfully assigned free tier to user:', userId);
      return true;
    } catch (error) {
      console.error('Error in assignFreeTier:', error);
      return false;
    }
  }

  /**
   * Upgrade user to Pro tier
   */
  async upgradeToPro(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          tier: 'pro'
        })
        .eq('auth_user_id', userId);

      if (error) {
        console.error('Error upgrading to Pro:', error);
        return false;
      }

      console.log('User upgraded to Pro tier:', userId);
      return true;
    } catch (error) {
      console.error('Error in upgradeToPro:', error);
      return false;
    }
  }

  /**
   * Upgrade user to Vanguard Pro tier
   */
  async upgradeToVanguardPro(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          tier: 'vanguard_pro'
        })
        .eq('auth_user_id', userId);

      if (error) {
        console.error('Error upgrading to Vanguard Pro:', error);
        return false;
      }

      console.log('User upgraded to Vanguard Pro tier:', userId);
      return true;
    } catch (error) {
      console.error('Error in upgradeToVanguardPro:', error);
      return false;
    }
  }

  /**
   * Get current tier information for a user
   */
  async getUserTier(userId: string): Promise<TierInfo | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('tier')
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        console.error('Error getting user tier:', error);
        return null;
      }

      const tier = data.tier as UserTier;
      return {
        tier,
        textLimit: this.TIER_LIMITS[tier].text,
        imageLimit: this.TIER_LIMITS[tier].image,
        price: this.TIER_PRICES[tier],
        features: this.TIER_FEATURES[tier],
      };
    } catch (error) {
      console.error('Error in getUserTier:', error);
      return null;
    }
  }

  /**
   * Get all available tiers for display
   */
  getAllTiers(): Record<UserTier, TierInfo> {
    const tiers: Record<UserTier, TierInfo> = {} as Record<UserTier, TierInfo>;
    
    (Object.keys(this.TIER_LIMITS) as UserTier[]).forEach(tier => {
      tiers[tier] = {
        tier,
        textLimit: this.TIER_LIMITS[tier].text,
        imageLimit: this.TIER_LIMITS[tier].image,
        price: this.TIER_PRICES[tier],
        features: this.TIER_FEATURES[tier],
      };
    });

    return tiers;
  }

  /**
   * Check if user can upgrade to a specific tier
   */
  canUpgradeTo(currentTier: UserTier, targetTier: UserTier): boolean {
    const tierHierarchy: UserTier[] = ['free', 'pro', 'vanguard_pro'];
    const currentIndex = tierHierarchy.indexOf(currentTier);
    const targetIndex = tierHierarchy.indexOf(targetTier);
    
    return targetIndex > currentIndex;
  }
}

export const tierService = TierService.getInstance();
