import React from 'react';
import { Store, Camera, TrendingUp, ChevronRight } from 'lucide-react';

interface PromoCardProps {
  onDismiss?: () => void;
}

export const PromoCard: React.FC<PromoCardProps> = ({ onDismiss }) => {
  return (
    <div className="w-full h-full flex flex-col rounded-[32px] overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 shadow-2xl shadow-black/20 border border-white/10 relative">
      
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl" />
      </div>

      {/* Main Content - Scrollable container */}
      <div className="relative flex-1 flex flex-col px-8 pt-10 pb-4 min-h-0 overflow-hidden">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex flex-col pb-4">
            {/* Icon */}
            <div className="mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Store size={32} className="text-white" />
              </div>
            </div>

            {/* Headline */}
            <div className="mb-6">
              <h1 className="text-[28px] font-black text-white leading-tight tracking-tight mb-3">
                Got products to sell?
              </h1>
              <p className="text-white/80 text-lg leading-relaxed">
                Turn your small business into a local favorite. Upload your products and reach customers nearby.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Camera size={18} className="text-white" />
                </div>
                <p className="text-white/90 text-sm font-medium">Snap a photo and list in seconds</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <TrendingUp size={18} className="text-white" />
                </div>
                <p className="text-white/90 text-sm font-medium">Get discovered by buyers in your area</p>
              </div>
            </div>

            {/* CTA hint */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-4">
              <p className="text-white text-sm font-semibold text-center">
                Tap the Upload tab to start selling 🚀
              </p>
            </div>

            {/* Bottom prompt - Now inside scrollable area */}
            <div className="pt-2 pb-2">
              <div className="flex items-center justify-center gap-2 text-white/70 text-sm font-medium">
                <span>Swipe to continue browsing</span>
                <ChevronRight size={16} className="animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

