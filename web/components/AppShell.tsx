/**
 * AppShell Component
 * Minimal UI shell that renders instantly without any business logic or API calls
 * This ensures the first paint happens immediately
 */
import React, { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="w-full h-full md:max-w-md md:mx-auto md:h-[98dvh] md:my-[1dvh] bg-white relative overflow-visible md:overflow-hidden md:rounded-[3rem] shadow-2xl md:border-[8px] md:border-gray-800 flex flex-col safe-area-container">
      {children}
    </div>
  );
};

