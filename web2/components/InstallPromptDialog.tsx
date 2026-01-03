import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share, Plus } from 'lucide-react';
import { Button } from './Button';

interface InstallPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Detect if device is iOS
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Detect if device is Android
const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

// Check if app is already installed (standalone mode)
const isStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

export const InstallPromptDialog: React.FC<InstallPromptDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) {
      return;
    }

    // Detect device type
    if (isIOS()) {
      setDeviceType('ios');
    } else if (isAndroid()) {
      setDeviceType('android');
      
      // Listen for the beforeinstallprompt event (Android)
      const handleBeforeInstallPrompt = (e: Event) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Save the event so it can be triggered later
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    } else {
      setDeviceType('other');
    }
  }, []);

  // Handle Android install prompt
  const handleAndroidInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    onClose();
  };

  // Don't show if already installed or not mobile
  // This is a safety check (WelcomeScreen should already handle this)
  if (isStandalone() || deviceType === 'other') {
    return null;
  }

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="text-center mb-6 pt-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand-600 flex items-center justify-center mx-auto mb-4">
                <Download size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                Install Nyem
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Add Nyem to your home screen for quick access and a better experience
              </p>
            </div>

            {/* iOS Instructions */}
            {deviceType === 'ios' && (
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <Share size={18} className="text-brand shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Tap the Share button
                    </p>
                    <p className="text-xs text-gray-600">
                      Look for the Share icon at the bottom of your Safari browser
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Plus size={18} className="text-brand shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Select "Add to Home Screen"
                    </p>
                    <p className="text-xs text-gray-600">
                      Scroll down and tap "Add to Home Screen" from the menu
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Download size={18} className="text-brand shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Confirm installation
                    </p>
                    <p className="text-xs text-gray-600">
                      Tap "Add" in the top right corner to finish
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Android Install Button */}
            {deviceType === 'android' && deferredPrompt && (
              <div className="mb-6">
                <Button
                  fullWidth
                  onClick={handleAndroidInstall}
                  className="py-3.5 text-base font-bold rounded-2xl shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30"
                >
                  <Download size={20} className="mr-2" />
                  Install App
                </Button>
              </div>
            )}

            {/* Android - No prompt available yet */}
            {deviceType === 'android' && !deferredPrompt && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 text-center">
                  Look for the install prompt in your browser, or use the menu to "Add to Home Screen"
                </p>
              </div>
            )}

            {/* Footer */}
            <button
              onClick={onClose}
              className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Maybe Later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};













