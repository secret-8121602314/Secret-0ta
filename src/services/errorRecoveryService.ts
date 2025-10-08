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

    // Check if we should retry
    if (this.shouldRetry(context)) {
      const delay = this.getRetryDelay(context.retryCount);
      console.log(`🔄 [ErrorRecovery] Retrying ${context.operation} in ${delay}ms`);
      
      await this.delay(delay);
      return {
        type: 'retry',
        action: async () => {
          // The retry will be handled by the calling function
        }
      };
    }

    // Determine fallback action based on error type
    if (error.message.includes('API key') || error.message.includes('authentication')) {
      return {
        type: 'user_notification',
        message: 'AI service authentication failed. Please check your API key in settings.'
      };
    }

    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      return {
        type: 'user_notification',
        message: 'AI service is temporarily busy. Please try again in a few moments.'
      };
    }

    if (error.message.includes('network') || error.message.includes('timeout')) {
      return {
        type: 'user_notification',
        message: 'Network connection issue. Please check your internet connection and try again.'
      };
    }

    // Generic fallback
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
  logError(error: Error, context: ErrorContext, additionalInfo?: any): void {
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
