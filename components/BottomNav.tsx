
import React from 'react';
import { Flame, Plus, Heart, User as UserIcon } from 'lucide-react';
import { TabState } from '../types';

interface BottomNavProps {
  activeTab: TabState;
  onTabChange: (tab: TabState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-white border-t border-gray-100 pt-3 pb-6 px-8 flex justify-between items-center z-40 shrink-0 w-full">
      <button 
          onClick={() => onTabChange('discover')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'discover' ? 'text-brand' : 'text-gray-300 hover:text-gray-400'}`}
      >
          <Flame size={20} fill={activeTab === 'discover' ? "currentColor" : "none"} strokeWidth={activeTab === 'discover' ? 0 : 2.5} />
          <span className="text-[10px] font-bold tracking-wide">Discover</span>
      </button>
      
      <button 
          onClick={() => onTabChange('upload')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'upload' ? 'text-brand' : 'text-gray-300 hover:text-gray-400'}`}
      >
          <Plus size={20} strokeWidth={2.5} />
          <span className="text-[10px] font-bold tracking-wide">Upload</span>
      </button>
      
      <button 
          onClick={() => onTabChange('matches')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'matches' ? 'text-brand' : 'text-gray-300 hover:text-gray-400'}`}
      >
          <Heart size={20} fill={activeTab === 'matches' ? "currentColor" : "none"} strokeWidth={activeTab === 'matches' ? 0 : 2.5} />
          <span className="text-[10px] font-bold tracking-wide">Matches</span>
      </button>
      
      <button 
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center space-y-1 ${activeTab === 'profile' ? 'text-brand' : 'text-gray-300 hover:text-gray-400'}`}
      >
          <UserIcon size={20} fill={activeTab === 'profile' ? "currentColor" : "none"} strokeWidth={activeTab === 'profile' ? 0 : 2.5} />
          <span className="text-[10px] font-bold tracking-wide">Profile</span>
      </button>
    </div>
  );
};
