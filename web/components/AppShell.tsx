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
    <div className="w-full h-full bg-gray-100 md:flex md:items-center md:justify-center md:p-8">
      <div className="w-full h-full md:w-[768px] md:h-[1024px] md:max-h-[90vh] bg-white relative overflow-visible md:overflow-hidden md:rounded-[2rem] md:shadow-2xl md:border-[12px] md:border-gray-900 flex flex-col safe-area-container">
        {children}
      </div>
    </div>
  );
};

