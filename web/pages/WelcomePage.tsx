import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  ShoppingBag, 
  Briefcase, 
  RefreshCw, 
  ArrowRight,
  UserPlus,
  LogIn
} from 'lucide-react';

interface WelcomePageProps {
  onStart: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { type: 'spring', stiffness: 300, damping: 25 } 
  }
};

export const WelcomePage: React.FC<WelcomePageProps> = ({ onStart, onLogin, onRegister }) => {
  const features = [
    {
      title: 'Marketplace',
      desc: 'Buy & sell from local sellers',
      icon: ShoppingBag,
      color: 'bg-rose-50',
      iconColor: 'text-[#830e4c]'
    },
    {
      title: 'Services',
      desc: 'Hire skilled professionals nearby',
      icon: Briefcase,
      color: 'bg-[#830e4c1a]',
      iconColor: 'text-[#830e4c]'
    },
    {
      title: 'Swap',
      desc: 'Trade items — no cash needed',
      icon: RefreshCw,
      color: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    }
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative w-full h-full bg-white flex flex-col items-center px-8 pt-[calc(env(safe-area-inset-top,0px)+48px)] pb-12 overflow-y-auto no-scrollbar"
    >
      {/* Branding Section */}
      <motion.div variants={itemVariants} className="flex flex-col items-center text-center mb-8 w-full">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#830e4c] rounded-full flex items-center justify-center text-white shadow-xl">
            <Zap size={24} fill="currentColor" />
          </div>
          <span className="text-4xl font-black tracking-tighter uppercase italic text-[#830e4c]">Nyem</span>
        </div>
        
        <h1 className="text-4xl font-black text-neutral-900 tracking-tighter uppercase italic leading-[0.85] mb-4">
          Your Local <br /> Marketplace
        </h1>
        
        <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-[260px] leading-relaxed">
          Connect with your community to buy, sell, trade, and hire — all in one app.
        </p>
      </motion.div>

      {/* Feature Cards */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        {features.map((f, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            className="flex items-center gap-4 p-4 bg-neutral-50 border border-neutral-100 rounded-[2rem] hover:bg-white transition-all group"
          >
            <div className={`w-11 h-11 ${f.color} rounded-2xl flex items-center justify-center ${f.iconColor} shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
              <f.icon size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-xs font-black text-neutral-900 uppercase tracking-tight leading-none mb-1">{f.title}</h3>
              <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Section */}
      <motion.div variants={itemVariants} className="w-full max-w-sm space-y-4">
        <button 
          onClick={onStart}
          className="w-full bg-[#830e4c] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-[0_20px_40px_-10px_rgba(131,14,76,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          Start Exploring
          <ArrowRight size={18} strokeWidth={3} />
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onLogin}
            className="bg-white border border-neutral-100 text-neutral-400 py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] active:scale-95 transition-all flex items-center justify-center gap-2 hover:text-[#830e4c] hover:border-[#830e4c33] shadow-sm"
          >
            <LogIn size={14} strokeWidth={3} />
            Login
          </button>
          <button 
            onClick={onRegister}
            className="bg-neutral-50 border border-transparent text-neutral-400 py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-[#830e4c1a] hover:text-[#830e4c] hover:border-[#830e4c33] shadow-sm"
          >
            <UserPlus size={14} strokeWidth={3} />
            Register
          </button>
        </div>

        <div className="text-center pt-2">
          <button 
            onClick={onStart}
            className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em] hover:text-[#830e4c] transition-colors"
          >
            Skip for now &rarr;
          </button>
        </div>
      </motion.div>

      {/* Footer Links */}
      <motion.div variants={itemVariants} className="mt-8 flex justify-center items-center gap-4 opacity-30 w-full">
        <button className="text-[8px] font-black text-neutral-900 uppercase tracking-widest">Terms</button>
        <div className="w-1 h-1 rounded-full bg-neutral-900" />
        <button className="text-[8px] font-black text-neutral-900 uppercase tracking-widest">Privacy</button>
      </motion.div>
    </motion.div>
  );
};