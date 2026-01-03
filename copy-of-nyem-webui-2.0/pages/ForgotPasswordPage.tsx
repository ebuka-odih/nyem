
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Mail, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface ForgotPasswordPageProps {
  onBack: () => void;
  onSubmit: () => void;
}

// Fix: Casting to any to bypass environment-specific type errors for motion components
const MotionDiv = motion.div as any;

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack, onSubmit }) => {
  const [email, setEmail] = useState("");

  return (
    <MotionDiv 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex flex-col px-8 pt-8 pb-12 w-full h-full overflow-y-auto no-scrollbar"
    >
      <button 
        onClick={onBack}
        className="w-10 h-10 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-900 mb-8 active:scale-90 transition-all"
      >
        <ArrowLeft size={20} strokeWidth={3} />
      </button>

      <div className="flex flex-col items-start mb-10">
        <div className="w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center text-white shadow-xl mb-6">
          <Sparkles size={24} />
        </div>
        <h1 className="text-3xl font-black text-neutral-900 tracking-tighter uppercase italic leading-none mb-4">
          Forgot Password
        </h1>
        <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
          No worries! Enter your email and we'll send you instructions to reset it.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-300" size={18} />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full bg-white border border-neutral-200 rounded-[1.5rem] pl-14 pr-6 py-5 text-sm font-black text-neutral-900 focus:outline-none focus:border-neutral-900 transition-all shadow-sm placeholder:text-neutral-200"
            />
          </div>
        </div>

        <button 
          onClick={onSubmit}
          className="w-full bg-neutral-900 text-white py-6 rounded-full font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          Reset Password
          <ArrowRight size={18} strokeWidth={3} />
        </button>
      </div>
    </MotionDiv>
  );
};
