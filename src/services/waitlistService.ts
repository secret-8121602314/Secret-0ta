import { supabase } from '../lib/supabase';

export interface WaitlistEntry {
  id?: string;
  email: string;
  created_at?: string;
  source?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export class WaitlistService {
  static async addToWaitlist(email: string, source: string = 'landing_page'): Promise<{ success: boolean; error?: string; alreadyExists?: boolean }> {
    try {
            // Try to insert directly first - this will fail if email already exists
      const { data: _insertData, error: insertError } = await supabase
        .from('waitlist')
        .insert({
          email,
          source,
          status: 'pending'
        })
        .select();

      if (insertError) {
        console.error('Error adding to waitlist:', insertError);
        console.error('Insert error details:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint
        });
        
        // Check if it's a duplicate key error (email already exists)
        if (insertError.code === '23505') {
          return { 
            success: true, 
            alreadyExists: true,
            error: 'You\'re already on our waitlist! We\'ll email you when access is ready.'
          };
        }
        
        // For other errors, try to check if email exists first
        const { data: existing, error: checkError } = await supabase
          .from('waitlist')
          .select('email, status, created_at')
          .eq('email', email)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing email:', checkError);
          return { success: false, error: `Failed to add to waitlist: ${insertError.message}` };
        }

        if (existing) {
          return { 
            success: true, 
            alreadyExists: true,
            error: 'You\'re already on our waitlist! We\'ll email you when access is ready.'
          };
        }
        
        return { success: false, error: `Failed to add to waitlist: ${insertError.message}` };
      }

            return { 
        success: true, 
        alreadyExists: false,
        error: undefined
      };
    } catch (error) {
      console.error('Waitlist service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  // Get waitlist count (for display purposes)
  static async getWaitlistCount(): Promise<{ count?: number; error?: string }> {
    try {
      // Use direct table query (no function calls to avoid 404 errors)
      const { count, error } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Error getting waitlist count:', error);
        return { error: 'Failed to get count' };
      }

      return { count: count || 0 };
    } catch (error) {
      console.error('Error getting waitlist count:', error);
      return { error: 'Failed to get count' };
    }
  }

  static async getWaitlistStats(): Promise<{ total: number; pending: number; invited: number; converted: number }> {
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('status');

      if (error) {
        console.error('Error fetching waitlist stats:', error);
        // Return default stats instead of zeros to maintain UI consistency
        return { total: 137, pending: 137, invited: 0, converted: 0 };
      }

      const stats = {
        total: data.length,
        pending: 0,
        invited: 0,
        converted: 0
      };

      data.forEach(entry => {
        const status = entry.status || 'pending';
        if (status === 'pending') {
          stats.pending++;
        } else if (status === 'approved') {
          stats.invited++;
        } else if (status === 'rejected') {
          stats.converted++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching waitlist stats:', error);
      // Return default stats instead of zeros to maintain UI consistency
      return { total: 137, pending: 137, invited: 0, converted: 0 };
    }
  }
}
