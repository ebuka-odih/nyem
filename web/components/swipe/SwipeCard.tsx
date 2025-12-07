import React, { useState } from 'react';
import { Info, MapPin, Share2, Heart, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { SwipeItem } from '../../types';

interface SwipeCardProps {
  item: SwipeItem;
  onInfoClick?: () => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ item, onInfoClick }) => {
  const isMarketplace = item.type === 'marketplace';
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Format location display: "Wuse, Abuja [icon] 20km Away" or just "Abuja"
  const formatLocation = () => {
    const location = item.owner.location || '';
    const distance = item.owner.distance && item.owner.distance !== 'Unknown' ? item.owner.distance : null;

    // Clean location - remove trailing comma if present
    const cleanLocation = location.trim().replace(/,$/, '');

    if (distance) {
      // Format with distance: "Wuse, Abuja [icon] 20km Away" or "Abuja [icon] 20km Away"
      return (
        <>
          <span>{cleanLocation}</span>
          <MapPin size={9} className="mx-1 shrink-0 text-gray-400" />
          <span>{distance} Away</span>
        </>
      );
    } else {
      // Just location: "Wuse, Abuja" or "Abuja"
      return <span>{cleanLocation}</span>;
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const shareUrl = `${window.location.origin}/items/${item.id}`;
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        // Could add a toast notification here
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to share item:', err);
      }
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <div className="w-full h-full flex flex-col rounded-[32px] overflow-hidden bg-white shadow-2xl shadow-black/10 border border-white/50">

      {/* Image Section - Larger image area */}
      <div className="relative h-[60%] shrink-0 overflow-hidden">
        {/* Shimmer loading state */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse" />
        )}

        <img
          src={item.image}
          alt={item.title}
          className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Elegant gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Subtle top gradient for badges */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />

        {/* Top Action Bar */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {/* Price/Condition Badge */}
          {isMarketplace ? (
            <div className="flex flex-col gap-1.5">
              <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-gray-900 text-sm font-black px-3 py-1.5 rounded-xl shadow-lg">
                <span className="text-[#990033]">{item.price}</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles size={9} />
                For Sale
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-gray-800 text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg uppercase tracking-wide">
              <CheckCircle2 size={11} className="text-emerald-500" />
              {item.condition}
            </span>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleLike}
              className={`w-9 h-9 rounded-xl backdrop-blur-md flex items-center justify-center border transition-all duration-300 ${isLiked
                ? 'bg-rose-500 border-rose-400 scale-110'
                : 'bg-white/20 border-white/40 hover:bg-white/30'
                }`}
            >
              <Heart
                size={16}
                className={`transition-colors ${isLiked ? 'text-white fill-white' : 'text-white'}`}
              />
            </button>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 hover:bg-white/30 transition-all"
            >
              <Share2 size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Title Section - Bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-[22px] font-black text-white leading-tight tracking-tight line-clamp-2 drop-shadow-2xl">
            {item.title}
          </h2>
        </div>
      </div>

      {/* Content Section - More compact layout */}
      <div className="flex-1 px-4 pt-3 pb-3 flex flex-col bg-gradient-to-b from-white to-gray-50/50 min-h-0">

        {/* Description - Compact */}
        {item.description && (
          <p className="text-gray-600 text-[13px] leading-relaxed line-clamp-2 mb-3">
            {item.description}
          </p>
        )}

        {/* Status/Action Banner - Compact */}
        {isMarketplace ? (
          <div className="bg-gradient-to-r from-[#990033]/10 to-[#cc0044]/5 rounded-xl px-3 py-2 flex items-center justify-between border border-[#990033]/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#990033]/10 flex items-center justify-center">
                <Sparkles size={12} className="text-[#990033]" />
              </div>
              <span className="text-[#990033] text-sm font-bold">Ready to Buy</span>
            </div>
            <ArrowRight size={16} className="text-[#990033]/60" />
          </div>
        ) : (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl px-3 py-2 border border-amber-100/50">
            <p className="text-[10px] text-amber-600/80 font-medium uppercase tracking-wider">Looking for</p>
            <p className="text-gray-900 font-bold text-sm truncate">{item.lookingFor}</p>
          </div>
        )}

        {/* Seller Info - Larger text for better readability */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar with verified badge */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gray-100 overflow-hidden ring-2 ring-white shadow-md">
                <img
                  src={item.owner.image}
                  alt={item.owner.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#990033] rounded-md flex items-center justify-center ring-2 ring-white">
                <CheckCircle2 size={8} className="text-white" />
              </div>
            </div>

            {/* Seller details - Increased text sizes */}
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 text-[16px] truncate">{item.owner.name}</h3>
              <div className="flex items-center text-[12px] text-gray-500 mt-0.5 truncate">
                {formatLocation()}
              </div>
            </div>
          </div>

          {/* Info Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInfoClick && onInfoClick();
            }}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors group shrink-0 ml-2"
          >
            <Info size={18} className="text-gray-500 group-hover:text-gray-700 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
