import React, { useState } from 'react';
import { Button } from './Button';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SignUpScreenProps {
  onSignUp: (email: string, name: string, password: string) => void;
  onBack: () => void;
  onSignIn: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSignUp, onBack, onSignIn }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, sendEmailOtp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation
      if (!name.trim()) {
        setError('Please enter your name');
        setLoading(false);
        return;
      }

      if (!email.trim()) {
        setError('Please enter an email address');
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

      if (!password.trim()) {
        setError('Please enter a password');
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

      // Register user - this now just validates and triggers email OTP
      const result = await register({
        email: email.trim(),
        name: name.trim(),
        password: password.trim(),
      });

      // Send email OTP
      await sendEmailOtp(email.trim());

      // Navigate to email OTP verification screen
      onSignUp(email.trim(), name.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
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
                    Create<br/>Account
                </h1>
            </div>
        </div>

        {/* Bottom Section: Form Card */}
        <div className="flex-1 bg-white w-full rounded-t-[36px] px-6 md:px-8 pt-10 md:pt-12 pb-6 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-500 overflow-y-auto">
            
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 flex-1 flex flex-col">
                {/* Name Input */}
                <div className="flex flex-col space-y-2">
                    <label className="text-brand font-bold text-sm">Name</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name" 
                        className="border-b border-gray-200 pb-2 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-brand font-medium text-lg w-full bg-transparent transition-colors rounded-none"
                    />
                </div>

                {/* Email Input */}
                <div className="flex flex-col space-y-2">
                    <label className="text-brand font-bold text-sm">Email</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com" 
                        className="border-b border-gray-200 pb-2 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-brand font-medium text-lg w-full bg-transparent transition-colors rounded-none"
                    />
                </div>

                {/* Password Input */}
                <div className="flex flex-col space-y-2 relative">
                    <label className="text-brand font-bold text-sm">Password</label>
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
                
                {/* Submit Button */}
                <div className="pt-4">
                     <Button 
                        fullWidth 
                        type="submit" 
                        className="shadow-xl py-4 uppercase text-lg tracking-wide"
                        disabled={loading}
                     >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </div>

                {/* Spacer to push footer down if there is space */}
                <div className="flex-grow"></div>

                {/* Footer */}
                <div className="pt-4 text-center pb-2">
                    <p className="text-gray-500 text-sm font-semibold">
                        Already have an account? <button type="button" onClick={onSignIn} className="text-brand font-bold hover:underline">Sign in</button>
                    </p>
                </div>
            </form>

        </div>
    </div>
  );
};

