import React, { useState } from 'react';
import { MapPin, Star, DollarSign, MessageCircle, Phone, Briefcase, CheckCircle2, Share2, Info } from 'lucide-react';
import { SwipeItem } from '../../types';
import { generateInitialsAvatar } from '../../constants/placeholders';
import { apiFetch } from '../../utils/api';
import { ENDPOINTS } from '../../constants/endpoints';

interface ServiceProviderCardProps {
  item: SwipeItem;
  onInfoClick?: () => void;
  onContactClick?: () => void;
  onMessageClick?: () => void;
}

export const ServiceProviderCard: React.FC<ServiceProviderCardProps> = ({
  item,
  onInfoClick,
  onContactClick,
  onMessageClick,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get work images or fallback to single image
  const workImages = item.images || item.gallery || [];
  const primaryImage = workImages[0] || item.image || 'https://via.placeholder.com/800';
  const hasMultipleImages = workImages.length > 1;

  // Format price
  const priceDisplay = item.price || item.starting_price
    ? `₦${typeof (item.price || item.starting_price) === 'string' 
        ? parseFloat((item.price || item.starting_price).toString().replace(/,/g, ''))
        : (item.price || item.starting_price)
      }`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : 'Price on request';

  // Availability badge
  const availability = item.availability || 'available';
  const availabilityColors = {
    available: 'bg-green-100 text-green-700 border-green-200',
    busy: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    unavailable: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const availabilityLabels = {
    available: 'Available',
    busy: 'Busy',
    unavailable: 'Unavailable',
  };

  // Rating
  const rating = item.rating || 0;
  const ratingCount = item.rating_count || 0;

  // Location and distance
  const location = item.owner?.location || item.user?.city || 'Location not specified';
  const distance = item.owner?.distance || item.distance || null;

  // Category/Service name
  const serviceName = item.category || item.title || 'Service Provider';
  const userName = item.owner?.name || item.user?.username || 'Service Provider';
  const userAvatar = item.owner?.image || item.user?.profile_photo;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const shareUrl = `${window.location.origin}/service-providers/${item.id}`;
      if (navigator.share) {
        await navigator.share({
          title: `${userName} - ${serviceName}`,
          text: item.description || `Check out ${userName}'s services`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to share:', err);
      }
    }
  };

  const nextImage = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev + 1) % workImages.length);
    }
  };

  const prevImage = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev - 1 + workImages.length) % workImages.length);
    }
  };

  const currentImage = hasMultipleImages ? workImages[currentImageIndex] : primaryImage;

  return (
    <div className="w-full h-full flex flex-col rounded-[32px] overflow-hidden bg-white shadow-2xl shadow-black/10 border border-white/50">
      {/* Image Section - Larger for service providers */}
      <div className="relative h-[50%] shrink-0 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
        {/* Shimmer loading state */}
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"></div>
        )}

        {/* Main Image */}
        <img
          src={currentImage}
          alt={serviceName}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800';
            setImageLoaded(true);
          }}
        />

        {/* Image Navigation Dots */}
        {hasMultipleImages && workImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {workImages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentImageIndex
                    ? 'w-6 bg-white'
                    : 'w-1.5 bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        )}

        {/* Image Navigation Arrows */}
        {hasMultipleImages && workImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all active:scale-95"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all active:scale-95"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}

        {/* Top Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all active:scale-95"
          >
            <Share2 size={18} />
          </button>
          {onInfoClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInfoClick();
              }}
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all active:scale-95"
            >
              <Info size={18} />
            </button>
          )}
        </div>

        {/* Availability Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm shadow-sm ${availabilityColors[availability]}`}>
            {availabilityLabels[availability]}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col p-5 bg-white">
        {/* Service Category & Name */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={16} className="text-brand shrink-0" />
            <h3 className="text-lg font-extrabold text-gray-900 truncate">{serviceName}</h3>
          </div>
          {item.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{item.description}</p>
          )}
        </div>

        {/* Provider Info */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden ring-2 ring-white shadow-md">
              <img
                src={userAvatar && userAvatar.trim() !== '' ? userAvatar : generateInitialsAvatar(userName)}
                alt={userName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = generateInitialsAvatar(userName);
                }}
              />
            </div>
            {/* Verified Badge */}
            {item.owner?.phone_verified_at && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5 border-2 border-white">
                <CheckCircle2 size={12} className="text-white" />
              </div>
            )}
          </div>

          {/* Name and Location */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <h4 className="text-sm font-bold text-gray-900 truncate">{userName}</h4>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{location}</span>
              {distance && distance !== 'Unknown' && (
                <>
                  <span className="mx-1">•</span>
                  <span>{distance}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mb-4">
          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <Star size={16} className="text-yellow-400 fill-yellow-400 shrink-0" />
            <span className="text-sm font-bold text-gray-900">
              {rating > 0 ? rating.toFixed(1) : 'New'}
            </span>
            {ratingCount > 0 && (
              <span className="text-xs text-gray-500">({ratingCount})</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center gap-1.5">
            <DollarSign size={16} className="text-gray-400 shrink-0" />
            <span className="text-sm font-bold text-brand">{priceDisplay}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMessageClick?.();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-brand-light text-white rounded-xl py-3 font-bold text-sm shadow-lg transition-all active:scale-95"
          >
            <MessageCircle size={18} />
            <span>Message</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContactClick?.();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-3 font-bold text-sm transition-all active:scale-95"
          >
            <Phone size={18} />
            <span>Contact</span>
          </button>
        </div>
      </div>
    </div>
  );
};



