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
    <>
      <div className="h-[55%] bg-gray-100 relative shrink-0">
        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        {/* INFO BUTTON */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onInfoClick && onInfoClick();
          }}
          className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg active:scale-90 border border-white/30 z-20 cursor-pointer hover:bg-white/30"
        >
          <Info size={18} />
        </button>

        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex flex-col items-start gap-1">
            {isMarketplace ? (
              <span className="bg-yellow-400 text-black border border-yellow-300/50 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm mb-1 whitespace-nowrap shrink-0">₦{item.price}</span>
            ) : (
              <span className="bg-green-500 text-white border border-green-400/50 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide shadow-sm mb-1 whitespace-nowrap shrink-0">{item.condition}</span>
            )}
            <h2 className="text-2xl font-extrabold text-white leading-tight drop-shadow-md pr-2 line-clamp-2">{item.title}</h2>
          </div>
        </div>
      </div>
      
      <div className="px-5 pt-5 pb-16 flex flex-col flex-1 bg-white relative overflow-y-auto min-h-0">
        {/* Description - Always visible */}
        <div className="mb-4 shrink-0">
          <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed font-medium select-none">
            {item.description || 'No description available'}
          </p>
        </div>
        
        {isMarketplace ? (
          <div className="bg-green-50 rounded-lg px-3 py-2 mb-3 flex items-center border border-green-100 select-none shrink-0">
            <span className="text-green-700 text-xs truncate font-bold">Available for Purchase</span>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3 flex items-center border border-gray-100 select-none shrink-0">
            <span className="text-gray-500 text-xs truncate">Looking for: <span className="font-bold text-gray-900 ml-1">{item.lookingFor}</span></span>
          </div>
        )}
        
        <div className="flex-grow"></div>
        <div className="h-px bg-gray-50 w-full my-2"></div>
        <div className="flex items-center pt-2 pb-10 shrink-0">
          <div className="w-9 h-9 rounded-full bg-gray-200 mr-3 overflow-hidden shrink-0 border">
            <img src={item.owner.image} alt={item.owner.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{item.owner.name}</h3>
            <div className="flex items-center text-gray-400 text-xs font-medium mt-0.5">
              <MapPin size={10} className="mr-1" />
              <span>{item.owner.location}</span>
              <span className="mx-1.5 text-gray-300">•</span>
              <MapPin size={10} className="mr-0.5 text-brand" />
              <span className="text-brand font-bold">{item.owner.distance} away</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

