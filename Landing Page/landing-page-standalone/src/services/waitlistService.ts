import { supabase } from './supabase';

export interface WaitlistEntry {
  id?: string;
  email: string;
  created_at?: string;
  source?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export class WaitlistService {
  private static instance: WaitlistService;

  private constructor() {}

  public static getInstance(): WaitlistService {
    if (!WaitlistService.instance) {
      WaitlistService.instance = new WaitlistService();
    }
    return WaitlistService.instance;
  }

  async addToWaitlist(email: string, source: string = 'landing_page'): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('waitlist')
        .select('email')
        .eq('email', email)
        .single();

      if (existing) {
        return { success: false, error: 'Email already registered for waitlist' };
      }

      // Add to waitlist
      const { error } = await supabase
        .from('waitlist')
        .insert({
          email,
          source,
          status: 'pending'
        });

      if (error) {
        console.error('Error adding to waitlist:', error);
        return { success: false, error: 'Failed to add to waitlist' };
      }

      return { success: true };
    } catch (error) {
      console.error('Waitlist service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async getWaitlistStatus(email: string): Promise<{ status?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('status, created_at')
        .eq('email', email)
        .single();

      if (error) {
        return { error: 'Email not found in waitlist' };
      }

      return { status: data.status };
    } catch (error) {
      console.error('Error checking waitlist status:', error);
      return { error: 'Failed to check waitlist status' };
    }
  }
}

export const waitlistService = WaitlistService.getInstance();
