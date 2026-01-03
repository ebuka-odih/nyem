import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Chrome } from 'lucide-react';
import { Button } from './Button';

interface LoginPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (method: 'google' | 'email') => void;
  onSignUp?: () => void;
  title?: string;
  subtitle?: string;
}

export const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onSignUp,
  title = "Sign In to Continue",
  subtitle = "Already have an account? Sign in to continue.",
}) => {
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
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{title}</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{subtitle}</p>
            </div>

            {/* Login Methods */}
            <div className="space-y-3 mb-4">
              {/* Email - Primary */}
              <Button
                fullWidth
                onClick={() => onLogin('email')}
                className="flex items-center justify-center space-x-3"
              >
                <Mail size={20} />
                <span>Continue with Email</span>
              </Button>

              {/* Google */}
              <button
                onClick={() => onLogin('google')}
                className="w-full py-3.5 px-4 rounded-full font-bold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center space-x-3"
              >
                <Chrome size={20} className="text-blue-500" />
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Sign Up Link */}
            {onSignUp && (
              <div className="text-center mb-3">
                <span className="text-gray-500 text-sm">Don't have an account? </span>
                <button
                  onClick={() => {
                    onClose();
                    onSignUp();
                  }}
                  className="text-brand font-semibold text-sm hover:underline transition-colors"
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Close Button */}
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



