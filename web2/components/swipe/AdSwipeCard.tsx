import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, TrendingUp, Zap, ArrowRight, Store, Sparkles } from 'lucide-react';

interface AdSwipeCardProps {
  onAction?: () => void;
}

export const AdSwipeCard: React.FC<AdSwipeCardProps> = ({ onAction }) => {
  const MotionDiv = motion.div as any;

  return (
    <div
      className="relative w-full h-full bg-[#830e4c] rounded-[32px] shadow-[0_20px_50px_rgba(131,14,76,0.3)] overflow-hidden flex flex-col border border-white/10"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-black/20 rounded-full blur-3xl" />
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
        {/* Animated Icon Container */}
        <MotionDiv 
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", repeat: Infinity, repeatType: "reverse", duration: 2 }}
          className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-8 border-4 border-[#830e4c]/20"
        >
          <Store size={48} className="text-[#830e4c]" strokeWidth={1.5} />
          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg">
            <TrendingUp size={16} strokeWidth={3} />
          </div>
        </MotionDiv>

        <div className="space-y-4 max-w-[280px]">
          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-[0.85]">
            Own a <br /> <span className="text-white/60">Business?</span>
          </h2>
          
          <p className="text-[11px] font-black text-white/70 uppercase tracking-[0.2em] leading-relaxed">
            Reach thousands of local buyers <br /> in your community instantly.
          </p>
        </div>

        <div className="mt-12 w-full space-y-3">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onAction?.(); 
            }}
            className="w-full bg-white text-[#830e4c] py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Start Dropping
            <Zap size={16} fill="currentColor" />
          </button>
          
          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="flex items-center gap-1.5 opacity-60">
              <Sparkles size={12} className="text-white" />
              <span className="text-[8px] font-black text-white uppercase tracking-widest">Free Listing</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-60">
              <ShoppingBag size={12} className="text-white" />
              <span className="text-[8px] font-black text-white uppercase tracking-widest">Verified Tags</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tag */}
      <div className="bg-black/20 backdrop-blur-md py-4 px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
            <Zap size={12} className="text-white" fill="currentColor" />
          </div>
          <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Nyem For Business</span>
        </div>
        <ArrowRight size={16} className="text-white/40" />
      </div>
    </div>
  );
};

