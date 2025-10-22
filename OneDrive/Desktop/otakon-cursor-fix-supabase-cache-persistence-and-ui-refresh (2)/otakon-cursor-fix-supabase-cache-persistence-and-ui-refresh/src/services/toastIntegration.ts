/**
 * Toast Integration Examples
 * Replace console.error/warn with user-friendly toast notifications
 * 
 * PRIORITY ORDER:
 * 1. Auth errors (user-facing, critical)
 * 2. Conversation/message errors (user-facing, critical)
 * 3. AI errors (user-facing, important)
 * 4. Cache errors (background, low priority)
 */

import { toastService } from './toastService';

// ===========================================
// AUTH SERVICE TOAST EXAMPLES
// ===========================================

export const authToasts = {
  /**
   * Show error when auth initialization fails
   */
  initError: (error: Error) => {
    console.error('Auth initialization error:', error);
    toastService.error(
      'Failed to initialize authentication. Please refresh the page.',
      {
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload()
        }
      }
    );
  },

  /**
   * Show error when user creation fails
   */
  userCreationError: (error: Error) => {
    console.error('🔐 [AuthService] Error creating user record:', error);
    toastService.error(
      'Failed to create your account. Please try again.',
      {
        action: {
          label: 'Retry',
          onClick: async () => {
            // Retry logic would go here
            toastService.info('Retrying...');
          }
        }
      }
    );
  },

  /**
   * Show error when OAuth fails
   */
  oauthError: (provider: string, error: Error) => {
    console.error(`🔐 [AuthService] ${provider} OAuth error:`, error);
    toastService.error(
      `Failed to sign in with ${provider}. Please try again.`,
      {
        action: {
          label: 'Try Again',
          onClick: () => {
            // Retry OAuth flow
          }
        }
      }
    );
  },

  /**
   * Show success when login completes
   */
  loginSuccess: () => {
    toastService.success('Welcome back! Successfully signed in.');
  },

  /**
   * Show success when logout completes
   */
  logoutSuccess: () => {
    toastService.success('Successfully signed out.');
  }
};

// ===========================================
// CONVERSATION SERVICE TOAST EXAMPLES
// ===========================================

export const conversationToasts = {
  /**
   * Show error when loading conversations fails
   */
  loadError: (error: Error) => {
    console.error('🔍 [ConversationService] Failed to load from Supabase:', error);
    toastService.error(
      'Failed to load your conversations. Using local data.',
      {
        duration: 5000
      }
    );
  },

  /**
   * Show error when saving conversation fails
   */
  saveError: (conversationId: string, error: Error) => {
    console.error(`Failed to save conversation ${conversationId}:`, error);
    toastService.error(
      'Failed to save conversation. Your changes may not be synced.',
      {
        action: {
          label: 'Retry',
          onClick: async () => {
            // Retry save logic
            toastService.info('Retrying save...');
          }
        }
      }
    );
  },

  /**
   * Show error when creating conversation fails
   */
  createError: (error: Error) => {
    console.error('🔍 [ConversationService] Failed to create in Supabase:', error);
    toastService.error(
      'Failed to create conversation. Please try again.',
      {
        action: {
          label: 'Retry',
          onClick: () => {
            // Retry creation
          }
        }
      }
    );
  },

  /**
   * Show warning when trying to delete Game Hub
   */
  cannotDeleteGameHub: () => {
    console.warn('🔍 [ConversationService] Cannot delete Game Hub conversation');
    toastService.warning(
      'The Game Hub conversation cannot be deleted.'
    );
  },

  /**
   * Show success when conversation is created
   */
  createSuccess: () => {
    toastService.success('New conversation created!');
  },

  /**
   * Show success when conversation is deleted
   */
  deleteSuccess: () => {
    toastService.success('Conversation deleted successfully.');
  }
};

// ===========================================
// AI SERVICE TOAST EXAMPLES
// ===========================================

export const aiToasts = {
  /**
   * Show error when AI response fails
   */
  responseError: (error: Error) => {
    console.error('❌ [AIService] Failed to get response:', error);
    
    // Check for specific error types
    if (error.message?.includes('rate limit')) {
      toastService.warning(
        'Too many requests. Please wait a moment and try again.',
        { duration: 6000 }
      );
    } else if (error.message?.includes('network')) {
      toastService.error(
        'Network error. Please check your connection and try again.',
        {
          action: {
            label: 'Retry',
            onClick: () => {
              // Retry logic
            }
          }
        }
      );
    } else {
      toastService.error(
        'Failed to get AI response. Please try again.',
        {
          action: {
            label: 'Retry',
            onClick: () => {
              // Retry logic
            }
          }
        }
      );
    }
  },

  /**
   * Show warning when reaching query limit
   */
  queryLimitReached: (queryType: 'text' | 'image') => {
    toastService.warning(
      `You've reached your ${queryType} query limit for this month.`,
      {
        action: {
          label: 'Upgrade',
          onClick: () => {
            // Navigate to upgrade page
            window.location.hash = '#/upgrade';
          }
        },
        duration: 8000
      }
    );
  }
};

// ===========================================
// CACHE SERVICE (Background errors - less critical)
// ===========================================

export const cacheToasts = {
  /**
   * Only show cache errors if they affect user experience
   * Most cache errors should be silent (logged only)
   */
  criticalError: (error: Error) => {
    console.error('[CacheService] Critical error:', error);
    toastService.warning(
      'Some features may be slower than usual.',
      { duration: 4000 }
    );
  }
};

// ===========================================
// USAGE TRACKING TOASTS
// ===========================================

export const usageToasts = {
  /**
   * Show warning when approaching limit
   */
  approachingLimit: (percentage: number, queryType: 'text' | 'image') => {
    toastService.warning(
      `You've used ${percentage}% of your ${queryType} queries this month.`,
      {
        action: {
          label: 'View Usage',
          onClick: () => {
            // Navigate to usage page
          }
        },
        duration: 6000
      }
    );
  },

  /**
   * Show info about trial
   */
  trialInfo: (daysLeft: number) => {
    toastService.info(
      `You have ${daysLeft} days left in your trial period.`,
      {
        action: {
          label: 'Learn More',
          onClick: () => {
            // Navigate to trial info
          }
        },
        duration: 7000
      }
    );
  }
};

// ===========================================
// HELPER FUNCTION
// ===========================================

/**
 * Wrap async operations with automatic toast feedback
 * Usage: await withToast(asyncOperation(), { loading: '...', success: '...' })
 */
export async function withToast<T>(
  promise: Promise<T>,
  messages: {
    loading?: string;
    success?: string | ((data: T) => string);
    error?: string | ((error: Error) => string);
  }
): Promise<T> {
  return toastService.promise(promise, {
    loading: messages.loading || 'Loading...',
    success: messages.success || 'Operation completed successfully',
    error: messages.error || 'Operation failed. Please try again.'
  });
}
