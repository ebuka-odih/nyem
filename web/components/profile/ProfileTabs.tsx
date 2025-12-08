import React from 'react';

interface ProfileTabsProps {
  activeTab: 'items' | 'settings';
  onTabChange: (tab: 'items' | 'settings') => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="px-6 mb-4">
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => onTabChange('items')}
          className={`flex-1 pb-3 text-sm font-bold transition-all relative ${activeTab === 'items' ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}
        >
          My Items
          {activeTab === 'items' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => onTabChange('settings')}
          className={`flex-1 pb-3 text-sm font-bold transition-all relative ${activeTab === 'settings' ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Settings
          {activeTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full"></div>}
        </button>
      </div>
    </div>
  );
};




