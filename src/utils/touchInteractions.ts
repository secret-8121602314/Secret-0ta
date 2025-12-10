/**
 * Touch Interaction Utilities for PWA
 * Provides ripple effects, long-press detection, and touch feedback helpers
 */

import { isPWAMode } from './pwaDetection';
import { hapticLongPress } from './hapticFeedback';

// ============================================
// RIPPLE EFFECT
// ============================================

/**
 * Create ripple effect on click
 */
export function createRipple(event: React.MouseEvent | React.TouchEvent, color = 'rgba(255, 255, 255, 0.5)'): void {
  if (!isPWAMode()) {
    return;
  }

  const button = event.currentTarget as HTMLElement;
  
  // Get click position
  const rect = button.getBoundingClientRect();
  const x = ('touches' in event ? event.touches[0].clientX : event.clientX) - rect.left;
  const y = ('touches' in event ? event.touches[0].clientY : event.clientY) - rect.top;

  // Create ripple element
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.background = color;

  // Add to button
  button.appendChild(ripple);

  // Remove after animation
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

/**
 * React hook for ripple effect
 * Usage: const handleClick = useRipple((e) => console.log('Clicked!'));
 */
export function useRipple<T extends HTMLElement = HTMLElement>(
  onClick?: (event: React.MouseEvent<T> | React.TouchEvent<T>) => void,
  color?: string
) {
  return (event: React.MouseEvent<T> | React.TouchEvent<T>) => {
    createRipple(event, color);
    onClick?.(event);
  };
}

// ============================================
// LONG PRESS DETECTION
// ============================================

interface LongPressOptions {
  delay?: number;
  onLongPress: (event: React.TouchEvent | React.MouseEvent) => void;
  onClick?: (event: React.TouchEvent | React.MouseEvent) => void;
  shouldPreventDefault?: boolean;
}

/**
 * React hook for long-press detection
 * Usage: const longPressHandlers = useLongPress({ onLongPress: () => showMenu() });
 *        <button {...longPressHandlers}>...</button>
 */
export function useLongPress(options: LongPressOptions) {
  const {
    delay = 500,
    onLongPress,
    onClick,
    shouldPreventDefault = true,
  } = options;

  let timeout: NodeJS.Timeout | null = null;
  let target: EventTarget | null = null;
  let isLongPress = false;

  const start = (event: React.TouchEvent | React.MouseEvent) => {
    if (shouldPreventDefault) {
      event.preventDefault();
    }

    target = event.target;
    isLongPress = false;

    // Add visual feedback class
    if (target instanceof HTMLElement) {
      target.classList.add('long-press-active');
    }

    timeout = setTimeout(() => {
      isLongPress = true;
      
      // Trigger haptic feedback
      hapticLongPress();
      
      // Remove visual feedback
      if (target instanceof HTMLElement) {
        target.classList.remove('long-press-active');
      }

      onLongPress(event);
    }, delay);
  };

  const clear = (event: React.TouchEvent | React.MouseEvent) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    // Remove visual feedback
    if (target instanceof HTMLElement) {
      target.classList.remove('long-press-active');
    }

    // If not long press, treat as click
    if (!isLongPress && onClick) {
      onClick(event);
    }

    timeout = null;
    target = null;
    isLongPress = false;
  };

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
  };
}

// ============================================
// CONTEXT MENU (Long Press)
// ============================================

interface ContextMenuItem {
  icon?: string;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

interface ContextMenuOptions {
  items: ContextMenuItem[];
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Show context menu at position
 */
export function showContextMenu(
  event: React.TouchEvent | React.MouseEvent,
  options: ContextMenuOptions
): void {
  if (!isPWAMode()) {
    return;
  }

  const { items, onOpen, onClose } = options;

  // Get position
  const x = 'touches' in event ? event.touches[0].clientX : event.clientX;
  const y = 'touches' in event ? event.touches[0].clientY : event.clientY;

  // Remove existing menu
  const existing = document.querySelector('.context-menu');
  if (existing) {
    existing.remove();
  }

  // Create menu
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  // Add items
  items.forEach((item, index) => {
    const menuItem = document.createElement('div');
    menuItem.className = `context-menu-item${item.destructive ? ' destructive' : ''}`;
    
    if (item.icon) {
      const icon = document.createElement('span');
      icon.textContent = item.icon;
      menuItem.appendChild(icon);
    }

    const label = document.createElement('span');
    label.textContent = item.label;
    menuItem.appendChild(label);

    menuItem.addEventListener('click', () => {
      item.onClick();
      closeContextMenu();
      onClose?.();
    });

    menu.appendChild(menuItem);

    // Add separator before last item if it's destructive
    if (index === items.length - 2 && items[index + 1].destructive) {
      const separator = document.createElement('div');
      separator.className = 'context-menu-separator';
      menu.appendChild(separator);
    }
  });

  // Add to body
  document.body.appendChild(menu);

  // Position menu (keep within viewport)
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = `${x - rect.width}px`;
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = `${y - rect.height}px`;
  }

  // Activate with animation
  requestAnimationFrame(() => {
    menu.classList.add('active');
  });

  // Close on outside click
  const handleClickOutside = (e: MouseEvent | TouchEvent) => {
    if (!menu.contains(e.target as Node)) {
      closeContextMenu();
      onClose?.();
    }
  };

  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
  }, 100);

  // Store cleanup function
  (menu as HTMLElement & { __cleanup?: () => void }).__cleanup = () => {
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('touchstart', handleClickOutside);
  };

  onOpen?.();
}

/**
 * Close active context menu
 */
export function closeContextMenu(): void {
  const menu = document.querySelector('.context-menu');
  if (menu) {
    menu.classList.remove('active');
    
    // Cleanup listeners
    const menuWithCleanup = menu as HTMLElement & { __cleanup?: () => void };
    if (menuWithCleanup.__cleanup) {
      menuWithCleanup.__cleanup();
    }

    setTimeout(() => {
      menu.remove();
    }, 200);
  }
}

// ============================================
// TOUCH FEEDBACK HELPERS
// ============================================

/**
 * Add touch feedback class to element
 */
export function addTouchFeedback(element: HTMLElement): void {
  if (!isPWAMode()) {
    return;
  }
  element.classList.add('touch-feedback');
}

/**
 * Add ripple container to element
 */
export function addRippleContainer(element: HTMLElement): void {
  if (!isPWAMode()) {
    return;
  }
  element.classList.add('ripple-container');
}

/**
 * Make element pressable (card press effect)
 */
export function makePressable(element: HTMLElement): void {
  if (!isPWAMode()) {
    return;
  }
  element.classList.add('card-pressable');
  element.setAttribute('data-pressable', 'true');
}

/**
 * Add long-press support to element
 */
export function addLongPressSupport(element: HTMLElement): void {
  if (!isPWAMode()) {
    return;
  }
  element.classList.add('long-press-target');
}
