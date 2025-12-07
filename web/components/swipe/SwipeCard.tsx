import React from 'react';
import { Info, MapPin, Share2 } from 'lucide-react';
import { SwipeItem } from '../../types';

interface SwipeCardProps {
  item: SwipeItem;
  onInfoClick?: () => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ item, onInfoClick }) => {
  const isMarketplace = item.type === 'marketplace';

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Create shareable URL
      const shareUrl = `${window.location.origin}/items/${item.id}`;

      // Use Web Share API if available, otherwise fallback to clipboard
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: shareUrl,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Item link copied to clipboard!');
      }
    } catch (err: any) {
      // User cancelled share or error occurred
      if (err.name !== 'AbortError') {
        console.error('Failed to share item:', err);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col rounded-[28px] overflow-hidden bg-white shadow-xl border border-gray-100/80">
      {/* Image Section - 55% of card height */}
      <div className="relative h-[55%] shrink-0">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

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
          {/* Title and Action Buttons Row */}
          <div className="w-full flex items-center justify-between gap-3">
            <h2 className="text-[26px] font-black text-white leading-tight drop-shadow-lg line-clamp-2 flex-1 min-w-0">
              {item.title}
            </h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleShare}
                className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-black/30 transition-colors"
              >
                <Share2 size={18} strokeWidth={1.5} className="text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInfoClick && onInfoClick();
                }}
                className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-black/30 transition-colors"
              >
                <Info size={18} strokeWidth={1.5} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section - Flexible height to show all content */}
      <div className="flex-1 px-5 pt-4 pb-4 flex flex-col bg-white overflow-hidden">
        {/* Description - Always visible */}
        {item.description && (
          <p className="text-gray-600 text-[14px] line-clamp-2 mb-2 leading-relaxed shrink-0">
            {item.description}
          </p>
        )}

        {/* Status Banner */}
        {isMarketplace ? (
          <div className="bg-[#ECFDF5] rounded-xl px-3 py-2 flex items-center justify-center border border-green-100/50 shrink-0">
            <span className="text-[#10B981] text-sm font-bold">Available for Purchase</span>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl px-3 py-2 flex items-center border border-gray-100 shrink-0">
            <span className="text-gray-500 text-sm">Looking for: <span className="font-bold text-gray-900 ml-1">{item.lookingFor}</span></span>
          </div>
        )}

        {/* Owner Info - Compact layout */}
        <div className="flex items-center mt-auto pt-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 overflow-hidden shrink-0 border-2 border-gray-100 shadow-sm">
            <img src={item.owner.image} alt={item.owner.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-[15px] truncate">{item.owner.name}</h3>
            <div className="flex items-center text-[12px] mt-0.5">
              <div className="flex items-center text-gray-400 mr-2">
                <MapPin size={11} className="mr-1 shrink-0" />
                <span className="truncate">{item.owner.location}</span>
              </div>
              <div className="flex items-center text-[#BE185D]">
                <MapPin size={11} className="mr-1 shrink-0" />
                <span className="font-bold whitespace-nowrap">{item.owner.distance} away</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
