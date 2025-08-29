import { supabase } from './supabase';

export interface ContactFormSubmission {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  user_id?: string | null;
  status?: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high';
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export class ContactService {
  private static instance: ContactService;

  private constructor() {}

  public static getInstance(): ContactService {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService();
    }
    return ContactService.instance;
  }

  /**
   * Submit a contact form
   */
  async submitContactForm(formData: Omit<ContactFormSubmission, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      const submission: Omit<ContactFormSubmission, 'id' | 'created_at' | 'updated_at'> = {
        ...formData,
        user_id: user?.id || null,
        status: 'new',
        priority: this.determinePriority(formData.subject, formData.message),
        source: 'landing_page'
      };

      // Store contact submission in new consolidated system table
      const { error } = await supabase
        .from('system_new')
        .insert({
          category: 'contact_submissions',
          event_type: 'contact_form',
          data: {
            name: submission.name,
            email: submission.email,
            subject: submission.subject,
            message: submission.message,
            timestamp: new Date().toISOString(),
            status: 'pending'
          }
        });

      if (error) {
        console.error('Error submitting contact form:', error);
        return { success: false, error: 'Failed to submit contact form' };
      }

      return { success: true, id: crypto.randomUUID() }; // Generate new ID for new structure
    } catch (error) {
      console.error('Contact service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get contact submissions for authenticated users
   */
  async getUserContactSubmissions(): Promise<{ data?: ContactFormSubmission[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('system_new')
        .select('*')
        .eq('category', 'contact_submissions')
        .eq('event_type', 'contact_form')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user contact submissions:', error);
        return { error: 'Failed to fetch contact submissions' };
      }

      // Transform data back to ContactFormSubmission format
      const submissions = data?.map(item => ({
        id: item.id,
        user_id: user.id,
        name: item.data.name,
        email: item.data.email,
        subject: item.data.subject,
        message: item.data.message,
        status: item.data.status,
        priority: item.data.priority || 'medium',
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];

      return { data: submissions };
    } catch (error) {
      console.error('Error getting user contact submissions:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  /**
   * Update contact submission status (admin function)
   */
  async updateContactStatus(id: string, status: ContactFormSubmission['status'], priority?: ContactFormSubmission['priority']): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: any = {
        data: {
          status,
          updated_at: new Date().toISOString()
        }
      };

      if (priority) {
        updates.data.priority = priority;
      }

      const { error } = await supabase
        .from('system_new')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating contact status:', error);
        return { success: false, error: 'Failed to update contact status' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating contact status:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get contact submission by ID
   */
  async getContactSubmission(id: string): Promise<{ data?: ContactFormSubmission; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('system_new')
        .select('*')
        .eq('id', id)
        .eq('category', 'contact_submissions')
        .single();

      if (error) {
        console.error('Error fetching contact submission:', error);
        return { error: 'Failed to fetch contact submission' };
      }

      // Transform data back to ContactFormSubmission format
      const submission: ContactFormSubmission = {
        id: data.id,
        user_id: data.user_id || 'unknown',
        name: data.data.name,
        email: data.data.email,
        subject: data.data.subject,
        message: data.data.message,
        status: data.data.status,
        priority: data.data.priority || 'medium',
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return { data: submission };
    } catch (error) {
      console.error('Error getting contact submission:', error);
      return { error: 'An unexpected error occurred' };
    }
  }

  /**
   * Determine priority based on subject and message content
   */
  private determinePriority(subject: string, message: string): ContactFormSubmission['priority'] {
    const urgentKeywords = ['urgent', 'critical', 'broken', 'error', 'bug', 'issue', 'problem', 'help', 'support'];
    const content = `${subject} ${message}`.toLowerCase();
    
    if (urgentKeywords.some(keyword => content.includes(keyword))) {
      return 'high';
    }
    
    if (content.includes('question') || content.includes('inquiry') || content.includes('info')) {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Get contact statistics (admin function)
   */
  async getContactStatistics(): Promise<{ data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('status, priority, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (error) {
        console.error('Error fetching contact statistics:', error);
        return { error: 'Failed to fetch contact statistics' };
      }

      // Process statistics
      const stats = {
        total: data.length,
        byStatus: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
        byDate: {} as Record<string, number>
      };

      data.forEach(submission => {
        // Count by status
        stats.byStatus[submission.status] = (stats.byStatus[submission.status] || 0) + 1;
        
        // Count by priority
        stats.byPriority[submission.priority] = (stats.byPriority[submission.priority] || 0) + 1;
        
        // Count by date
        const date = new Date(submission.created_at).toDateString();
        stats.byDate[date] = (stats.byDate[date] || 0) + 1;
      });

      return { data: stats };
    } catch (error) {
      console.error('Error getting contact statistics:', error);
      return { error: 'An unexpected error occurred' };
    }
  }
}

export const contactService = ContactService.getInstance();
