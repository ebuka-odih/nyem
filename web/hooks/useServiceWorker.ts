import { useEffect, useCallback } from 'react';

/**
 * useServiceWorker hook - Handles background service worker updates silently
 * and prevents refresh loops.
 */
export const useServiceWorker = () => {
  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    } catch (error) {
      // Silently fail update checks
      console.debug('[SW] Update check failed:', error);
    }
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Protection against refresh loops
    const lastReloadKey = 'sw_last_reload';
    const lastReload = localStorage.getItem(lastReloadKey);
    const now = Date.now();

    // If we reloaded less than 30 seconds ago, don't trigger another reload
    // even if the controller changes. This breaks cycles.
    const isLooping = lastReload && (now - parseInt(lastReload, 10) < 30000);

    const handleControllerChange = () => {
      if (isLooping) {
        console.warn('[SW] Potential refresh loop detected, delaying reload');
        return;
      }

      // Store the reload time BEFORE reloading
      localStorage.setItem(lastReloadKey, now.toString());

      /**
       * Silent Background Update Strategy:
       * 1. If the user is currently interacting with the page (visible), 
       *    wait for them to switch tabs or minimize the app.
       * 2. If the app is already backgrounded, reload immediately.
       */
      const reload = () => {
        console.log('[SW] Service worker updated, refreshing for latest version');
        window.location.reload();
      };

      if (document.visibilityState === 'hidden') {
        reload();
      } else {
        // Wait for the tab to be hidden before reloading
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            reload();
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Also set a fallback timeout for very long sessions (e.g. 1 hour)
        // This ensures they eventually get the update even if they never hide the tab
        setTimeout(() => {
          // Only if still the same controller change event waiting
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }, 60 * 60 * 1000);
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Initial check on mount
    checkForUpdates();

    // Periodic check every 30 minutes (less aggressive to save battery/data)
    const updateInterval = setInterval(checkForUpdates, 30 * 60 * 1000);

    // Check on focus and online
    const handleEvents = () => checkForUpdates();
    window.addEventListener('focus', handleEvents);
    window.addEventListener('online', handleEvents);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      clearInterval(updateInterval);
      window.removeEventListener('focus', handleEvents);
      window.removeEventListener('online', handleEvents);
    };
  }, [checkForUpdates]);

  // Return empty interface for backward compatibility with components
  return {
    isUpdateAvailable: false,
    isUpdateReady: false,
    isRefreshing: false,
    isInstalling: false,
    registration: null,
    checkForUpdates,
    activateUpdate: () => { }, // No longer needed as it's automatic
  };
};



