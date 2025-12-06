import React from 'react';
import { SwipeItem } from '../../types';

interface ItemDetailsProps {
  item: SwipeItem;
}

export const ItemDetails: React.FC<ItemDetailsProps> = ({ item }) => {
  const isMarketplace = item.type === 'marketplace';

  return (
    <div className="p-6 -mt-6 bg-white rounded-t-[32px] relative z-10">
      {/* Gallery Thumbnails */}
      {item.gallery && item.gallery.length > 0 && (
        <div className="flex space-x-3 overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar">
          {item.gallery.map((img, i) => (
            <div key={i} className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100">
              <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Description */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
        <p className="text-gray-600 leading-relaxed text-sm">
          {item.description}
        </p>
      </div>

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

