import React, { useState } from 'react';
import { Filter, MapPin, ChevronDown } from 'lucide-react';
import { FilterModal } from './FilterModal';

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
  // Local state for modals (instead of dropdowns)
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleCategorySelect = (category: string) => {
    onCategorySelect(category);
    setShowCategoryModal(false);
  };

  const handleLocationSelect = (location: string) => {
    onLocationSelect(location);
    setShowLocationModal(false);
  };

  // Truncate long category/location names for the button
  const truncateText = (text: string, maxLength: number = 14) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
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
        
        {/* Filters - Now opens modals instead of dropdowns */}
        <div className="flex justify-between items-center w-full pb-1 gap-2">
          {/* Category Filter Button */}
          <button 
            onClick={() => setShowCategoryModal(true)} 
            disabled={loadingFilters}
            className="flex-1 flex items-center justify-between px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-[11px] font-semibold text-gray-700 active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300 transition-all"
          >
            <div className="flex items-center gap-1.5">
              <Filter size={11} className="text-gray-400" />
              <span className="text-gray-700">{truncateText(selectedCategory)}</span>
            </div>
            <ChevronDown size={12} className="text-gray-400" />
          </button>
          
          {/* Location Filter Button */}
          <button 
            onClick={() => setShowLocationModal(true)} 
            disabled={loadingFilters}
            className="flex-1 flex items-center justify-between px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-[11px] font-semibold text-gray-700 active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-300 transition-all"
          >
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className="text-brand" />
              <span className="text-gray-700">
                {truncateText(selectedLocation === 'all' ? 'All Locations' : selectedLocation)}
              </span>
            </div>
            <ChevronDown size={12} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Category Modal */}
      <FilterModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        type="category"
        options={categoryOptions}
        selectedValue={selectedCategory}
        onSelect={handleCategorySelect}
      />

      {/* Location Modal */}
      <FilterModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        type="location"
        options={locationOptions}
        selectedValue={selectedLocation}
        onSelect={handleLocationSelect}
      />
    </>
  );
};
