// ========================================
// 🛡️ COMPREHENSIVE ERROR RECOVERY SERVICE
// ========================================
// Handles all authentication error scenarios with proper UI state recovery
// and user-friendly error messages

export interface ErrorRecoveryOptions {
  resetButtonStates?: boolean;
  showUserMessage?: boolean;
  allowRetry?: boolean;
  redirectToLogin?: boolean;
}

export interface ButtonState {
  isLoading: boolean;
  isDisabled: boolean;
  errorMessage?: string;
}

class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private errorHistory: Array<{ timestamp: number; error: string; context: string }> = [];

  private constructor() {}

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  /**
   * Handle authentication errors with comprehensive recovery
   */
  async handleAuthError(
    error: any, 
    context: string, 
    options: ErrorRecoveryOptions = {}
  ): Promise<ButtonState> {
    try {
      console.error(`🛡️ [ErrorRecovery] Auth error in ${context}:`, error);
      
      // Log error for debugging
      this.logError(error, context);
      
      // Determine error type and recovery strategy
      const errorType = this.categorizeError(error);
      const recoveryStrategy = this.getRecoveryStrategy(errorType);
      
      // Execute recovery strategy
      const buttonState = await this.executeRecoveryStrategy(
        error, 
        context, 
        recoveryStrategy, 
        options
      );
      
      return buttonState;
      
    } catch (recoveryError) {
      console.error('🛡️ [ErrorRecovery] Failed to handle auth error:', recoveryError);
      
      // Fallback to basic error state
      return {
        isLoading: false,
        isDisabled: false,
        errorMessage: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  /**
   * Handle OAuth-specific errors
   */
  async handleOAuthError(
    error: any, 
    provider: 'google' | 'discord' | 'email',
    options: ErrorRecoveryOptions = {}
  ): Promise<ButtonState> {
    const context = `OAuth-${provider}`;
    return this.handleAuthError(error, context, options);
  }

  /**
   * Handle network errors with retry logic
   */
  async handleNetworkError(
    error: any, 
    context: string,
    options: ErrorRecoveryOptions = {}
  ): Promise<ButtonState> {
    try {
      console.error(`🛡️ [ErrorRecovery] Network error in ${context}:`, error);
      
      this.logError(error, context);
      
      // Check if it's a temporary network issue
      const isTemporaryError = this.isTemporaryNetworkError(error);
      
      if (isTemporaryError && options.allowRetry !== false) {
        return {
          isLoading: false,
          isDisabled: false,
          errorMessage: 'Network connection issue. Please check your internet and try again.'
        };
      }
      
      // For persistent network errors, show generic message
      return {
        isLoading: false,
        isDisabled: false,
        errorMessage: 'Unable to connect to our servers. Please try again later.'
      };
      
    } catch (recoveryError) {
      console.error('🛡️ [ErrorRecovery] Failed to handle network error:', recoveryError);
      
      return {
        isLoading: false,
        isDisabled: false,
        errorMessage: 'A network error occurred. Please try again.'
      };
    }
  }

  /**
   * Reset all button states to default
   */
  resetAllButtonStates(): Record<string, ButtonState> {
    return {
      google: { isLoading: false, isDisabled: false },
      discord: { isLoading: false, isDisabled: false },
      email: { isLoading: false, isDisabled: false }
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: any): string {
    if (!error) return 'An unexpected error occurred.';
    
    const errorMessage = error.message || error.toString();
    
    // OAuth-specific error messages
    if (errorMessage.includes('popup_closed_by_user')) {
      return 'Sign-in was cancelled. Please try again.';
    }
    
    if (errorMessage.includes('access_denied')) {
      return 'Access was denied. Please try again or use a different sign-in method.';
    }
    
    if (errorMessage.includes('network')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    if (errorMessage.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    if (errorMessage.includes('invalid_credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    if (errorMessage.includes('email_not_confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.';
    }
    
    if (errorMessage.includes('too_many_requests')) {
      return 'Too many attempts. Please wait a moment before trying again.';
    }
    
    // Generic fallback
    return 'Authentication failed. Please try again.';
  }

  /**
   * Clear error history (for testing)
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Get error history for debugging
   */
  getErrorHistory(): Array<{ timestamp: number; error: string; context: string }> {
    return [...this.errorHistory];
  }

  private logError(error: any, context: string): void {
    this.errorHistory.push({
      timestamp: Date.now(),
      error: error?.message || error?.toString() || 'Unknown error',
      context
    });
    
    // Keep only last 50 errors
    if (this.errorHistory.length > 50) {
      this.errorHistory = this.errorHistory.slice(-50);
    }
  }

  private categorizeError(error: any): string {
    if (!error) return 'unknown';
    
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('popup_closed_by_user')) return 'user_cancelled';
    if (errorMessage.includes('access_denied')) return 'access_denied';
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) return 'network';
    if (errorMessage.includes('timeout')) return 'timeout';
    if (errorMessage.includes('invalid_credentials')) return 'invalid_credentials';
    if (errorMessage.includes('email_not_confirmed')) return 'email_not_confirmed';
    if (errorMessage.includes('too_many_requests')) return 'rate_limited';
    if (error.status === 401) return 'unauthorized';
    if (error.status === 403) return 'forbidden';
    if (error.status === 404) return 'not_found';
    if (error.status >= 500) return 'server_error';
    
    return 'unknown';
  }

  private getRecoveryStrategy(errorType: string): {
    resetButtons: boolean;
    showMessage: boolean;
    allowRetry: boolean;
    redirectToLogin: boolean;
  } {
    switch (errorType) {
      case 'user_cancelled':
        return {
          resetButtons: true,
          showMessage: false, // Don't show error for user cancellation
          allowRetry: true,
          redirectToLogin: false
        };
      
      case 'access_denied':
        return {
          resetButtons: true,
          showMessage: true,
          allowRetry: true,
          redirectToLogin: false
        };
      
      case 'network':
      case 'timeout':
        return {
          resetButtons: true,
          showMessage: true,
          allowRetry: true,
          redirectToLogin: false
        };
      
      case 'invalid_credentials':
        return {
          resetButtons: true,
          showMessage: true,
          allowRetry: true,
          redirectToLogin: false
        };
      
      case 'email_not_confirmed':
        return {
          resetButtons: true,
          showMessage: true,
          allowRetry: true,
          redirectToLogin: false
        };
      
      case 'rate_limited':
        return {
          resetButtons: true,
          showMessage: true,
          allowRetry: false,
          redirectToLogin: false
        };
      
      case 'unauthorized':
      case 'forbidden':
        return {
          resetButtons: true,
          showMessage: true,
          allowRetry: false,
          redirectToLogin: true
        };
      
      case 'server_error':
        return {
          resetButtons: true,
          showMessage: true,
          allowRetry: true,
          redirectToLogin: false
        };
      
      default:
        return {
          resetButtons: true,
          showMessage: true,
          allowRetry: true,
          redirectToLogin: false
        };
    }
  }

  private async executeRecoveryStrategy(
    error: any,
    context: string,
    strategy: any,
    options: ErrorRecoveryOptions
  ): Promise<ButtonState> {
    // Handle redirect to login if needed
    if (strategy.redirectToLogin && options.redirectToLogin !== false) {
      console.log('🛡️ [ErrorRecovery] Redirecting to login due to auth error');
      // Clear any invalid session data
      localStorage.removeItem('otakonAuthMethod');
      localStorage.removeItem('otakon_developer_mode');
      
      // Redirect to login (this would be handled by the calling component)
    }
    
    // Return button state based on strategy
    return {
      isLoading: false,
      isDisabled: !strategy.allowRetry,
      errorMessage: strategy.showMessage ? this.getUserFriendlyMessage(error) : undefined
    };
  }

  private isTemporaryNetworkError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || error.toString();
    
    return errorMessage.includes('network') || 
           errorMessage.includes('timeout') ||
           errorMessage.includes('fetch') ||
           error.status === 0 || // Network error
           error.status >= 500; // Server errors
  }
}

// Export singleton instance
export const errorRecoveryService = ErrorRecoveryService.getInstance();
