import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SignUpOtpScreenProps {
  phoneNumber: string;
  onVerify: (isNewUser: boolean) => void;
  onBack: () => void;
}

export const SignUpOtpScreen: React.FC<SignUpOtpScreenProps> = ({ phoneNumber, onVerify, onBack }) => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { verifyOtp } = useAuth();

  const handleChange = (element: HTMLInputElement, index: number) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `+234${phoneNumber}`;
      const result = await verifyOtp({
        phone: fullPhone,
        code: otpCode,
      });
      onVerify(result.new_user);
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

  useEffect(() => {
      inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-brand relative">
        {/* Top Section: Header */}
        <div className="px-6 pt-8 pb-8 md:pt-10 md:pb-8 shrink-0">
            <button 
                onClick={onBack} 
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                aria-label="Go back"
            >
                <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <div className="mt-6 md:mt-8 mb-4 text-center">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-wide">
                    Enter<br/>verification code
                </h1>
            </div>
        </div>

        {/* Bottom Section: Form Card */}
        <div className="flex-1 bg-white w-full rounded-t-[36px] px-6 md:px-8 pt-10 md:pt-12 pb-6 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-500">
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                <p className="text-gray-500 font-medium mb-8 text-center px-4 text-sm md:text-base">
                    We sent a code to <span className="text-gray-700 font-semibold">+234{phoneNumber}</span>
                </p>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                        {error}
                    </div>
                )}

                {/* OTP Inputs - Flex container ensures they fit on small screens */}
                <div className="flex justify-between gap-1 md:gap-2 mb-10 px-1">
                    {otp.map((data, index) => (
                        <input
                            key={index}
                            type="text"
                            maxLength={1}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            value={data}
                            onChange={(e) => handleChange(e.target, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
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
                        {loading ? 'Verifying...' : 'Verify'}
                    </Button>
                </div>

                <div className="mt-8 text-center">
                    <button type="button" className="text-brand font-bold hover:text-brand-dark transition-colors">
                        Resend OTP
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};