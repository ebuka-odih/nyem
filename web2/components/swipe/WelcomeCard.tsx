import React from 'react';
import { ArrowLeftRight, ChevronRight } from 'lucide-react';

interface WelcomeCardProps {
  onDismiss?: () => void;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ onDismiss }) => {
  return (
    <div className="w-full h-full flex flex-col rounded-[32px] overflow-hidden bg-gradient-to-br from-brand via-brand-700 to-brand-800 shadow-2xl shadow-black/20 border border-white/10 relative">
      
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>


      {/* Main Content */}
      <div className="relative flex-1 flex flex-col justify-center px-8 py-10">
        
        {/* Headline */}
        <div className="mb-8">
          <h1 className="text-[32px] font-black text-white leading-tight tracking-tight mb-4">
            Swipe right on things you like
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            See something you want? Swipe right to show interest. The seller gets notified and you can start chatting.
          </p>
        </div>

        {/* Visual hint */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-2">
              <span className="text-2xl">👈</span>
            </div>
            <span className="text-white/50 text-xs font-medium">Pass</span>
          </div>
          
          <ArrowLeftRight size={24} className="text-brand" />
          
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mb-2">
              <span className="text-2xl">👉</span>
            </div>
            <span className="text-emerald-400/80 text-xs font-medium">Interested</span>
          </div>
        </div>

        {/* Simple instruction */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <p className="text-white/90 text-sm leading-relaxed text-center">
            Browse items from people nearby. When you find something you like, swipe right to connect with the seller.
          </p>
        </div>
      </div>

      {/* Bottom CTA hint */}
      <div className="relative px-8 pb-8">
        <div className="flex items-center justify-center gap-2 text-white/60 text-sm font-medium">
          <span>Swipe to continue</span>
          <ChevronRight size={16} className="animate-pulse" />
        </div>
      </div>
    </div>
  );
};
