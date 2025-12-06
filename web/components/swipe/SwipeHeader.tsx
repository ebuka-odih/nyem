import React from 'react';
import { Filter, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SwipeHeaderProps {
  activeTab: 'Marketplace' | 'Services' | 'Swap';
  onTabChange: (tab: 'Marketplace' | 'Services' | 'Swap') => void;
  selectedCategory: string;
  selectedLocation: string;
  showCategoryDropdown: boolean;
  showLocationDropdown: boolean;
  loadingFilters: boolean;
  categoryOptions: string[];
  locationOptions: string[];
  onCategoryToggle: () => void;
  onLocationToggle: () => void;
  onCategorySelect: (category: string) => void;
  onLocationSelect: (location: string) => void;
}

export const SwipeHeader: React.FC<SwipeHeaderProps> = ({
  activeTab,
  onTabChange,
  selectedCategory,
  selectedLocation,
  showCategoryDropdown,
  showLocationDropdown,
  loadingFilters,
  categoryOptions,
  locationOptions,
  onCategoryToggle,
  onLocationToggle,
  onCategorySelect,
  onLocationSelect,
}) => {
  return (
    <div className="px-6 pb-1 bg-white z-20 shrink-0 app-header-safe">
      <div className="flex justify-center items-center mb-2 pt-1">
        <h1 className="text-lg font-extrabold text-gray-900 tracking-wide">Discover</h1>
      </div>
      
      {/* Tabs */}
      <div className="bg-gray-100 p-1 rounded-full flex items-center mb-3 w-full">
        <button 
          className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all text-center ${activeTab === 'Marketplace' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          onClick={() => onTabChange('Marketplace')}
        >
          Marketplace
        </button>
        <button 
          className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all text-center ${activeTab === 'Services' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          onClick={() => onTabChange('Services')}
        >
          Services
        </button>
        <button 
          className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all text-center ${activeTab === 'Swap' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          onClick={() => onTabChange('Swap')}
        >
          Swap
        </button>
      </div>
      
      {/* Filters */}
      <div className="flex justify-between items-center w-full pb-1 relative">
        {/* Category Filter */}
        <div className="relative">
          <button 
            onClick={onCategoryToggle} 
            disabled={loadingFilters}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-700 shadow-sm active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Filter size={12} />
            <span>{selectedCategory}</span>
          </button>
          <AnimatePresence>
            {showCategoryDropdown && !loadingFilters && (
              <motion.div 
                initial={{opacity: 0, y: -10}} 
                animate={{opacity: 1, y: 0}} 
                exit={{opacity: 0, y: -10}} 
                className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-30 max-h-60 overflow-y-auto"
              >
                {categoryOptions.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => onCategorySelect(cat)} 
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      selectedCategory === cat ? 'bg-brand/10 text-brand font-bold' : 'text-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Location Filter */}
        <div className="relative">
          <button 
            onClick={onLocationToggle} 
            disabled={loadingFilters}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-700 shadow-sm active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MapPin size={12} className="text-brand" />
            <span>{selectedLocation === 'all' ? 'All Locations' : selectedLocation}</span>
          </button>
          <AnimatePresence>
            {showLocationDropdown && !loadingFilters && (
              <motion.div 
                initial={{opacity: 0, y: -10}} 
                animate={{opacity: 1, y: 0}} 
                exit={{opacity: 0, y: -10}} 
                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-30 max-h-60 overflow-y-auto"
              >
                {locationOptions.map(loc => (
                  <button 
                    key={loc} 
                    onClick={() => onLocationSelect(loc)} 
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      selectedLocation === loc ? 'bg-brand/10 text-brand font-bold' : 'text-gray-700'
                    }`}
                  >
                    {loc === 'all' ? 'All Locations' : loc}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

