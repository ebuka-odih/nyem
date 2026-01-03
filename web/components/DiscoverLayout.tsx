import React from 'react';
import { motion } from 'framer-motion';
import { DiscoverHeader } from './DiscoverHeader';

interface DiscoverLayoutProps {
  children: React.ReactNode;
  headerProps: {
    onFilter: () => void;
    onLocation: () => void;
    onWishlist: () => void;
    activeCategory: string;
    setActiveTab: (t: any) => void;
    activeTab: string;
    wishlistCount: number;
  };
  bottomNav: React.ReactNode;
  floatingControls?: React.ReactNode;
}

export const DiscoverLayout: React.FC<DiscoverLayoutProps> = ({ 
  children, 
  headerProps, 
  bottomNav,
  floatingControls 
}) => {
  return (
    <div className="h-[100svh] bg-slate-100 flex flex-col overflow-hidden relative items-center pb-0">
      {/* App Container: phone width on mobile, iPad width on desktop */}
      <div className="w-full max-w-full sm:max-w-[768px] h-full flex flex-col relative bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)] pb-0">
        <DiscoverHeader {...headerProps} />
        
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {/* Constrain the swiping area to mobile width even on iPad view to keep card UX "untouched" */}
          <div className="flex-1 relative w-full max-w-[400px] md:max-w-[480px] lg:max-w-[520px] mx-auto px-2 flex flex-col">
            {children}
          </div>
          
          {floatingControls && (
            <div className="absolute bottom-2 left-0 right-0 z-[110] flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto">
                {floatingControls}
              </div>
            </div>
          )}
        </main>

        <div className="shrink-0 z-[130] w-full">
          {bottomNav}
        </div>
      </div>
    </div>
  );
};