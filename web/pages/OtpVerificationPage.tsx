import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiFetch, storeToken, storeUser } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

interface OtpVerificationPageProps {
  email: string;
  name?: string;
  password?: string;
  onVerify: () => void;
  onBack: () => void;
}

export const OtpVerificationPage: React.FC<OtpVerificationPageProps> = ({ email, name, password, onVerify, onBack }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (element: HTMLInputElement, index: number) => {
    // Only allow numeric input
    const value = element.value.replace(/[^0-9]/g, '');
    if (!value && element.value !== '') return;

    const newOtp = [...otp.map((d, idx) => (idx === index ? value : d))];
    setOtp(newOtp);
    setError(null);

    // Move to next input if value entered
    if (value && element.nextSibling) {
      (element.nextSibling as HTMLInputElement).focus();
    }
    
    // Auto-submit when all 6 digits are entered
    if (newOtp.every(d => d !== "") && newOtp.length === 6) {
      setTimeout(() => handleVerify(newOtp.join("")), 100);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      setError(null);
      // Focus the last input
      inputRefs.current[5]?.focus();
      // Auto-verify
      setTimeout(() => handleVerify(pastedData), 100);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join("");
    
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Verify OTP with email and code
      const response = await apiFetch<{ user: any; token: string; new_user?: boolean }>(
        ENDPOINTS.auth.verifyOtp,
        {
          method: 'POST',
          body: {
            email: email,
            code: code,
            ...(name && { name }),
            ...(password && { password }),
          },
        }
      );

      // Store token and user
      const token = response.token;
      const user = response.user || response.data?.user;

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      storeToken(token);
      storeUser(user);

      // Call onVerify callback
      onVerify();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please try again.');
      console.error('Verify OTP error:', err);
      // Clear OTP on error
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccessMessage(null);
    setResendLoading(true);
    
    try {
      await apiFetch(ENDPOINTS.auth.sendEmailOtp, {
        method: 'POST',
        body: { email },
      });
      
      setSuccessMessage('A new OTP code has been sent to your email.');
      // Clear OTP inputs
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col px-8 pt-[calc(env(safe-area-inset-top,0px)+32px)] pb-12 w-full h-full overflow-y-auto no-scrollbar max-w-[768px] mx-auto"
    >
      <button 
        onClick={onBack}
        className="w-10 h-10 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-900 mb-8 active:scale-90 transition-all"
      >
        <ArrowLeft size={20} strokeWidth={3} />
      </button>

      <div className="flex flex-col items-center text-center mb-12">
        <div className="w-16 h-16 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-sm mb-6">
          <ShieldCheck size={32} strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tighter uppercase italic leading-none mb-4">
          Verify Email
        </h1>
        <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-[280px] mx-auto leading-relaxed">
          Enter the 6-digit code sent to <br /><span className="text-neutral-900">{email || "your email"}</span>
        </p>
      </div>

      <div className="flex justify-center gap-2 sm:gap-3 md:gap-4 mb-12 px-2">
        {otp.map((data, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={data}
            ref={(el) => (inputRefs.current[index] = el)}
            onChange={(e) => handleChange(e.target, index)}
            onFocus={(e) => e.target.select()}
            onPaste={index === 0 ? handlePaste : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !data && index > 0) {
                inputRefs.current[index - 1]?.focus();
              } else if (e.key === 'ArrowLeft' && index > 0) {
                inputRefs.current[index - 1]?.focus();
              } else if (e.key === 'ArrowRight' && index < 5) {
                inputRefs.current[index + 1]?.focus();
              }
            }}
            className="flex-1 min-w-0 max-w-[60px] sm:max-w-[70px] md:max-w-[80px] h-14 sm:h-16 md:h-20 bg-white border-2 border-neutral-100 rounded-[1.5rem] text-center text-xl sm:text-2xl md:text-3xl font-black text-neutral-900 focus:outline-none focus:border-indigo-600 focus:shadow-lg focus:shadow-indigo-100 transition-all"
          />
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
          {successMessage}
        </div>
      )}

      <div className="space-y-8">
        <button 
          onClick={() => handleVerify()}
          disabled={loading || otp.some(d => d === "")}
          className="w-full bg-[#830e4c] text-white py-6 rounded-full font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify & Finish'}
          {!loading && <ArrowRight size={18} strokeWidth={3} />}
        </button>

        <div className="text-center">
          <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">
            Didn't receive code?{' '}
            <button 
              onClick={handleResend}
              disabled={resendLoading}
              className="text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? 'Sending...' : 'Resend Code'}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};
