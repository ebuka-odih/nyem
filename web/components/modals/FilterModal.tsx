import React from 'react';
import { Check, ChevronRight, Loader2 } from 'lucide-react';
import { Modal } from '../Modal';
import { useCategories, Category } from '../../hooks/api/useCategories';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { DISCOVER_TAB_CONFIG, DiscoverTab } from '../../constants/discoverTabs';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  onCategorySelect: (category: string) => void;
  activeTab: DiscoverTab;
}

/**
 * Maps activeTab to the parent category name used in the backend API
 */
const getParentCategoryName = (tab: DiscoverTab): string => {
  return DISCOVER_TAB_CONFIG[tab].parentCategory;
};

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  activeCategory,
  onCategorySelect,
  activeTab
}) => {
  // Determine parent category based on active tab
  const parentCategory = getParentCategoryName(activeTab);

  // Fetch categories from backend
  const { data: categories = [], isLoading, error } = useCategories(parentCategory);

  // Create categories list with "All" option first
  const allCategories = React.useMemo(() => {
    const allOption = { id: 0, name: 'All' };
    return [allOption, ...(categories as Category[])];
  }, [categories]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="DISCOVERY FILTER">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={32} className="text-[#830e4c] animate-spin mb-4" />
          <p className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
            Loading Categories...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-sm font-bold text-red-500 uppercase tracking-wider mb-2">
            Failed to load categories
          </p>
          <p className="text-xs text-neutral-400 text-center">
            Please try again later
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {allCategories.map(cat => {
            const Icon = getCategoryIcon(cat.name);
            return (
              <button
                key={cat.id || cat.name}
                onClick={() => {
                  onCategorySelect(cat.name);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border-2 active:scale-[0.98] ${activeCategory === cat.name
                    ? 'bg-[#830e4c] border-[#830e4c] shadow-md text-white'
                    : 'bg-white border-neutral-50 hover:border-neutral-100'
                  }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${activeCategory === cat.name
                      ? 'bg-white/20 text-white'
                      : 'bg-neutral-50 text-neutral-400'
                    }`}>
                    <Icon size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className={`text-base font-black tracking-tight leading-tight uppercase italic ${activeCategory === cat.name ? 'text-white' : 'text-neutral-900'
                      }`}>
                      {cat.name}
                    </h4>
                    <p className={`text-[8px] font-black uppercase tracking-[0.15em] mt-0.5 ${activeCategory === cat.name ? 'text-white/70' : 'text-neutral-300'
                      }`}>
                      EXPLORE COLLECTION
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  {activeCategory === cat.name ? (
                    <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Check size={14} strokeWidth={4} className="text-[#830e4c]" />
                    </div>
                  ) : (
                    <ChevronRight size={18} className="text-neutral-200" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
};
