import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, ArrowRight, Chrome } from 'lucide-react';
import { apiFetch, storeToken, storeUser } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

interface LoginPageProps {
  onLogin: () => void;
  onGoToRegister: () => void;
  onGoToForgot: () => void;
  onSkip: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGoToRegister, onGoToForgot, onSkip }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs
      if (!email.trim() || !password.trim()) {
        setError('Please enter both email and password');
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

      // Call login API
      const response = await apiFetch<{ user: any; token: string }>(
        ENDPOINTS.auth.login,
        {
          method: 'POST',
          body: {
            username_or_phone: email.trim(),
            password: password,
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

      // Call onLogin callback to update parent state
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials and try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col px-8 pt-[calc(env(safe-area-inset-top,0px)+48px)] pb-12 w-full h-full overflow-y-auto no-scrollbar max-w-[768px] mx-auto"
    >
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-12 h-12 bg-[#830e4c] rounded-full flex items-center justify-center text-white shadow-xl mb-6">
          <Zap size={24} fill="currentColor" />
        </div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tighter uppercase italic leading-none mb-4">
          Welcome Back
        </h1>
        <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
          Log in to continue your discovery
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[#830e4c1a] text-[#830e4c]" size={18} />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full bg-white border border-neutral-200 rounded-[1.5rem] pl-14 pr-6 py-5 text-sm font-black text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all shadow-sm placeholder:text-neutral-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Password</label>
            <button 
              onClick={onGoToForgot}
              className="text-[10px] font-black text-[#830e4c] uppercase tracking-widest"
            >
              Forgot?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-[#830e4c1a] text-[#830e4c]" size={18} />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-neutral-200 rounded-[1.5rem] pl-14 pr-6 py-5 text-sm font-black text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all shadow-sm placeholder:text-neutral-200"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#830e4c] text-white py-6 rounded-full font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing In...' : 'Sign In'}
          {!loading && <ArrowRight size={18} strokeWidth={3} />}
        </button>

        <div className="relative flex items-center justify-center py-4">
          <div className="absolute inset-0 flex items-center px-2">
            <div className="w-full border-t border-neutral-100"></div>
          </div>
          <span className="relative px-4 bg-white text-[9px] font-black text-neutral-300 uppercase tracking-widest">Or continue with</span>
        </div>

        <button className="w-full bg-white border border-neutral-200 text-neutral-900 py-5 rounded-full font-black uppercase tracking-[0.2em] text-[11px] shadow-sm active:scale-95 transition-all flex items-center justify-center gap-3">
          <Chrome size={18} className="text-[#830e4c]" />
          Google Account
        </button>
      </div>

      <div className="mt-auto pt-10 text-center space-y-4">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
          New to Nyem? <button onClick={onGoToRegister} className="text-[#830e4c]">Join the community</button>
        </p>
        <button 
          onClick={onSkip}
          className="text-[10px] font-black text-neutral-300 uppercase tracking-widest hover:text-[#830e4c] transition-colors"
        >
          Continue as Guest &rarr;
        </button>
      </div>
    </motion.div>
  );
};
