import React, { useCallback, useMemo, useRef, useEffect } from 'react';

// Performance optimization utilities and guidelines

/**
 * Custom hook for debouncing expensive operations
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  ) as T;
}

/**
 * Custom hook for throttling expensive operations
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0);
  const lastCallTimer = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        callback(...args);
        lastCall.current = now;
      } else {
        if (lastCallTimer.current) {
          clearTimeout(lastCallTimer.current);
        }
        lastCallTimer.current = setTimeout(() => {
          callback(...args);
          lastCall.current = Date.now();
        }, delay - (now - lastCall.current));
      }
    },
    [callback, delay]
  ) as T;
}

/**
 * Custom hook for memoizing expensive calculations
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Custom hook for intersection observer (lazy loading)
 */
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(callback, options);
    return () => observerRef.current?.disconnect();
  }, [callback, options]);

  const observe = useCallback((element: Element) => {
    observerRef.current?.observe(element);
  }, []);

  const unobserve = useCallback((element: Element) => {
    observerRef.current?.unobserve(element);
  }, []);

  return { observe, unobserve };
}

/**
 * Performance monitoring utilities
 */
export const performanceUtils = {
  // Measure function execution time
  measureTime: function<T>(fn: () => T, label: string): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${label} took ${end - start}ms`);
    return result;
  },

  // Measure component render time
  measureRender: function(componentName: string) {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`${componentName} rendered in ${end - start}ms`);
    };
  },

  // Check if component should re-render
  shouldComponentUpdate: function<T>(
    prevProps: T,
    nextProps: T,
    keys: (keyof T)[]
  ): boolean {
    return keys.some(key => prevProps[key] !== nextProps[key]);
  }
};

/**
 * Performance optimization guidelines:
 * 
 * 1. Use React.memo for components that receive stable props
 * 2. Use useCallback for functions passed as props
 * 3. Use useMemo for expensive calculations
 * 4. Implement virtualization for long lists
 * 5. Use lazy loading for routes and components
 * 6. Optimize images with proper sizing and formats
 * 7. Minimize bundle size with code splitting
 * 8. Use Web Workers for heavy computations
 * 9. Implement proper error boundaries
 * 10. Monitor performance with React DevTools Profiler
 */

export default {
  useDebounce,
  useThrottle,
  useMemoizedValue,
  useIntersectionObserver,
  performanceUtils
};
