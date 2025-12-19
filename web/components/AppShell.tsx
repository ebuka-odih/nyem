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
    <div className="w-full md:max-w-md md:mx-auto md:h-[95dvh] md:my-[2.5dvh] bg-white relative overflow-visible md:overflow-hidden md:rounded-[3rem] shadow-2xl md:border-[8px] md:border-gray-900 flex flex-col safe-area-container">
      {children}
    </div>
  );
};

