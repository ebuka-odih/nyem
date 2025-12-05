import React, { useState } from 'react';
import { Button } from './Button';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SignInScreenProps {
  onSignIn: () => void;
  onBack: () => void;
  onSignUp: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ onSignIn, onBack, onSignUp }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!username.trim() || !password.trim()) {
        setError('Please enter both username and password');
        setLoading(false);
        return;
      }

      await login(username.trim(), password);
      onSignIn();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-brand relative">
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
                    Hello<br/>Sign in!
                </h1>
            </div>
        </div>

        {/* Bottom Section: Form Card */}
        <div className="flex-1 bg-white w-full rounded-t-[36px] px-6 md:px-8 pt-10 md:pt-12 pb-6 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-500">
            
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 flex-1 flex flex-col">
                {/* Username Input */}
                <div className="flex flex-col space-y-2">
                    <label className="text-brand font-bold text-sm">Username or Phone</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Joydeo@gmail.com" 
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

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Forgot Password */}
                <div className="w-full text-right">
                    <button type="button" className="text-gray-500 font-bold text-sm hover:text-brand transition-colors">Forgot password?</button>
                </div>
                
                {/* Submit Button */}
                <div className="pt-4">
                     <Button 
                        fullWidth 
                        type="submit" 
                        className="shadow-xl py-4 uppercase text-lg tracking-wide"
                        disabled={loading}
                     >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                </div>

                {/* Spacer to push footer down if there is space */}
                <div className="flex-grow"></div>

                {/* Footer */}
                <div className="pt-4 text-center pb-2">
                    <p className="text-gray-500 text-sm font-semibold">
                        Don't have account? <button type="button" onClick={onSignUp} className="text-brand font-bold hover:underline">Sign up</button>
                    </p>
                </div>
            </form>

        </div>
    </div>
  );
};