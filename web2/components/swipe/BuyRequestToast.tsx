import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BuyRequestToastProps {
  isOpen: boolean;
  onClose: () => void;
  sellerName: string;
  duration?: number; // Duration in milliseconds before auto-dismiss
}

/**
 * Toast notification shown when a buy request is successfully sent
 * Auto-dismisses after specified duration
 */
export const BuyRequestToast: React.FC<BuyRequestToastProps> = ({
  isOpen,
  onClose,
  sellerName,
  duration = 3000, // Default 3 seconds
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4 pointer-events-none"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 flex items-start gap-3 w-full max-w-md pointer-events-auto">
            {/* Success Icon */}
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} className="text-green-600" />
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                Buy Request Sent!
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your message has been sent to <span className="font-semibold">{sellerName}</span>. You can continue the conversation in your matches.
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

