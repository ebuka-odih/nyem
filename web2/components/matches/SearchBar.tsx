import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = 'Search matches',
  value,
  onChange 
}) => {
  return (
    <div className="relative">
      <input 
        type="text" 
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full h-10 pl-10 pr-4 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
    </div>
  );
};

















