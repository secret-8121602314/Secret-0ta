export interface ErrorContext {
  operation: string;
  conversationId?: string;
  userId?: string;
  timestamp: number;
  retryCount: number;
}

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'user_notification' | 'skip';
  message?: string;
  action?: () => Promise<void>;
}

class ErrorRecoveryService {
  private retryAttempts = new Map<string, number>();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // Progressive delays

  /**
   * Handle AI service errors with intelligent recovery
   */
  async handleAIError(error: Error, context: ErrorContext): Promise<RecoveryAction> {
    console.error(`🤖 [ErrorRecovery] AI Error in ${context.operation}:`, error);
    console.error(`🤖 [ErrorRecovery] Error message:`, error.message);

    // ✅ CRITICAL: Check for non-retryable errors FIRST (before any retry logic)
    // Rate limit / quota / 429 errors should NEVER be retried - they waste API quota!
    const isRateLimitError = error.message.includes('RATE_LIMIT_ERROR') ||
                            error.message.includes('rate limit') || 
                            error.message.includes('quota') || 
                            error.message.includes('429') ||
                            error.message.includes('RESOURCE_EXHAUSTED') ||
                            error.message.includes('Too Many Requests');
    
    if (isRateLimitError) {
      console.error('🔴 [ErrorRecovery] ⛔ RATE LIMIT ERROR DETECTED - STOPPING ALL RETRIES');
      console.error('🔴 [ErrorRecovery] Error message:', error.message);
      return {
        type: 'user_notification',
        message: 'AI service is temporarily busy. Please wait about a minute and try again.'
      };
    }

    // Check for authentication errors (don't retry auth failures)
    if (error.message.includes('API key') || 
        error.message.includes('authentication') ||
        error.message.includes('401') || 
        error.message.includes('403') || 
        error.message.includes('unauthorized')) {
      console.error('🔴 [ErrorRecovery] Auth error - NOT retrying:', error.message);
      return {
        type: 'user_notification',
        message: 'AI service authentication failed. Please try logging out and back in.'
      };
    }

    // Only retry transient errors (network issues, timeouts, 5xx errors)
    if (this.shouldRetry(context)) {
      const delay = this.getRetryDelay(context.retryCount);
      console.log(`🔄 [ErrorRecovery] Will retry after ${delay}ms (attempt ${context.retryCount + 1}/${this.MAX_RETRIES})`);
      await this.delay(delay);
      return {
        type: 'retry',
        action: async () => {
          // The retry will be handled by the calling function
        }
      };
    }

    // Network/timeout errors (after max retries)
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return {
        type: 'user_notification',
        message: 'Network connection issue. Please check your internet connection and try again.'
      };
    }

    // Generic fallback - log full error for debugging
    console.error('🔴 [ErrorRecovery] Unknown AI service error:', {
      message: error.message,
      stack: error.stack,
      operation: context.operation
    });
    return {
      type: 'user_notification',
      message: 'AI service is temporarily unavailable. Please try again later.'
    };
  }

  /**
   * Handle conversation service errors
   */
  async handleConversationError(error: Error, context: ErrorContext): Promise<RecoveryAction> {
    console.error(`💬 [ErrorRecovery] Conversation Error in ${context.operation}:`, error);

    if (error.message.includes('not found')) {
      return {
        type: 'fallback',
        message: 'Conversation not found. Creating a new one.',
        action: async () => {
          // This would be handled by the calling function
        }
      };
    }

    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return {
        type: 'user_notification',
        message: 'Permission denied. Please log in again.'
      };
    }

    return {
      type: 'user_notification',
      message: 'Failed to save conversation. Your data may not be persisted.'
    };
  }

  /**
   * Handle cache service errors
   */
  async handleCacheError(error: Error, context: ErrorContext): Promise<RecoveryAction> {
    console.error(`💾 [ErrorRecovery] Cache Error in ${context.operation}:`, error);

    // Cache errors are usually non-critical, so we can skip
    return {
      type: 'skip',
      message: 'Cache unavailable. Continuing without caching.'
    };
  }

  /**
   * Handle WebSocket connection errors
   */
  async handleWebSocketError(error: Error, context: ErrorContext): Promise<RecoveryAction> {
    console.error(`🔌 [ErrorRecovery] WebSocket Error in ${context.operation}:`, error);

    if (this.shouldRetry(context)) {
      const delay = this.getRetryDelay(context.retryCount);
      return {
        type: 'retry',
        action: async () => {
          await this.delay(delay);
          // Retry connection logic would be handled by the calling function
        }
      };
    }

    return {
      type: 'user_notification',
      message: 'PC connection lost. Screenshot upload may not be available.'
    };
  }

  /**
   * Check if an operation should be retried
   */
  private shouldRetry(context: ErrorContext): boolean {
    const key = `${context.operation}_${context.conversationId || 'global'}`;
    const attempts = this.retryAttempts.get(key) || 0;
    return attempts < this.MAX_RETRIES;
  }

  /**
   * Get retry delay based on attempt count
   */
  private getRetryDelay(retryCount: number): number {
    return this.RETRY_DELAYS[Math.min(retryCount, this.RETRY_DELAYS.length - 1)];
  }

  /**
   * Get current retry count for an operation
   */
  getRetryCount(context: ErrorContext): number {
    const key = `${context.operation}_${context.conversationId || 'global'}`;
    return this.retryAttempts.get(key) || 0;
  }

  /**
   * Increment retry count for an operation
   */
  incrementRetryCount(context: ErrorContext): void {
    const key = `${context.operation}_${context.conversationId || 'global'}`;
    const current = this.retryAttempts.get(key) || 0;
    this.retryAttempts.set(key, current + 1);
  }

  /**
   * Reset retry count for an operation
   */
  resetRetryCount(context: ErrorContext): void {
    const key = `${context.operation}_${context.conversationId || 'global'}`;
    this.retryAttempts.delete(key);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Display user-friendly error message
   */
  displayError(message: string, type: 'error' | 'warning' | 'info' = 'error'): void {
    // In a real app, this would show a toast notification or modal
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // For now, we'll use a simple alert (in production, use a proper UI component)
    if (type === 'error') {
      // Only show critical errors to user
      console.error('User Error:', message);
    }
  }

  /**
   * Log error for debugging
   */
  logError(error: Error, context: ErrorContext, additionalInfo?: unknown): void {
    console.error('Error Details:', {
      error: error.message,
      stack: error.stack,
      context,
      additionalInfo,
      timestamp: new Date().toISOString()
    });
  }
}

export const errorRecoveryService = new ErrorRecoveryService();
