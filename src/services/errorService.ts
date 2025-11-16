/**
 * Centralized error handling service
 * Provides consistent error handling across the application
 */
class ErrorService {
  private static errorCount = 0;
  private static maxErrorsPerMinute = 10;
  private static errorWindow = 60 * 1000; // 1 minute
  private static recentErrors: number[] = [];

  /**
   * Handle an error with context and optional user message
   */
  static handle(error: Error, context: string, userMessage?: string): void {
    // Increment error count
    this.errorCount++;
    
    // Check if we're hitting error rate limits
    if (this.isErrorRateLimited()) {
            return;
    }

    // Log error with context
    console.error(`[${context}]`, {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      errorCount: this.errorCount,
    });

    // Show user-friendly message if provided
    if (userMessage) {
      this.showUserMessage(userMessage);
    }

    // Report to monitoring service (if configured)
    this.reportError(error, context);
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(error: Error, operation: string): void {
    const userMessage = this.getAuthErrorMessage(operation);
    this.handle(error, `AuthService:${operation}`, userMessage);
  }

  /**
   * Handle WebSocket errors
   */
  static handleWebSocketError(error: Error, operation: string): void {
    const userMessage = this.getWebSocketErrorMessage(operation);
    this.handle(error, `WebSocketService:${operation}`, userMessage);
  }

  /**
   * Handle conversation errors
   */
  static handleConversationError(error: Error, operation: string): void {
    const userMessage = this.getConversationErrorMessage(operation);
    this.handle(error, `ConversationService:${operation}`, userMessage);
  }

  /**
   * Handle database errors
   */
  static handleDatabaseError(error: Error, operation: string): void {
    const userMessage = this.getDatabaseErrorMessage(operation);
    this.handle(error, `DatabaseService:${operation}`, userMessage);
  }

  /**
   * Check if error rate is too high
   */
  private static isErrorRateLimited(): boolean {
    const now = Date.now();
    
    // Remove old errors from the window
    this.recentErrors = this.recentErrors.filter(time => now - time < this.errorWindow);
    
    // Add current error
    this.recentErrors.push(now);
    
    // Check if we're over the limit
    return this.recentErrors.length > this.maxErrorsPerMinute;
  }

  /**
   * Show user-friendly error message
   */
  private static showUserMessage(message: string): void {
    // TODO: Implement toast notification system
    // For now, we'll use console.warn as a placeholder
        // In a real implementation, this would:
    // 1. Show a toast notification
    // 2. Update UI state to show error
    // 3. Log to user activity tracking
  }

  /**
   * Report error to monitoring service
   */
  private static reportError(error: Error, context: string): void {
    // TODO: Implement error reporting to monitoring service
    // For now, we'll just log it
    console.warn(`[Error Reporting] Would report error to monitoring service:`, {
      error: error.message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get user-friendly auth error messages
   */
  private static getAuthErrorMessage(operation: string): string {
    const messages: Record<string, string> = {
      'signIn': 'Failed to sign in. Please check your credentials and try again.',
      'signOut': 'Failed to sign out. Please try again.',
      'loadUser': 'Failed to load user data. Please refresh the page.',
      'createUser': 'Failed to create user account. Please try again.',
      'refreshUser': 'Failed to refresh user data. Please try again.',
    };
    
    return messages[operation] || 'An authentication error occurred. Please try again.';
  }

  /**
   * Get user-friendly WebSocket error messages
   */
  private static getWebSocketErrorMessage(operation: string): string {
    const messages: Record<string, string> = {
      'connect': 'Failed to connect to server. Please check your internet connection.',
      'send': 'Failed to send message. Please try again.',
      'disconnect': 'Failed to disconnect. Please try again.',
    };
    
    return messages[operation] || 'A connection error occurred. Please try again.';
  }

  /**
   * Get user-friendly conversation error messages
   */
  private static getConversationErrorMessage(operation: string): string {
    const messages: Record<string, string> = {
      'create': 'Failed to create conversation. Please try again.',
      'load': 'Failed to load conversations. Please refresh the page.',
      'save': 'Failed to save conversation. Please try again.',
      'delete': 'Failed to delete conversation. Please try again.',
    };
    
    return messages[operation] || 'A conversation error occurred. Please try again.';
  }

  /**
   * Get user-friendly database error messages
   */
  private static getDatabaseErrorMessage(operation: string): string {
    const messages: Record<string, string> = {
      'save': 'Failed to save data. Please try again.',
      'load': 'Failed to load data. Please refresh the page.',
      'update': 'Failed to update data. Please try again.',
      'delete': 'Failed to delete data. Please try again.',
    };
    
    return messages[operation] || 'A database error occurred. Please try again.';
  }

  /**
   * Get error statistics
   */
  static getStats(): { totalErrors: number; recentErrors: number; isRateLimited: boolean } {
    return {
      totalErrors: this.errorCount,
      recentErrors: this.recentErrors.length,
      isRateLimited: this.isErrorRateLimited(),
    };
  }

  /**
   * Reset error statistics
   */
  static reset(): void {
    this.errorCount = 0;
    this.recentErrors = [];
  }
}

export { ErrorService };
