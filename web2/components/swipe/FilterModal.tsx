import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, MapPin, Check, ChevronRight } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'category' | 'location';
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  type,
  options,
  selectedValue,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLElement | null>(null);
  
  // Debug: Log options when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log(`[FilterModal] ${type} modal opened with ${options.length} options:`, options);
    }
  }, [isOpen, type, options]);
  
  // Find the AppShell container (phone window container) - find it immediately and on mount
  if (typeof document !== 'undefined' && !containerRef.current) {
    // Find the AppShell container - it has the safe-area-container class
    const appShell = document.querySelector('.safe-area-container') as HTMLElement;
    if (appShell) {
      containerRef.current = appShell;
    } else {
      // Fallback to root if AppShell not found
      containerRef.current = document.getElementById('root') || document.body;
    }
  }
  
  // Also set up on mount to catch cases where DOM isn't ready yet
  useEffect(() => {
    if (typeof document !== 'undefined' && !containerRef.current) {
      const appShell = document.querySelector('.safe-area-container') as HTMLElement;
      if (appShell) {
        containerRef.current = appShell;
      } else {
        containerRef.current = document.getElementById('root') || document.body;
      }
    }
  }, []);
  
  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  const title = type === 'category' ? 'Select Category' : 'Select Location';
  const icon = type === 'category' ? <Filter size={20} /> : <MapPin size={20} />;
  const placeholder = type === 'category' ? 'Search categories...' : 'Search locations...';

  // Use portal to render modal within the phone container to ensure it's contained
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - positioned relative to container */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />
          
          {/* Modal - positioned relative to container, constrained to viewport */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 z-[9999] max-h-[70vh] flex flex-col bg-white rounded-t-[20px] shadow-2xl"
            style={{ maxHeight: '70vh' }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-8 h-0.5 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="px-4 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-brand-600 flex items-center justify-center text-white">
                    {React.cloneElement(icon as React.ReactElement, { size: 14 })}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">{title}</h2>
                    <p className="text-[10px] text-gray-500">{filteredOptions.length} options</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:bg-white border border-transparent focus:border-brand/30 transition-all"
                />
              </div>
            </div>
            
            {/* Options List */}
            <div 
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-2"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
            >
              {filteredOptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-xs font-medium">No results found</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">Try a different search term</p>
                </div>
              ) : (
                <div className="space-y-0.5 pb-6">
                  {filteredOptions.map((option) => {
                    const isSelected = selectedValue === option || 
                      (type === 'location' && option === 'all' && selectedValue === 'all');
                    const displayValue = type === 'location' && option === 'all' ? 'All Locations' : option;
                    
                    return (
                      <button
                        key={option}
                        onClick={() => handleSelect(option)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                            isSelected ? 'bg-brand/20' : 'bg-gray-100'
                          }`}>
                            {type === 'location' ? (
                              <MapPin size={12} className={isSelected ? 'text-brand' : 'text-gray-400'} />
                            ) : (
                              <Filter size={12} className={isSelected ? 'text-brand' : 'text-gray-400'} />
                            )}
                          </div>
                          <span className={`text-xs font-medium ${isSelected ? 'text-brand' : 'text-gray-700'}`}>
                            {displayValue}
                          </span>
                        </div>
                        {isSelected ? (
                          <div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                            <Check size={10} className="text-white" strokeWidth={3} />
                          </div>
                        ) : (
                          <ChevronRight size={14} className="text-gray-300" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render modal using portal to AppShell container to keep it within phone window
  if (typeof document !== 'undefined' && containerRef.current) {
    return createPortal(modalContent, containerRef.current);
  }
  
  // Fallback if container not found yet
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return modalContent;
};

