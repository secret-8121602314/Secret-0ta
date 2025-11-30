/**
 * Feedback Service
 * Handles submitting user feedback on AI responses and subtab content
 */

import { supabase } from '../lib/supabase';
import { authService } from './authService';

export type FeedbackType = 'up' | 'down';
export type ContentType = 'message' | 'subtab';
export type FeedbackCategory = 'not_helpful' | 'incorrect' | 'off_topic' | 'inappropriate' | 'other';

export interface FeedbackData {
  messageId: string;
  conversationId: string;
  feedbackType: FeedbackType;
  contentType: ContentType;
  category?: FeedbackCategory;
  comment?: string;
}

class FeedbackService {
  private submittedFeedback: Set<string> = new Set();

  /**
   * Check if feedback has already been submitted for a message
   */
  hasSubmittedFeedback(messageId: string): boolean {
    return this.submittedFeedback.has(messageId);
  }

  /**
   * Submit feedback for an AI response or subtab content
   */
  async submitFeedback(data: FeedbackData): Promise<{ success: boolean; error?: string }> {
    try {
      const user = authService.getCurrentUser();
      if (!user?.authUserId) {
        console.warn('[FeedbackService] User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      // Prevent duplicate feedback
      if (this.submittedFeedback.has(data.messageId)) {
        console.log('[FeedbackService] Feedback already submitted for message:', data.messageId);
        return { success: true }; // Silently succeed - already submitted
      }

      const { error } = await supabase
        .from('ai_feedback')
        .insert({
          user_id: user.authUserId,
          conversation_id: data.conversationId,
          message_id: data.messageId,
          feedback_type: data.feedbackType,
          content_type: data.contentType,
          category: data.category || null,
          comment: data.comment || null,
        });

      if (error) {
        // Check if it's a duplicate (unique constraint violation)
        if (error.code === '23505') {
          console.log('[FeedbackService] Feedback already exists in database');
          this.submittedFeedback.add(data.messageId);
          return { success: true };
        }
        
        console.error('[FeedbackService] Failed to submit feedback:', error);
        return { success: false, error: error.message };
      }

      // Track locally to prevent duplicate submissions
      this.submittedFeedback.add(data.messageId);
      
      console.log('[FeedbackService] Feedback submitted:', {
        messageId: data.messageId,
        type: data.feedbackType,
        contentType: data.contentType
      });

      return { success: true };
    } catch (error) {
      console.error('[FeedbackService] Error submitting feedback:', error);
      return { success: false, error: 'Failed to submit feedback' };
    }
  }

  /**
   * Submit quick positive feedback (thumbs up)
   */
  async submitPositiveFeedback(
    messageId: string, 
    conversationId: string, 
    contentType: ContentType = 'message'
  ): Promise<{ success: boolean; error?: string }> {
    return this.submitFeedback({
      messageId,
      conversationId,
      feedbackType: 'up',
      contentType,
    });
  }

  /**
   * Submit detailed negative feedback (thumbs down with details)
   */
  async submitNegativeFeedback(
    messageId: string,
    conversationId: string,
    category: FeedbackCategory,
    comment?: string,
    contentType: ContentType = 'message'
  ): Promise<{ success: boolean; error?: string }> {
    return this.submitFeedback({
      messageId,
      conversationId,
      feedbackType: 'down',
      contentType,
      category,
      comment,
    });
  }

  /**
   * Get feedback statistics for analytics (admin use)
   */
  async getFeedbackStats(): Promise<{
    totalFeedback: number;
    positiveCount: number;
    negativeCount: number;
    categoryBreakdown: Record<string, number>;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('ai_feedback')
        .select('feedback_type, category');

      if (error) {
        console.error('[FeedbackService] Failed to get feedback stats:', error);
        return null;
      }

      const stats = {
        totalFeedback: data.length,
        positiveCount: data.filter(f => f.feedback_type === 'up').length,
        negativeCount: data.filter(f => f.feedback_type === 'down').length,
        categoryBreakdown: {} as Record<string, number>,
      };

      // Count categories
      data.forEach(f => {
        if (f.category) {
          stats.categoryBreakdown[f.category] = (stats.categoryBreakdown[f.category] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('[FeedbackService] Error getting feedback stats:', error);
      return null;
    }
  }

  /**
   * Clear local feedback tracking (for testing)
   */
  clearLocalTracking(): void {
    this.submittedFeedback.clear();
  }
}

// Export singleton instance
export const feedbackService = new FeedbackService();
