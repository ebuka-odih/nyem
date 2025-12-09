
import React from 'react';
import { Flame, Plus, Heart, User as UserIcon } from 'lucide-react';
import { TabState } from '../types';

interface BottomNavProps {
  activeTab: TabState;
  onTabChange: (tab: TabState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-white border-t border-gray-100 px-4 flex justify-between items-center shrink-0 w-full footer-safe-bottom-white md:relative md:bottom-auto md:mb-0" style={{ 
      paddingLeft: 'calc(1rem + env(safe-area-inset-left, 0px))', 
      paddingRight: 'calc(1rem + env(safe-area-inset-right, 0px))', 
      paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
      paddingTop: '0',
      height: 'calc(56px + env(safe-area-inset-bottom, 0px))'
    }}>
      <button 
          onClick={() => onTabChange('discover')}
          className={`flex flex-col items-center justify-center space-y-0.5 min-h-[44px] min-w-[44px] touch-manipulation ${activeTab === 'discover' ? 'text-brand' : 'text-gray-300 active:text-gray-400'}`}
          aria-label="Discover"
      >
          <Flame size={22} fill={activeTab === 'discover' ? "currentColor" : "none"} strokeWidth={activeTab === 'discover' ? 0 : 2.5} />
          <span className="text-[10px] font-bold tracking-wide leading-tight whitespace-nowrap">Discover</span>
      </button>
      
      <button 
          onClick={() => onTabChange('upload')}
          className={`flex flex-col items-center justify-center space-y-0.5 min-h-[44px] min-w-[44px] touch-manipulation ${activeTab === 'upload' ? 'text-brand' : 'text-gray-300 active:text-gray-400'}`}
          aria-label="Upload"
      >
          <Plus size={22} strokeWidth={2.5} />
          <span className="text-[10px] font-bold tracking-wide leading-tight whitespace-nowrap">Upload</span>
      </button>
      
      <button 
          onClick={() => onTabChange('matches')}
          className={`flex flex-col items-center justify-center space-y-0.5 min-h-[44px] min-w-[44px] touch-manipulation ${activeTab === 'matches' ? 'text-brand' : 'text-gray-300 active:text-gray-400'}`}
          aria-label="Matches"
      >
          <Heart size={22} fill={activeTab === 'matches' ? "currentColor" : "none"} strokeWidth={activeTab === 'matches' ? 0 : 2.5} />
          <span className="text-[10px] font-bold tracking-wide leading-tight whitespace-nowrap">Matches</span>
      </button>
      
      <button 
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center space-y-0.5 min-h-[44px] min-w-[44px] touch-manipulation ${activeTab === 'profile' ? 'text-brand' : 'text-gray-300 active:text-gray-400'}`}
          aria-label="Profile"
      >
          <UserIcon size={22} fill={activeTab === 'profile' ? "currentColor" : "none"} strokeWidth={activeTab === 'profile' ? 0 : 2.5} />
          <span className="text-[10px] font-bold tracking-wide leading-tight whitespace-nowrap">Profile</span>
      </button>
    </div>
  );
};
