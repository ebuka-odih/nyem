import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { apiFetch, getStoredToken } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

// OneSignal TypeScript declarations
declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
    OneSignalReady?: Promise<any>;
    PushAlert?: any;
  }
}

interface PushNotificationSubscriptionProps {
  showOneSignal?: boolean;
  showPushAlert?: boolean;
  className?: string;
}

export const PushNotificationSubscription: React.FC<PushNotificationSubscriptionProps> = ({
  showOneSignal = true,
  showPushAlert = true,
  className = '',
}) => {
  const [isOneSignalSubscribed, setIsOneSignalSubscribed] = useState(false);
  const [isOneSignalSubscribing, setIsOneSignalSubscribing] = useState(false);
  const [isPushAlertSubscribed, setIsPushAlertSubscribed] = useState(false);
  const [isPushAlertSubscribing, setIsPushAlertSubscribing] = useState(false);

  // Check OneSignal subscription status
  const checkOneSignalSubscription = async () => {
    try {
      // Wait for OneSignal to be ready using the promise from initialization
      let OneSignal: any = null;
      
      if (window.OneSignalReady) {
        // Use the initialization promise
        OneSignal = await window.OneSignalReady;
      } else if (window.OneSignal) {
        // Already loaded
        OneSignal = window.OneSignal;
      } else if (window.OneSignalDeferred) {
        // Wait for deferred initialization
        OneSignal = await new Promise<any>((resolve) => {
          window.OneSignalDeferred!.push((instance: any) => {
            resolve(instance);
          });
        });
      } else {
        // OneSignal not loaded yet, return silently
        return;
      }

      if (!OneSignal) {
        return; // OneSignal not available
      }
      
      // Check subscription status using multiple possible API structures
      let isOptedIn = false;
      
      if (OneSignal.User?.PushSubscription?.optedIn !== undefined) {
        isOptedIn = OneSignal.User.PushSubscription.optedIn;
      } else if (typeof OneSignal.isPushNotificationsEnabled === 'function') {
        try {
          isOptedIn = await OneSignal.isPushNotificationsEnabled();
        } catch (err) {
          console.warn('isPushNotificationsEnabled failed:', err);
        }
      } else if (OneSignal.getNotificationPermission) {
        const permission = OneSignal.getNotificationPermission();
        isOptedIn = permission === 'granted';
      } else if ('Notification' in window) {
        // Fallback to browser API
        isOptedIn = Notification.permission === 'granted';
      }

      setIsOneSignalSubscribed(isOptedIn);
    } catch (err) {
      console.error('Failed to check OneSignal subscription:', err);
      // Don't set error state, just log it
    }
  };

  // Handle OneSignal subscription
  const handleOneSignalSubscribe = async () => {
    try {
      setIsOneSignalSubscribing(true);
      
      // Wait for OneSignal to be ready using the promise from initialization
      let OneSignal: any = null;
      
      if (window.OneSignalReady) {
        // Use the initialization promise
        OneSignal = await window.OneSignalReady;
      } else if (window.OneSignal) {
        // Already loaded
        OneSignal = window.OneSignal;
      } else if (window.OneSignalDeferred) {
        // Wait for deferred initialization
        OneSignal = await new Promise<any>((resolve) => {
          window.OneSignalDeferred!.push((instance: any) => {
            resolve(instance);
          });
        });
      } else {
        // Poll for OneSignal to load (fallback)
        OneSignal = await new Promise<any>((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (window.OneSignal) {
              clearInterval(checkInterval);
              resolve(window.OneSignal);
            }
          }, 100);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('OneSignal failed to load'));
          }, 10000);
        });
      }

      if (!OneSignal) {
        console.error('OneSignal is not available');
        alert('OneSignal is not loaded. Please refresh the page and try again.');
        setIsOneSignalSubscribing(false);
        return;
      }

      console.log('OneSignal instance:', OneSignal);

      try {
        // Try using Slidedown first (recommended for v16)
        if (OneSignal.Slidedown && typeof OneSignal.Slidedown.promptPush === 'function') {
          console.log('Using Slidedown.promptPush');
          await OneSignal.Slidedown.promptPush();
        } else if (OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === 'function') {
          // Fallback: Request permission directly
          console.log('Using Notifications.requestPermission');
          const permission = await OneSignal.Notifications.requestPermission();
          if (permission === 'granted') {
            if (OneSignal.User?.PushSubscription?.optIn) {
              await OneSignal.User.PushSubscription.optIn();
            }
          }
        } else if (typeof OneSignal.registerForPushNotifications === 'function') {
          // Try legacy API method
          console.log('Using registerForPushNotifications');
          await OneSignal.registerForPushNotifications();
        } else if (typeof OneSignal.showSlidedownPrompt === 'function') {
          // Another fallback
          console.log('Using showSlidedownPrompt');
          await OneSignal.showSlidedownPrompt();
        } else {
          console.error('OneSignal API methods:', Object.keys(OneSignal));
          throw new Error('OneSignal subscription methods not available. Available methods: ' + Object.keys(OneSignal).join(', '));
        }

        // Wait a moment for subscription to complete
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check subscription status using multiple possible API structures
        let isOptedIn = false;
        let playerId: string | null = null;

        if (OneSignal.User?.PushSubscription) {
          isOptedIn = OneSignal.User.PushSubscription.optedIn ?? false;
          playerId = OneSignal.User.PushSubscription.id ?? null;
          console.log('Using User.PushSubscription - optedIn:', isOptedIn, 'id:', playerId);
        } else if (typeof OneSignal.isPushNotificationsEnabled === 'function') {
          try {
            isOptedIn = await OneSignal.isPushNotificationsEnabled();
            console.log('Using isPushNotificationsEnabled - optedIn:', isOptedIn);
            if (typeof OneSignal.getUserId === 'function') {
              playerId = await OneSignal.getUserId();
              console.log('Using getUserId - id:', playerId);
            }
          } catch (err) {
            console.warn('isPushNotificationsEnabled failed:', err);
          }
        } else if (OneSignal.getNotificationPermission) {
          const permission = OneSignal.getNotificationPermission();
          isOptedIn = permission === 'granted';
          console.log('Using getNotificationPermission - permission:', permission);
        } else {
          // Check browser permission directly
          if ('Notification' in window) {
            const permission = Notification.permission;
            isOptedIn = permission === 'granted';
            console.log('Using browser Notification.permission - permission:', permission);
          }
        }

        setIsOneSignalSubscribed(isOptedIn);
        
        if (isOptedIn) {
          console.log('Successfully subscribed to OneSignal notifications');
          
          // Get the player ID and send it to the backend
          if (playerId) {
            try {
              const token = getStoredToken();
              if (token) {
                await apiFetch(ENDPOINTS.profile.updateOneSignalPlayerId, {
                  method: 'POST',
                  token,
                  body: {
                    onesignal_player_id: playerId,
                  },
                });
                console.log('OneSignal player ID saved to backend:', playerId);
              }
            } catch (err) {
              console.error('Failed to save OneSignal player ID:', err);
              // Don't fail the subscription if saving player ID fails
            }
          } else {
            console.warn('OneSignal player ID not available yet - will retry on next check');
            // Retry getting player ID after a delay
            setTimeout(async () => {
              try {
                const OneSignal = window.OneSignal as any;
                const retryPlayerId = OneSignal?.User?.PushSubscription?.id || 
                                    (typeof OneSignal.getUserId === 'function' ? await OneSignal.getUserId() : null);
                if (retryPlayerId) {
                  const token = getStoredToken();
                  if (token) {
                    await apiFetch(ENDPOINTS.profile.updateOneSignalPlayerId, {
                      method: 'POST',
                      token,
                      body: { onesignal_player_id: retryPlayerId },
                    });
                  }
                }
              } catch (err) {
                console.error('Retry failed to save player ID:', err);
              }
            }, 3000);
          }
        } else {
          console.log('User declined OneSignal notifications');
        }
      } catch (err: any) {
        // Handle IndexedDB errors gracefully
        if (err?.name === 'UnknownError' || err?.message?.includes('indexedDB') || err?.message?.includes('backing store')) {
          console.error('IndexedDB error (browser storage issue):', err);
          alert('Unable to enable notifications due to browser storage restrictions. Please:\n1. Clear your browser cache\n2. Check browser settings allow storage\n3. Try a different browser or incognito mode');
        } else {
          console.error('Failed to subscribe to notifications:', err);
          alert('Failed to enable notifications: ' + (err?.message || 'Unknown error'));
        }
      }
    } catch (err) {
      console.error('Failed to subscribe to notifications:', err);
      alert('Failed to enable notifications. Please try again.');
    } finally {
      setIsOneSignalSubscribing(false);
    }
  };

  // Handle PushAlert subscription
  const handlePushAlertSubscribe = async () => {
    try {
      setIsPushAlertSubscribing(true);
      
      // Wait for PushAlert to load
      let pushAlertReady = false;
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      while (!pushAlertReady && attempts < maxAttempts) {
        if (window.PushAlert) {
          pushAlertReady = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.PushAlert) {
        console.error('PushAlert is not available');
        alert('PushAlert is not loaded. Please refresh the page and try again.');
        setIsPushAlertSubscribing(false);
        return;
      }

      const PushAlert = window.PushAlert as any;
      console.log('PushAlert instance:', PushAlert);

      try {
        // Check if PushAlert has subscription methods
        if (typeof PushAlert.subscribe === 'function') {
          // Use the subscribe method
          await PushAlert.subscribe();
          setIsPushAlertSubscribed(true);
          console.log('Successfully subscribed to PushAlert notifications');
        } else if (typeof PushAlert.requestPermission === 'function') {
          // Request permission directly
          const permission = await PushAlert.requestPermission();
          if (permission === 'granted' || permission === true) {
            setIsPushAlertSubscribed(true);
            console.log('Successfully subscribed to PushAlert notifications');
          } else {
            console.log('User declined PushAlert notifications');
          }
        } else if (typeof PushAlert.prompt === 'function') {
          // Use prompt method
          PushAlert.prompt();
          // Check subscription status after a delay
          setTimeout(() => {
            if (PushAlert.isSubscribed && PushAlert.isSubscribed()) {
              setIsPushAlertSubscribed(true);
            }
          }, 2000);
        } else {
          // Try to trigger subscription via custom event or direct API
          console.log('PushAlert methods available:', Object.keys(PushAlert));
          
          // Try browser Notification API as fallback
          if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              setIsPushAlertSubscribed(true);
              console.log('Browser notification permission granted');
            }
          } else if (Notification.permission === 'granted') {
            setIsPushAlertSubscribed(true);
            console.log('Already have browser notification permission');
          } else {
            throw new Error('PushAlert subscription methods not available');
          }
        }
      } catch (err: any) {
        console.error('Failed to subscribe to PushAlert:', err);
        alert('Failed to enable PushAlert notifications: ' + (err?.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to subscribe to PushAlert notifications:', err);
      alert('Failed to enable PushAlert notifications. Please try again.');
    } finally {
      setIsPushAlertSubscribing(false);
    }
  };

  // Check PushAlert subscription status
  const checkPushAlertSubscription = () => {
    if (window.PushAlert) {
      const PushAlert = window.PushAlert as any;
      if (typeof PushAlert.isSubscribed === 'function') {
        const isSubscribed = PushAlert.isSubscribed();
        setIsPushAlertSubscribed(isSubscribed);
      } else if (Notification.permission === 'granted') {
        // Fallback: check browser permission
        setIsPushAlertSubscribed(true);
      }
    }
  };

  // Check subscriptions on mount
  useEffect(() => {
    if (showOneSignal) {
      checkOneSignalSubscription();
    }
    if (showPushAlert) {
      // Check immediately
      checkPushAlertSubscription();
      // Also check after a delay in case PushAlert loads later
      const timeout = setTimeout(checkPushAlertSubscription, 2000);
      return () => clearTimeout(timeout);
    }
  }, [showOneSignal, showPushAlert]);

  if (!showOneSignal && !showPushAlert) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {showOneSignal && (
        <button
          onClick={handleOneSignalSubscribe}
          disabled={isOneSignalSubscribing || isOneSignalSubscribed}
          className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
            isOneSignalSubscribed
              ? 'bg-emerald-500 text-white shadow-lg cursor-not-allowed'
              : isOneSignalSubscribing
              ? 'bg-neutral-300 text-neutral-500 cursor-wait'
              : 'bg-[#830e4c] text-white shadow-lg active:scale-95 hover:bg-[#931e5c]'
          }`}
        >
          <Bell size={18} strokeWidth={2.5} />
          {isOneSignalSubscribed ? 'Subscribed (OneSignal)' : isOneSignalSubscribing ? 'Subscribing...' : 'Subscribe (OneSignal)'}
          {isOneSignalSubscribed && <Check size={16} strokeWidth={3} />}
        </button>
      )}

      {showPushAlert && (
        <button
          onClick={handlePushAlertSubscribe}
          disabled={isPushAlertSubscribing || isPushAlertSubscribed}
          className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
            isPushAlertSubscribed
              ? 'bg-blue-500 text-white shadow-lg cursor-not-allowed'
              : isPushAlertSubscribing
              ? 'bg-neutral-300 text-neutral-500 cursor-wait'
              : 'bg-blue-600 text-white shadow-lg active:scale-95 hover:bg-blue-700'
          }`}
        >
          <Bell size={18} strokeWidth={2.5} />
          {isPushAlertSubscribed ? 'Subscribed (PushAlert)' : isPushAlertSubscribing ? 'Subscribing...' : 'Subscribe (PushAlert)'}
          {isPushAlertSubscribed && <Check size={16} strokeWidth={3} />}
        </button>
      )}
    </div>
  );
};

