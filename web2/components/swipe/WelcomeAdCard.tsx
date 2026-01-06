import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Heart, X, Star, MousePointer2, ChevronRight, Sparkles } from 'lucide-react';

interface WelcomeAdCardProps {
  onAction?: () => void;
}

export const WelcomeAdCard: React.FC<WelcomeAdCardProps> = ({ onAction }) => {
  const MotionDiv = motion.div as any;

  return (
    <div className="relative w-full h-full bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col border border-neutral-100">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-full h-full bg-[#830e4c]/5 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-full h-full bg-indigo-500/5 rounded-full blur-[100px]" />

      <div className="flex-1 flex flex-col p-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#830e4c] rounded-xl flex items-center justify-center text-white shadow-lg">
            <Zap size={20} fill="currentColor" />
          </div>
          <div>
            <h2 className="text-xl font-black text-neutral-900 tracking-tight uppercase italic leading-none">Welcome</h2>
            <p className="text-[9px] font-black text-[#830e4c] uppercase tracking-widest mt-1">To Nyem Marketplace</p>
          </div>
        </div>

        <div className="space-y-8 flex-1">
          <h1 className="text-4xl font-black text-neutral-900 tracking-tighter uppercase italic leading-[0.85]">
            Let's get you <br /> <span className="text-[#830e4c]">Started.</span>
          </h1>

          <div className="space-y-6">
            {/* Tutorial Items */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0 border border-rose-100 shadow-sm">
                <X size={20} strokeWidth={3} />
              </div>
              <div>
                <h4 className="text-xs font-black text-neutral-900 uppercase tracking-tight">Swipe Left</h4>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">To pass on items you don't like</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-100 shadow-sm">
                <Heart size={20} fill="currentColor" strokeWidth={0} />
              </div>
              <div>
                <h4 className="text-xs font-black text-neutral-900 uppercase tracking-tight">Swipe Right</h4>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">To save to your wishlist</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#830e4c] shrink-0 border border-indigo-100 shadow-sm">
                <Star size={20} fill="currentColor" strokeWidth={0} />
              </div>
              <div>
                <h4 className="text-xs font-black text-neutral-900 uppercase tracking-tight">Swipe Up</h4>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">To notify seller immediately</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prompt to begin */}
        <div className="mt-8 bg-neutral-50 rounded-3xl p-6 flex items-center justify-between border border-neutral-100">
          <div className="flex items-center gap-3">
            <MotionDiv 
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#830e4c] shadow-sm"
            >
              <MousePointer2 size={18} strokeWidth={2.5} />
            </MotionDiv>
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Try it now</span>
          </div>
          <div className="flex items-center gap-1 text-[#830e4c]">
            <ChevronRight size={16} strokeWidth={4} />
            <ChevronRight size={16} strokeWidth={4} className="opacity-40" />
            <ChevronRight size={16} strokeWidth={4} className="opacity-10" />
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="bg-neutral-50 py-4 px-8 border-t border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-[#830e4c]" />
          <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic">Happy Discovering</span>
        </div>
      </div>
    </div>
  );
};

