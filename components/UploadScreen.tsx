
import React, { useState } from 'react';
import { Camera, ChevronDown } from 'lucide-react';
import { Button } from './Button';

export const UploadScreen: React.FC = () => {
  const [listingType, setListingType] = useState<'barter' | 'sell'>('barter');

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 bg-white z-10">
        <h1 className="text-xl font-extrabold text-gray-900">Upload</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        
        {/* Title Section */}
        <div>
           <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Upload Item</h2>
           <p className="text-gray-500 text-sm">What would you like to trade?</p>
        </div>

        {/* Photo Upload */}
        <div>
            <label className="block text-brand font-bold text-sm mb-3">Photos * (Camera Only)</label>
            <div className="flex space-x-3 overflow-x-auto pb-2">
                <button className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors shrink-0">
                    <Camera size={24} className="mb-1" />
                    <span className="text-[10px] font-bold">Take Photo</span>
                </button>
                {/* Placeholder for uploaded image */}
                {/* <div className="w-24 h-24 rounded-2xl bg-gray-100 shrink-0"></div> */}
            </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
            {/* Title */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">Title *</label>
                <input 
                    type="text" 
                    placeholder="e.g., iPhone 13 Pro" 
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">Description</label>
                <textarea 
                    placeholder="Describe your item..." 
                    className="w-full h-24 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none"
                ></textarea>
            </div>

            {/* Category */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">Category *</label>
                <div className="relative">
                    <select className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all appearance-none cursor-pointer">
                        <option value="" disabled selected>Select category</option>
                        <option value="electronics">Electronics</option>
                        <option value="fashion">Fashion</option>
                        <option value="home">Home & Garden</option>
                        <option value="vehicles">Vehicles</option>
                        <option value="other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
            </div>

            {/* Condition */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">Condition *</label>
                <div className="relative">
                    <select className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all appearance-none cursor-pointer">
                        <option value="" disabled selected>Select condition</option>
                        <option value="new">New</option>
                        <option value="like_new">Like New</option>
                        <option value="used_good">Used - Good</option>
                        <option value="used_fair">Used - Fair</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
            </div>
            
            {/* Listing Type Toggle */}
            <div className="pt-2">
                 <label className="block text-brand font-bold text-sm mb-3">Listing Type</label>
                 <div className="flex bg-gray-100 p-1 rounded-xl">
                     <button 
                        type="button"
                        onClick={() => setListingType('barter')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${listingType === 'barter' ? 'bg-white text-brand shadow-sm' : 'text-gray-500'}`}
                     >
                         Barter (Exchange)
                     </button>
                     <button 
                        type="button"
                        onClick={() => setListingType('sell')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${listingType === 'sell' ? 'bg-white text-brand shadow-sm' : 'text-gray-500'}`}
                     >
                         Sell (Cash)
                     </button>
                 </div>
            </div>

            {/* Looking For / Price */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">
                    {listingType === 'barter' ? 'Looking For *' : 'Price (₦) *'}
                </label>
                {listingType === 'barter' ? (
                    <input 
                        type="text" 
                        placeholder="What do you want in exchange?" 
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                ) : (
                    <input 
                        type="number" 
                        placeholder="0.00" 
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                    />
                )}
            </div>

            {/* Submit */}
            <div className="pt-4 pb-8">
                <Button fullWidth className="bg-brand hover:bg-brand-light text-white rounded-xl py-4 shadow-lg text-lg">
                    Post Item
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};
