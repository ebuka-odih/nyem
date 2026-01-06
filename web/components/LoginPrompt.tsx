import React from 'react';
import { motion } from 'framer-motion';
import { Lock, LogIn, UserPlus } from 'lucide-react';

interface LoginPromptProps {
  onLogin: () => void;
  onRegister: () => void;
  title?: string;
  message?: string;
}

export const LoginPrompt: React.FC<LoginPromptProps> = ({ 
  onLogin, 
  onRegister,
  title = "Authentication Required",
  message = "Please login or register to access this feature"
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full px-8 text-center"
    >
      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
        <Lock size={28} className="text-neutral-400" />
      </div>
      
      <h2 className="text-2xl font-black text-neutral-900 tracking-tight uppercase mb-3">
        {title}
      </h2>
      
      <p className="text-sm text-neutral-500 mb-8 max-w-sm">
        {message}
      </p>
      
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={onLogin}
          className="w-full bg-neutral-900 text-white py-4 rounded-full font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <LogIn size={16} />
          Login
        </button>
        
        <button
          onClick={onRegister}
          className="w-full bg-white border-2 border-neutral-200 text-neutral-900 py-4 rounded-full font-black uppercase tracking-[0.2em] text-xs active:scale-95 transition-all flex items-center justify-center gap-2 hover:border-neutral-900"
        >
          <UserPlus size={16} />
          Register
        </button>
      </div>
    </motion.div>
  );
};









