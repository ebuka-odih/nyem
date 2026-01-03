import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../Button';

interface Category {
  id: number;
  name: string;
}

interface ServiceProfileFormProps {
  serviceCategory: string;
  startingPrice: string;
  city: string;
  bio: string;
  workImages: string[];
  categories: Category[];
  loadingCategories: boolean;
  loading: boolean;
  onServiceCategoryChange: (value: string) => void;
  onStartingPriceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ServiceProfileForm: React.FC<ServiceProfileFormProps> = ({
  serviceCategory,
  startingPrice,
  city,
  bio,
  workImages,
  categories,
  loadingCategories,
  loading,
  onServiceCategoryChange,
  onStartingPriceChange,
  onCityChange,
  onBioChange,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Service Category */}
      <div>
        <label className="block text-brand font-bold text-sm mb-2">Service Category *</label>
        <div className="relative">
          <select 
            value={serviceCategory}
            onChange={(e) => onServiceCategoryChange(e.target.value)}
            disabled={loadingCategories}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="" disabled>Select service category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
        </div>
      </div>

      {/* Starting Price */}
      <div>
        <label className="block text-brand font-bold text-sm mb-2">Starting Price (₦)</label>
        <input 
          type="text" 
          value={startingPrice}
          onChange={(e) => onStartingPriceChange(e.target.value.replace(/[^0-9,.]/g, ''))}
          placeholder="0.00 (optional)" 
          className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
        />
        <p className="text-xs text-gray-500 mt-1">Leave empty if you prefer to discuss pricing</p>
      </div>

      {/* City */}
      <div>
        <label className="block text-brand font-bold text-sm mb-2">City *</label>
        <input 
          type="text" 
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="e.g., Lagos, Abuja" 
          className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-brand font-bold text-sm mb-2">Bio</label>
        <textarea 
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="Tell potential clients about your services, experience, and what makes you unique..." 
          rows={5}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none"
        ></textarea>
        <p className="text-xs text-gray-500 mt-1">Describe your services and expertise</p>
      </div>

      {/* Work Images Info */}
      {workImages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>{workImages.length}</strong> work sample{workImages.length !== 1 ? 's' : ''} added
          </p>
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
          {loading ? 'Saving...' : 'Save Service Profile'}
        </Button>
      </div>
    </form>
  );
};

