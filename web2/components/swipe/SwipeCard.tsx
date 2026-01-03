import React, { useState } from 'react';
import { Info, MapPin, Share2, Heart, CheckCircle2, ArrowRight, ShoppingBag, Repeat, Eye, Loader2 } from 'lucide-react';
import { SwipeItem } from '../../types';
import { PLACEHOLDER_AVATAR, generateInitialsAvatar } from '../../constants/placeholders';
import { apiFetch } from '../../utils/api';
import { ENDPOINTS } from '../../constants/endpoints';
import { ServiceProviderCard } from './ServiceProviderCard';

interface SwipeCardProps {
  item: SwipeItem;
  isLiked?: boolean;
  onLike?: () => void;
  onInfoClick?: () => void;
  onBuyClick?: () => void; // Handler for swipe right button (triggers modal)
  onDirectBuyRequest?: () => void; // Handler for direct buy request button (no modal)
  isSendingBuyRequest?: boolean; // Loading state for buy request
  isOwnItem?: boolean; // Whether this item belongs to the current user
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ item, isLiked: isLikedProp = false, onLike, onInfoClick, onBuyClick, onDirectBuyRequest, isSendingBuyRequest = false, isOwnItem = false }) => {
  const isMarketplace = item.type === 'marketplace';
  const isService = item.type === 'services';
  const [imageLoaded, setImageLoaded] = useState(false);
  // Use prop if provided, otherwise fall back to local state (for backward compatibility)
  const isLiked = onLike ? isLikedProp : false;

  // Use ServiceProviderCard for service items
  if (isService) {
    return (
      <ServiceProviderCard
        item={item}
        onInfoClick={onInfoClick}
        onContactClick={onBuyClick} // Use onBuyClick for contact action
        onMessageClick={onBuyClick} // Use onBuyClick for message action
      />
    );
  }
  
  // Get stats with defaults
  const views = item.views ?? 0;
  const likes = item.likes ?? 0;
  const shares = item.shares ?? 0;

  // Format location display: "Wuse, Abuja [icon] 20km Away" or just "Abuja"
  const formatLocation = () => {
    const location = item.owner.location || '';
    const distance = item.owner.distance && item.owner.distance !== 'Unknown' ? item.owner.distance : null;

    // Clean location - remove trailing comma if present
    const cleanLocation = location.trim().replace(/,$/, '');

    if (distance) {
      return (
        <>
          <span>{cleanLocation}</span>
          <MapPin size={9} className="mx-1 shrink-0 text-gray-400" />
          <span>{distance} Away</span>
        </>
      );
    } else {
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
      }

      // Track share in backend (silently fail if it doesn't work)
      try {
        await apiFetch(ENDPOINTS.items.trackShare(item.id), {
          method: 'POST',
        });
      } catch (error) {
        // Silently fail - share tracking is not critical for UX
        console.debug('Failed to track share:', error);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to share item:', err);
      }
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLike) {
      // Call the parent's like handler (which will call the API)
      onLike();
    }
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuyClick) {
      onBuyClick();
    }
  };

  const handleDirectBuyRequest = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDirectBuyRequest) {
      onDirectBuyRequest();
    }
  };

  return (
    <div className="w-full h-full flex flex-col rounded-[32px] overflow-hidden bg-white shadow-2xl shadow-black/10 border border-white/50">

      {/* Image Section */}
      <div className="relative h-[55%] sm:h-[58%] shrink-0 overflow-hidden">
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

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Top gradient for badges */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />

        {/* Top Action Bar */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {/* Price/Condition Badge */}
          {isMarketplace ? (
            <div className="flex items-center gap-2">
              {/* Price badge */}
              <span className="inline-flex items-center bg-white/95 backdrop-blur-md text-brand text-sm font-black px-3 py-1.5 rounded-xl shadow-lg">
                {item.price}
              </span>
              {/* For Sale tag */}
              <span className="inline-flex items-center gap-1 bg-brand/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                <ShoppingBag size={9} />
                Sale
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Condition badge */}
              <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-gray-800 text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg uppercase tracking-wide">
                <CheckCircle2 size={10} className="text-emerald-500" />
                {item.condition}
              </span>
              {/* For Swap tag */}
              <span className="inline-flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                <Repeat size={9} />
                Swap
              </span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleLike}
              className={`w-9 h-9 rounded-xl backdrop-blur-md flex items-center justify-center border transition-all duration-300 ${isLiked
                ? 'bg-rose-500 border-rose-400 scale-110'
                : 'bg-white/20 border-white/30 hover:bg-white/30'
                }`}
            >
              <Heart
                size={16}
                className={`transition-colors ${isLiked ? 'text-white fill-white' : 'text-white'}`}
              />
            </button>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all"
            >
              <Share2 size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Title Section - Bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="text-[22px] font-black text-white leading-tight tracking-tight line-clamp-2 drop-shadow-2xl mb-1">
            {item.title}
          </h2>
          {/* Category - subtle, below title */}
          {item.category && (
            <span className="text-white/60 text-[11px] font-medium">
              {item.category}
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 px-4 pt-3 pb-3 flex flex-col bg-gradient-to-b from-white to-gray-50/50 min-h-0">

        {/* Description */}
        {item.description && (
          <p className="text-gray-600 text-[13px] leading-relaxed line-clamp-2 mb-3">
            {item.description}
          </p>
        )}

        {/* Action Banner - Show stats for own items, otherwise show normal action */}
        {isOwnItem ? (
          // Stats display for user's own items
          <div className="w-full bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl px-4 py-3 border border-gray-200/50">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-2 text-center">Item Performance</p>
            <div className="flex items-center justify-around gap-2">
              {/* Views */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Eye size={14} className="text-blue-600" />
                </div>
                <span className="text-gray-900 font-bold text-sm">{views}</span>
                <span className="text-gray-500 text-[10px] font-medium">Views</span>
              </div>
              
              {/* Likes */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <Heart size={14} className="text-rose-600 fill-rose-600" />
                </div>
                <span className="text-gray-900 font-bold text-sm">{likes}</span>
                <span className="text-gray-500 text-[10px] font-medium">Likes</span>
              </div>
              
              {/* Shares */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Share2 size={14} className="text-emerald-600" />
                </div>
                <span className="text-gray-900 font-bold text-sm">{shares}</span>
                <span className="text-gray-500 text-[10px] font-medium">Shares</span>
              </div>
            </div>
          </div>
        ) : isMarketplace ? (
          <button
            onClick={handleDirectBuyRequest}
            disabled={!onDirectBuyRequest || isSendingBuyRequest}
            className={`w-full bg-gradient-to-r from-brand to-brand-600 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-lg shadow-brand/15 hover:shadow-xl hover:shadow-brand/25 active:scale-[0.98] transition-all group ${!onDirectBuyRequest || isSendingBuyRequest ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!onDirectBuyRequest ? "You can't send a buy request for your own item" : isSendingBuyRequest ? "Sending buy request..." : "Send buy request to seller"}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                {isSendingBuyRequest ? (
                  <Loader2 size={14} className="text-white animate-spin" />
                ) : (
                  <ShoppingBag size={14} className="text-white" />
                )}
              </div>
              <div className="text-left">
                <span className="text-white text-sm font-bold block leading-tight">
                  {isSendingBuyRequest ? 'Sending...' : 'Send Buy Request'}
                </span>
                <span className="text-white/60 text-[10px]">
                  {isSendingBuyRequest ? 'Please wait' : 'Direct message to seller'}
                </span>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
              {isSendingBuyRequest ? (
                <Loader2 size={14} className="text-white animate-spin" />
              ) : (
                <ArrowRight size={14} className="text-white group-hover:translate-x-0.5 transition-transform" />
              )}
            </div>
          </button>
        ) : (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl px-3 py-2.5 border border-amber-100/50">
            <p className="text-[10px] text-amber-600/70 font-semibold uppercase tracking-wider mb-0.5">Looking for</p>
            <p className="text-gray-900 font-bold text-sm truncate">{item.lookingFor}</p>
          </div>
        )}

        {/* Seller Info */}
        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-gray-100">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Avatar with verified badge */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gray-100 overflow-hidden ring-2 ring-white shadow-sm">
                <img
                  src={(() => {
                    // Check if image exists and is not empty
                    if (!item.owner.image || item.owner.image.trim() === '') {
                      return generateInitialsAvatar(item.owner.name);
                    }
                    // Filter out known generated avatar service URLs
                    const generatedAvatarPatterns = [
                      'ui-avatars.com',
                      'pravatar.cc',
                      'i.pravatar.cc',
                      'robohash.org',
                      'dicebear.com',
                      'avatar.vercel.sh',
                    ];
                    const isGeneratedAvatar = generatedAvatarPatterns.some(pattern => 
                      item.owner.image.toLowerCase().includes(pattern.toLowerCase())
                    );
                    // Return initials avatar if it's a generated avatar, otherwise use the actual photo
                    return isGeneratedAvatar ? generateInitialsAvatar(item.owner.name) : item.owner.image;
                  })()}
                  alt={item.owner.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // If image fails to load, use initials avatar
                    (e.target as HTMLImageElement).src = generateInitialsAvatar(item.owner.name);
                  }}
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-md flex items-center justify-center ring-1.5 ring-white">
                <CheckCircle2 size={7} className="text-white" />
              </div>
            </div>

            {/* Seller details */}
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 text-[14px] truncate leading-tight">{item.owner.name}</h3>
              <div className="flex items-center text-[11px] text-gray-500 truncate">
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
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors group shrink-0 ml-2"
          >
            <Info size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
