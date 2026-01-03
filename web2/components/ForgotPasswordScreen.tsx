import React, { useState } from 'react';
import { Button } from './Button';
import { ArrowLeft, Mail } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

interface ForgotPasswordScreenProps {
  onSubmit: (email: string) => void;
  onBack: () => void;
  onSignIn: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ 
  onSubmit, 
  onBack, 
  onSignIn 
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email.trim()) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Send forgot password request to backend
      await apiFetch(ENDPOINTS.auth.forgotPassword, {
        method: 'POST',
        body: { email: email.trim() },
      });

      // Navigate to reset password screen
      onSubmit(email.trim());
    } catch (err: any) {
      // Don't reveal if email exists or not for security
      // Still proceed to reset password screen
      onSubmit(email.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-brand relative header-safe-top-brand">
      {/* Top Section: Header */}
      <div className="px-6 pt-8 pb-8 md:pt-10 md:pb-10 shrink-0">
        <button 
          onClick={onBack} 
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <div className="mt-6 md:mt-8 mb-4 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-wide">
            Forgot<br/>Password?
          </h1>
        </div>
      </div>

      {/* Bottom Section: Form Card */}
      <div className="flex-1 bg-white w-full rounded-t-[36px] px-6 md:px-8 pt-10 md:pt-12 pb-6 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-500">
        
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center">
            <Mail size={28} className="text-brand" />
          </div>
        </div>

        {/* Instructions */}
        <p className="text-gray-500 text-center text-sm mb-8 leading-relaxed">
          Enter the email address associated with your account. We'll send you a code to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 flex-1 flex flex-col">
          {/* Email Input */}
          <div className="flex flex-col space-y-2">
            <label className="text-brand font-bold text-sm">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com" 
              className="border-b border-gray-200 pb-2 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-brand font-medium text-lg w-full bg-transparent transition-colors rounded-none"
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {/* Submit Button */}
          <div className="pt-4">
            <Button 
              fullWidth 
              type="submit" 
              className="shadow-xl py-4 uppercase text-lg tracking-wide"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </Button>
          </div>

          {/* Spacer to push footer down if there is space */}
          <div className="flex-grow"></div>

          {/* Footer */}
          <div className="pt-4 text-center pb-2">
            <p className="text-gray-500 text-sm font-semibold">
              Remember your password? <button type="button" onClick={onSignIn} className="text-brand font-bold hover:underline">Sign in</button>
            </p>
          </div>
        </form>

      </div>
    </div>
  );
};














