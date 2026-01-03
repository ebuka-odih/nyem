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
    <div className="h-[100svh] bg-white flex flex-col overflow-hidden items-center pb-0">
      <div className="w-full max-w-[768px] h-full flex flex-col pb-0">
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

        <main className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-0">
          <div className="max-w-[390px] mx-auto">
            {children}
          </div>
        </main>

        <div className="shrink-0">
          {bottomNav}
        </div>
      </div>
    </div>
  );
};