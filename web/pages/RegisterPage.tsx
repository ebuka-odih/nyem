import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, User, Mail, Lock, ArrowRight, Chrome, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

interface RegisterPageProps {
  onRegister: (email: string, name: string, password: string) => void;
  onGoToLogin: () => void;
  onSkip: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onGoToLogin, onSkip }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col px-8 pt-[calc(env(safe-area-inset-top,0px)+32px)] pb-12 w-full h-full overflow-y-auto no-scrollbar max-w-[768px] mx-auto"
    >
      <button 
        onClick={onGoToLogin}
        className="w-10 h-10 bg-neutral-100 rounded-2xl flex items-center justify-center text-[#830e4c] mb-8 active:scale-90 transition-all self-start"
      >
        <ArrowLeft size={20} strokeWidth={3} />
      </button>

      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-12 h-12 bg-[#830e4c] rounded-full flex items-center justify-center text-white shadow-xl mb-6">
          <Zap size={24} fill="currentColor" />
        </div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tighter uppercase italic leading-none mb-4">
          Create Account
        </h1>
        <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
          Join thousands of local discoverers
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-[#830e4c]" size={18} />
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Thompson"
              className="w-full bg-white border border-neutral-200 rounded-[1.5rem] pl-14 pr-6 py-5 text-sm font-black text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all shadow-sm placeholder:text-neutral-200"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-[#830e4c]" size={18} />
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
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-[#830e4c]" size={18} />
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
          onClick={async () => {
            setError(null);
            
            // Validate inputs
            if (!name.trim()) {
              setError('Please enter your full name');
              return;
            }
            
            if (!email.trim()) {
              setError('Please enter your email address');
              return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
              setError('Please enter a valid email address');
              return;
            }
            
            if (!password.trim()) {
              setError('Please enter a password');
              return;
            }
            
            if (password.length < 6) {
              setError('Password must be at least 6 characters');
              return;
            }
            
            setLoading(true);
            
            try {
              // Register user (validates and prepares for OTP)
              await apiFetch(ENDPOINTS.auth.register, {
                method: 'POST',
                body: {
                  email: email.trim(),
                  name: name.trim(),
                  password: password.trim(),
                },
              });
              
              // Send email OTP
              await apiFetch(ENDPOINTS.auth.sendEmailOtp, {
                method: 'POST',
                body: {
                  email: email.trim(),
                },
              });
              
              // Navigate to OTP verification page
              onRegister(email.trim(), name.trim(), password.trim());
            } catch (err: any) {
              setError(err.message || 'Registration failed. Please try again.');
              console.error('Registration error:', err);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="w-full bg-[#830e4c] text-white py-6 rounded-full font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending OTP...' : 'Verify Email'}
          {!loading && <ArrowRight size={18} strokeWidth={3} />}
        </button>

        <button className="w-full bg-white border border-neutral-200 text-neutral-900 py-5 rounded-full font-black uppercase tracking-[0.2em] text-[11px] shadow-sm active:scale-95 transition-all flex items-center justify-center gap-3">
          <Chrome size={18} className="text-[#830e4c]" />
          Sign up with Google
        </button>
      </div>

      <div className="mt-auto pt-10 text-center space-y-4">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
          Already a member? <button onClick={onGoToLogin} className="text-[#830e4c]">Sign in instead</button>
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
