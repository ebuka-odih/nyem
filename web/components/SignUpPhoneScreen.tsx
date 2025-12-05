import React, { useState } from 'react';
import { Button } from './Button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SignUpPhoneScreenProps {
  onSendOtp: (phone: string) => void;
  onBack: () => void;
}

export const SignUpPhoneScreen: React.FC<SignUpPhoneScreenProps> = ({ onSendOtp, onBack }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sendOtp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
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
      onSendOtp(phone);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
      console.error('Send OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

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
                    Enter your<br/>phone number
                </h1>
            </div>
        </div>

        {/* Bottom Section: Form Card */}
        <div className="flex-1 bg-white w-full rounded-t-[36px] px-6 md:px-8 pt-10 md:pt-12 pb-6 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-500">
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                <p className="text-gray-500 font-medium mb-6">We'll send a one-time code</p>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                        {error}
                    </div>
                )}

                {/* Phone Input Group */}
                <div className="flex items-end space-x-3 mb-10 border-b border-gray-200 pb-2">
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
                
                {/* Submit Button */}
                <div>
                     <Button 
                        fullWidth 
                        type="submit" 
                        className="shadow-xl py-4 font-extrabold text-lg tracking-wide rounded-full"
                        disabled={loading}
                     >
                        {loading ? 'Sending...' : 'Send OTP'}
                    </Button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">Standard SMS rates may apply</p>
                </div>
            </form>
        </div>
    </div>
  );
};