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
    <div className="h-[100svh] bg-slate-100 flex flex-col overflow-hidden relative items-center pb-0">
      {/* App Container: phone width on mobile, iPad width on desktop */}
      <div className="w-full max-w-full sm:max-w-[768px] h-full flex flex-col relative bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)] pb-0">
        <header className="shrink-0 bg-white pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-3 px-6 flex flex-col gap-2 border-b border-neutral-50">
          <div className="flex items-center gap-1.5 opacity-60">
            <div className="w-5 h-5 bg-neutral-900 rounded flex items-center justify-center text-white">
              <Zap size={10} fill="currentColor" />
            </div>
            <span className="text-[10px] font-black tracking-tighter uppercase italic text-neutral-900">Nyem</span>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-neutral-900 tracking-tighter uppercase italic">
              {title}
            </h2>
            {rightAction && (
              <button 
                onClick={rightAction.onClick}
                className="p-2.5 bg-neutral-100 rounded-2xl text-neutral-400 active:scale-90 transition-all hover:bg-neutral-200 hover:text-neutral-900"
              >
                {rightAction.icon}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 relative overflow-hidden flex flex-col">
          {/* Constrain the content to mobile width even on iPad view to keep card UX "untouched" */}
          <div className="flex-1 relative w-full max-w-[400px] md:max-w-[480px] lg:max-w-[520px] mx-auto px-2 flex flex-col overflow-y-auto no-scrollbar pt-4 pb-0">
            {children}
          </div>
        </main>

        <div className="shrink-0 z-[130] w-full">
          {bottomNav}
        </div>
      </div>
    </div>
  );
};