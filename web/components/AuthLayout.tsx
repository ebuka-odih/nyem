import React from 'react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-[100dvh] h-full bg-slate-100 flex flex-col overflow-hidden relative items-center pb-0">
      {/* App Container: phone width on mobile, iPad width on desktop */}
      <div className="w-full max-w-full sm:max-w-[768px] h-full flex flex-col relative bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)] pb-0">
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {/* Constrain the content to mobile width even on iPad view to keep card UX "untouched" */}
          <div className="flex-1 relative w-full max-w-[400px] md:max-w-[480px] lg:max-w-[520px] mx-auto px-2 flex flex-col overflow-y-auto no-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
