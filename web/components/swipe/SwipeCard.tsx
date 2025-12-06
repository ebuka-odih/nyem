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
    <div className="w-full h-full flex flex-col rounded-[24px] overflow-hidden bg-white shadow-lg border border-gray-100">
      {/* Image Section - 60% of card height */}
      <div className="relative h-[60%] shrink-0">
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

        {/* Badge & Title - Bottom of image */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-col items-start gap-1.5">
          {isMarketplace ? (
            <span className="bg-[#FFD700] text-black text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              {item.price}
            </span>
          ) : (
            <span className="bg-[#10B981] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm">
              {item.condition}
            </span>
          )}
          <h2 className="text-2xl font-black text-white leading-tight drop-shadow-lg line-clamp-2">
            {item.title}
          </h2>
        </div>
      </div>

      {/* Content Section - 40% of card height */}
      <div className="h-[40%] px-4 py-3 flex flex-col bg-white">
        {/* Status Banner */}
        {isMarketplace ? (
          <div className="bg-[#ECFDF5] rounded-lg px-3 py-2.5 flex items-center justify-center border border-green-100/50 shrink-0">
            <span className="text-[#10B981] text-sm font-bold">Available for Purchase</span>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg px-3 py-2.5 flex items-center border border-gray-100 shrink-0">
            <span className="text-gray-500 text-sm">Looking for: <span className="font-bold text-gray-900 ml-1">{item.lookingFor}</span></span>
          </div>
        )}

        {/* Owner Info */}
        <div className="flex items-center mt-auto pt-3">
          <div className="w-11 h-11 rounded-full bg-gray-200 mr-3 overflow-hidden shrink-0 border border-gray-100">
            <img src={item.owner.image} alt={item.owner.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-base truncate">{item.owner.name}</h3>
            <div className="flex items-center text-xs mt-0.5">
              <div className="flex items-center text-gray-400 mr-2">
                <MapPin size={11} className="mr-0.5 shrink-0" />
                <span className="truncate">{item.owner.location}</span>
              </div>
              <div className="flex items-center text-[#BE185D]">
                <MapPin size={11} className="mr-0.5 shrink-0" />
                <span className="font-bold whitespace-nowrap">{item.owner.distance} away</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
