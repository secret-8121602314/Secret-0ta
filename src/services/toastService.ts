/**
 * Toast Notification Service
 * Provides user-friendly feedback for operations throughout the app
 * Replaces silent console.error calls with visible notifications
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
}

export interface ToastOptions {
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
}

type ToastListener = (toasts: Toast[]) => void;

class ToastService {
  private toasts: Toast[] = [];
  private listeners: Set<ToastListener> = new Set();
  private maxToasts = 5; // Maximum visible toasts

  /**
   * Subscribe to toast updates
   * @returns Unsubscribe function
   */
  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current toasts
    listener(this.toasts);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of toast changes
   */
  private notify(): void {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  /**
   * Show a toast notification
   * @param message - Message to display
   * @param type - Toast type (success, error, warning, info)
   * @param options - Additional options
   * @returns Toast ID for manual dismissal
   */
  show(
    message: string,
    type: ToastType = 'info',
    options: ToastOptions = {}
  ): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const toast: Toast = {
      id,
      message,
      type,
      duration: options.duration ?? this.getDefaultDuration(type),
      action: options.action,
      dismissible: options.dismissible ?? true,
    };

    // Add to beginning of array (newest first)
    this.toasts.unshift(toast);

    // Limit number of visible toasts
    if (this.toasts.length > this.maxToasts) {
      this.toasts = this.toasts.slice(0, this.maxToasts);
    }

    this.notify();

    // Auto-dismiss after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => this.dismiss(id), toast.duration);
    }

    return id;
  }

  /**
   * Show success toast
   */
  success(message: string, options?: ToastOptions): string {
    return this.show(message, 'success', {
      duration: 3000,
      ...options,
    });
  }

  /**
   * Show error toast with optional retry action
   */
  error(message: string, options?: ToastOptions): string {
    return this.show(message, 'error', {
      duration: 7000,
      dismissible: true,
      ...options,
    });
  }

  /**
   * Show warning toast
   */
  warning(message: string, options?: ToastOptions): string {
    return this.show(message, 'warning', {
      duration: 5000,
      ...options,
    });
  }

  /**
   * Show info toast
   */
  info(message: string, options?: ToastOptions): string {
    return this.show(message, 'info', {
      duration: 4000,
      ...options,
    });
  }

  /**
   * Dismiss a specific toast
   */
  dismiss(id: string): void {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      this.toasts.splice(index, 1);
      this.notify();
    }
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    this.toasts = [];
    this.notify();
  }

  /**
   * Get default duration based on toast type
   */
  private getDefaultDuration(type: ToastType): number {
    switch (type) {
      case 'success':
        return 3000;
      case 'error':
        return 7000;
      case 'warning':
        return 5000;
      case 'info':
        return 4000;
      default:
        return 4000;
    }
  }

  /**
   * Show loading toast that stays until dismissed
   * Returns dismiss function
   */
  loading(message: string): () => void {
    const id = this.show(message, 'info', {
      duration: 0, // Don't auto-dismiss
      dismissible: false,
    });

    return () => this.dismiss(id);
  }

  /**
   * Show promise-based toast
   * Shows loading, then success or error based on promise result
   */
  async promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ): Promise<T> {
    const dismiss = this.loading(messages.loading);

    try {
      const result = await promise;
      dismiss();
      
      const successMessage = typeof messages.success === 'function'
        ? messages.success(result)
        : messages.success;
      
      this.success(successMessage);
      return result;
    } catch (error) {
      dismiss();
      
      const errorMessage = typeof messages.error === 'function'
        ? messages.error(error as Error)
        : messages.error;
      
      this.error(errorMessage);
      throw error;
    }
  }
}

// Export singleton instance
export const toastService = new ToastService();

// System notification helpers for screen-locked scenarios
let isScreenLocked = false;

// Track screen lock state
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    isScreenLocked = document.hidden;
  });
  
  window.addEventListener('blur', () => {
    isScreenLocked = true;
  });
  
  window.addEventListener('focus', () => {
    if (!document.hidden) {
      isScreenLocked = false;
    }
  });
}

/**
 * Show system notification for AI response
 * Only shows when screen is locked/hidden
 */
export const showAINotification = async (
  messagePreview: string,
  conversationName: string = 'Otagon AI'
): Promise<void> => {
  // Only show if screen is locked/hidden
  if (!isScreenLocked && !document.hidden) {
    return;
  }
  
  // Check permission
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  
  try {
    const preview = messagePreview.length > 100 
      ? messagePreview.substring(0, 97) + '...' 
      : messagePreview;

    const notification = new Notification(conversationName, {
      body: preview,
      icon: '/Otagon/icon-192.png',
      badge: '/Otagon/icon-192.png',
      tag: 'otagon-ai-response',
      renotify: true,
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200]
    });

    setTimeout(() => notification.close(), 10000);
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
};

export const isScreenLockedOrHidden = (): boolean => isScreenLocked || document.hidden;
