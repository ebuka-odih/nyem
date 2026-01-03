import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { ArrowLeft, Eye, EyeOff, Lock } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

interface ResetPasswordScreenProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ 
  email, 
  onSuccess, 
  onBack 
}) => {
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 'otp') {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // Extract only numeric characters from pasted text
    const numericCode = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (numericCode.length > 0) {
      const newOtp = [...otp];
      
      // Fill OTP inputs with pasted code
      for (let i = 0; i < 6; i++) {
        newOtp[i] = numericCode[i] || '';
      }
      
      setOtp(newOtp);
      
      // Focus the next empty input or the last input if all are filled
      const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    // Move to password step (we'll verify OTP with password reset)
    setStep('password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!password.trim()) {
        setError('Please enter a new password');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const otpCode = otp.join("");

      // Send reset password request
      await apiFetch(ENDPOINTS.auth.resetPassword, {
        method: 'POST',
        body: {
          email: email,
          code: otpCode,
          password: password,
          password_confirmation: confirmPassword,
        },
      });

      // Password reset successful
      setSuccessMessage('Password reset successful! Redirecting to sign in...');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
      // If OTP is invalid, go back to OTP step
      if (err.message?.toLowerCase().includes('otp') || err.message?.toLowerCase().includes('code')) {
        setStep('otp');
        setOtp(new Array(6).fill(""));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccessMessage(null);
    setResendLoading(true);
    try {
      await apiFetch(ENDPOINTS.auth.forgotPassword, {
        method: 'POST',
        body: { email },
      });
      setSuccessMessage('A new reset code has been sent to your email.');
      // Clear OTP inputs
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-brand relative header-safe-top-brand">
      {/* Top Section: Header */}
      <div className="px-6 pt-8 pb-8 md:pt-10 md:pb-8 shrink-0">
        <button 
          onClick={step === 'password' ? () => setStep('otp') : onBack} 
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>
        <div className="mt-6 md:mt-8 mb-4 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-wide">
            {step === 'otp' ? (
              <>Enter<br/>Reset Code</>
            ) : (
              <>Create New<br/>Password</>
            )}
          </h1>
        </div>
      </div>

      {/* Bottom Section: Form Card */}
      <div className="flex-1 bg-white w-full rounded-t-[36px] px-6 md:px-8 pt-10 md:pt-12 pb-6 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-500">
        
        {step === 'otp' ? (
          <form onSubmit={handleVerifyOtp} className="flex flex-col flex-1">
            <p className="text-gray-500 font-medium mb-8 text-center px-4 text-sm md:text-base">
              We sent a code to <span className="text-gray-700 font-semibold">{email}</span>
            </p>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                {successMessage}
              </div>
            )}

            {/* OTP Inputs */}
            <div className="flex justify-between gap-1 md:gap-2 mb-10 px-1">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  value={data}
                  onChange={(e) => handleOtpChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="flex-1 min-w-0 h-12 md:h-14 max-w-[50px] border border-gray-300 rounded-lg text-center text-xl md:text-2xl font-bold text-gray-800 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none transition-all bg-gray-50 p-0"
                  inputMode="numeric"
                />
              ))}
            </div>
            
            {/* Submit Button */}
            <div>
              <Button 
                fullWidth 
                type="submit" 
                className="shadow-xl py-4 font-extrabold text-lg tracking-wide rounded-full"
                disabled={loading}
              >
                Continue
              </Button>
            </div>

            <div className="mt-8 text-center">
              <button 
                type="button" 
                onClick={handleResend}
                disabled={resendLoading || loading}
                className="text-brand font-bold hover:text-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Sending...' : 'Resend Code'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6 md:space-y-8 flex-1 flex flex-col">
            {/* Icon */}
            <div className="flex justify-center mb-2">
              <div className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center">
                <Lock size={24} className="text-brand" />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col space-y-2 relative">
              <label className="text-brand font-bold text-sm">New Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="........" 
                  className="border-b border-gray-200 pb-2 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-brand font-medium text-lg w-full bg-transparent pr-10 tracking-widest transition-colors rounded-none"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 bottom-3 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="flex flex-col space-y-2 relative">
              <label className="text-brand font-bold text-sm">Confirm Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="........" 
                  className="border-b border-gray-200 pb-2 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-brand font-medium text-lg w-full bg-transparent pr-10 tracking-widest transition-colors rounded-none"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 bottom-3 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {successMessage}
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
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>

            {/* Spacer to push footer down if there is space */}
            <div className="flex-grow"></div>
          </form>
        )}

      </div>
    </div>
  );
};














