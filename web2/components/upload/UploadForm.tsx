import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../Button';

interface Category {
  id: number;
  name: string;
}

interface UploadFormProps {
  activeTab: 'Marketplace' | 'Services' | 'Swap';
  title: string;
  description: string;
  category: string;
  condition: string;
  lookingFor: string;
  price: string;
  categories: Category[];
  loadingCategories: boolean;
  loading: boolean;
  isEditMode?: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onConditionChange: (value: string) => void;
  onLookingForChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const UploadForm: React.FC<UploadFormProps> = ({
  activeTab,
  title,
  description,
  category,
  condition,
  lookingFor,
  price,
  categories,
  loadingCategories,
  loading,
  isEditMode = false,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onConditionChange,
  onLookingForChange,
  onPriceChange,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-brand font-bold text-sm mb-2">Title *</label>
        <input 
          type="text" 
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g., iPhone 13 Pro" 
          className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-brand font-bold text-sm mb-2">Description</label>
        <textarea 
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe your item..." 
          className="w-full h-24 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none"
        ></textarea>
      </div>

      {/* Category */}
      <div>
        <label className="block text-brand font-bold text-sm mb-2">Category *</label>
        <div className="relative">
          <select 
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            disabled={loadingCategories}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="" disabled>Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-brand font-bold text-sm mb-2">Condition *</label>
        <div className="relative">
          <select 
            value={condition}
            onChange={(e) => onConditionChange(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all appearance-none cursor-pointer"
          >
            <option value="" disabled>Select condition</option>
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="used">Used</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
        </div>
      </div>
      
      {/* Swap-specific: Looking For */}
      {activeTab === 'Swap' && (
        <div>
          <label className="block text-brand font-bold text-sm mb-2">Looking For *</label>
          <input 
            type="text" 
            value={lookingFor}
            onChange={(e) => onLookingForChange(e.target.value)}
            placeholder="What do you want in exchange?" 
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
          />
        </div>
      )}

      {/* Marketplace-specific: Price */}
      {activeTab === 'Marketplace' && (
        <div>
          <label className="block text-brand font-bold text-sm mb-2">Price (₦) *</label>
          <input 
            type="text" 
            value={price}
            onChange={(e) => onPriceChange(e.target.value.replace(/[^0-9,.]/g, ''))}
            placeholder="0.00" 
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
          />
        </div>
      )}

      {/* Submit */}
      <div className="pt-4 pb-8">
        <Button 
          fullWidth 
          type="submit"
          className="bg-brand hover:bg-brand-light text-white rounded-xl py-4 shadow-lg text-lg"
          disabled={loading}
        >
          {loading 
            ? (isEditMode ? 'Updating...' : 'Saving...') 
            : (isEditMode ? 'Update Item' : 'Save Item')}
        </Button>
      </div>
    </form>
  );
};




