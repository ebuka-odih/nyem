import React from 'react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="h-[100svh] w-full bg-slate-100 flex flex-col items-center overflow-hidden no-scrollbar">
      {/* App Container: iPad width on desktop, full width on mobile */}
      <div className="w-full max-w-full sm:max-w-[768px] h-full bg-white flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.05)]">
        <main className="flex-1 relative overflow-y-auto no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};