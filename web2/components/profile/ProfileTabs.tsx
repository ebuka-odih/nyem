import React from 'react';

interface ProfileTabsProps {
  activeTab: 'about' | 'listings' | 'settings';
  onTabChange: (tab: 'about' | 'listings' | 'settings') => void;
  showListings?: boolean; // Whether to show the listings tab
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange, showListings = false }) => {
  const tabs = [
    { id: 'about' as const, label: 'Info' },
    ...(showListings ? [{ id: 'listings' as const, label: 'Listings' }] : []),
    { id: 'settings' as const, label: 'Settings' },
  ];

  return (
    <div className="px-6 mb-4">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 pb-3 text-sm font-bold transition-all relative ${
              activeTab === tab.id ? 'text-brand' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};




