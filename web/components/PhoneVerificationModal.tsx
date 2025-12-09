import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  /** Custom message to show in the modal. Defaults to generic verification message. */
  message?: string;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  message,
}) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { sendOtp, verifyPhoneForSeller } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStep('phone');
      setPhone('');
      setOtp(new Array(6).fill(""));
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'otp') {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (phone.length < 8) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `+234${phone}`;
      await sendOtp(fullPhone);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
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

    setLoading(true);
    try {
      const fullPhone = `+234${phone}`;
      await verifyPhoneForSeller(fullPhone, otpCode);
      onVerified();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please try again.');
      // Clear OTP on error
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {step === 'phone' ? 'Verify Phone Number' : 'Enter Verification Code'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-gray-600 text-sm mb-4">
                {message || 'To upload items and connect with buyers, we need to verify your phone number. This helps keep our community safe and trustworthy.'}
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-end space-x-3 border-b border-gray-200 pb-2">
                <span className="text-lg font-bold text-gray-900 pb-1">+234</span>
                <div className="w-px h-6 bg-gray-300 mb-1"></div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="8012345678"
                  className="flex-1 text-gray-600 placeholder-gray-300 focus:outline-none font-medium text-lg bg-transparent pb-1 rounded-none"
                  autoFocus
                />
              </div>

              <Button
                fullWidth
                type="submit"
                className="mt-6"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-gray-600 text-sm mb-4 text-center">
                We sent a code to <span className="font-semibold">+234{phone}</span>
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {successMessage}
                </div>
              )}

              <div className="flex justify-between gap-2 mb-6">
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
                    className="flex-1 h-12 border border-gray-300 rounded-lg text-center text-xl font-bold text-gray-800 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none transition-all bg-gray-50"
                    inputMode="numeric"
                  />
                ))}
              </div>

              <Button
                fullWidth
                type="submit"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>

              <div className="flex items-center justify-center space-x-4 mt-4">
                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    setSuccessMessage(null);
                    setResendLoading(true);
                    try {
                      const fullPhone = `+234${phone}`;
                      await sendOtp(fullPhone);
                      setSuccessMessage('A new code has been sent to your phone.');
                      setOtp(new Array(6).fill(""));
                      inputRefs.current[0]?.focus();
                      setTimeout(() => setSuccessMessage(null), 5000);
                    } catch (err: any) {
                      setError(err.message || 'Failed to resend OTP.');
                    } finally {
                      setResendLoading(false);
                    }
                  }}
                  disabled={resendLoading || loading}
                  className="text-brand font-bold hover:text-brand-dark transition-colors disabled:opacity-50"
                >
                  {resendLoading ? 'Sending...' : 'Resend Code'}
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp(new Array(6).fill(""));
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-gray-500 font-medium hover:text-gray-700 transition-colors"
                >
                  Change Number
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};


