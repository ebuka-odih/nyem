import React from 'react';
import { SwipeItem } from '../../types';

interface ItemDetailsProps {
  item: SwipeItem;
  onImageClick?: (index: number) => void;
}

export const ItemDetails: React.FC<ItemDetailsProps> = ({ item, onImageClick }) => {
  const isMarketplace = item.type === 'marketplace';

  // Get all images (main image + gallery, excluding duplicates)
  const allImages = item.gallery && item.gallery.length > 0 
    ? [item.image, ...item.gallery.filter(img => img !== item.image)]
    : [item.image];

  return (
    <div className="pt-10 px-6 pb-6 -mt-6 bg-white rounded-t-[32px] relative z-10">
      {/* Gallery Thumbnails */}
      {item.gallery && item.gallery.length > 0 && (
        <div className="flex space-x-3 overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar">
          {allImages.map((img, i) => (
            <div 
              key={i} 
              className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100 cursor-pointer hover:border-brand transition-colors"
              onClick={() => onImageClick?.(i)}
            >
              <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Description */}
      {item.description && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-600 leading-relaxed text-sm">
            {item.description}
          </p>
        </div>
      )}

      {/* Looking For (if barter) */}
      {!isMarketplace && (
        <div className="mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Looking For</h3>
          <p className="text-gray-700 font-medium">{item.lookingFor}</p>
        </div>
      )}
    </div>
  );
};



