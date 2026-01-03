import React from 'react';

interface UploadTabsProps {
  activeTab: 'Marketplace' | 'Services' | 'Swap';
  onTabChange: (tab: 'Marketplace' | 'Services' | 'Swap') => void;
}

export const UploadTabs: React.FC<UploadTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="px-6 pb-4">
      <div className="bg-gray-100 p-1 rounded-full flex items-center">
        <button 
          className={`flex-1 py-2 rounded-full text-sm font-bold transition-all text-center ${activeTab === 'Marketplace' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          onClick={() => onTabChange('Marketplace')}
        >
          Marketplace
        </button>
        <button 
          className={`flex-1 py-2 rounded-full text-sm font-bold transition-all text-center ${activeTab === 'Services' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          onClick={() => onTabChange('Services')}
        >
          Services
        </button>
        <button 
          className={`flex-1 py-2 rounded-full text-sm font-bold transition-all text-center ${activeTab === 'Swap' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          onClick={() => onTabChange('Swap')}
        >
          Swap
        </button>
      </div>
    </div>
  );
};




