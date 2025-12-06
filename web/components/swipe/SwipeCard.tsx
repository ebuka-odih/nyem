import React from 'react';
import { Info, MapPin } from 'lucide-react';
import { SwipeItem } from '../../types';

interface SwipeCardProps {
  item: SwipeItem;
  onInfoClick?: () => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ item, onInfoClick }) => {
  const isMarketplace = item.type === 'marketplace';

  return (
    <div className="w-full h-full flex flex-col rounded-[28px] overflow-hidden bg-white shadow-xl border border-gray-100/80">
      {/* Image Section - 65% of card height for premium look */}
      <div className="relative h-[65%] shrink-0">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

        {/* INFO BUTTON */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInfoClick && onInfoClick();
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-black/30 transition-colors"
        >
          <Info size={18} strokeWidth={1.5} className="text-white" />
        </button>

        {/* Badge & Title - Bottom of image with more spacing */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-col items-start gap-2">
          {isMarketplace ? (
            <span className="bg-[#FFD700] text-black text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              {item.price}
            </span>
          ) : (
            <span className="bg-[#10B981] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm">
              {item.condition}
            </span>
          )}
          <h2 className="text-[26px] font-black text-white leading-tight drop-shadow-lg line-clamp-2">
            {item.title}
          </h2>
        </div>
      </div>

      {/* Content Section - 35% of card height with premium spacing */}
      <div className="h-[35%] px-5 pt-5 pb-4 flex flex-col bg-white">
        {/* Description - Limited to 3 lines for readability */}
        {item.description && (
          <p className="text-gray-600 text-[15px] line-clamp-3 mb-3 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Status Banner */}
        {isMarketplace ? (
          <div className="bg-[#ECFDF5] rounded-xl px-4 py-2.5 flex items-center justify-center border border-green-100/50 shrink-0">
            <span className="text-[#10B981] text-sm font-bold">Available for Purchase</span>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-center border border-gray-100 shrink-0">
            <span className="text-gray-500 text-sm">Looking for: <span className="font-bold text-gray-900 ml-1">{item.lookingFor}</span></span>
          </div>
        )}

        {/* Owner Info - More spacious layout */}
        <div className="flex items-center mt-auto pt-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 mr-3.5 overflow-hidden shrink-0 border-2 border-gray-100 shadow-sm">
            <img src={item.owner.image} alt={item.owner.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-[17px] truncate">{item.owner.name}</h3>
            <div className="flex items-center text-[13px] mt-1">
              <div className="flex items-center text-gray-400 mr-3">
                <MapPin size={12} className="mr-1 shrink-0" />
                <span className="truncate">{item.owner.location}</span>
              </div>
              <div className="flex items-center text-[#BE185D]">
                <MapPin size={12} className="mr-1 shrink-0" />
                <span className="font-bold whitespace-nowrap">{item.owner.distance} away</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
