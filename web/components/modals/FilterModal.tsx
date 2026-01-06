import React from 'lucide-react';
import { Check, ChevronRight } from 'lucide-react';
import { CATEGORIES_DATA } from '../../data';
import { Modal } from '../Modal';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  onCategorySelect: (category: string) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  activeCategory,
  onCategorySelect
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="DISCOVERY FILTER">
      <div className="space-y-2">
        {CATEGORIES_DATA.map(cat => (
          <button 
            key={cat.name} 
            onClick={() => { 
              onCategorySelect(cat.name); 
              onClose(); 
            }} 
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border-2 active:scale-[0.98] ${
              activeCategory === cat.name 
                ? 'bg-[#830e4c] border-[#830e4c] shadow-md text-white' 
                : 'bg-white border-neutral-50 hover:border-neutral-100'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                activeCategory === cat.name 
                  ? 'bg-white/20 text-white' 
                  : 'bg-neutral-50 text-neutral-400'
              }`}>
                <cat.icon size={20} />
              </div>
              <div className="text-left">
                <h4 className={`text-base font-black tracking-tight leading-tight uppercase italic ${
                  activeCategory === cat.name ? 'text-white' : 'text-neutral-900'
                }`}>
                  {cat.name}
                </h4>
                <p className={`text-[8px] font-black uppercase tracking-[0.15em] mt-0.5 ${
                  activeCategory === cat.name ? 'text-white/70' : 'text-neutral-300'
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
        ))}
      </div>
    </Modal>
  );
};

