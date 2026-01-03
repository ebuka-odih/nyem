import React from 'react';
import { motion } from 'framer-motion';
import { Filter, MapPin, Zap, ChevronDown } from 'lucide-react';

interface DiscoverHeaderProps {
  onFilter: () => void;
  onLocation: () => void;
  onWishlist: () => void;
  activeCategory: string;
  setActiveTab: (t: any) => void;
  activeTab: string;
  wishlistCount: number;
}

// Fix: Casting to any to bypass environment-specific type errors for motion components
const MotionDiv = motion.div as any;

export const DiscoverHeader: React.FC<DiscoverHeaderProps> = ({ 
  onFilter, onLocation, onWishlist, activeCategory, setActiveTab, activeTab, wishlistCount 
}) => (
  <header className="shrink-0 z-[100] bg-white pt-2.5 pb-2 px-5 sm:px-8 border-b border-neutral-100">
    <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
      {/* Brand Logo Area - Balanced and spaced */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 sm:w-9 h-9 bg-[#830e4c] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#830e4c1a]">
           <Zap size={16} className="sm:size-[18px]" fill="currentColor" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm sm:text-base font-black tracking-tight uppercase italic text-[#830e4c] leading-none">
            Nyem <span className="text-[#830e4c]/70 ml-1">Marketplace</span>
          </span>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-300 mt-1 hidden sm:block">Local Discovery Engine</span>
        </div>
      </div>

      {/* Navigation & Filters Row */}
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        <button 
          onClick={onFilter} 
          className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl active:scale-95 transition-all flex-shrink-0 shadow-sm ${activeCategory !== "All" ? 'bg-[#830e4c] text-white' : 'bg-neutral-50 text-neutral-500'}`}
        >
          <Filter size={18} className="sm:size-[22px]" />
        </button>

        {/* Tab Pill - Enhanced visibility for mobile text */}
        <div className="flex-1 bg-neutral-100 p-1.5 rounded-2xl sm:rounded-[2rem] flex relative overflow-hidden h-11 sm:h-16 min-w-0 max-w-[500px]">
          {(['marketplace', 'services', 'barter'] as const).map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`relative z-10 flex-1 flex items-center justify-center text-[10px] sm:text-[14px] font-black transition-all duration-300 uppercase px-1 sm:px-2 ${activeTab === tab ? 'text-[#830e4c]' : 'text-neutral-400'}`}
            >
              <span className="whitespace-nowrap tracking-tighter sm:tracking-widest">{tab}</span>
              {activeTab === tab && (
                <MotionDiv 
                  layoutId="activeTab" 
                  className="absolute inset-0 bg-white rounded-xl sm:rounded-[1.5rem] shadow-sm -z-10" 
                  transition={{ type: "spring", duration: 0.5, bounce: 0.2 }} 
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button onClick={onLocation} className="p-3 sm:p-4 bg-neutral-50 rounded-xl sm:rounded-2xl text-[#830e4c] active:scale-95 transition-all flex items-center gap-1 shadow-sm">
            <MapPin size={18} className="sm:size-[22px]" />
            <ChevronDown size={14} className="hidden sm:block opacity-40" />
          </button>
          <button onClick={onWishlist} className="relative p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-center active:scale-95 transition-all">
            <Zap size={18} className="sm:size-[22px] text-[#830e4c]" fill="currentColor" strokeWidth={1} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 bg-[#830e4c] text-white text-[8px] sm:text-[10px] flex items-center justify-center rounded-full font-black border-2 border-white shadow-sm">{wishlistCount}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  </header>
);