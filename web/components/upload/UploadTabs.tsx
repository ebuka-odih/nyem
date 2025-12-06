import React from 'react';

interface UploadTabsProps {
  activeTab: 'exchange' | 'marketplace';
  onTabChange: (tab: 'exchange' | 'marketplace') => void;
}

export const UploadTabs: React.FC<UploadTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="px-6 pb-4">
      <div className="bg-gray-100 p-1 rounded-full flex items-center">
        <button 
          className={`flex-1 py-2 rounded-full text-sm font-bold transition-all text-center ${activeTab === 'exchange' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          onClick={() => onTabChange('exchange')}
        >
          Exchange Item
        </button>
        <button 
          className={`flex-1 py-2 rounded-full text-sm font-bold transition-all text-center ${activeTab === 'marketplace' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          onClick={() => onTabChange('marketplace')}
        >
          Marketplace Item
        </button>
      </div>
    </div>
  );
};

