import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check } from 'lucide-react';
import { apiFetch, getStoredToken } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

// OneSignal TypeScript declarations
declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: Array<(OneSignal: any) => void | Promise<void>>;
    OneSignalReady?: Promise<any>;
  }
}

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (playerId: string) => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'prompt' | 'processing' | 'success'>('prompt');

  const handleAllow = async () => {
    try {
      setLoading(true);
      setError(null);
      setStep('processing');

      const token = getStoredToken();
      if (!token) {
        setError('Please login first');
        setLoading(false);
        setStep('prompt');
        return;
      }

      // Step 1: Request browser notification permission first
      if (!('Notification' in window)) {
        setError('Your browser does not support notifications');
        setLoading(false);
        setStep('prompt');
        return;
      }

      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      if (permission !== 'granted') {
        setError('Notification permission was denied. Please enable it in your browser settings.');
        setLoading(false);
        setStep('prompt');
        return;
      }

      // Step 2: Get OneSignal instance
      let OneSignal: any = null;
      
      if (window.OneSignalReady) {
        OneSignal = await window.OneSignalReady;
      } else if (window.OneSignal) {
        OneSignal = window.OneSignal;
      } else if (window.OneSignalDeferred) {
        OneSignal = await new Promise<any>((resolve) => {
          window.OneSignalDeferred!.push((instance: any) => {
            resolve(instance);
          });
        });
      }

      if (!OneSignal) {
        setError('OneSignal is not loaded. Please refresh the page and try again.');
        setLoading(false);
        setStep('prompt');
        return;
      }

      // Step 3: Opt in to OneSignal (since browser permission is already granted)
      try {
        // Try to opt in if not already opted in
        if (OneSignal.User?.PushSubscription) {
          const isOptedIn = OneSignal.User.PushSubscription.optedIn ?? false;
          if (!isOptedIn && OneSignal.User.PushSubscription.optIn) {
            await OneSignal.User.PushSubscription.optIn();
          }
        } else if (OneSignal.Notifications && typeof OneSignal.Notifications.requestPermission === 'function') {
          // Alternative method
          await OneSignal.Notifications.requestPermission();
        }

        // Wait a moment for OneSignal to process
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 4: Get player ID
        let playerId: string | null = null;
        
        // Try multiple methods to get player ID
        if (OneSignal.User?.PushSubscription?.id) {
          playerId = OneSignal.User.PushSubscription.id;
        } else if (typeof OneSignal.getUserId === 'function') {
          playerId = await OneSignal.getUserId();
        } else if (OneSignal.User?.id) {
          playerId = OneSignal.User.id;
        }

        // If still no player ID, wait a bit more and retry
        if (!playerId) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          if (OneSignal.User?.PushSubscription?.id) {
            playerId = OneSignal.User.PushSubscription.id;
          } else if (typeof OneSignal.getUserId === 'function') {
            playerId = await OneSignal.getUserId();
          }
        }

        if (!playerId) {
          setError('Unable to get notification ID. Please try refreshing the page.');
          setLoading(false);
          setStep('prompt');
          return;
        }

        // Step 5: Register player ID with backend
        try {
          await apiFetch(ENDPOINTS.profile.updateOneSignalPlayerId, {
            method: 'POST',
            token,
            body: {
              onesignal_player_id: playerId,
            },
          });
        } catch (err: any) {
          console.warn('Failed to register player ID (may already be registered):', err);
          // Continue anyway - player ID might already be registered
        }

        // Success!
        setStep('success');
        setTimeout(() => {
          onSuccess(playerId);
          onClose();
        }, 1500);
      } catch (err: any) {
        console.error('OneSignal subscription error:', err);
        setError('Failed to enable notifications: ' + (err?.message || 'Unknown error'));
        setLoading(false);
        setStep('prompt');
      }
    } catch (err: any) {
      console.error('Notification permission error:', err);
      setError(err?.message || 'Failed to enable notifications. Please try again.');
      setLoading(false);
      setStep('prompt');
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && step !== 'processing') {
            handleSkip();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
        >
          {step === 'success' ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Check size={32} className="text-emerald-600" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-neutral-900 tracking-tight mb-3">
                Notifications Enabled! 🎉
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                You'll now receive push notifications from Nyem.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <Bell size={32} className="text-indigo-600" strokeWidth={2.5} />
                </div>
                {step !== 'processing' && (
                  <button
                    onClick={handleSkip}
                    className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              <h2 className="text-2xl font-black text-neutral-900 tracking-tight mb-3">
                Enable Push Notifications
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                Get notified about new matches, messages, and important updates! We'll ask for your permission to send notifications.
              </p>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm mb-4">
                  {error}
                </div>
              )}

              {step === 'processing' ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleAllow}
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Bell size={16} />
                    Enable Notifications
                  </button>
                  
                  <button
                    onClick={handleSkip}
                    disabled={loading}
                    className="w-full bg-white border-2 border-neutral-200 text-neutral-600 py-4 rounded-full font-black uppercase tracking-widest text-xs active:scale-95 transition-all hover:border-neutral-400 disabled:opacity-50"
                  >
                    Maybe Later
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

