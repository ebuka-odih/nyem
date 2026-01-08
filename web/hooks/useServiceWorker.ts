import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isUpdateAvailable: boolean;
  isUpdateReady: boolean;
  isInstalling: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = () => {
  const [swState, setSwState] = useState<ServiceWorkerState & { isRefreshing: boolean }>({
    isUpdateAvailable: false,
    isUpdateReady: false,
    isInstalling: false,
    registration: null,
    isRefreshing: false,
  });

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      // Check for updates
      await registration.update();

      // Check if there's a waiting service worker
      if (registration.waiting) {
        setSwState((prev) => ({
          ...prev,
          isUpdateReady: true,
          registration,
        }));
        return;
      }

      // Listen for installing service worker
      if (registration.installing) {
        setSwState((prev) => ({
          ...prev,
          isInstalling: true,
          isUpdateAvailable: true,
          registration,
        }));

        registration.installing.addEventListener('statechange', (e) => {
          const sw = e.target as ServiceWorker;
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is installed and waiting
            setSwState((prev) => ({
              ...prev,
              isUpdateReady: true,
              isInstalling: false,
            }));
          } else if (sw.state === 'activated') {
            // Service worker activated
            setSwState((prev) => ({
              ...prev,
              isInstalling: false,
              isUpdateAvailable: false,
              isUpdateReady: false,
            }));
          }
        });
      }

      // Listen for updatefound event
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          setSwState((prev) => ({
            ...prev,
            isInstalling: true,
            isUpdateAvailable: true,
            registration,
          }));

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker installed, waiting to activate
              setSwState((prev) => ({
                ...prev,
                isUpdateReady: true,
                isInstalling: false,
              }));
            } else if (newWorker.state === 'activated') {
              // New service worker activated
              setSwState((prev) => ({
                ...prev,
                isInstalling: false,
                isUpdateAvailable: false,
                isUpdateReady: false,
              }));
            }
          });
        }
      });
    } catch (error) {
      console.error('Error checking for service worker updates:', error);
    }
  }, []);

  // Activate update
  const activateUpdate = useCallback(async () => {
    if (!swState.registration || !swState.registration.waiting || swState.isRefreshing) return;

    try {
      setSwState(prev => ({ ...prev, isRefreshing: true }));
      console.log('[SW] Sending SKIP_WAITING to waiting worker...');
      swState.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } catch (error) {
      console.error('Error activating service worker update:', error);
      setSwState(prev => ({ ...prev, isRefreshing: false }));
    }
  }, [swState.registration, swState.isRefreshing]);

  // Initialize service worker monitoring
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshLock = false;

    // Get initial registration
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        setSwState((prev) => ({ ...prev, registration }));

        // Check if there's already a waiting service worker
        if (registration.waiting) {
          setSwState((prev) => ({
            ...prev,
            isUpdateReady: true,
            registration,
          }));
        }

        // Listen for controller change (service worker updated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshLock) return;
          refreshLock = true;
          console.log('[SW] Controller changed, reloading page');
          window.location.reload();
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SW_UPDATED') {
            console.log('[SW] Service worker active:', event.data.version);
            // We no longer call checkForUpdates() here to avoid potential loops
          }
        });
      }
    });

    // Check for updates on mount
    checkForUpdates();

    // Check for updates periodically (every 5 minutes)
    const updateInterval = setInterval(() => {
      checkForUpdates();
    }, 5 * 60 * 1000);

    // Also check when the app comes back into focus
    const handleFocus = () => {
      checkForUpdates();
    };
    window.addEventListener('focus', handleFocus);

    // Also check when online
    const handleOnline = () => {
      checkForUpdates();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(updateInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkForUpdates]);

  return {
    ...swState,
    checkForUpdates,
    activateUpdate,
  };
};


