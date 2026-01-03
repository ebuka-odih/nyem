import React from 'react';
import { Zap, Sparkles, Settings } from 'lucide-react';

interface GeneralLayoutProps {
  children: React.ReactNode;
  title: string;
  rightAction?: {
    icon: React.ReactNode;
    onClick: () => void;
  };
  bottomNav: React.ReactNode;
}

export const GeneralLayout: React.FC<GeneralLayoutProps> = ({ 
  children, 
  title, 
  rightAction, 
  bottomNav 
}) => {
  return (
    <div className="h-[100svh] bg-slate-100 flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-full sm:max-w-[768px] h-full flex flex-col bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)]">
        <header className="shrink-0 bg-white pt-6 pb-4 px-8 flex flex-col gap-3 border-b border-neutral-50">
          <div className="flex items-center gap-2 opacity-60">
            <div className="w-5 h-5 bg-[#830e4c] rounded flex items-center justify-center text-white">
              <Zap size={10} fill="currentColor" />
            </div>
            <span className="text-[11px] font-black tracking-tighter uppercase italic text-[#830e4c]">Nyem</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-[#830e4c] tracking-tighter uppercase italic">
              {title}
            </h2>
            {rightAction && (
              <button 
                onClick={rightAction.onClick}
                className="p-3 bg-neutral-50 rounded-2xl text-[#830e4c] active:scale-90 transition-all hover:bg-[#830e4c1a] shadow-sm"
              >
                {rightAction.icon}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar px-6 pt-6 pb-40">
          <div className="max-w-[500px] mx-auto">
            {children}
          </div>
        </main>

        <div className="w-full shrink-0">
          {bottomNav}
        </div>
      </div>
    </div>
  );
};