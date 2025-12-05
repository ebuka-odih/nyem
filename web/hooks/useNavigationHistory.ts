import { useRef, useCallback } from 'react';
import { ScreenState } from '../types';

/**
 * Hook to manage navigation history for back navigation
 * Tracks screen transitions and provides back navigation functionality
 */
export function useNavigationHistory() {
  const historyRef = useRef<ScreenState[]>(['welcome']);

  const push = useCallback((screen: ScreenState) => {
    const current = historyRef.current[historyRef.current.length - 1];
    // Don't add duplicate consecutive screens
    if (current !== screen) {
      historyRef.current.push(screen);
      // Limit history to prevent memory issues
      if (historyRef.current.length > 20) {
        historyRef.current = historyRef.current.slice(-20);
      }
    }
  }, []);

  const goBack = useCallback((): ScreenState | null => {
    if (historyRef.current.length <= 1) {
      return null; // Can't go back further
    }
    // Remove current screen
    historyRef.current.pop();
    // Return previous screen
    return historyRef.current[historyRef.current.length - 1];
  }, []);

  const canGoBack = useCallback((): boolean => {
    return historyRef.current.length > 1;
  }, []);

  const replace = useCallback((screen: ScreenState) => {
    if (historyRef.current.length > 0) {
      historyRef.current[historyRef.current.length - 1] = screen;
    } else {
      historyRef.current.push(screen);
    }
  }, []);

  const reset = useCallback((screen: ScreenState = 'welcome') => {
    historyRef.current = [screen];
  }, []);

  return {
    push,
    goBack,
    canGoBack,
    replace,
    reset,
  };
}

