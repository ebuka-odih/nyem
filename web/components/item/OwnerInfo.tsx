import React from 'react';
import { MapPin, Star } from 'lucide-react';
import { PLACEHOLDER_AVATAR, generateInitialsAvatar } from '../../constants/placeholders';

interface Owner {
  name: string;
  image: string;
  location: string;
  distance: string;
}

interface OwnerInfoProps {
  owner: Owner;
  rating?: number;
  reviewCount?: number;
}

export const OwnerInfo: React.FC<OwnerInfoProps> = ({
  owner,
  rating = 4.9,
  reviewCount = 12
}) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative w-12 h-12 mr-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
              <img 
                src={(() => {
                  // Check if image exists and is not empty
                  if (!owner.image || owner.image.trim() === '') {
                    return generateInitialsAvatar(owner.name);
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
                    owner.image.toLowerCase().includes(pattern.toLowerCase())
                  );
                  // Return initials avatar if it's a generated avatar, otherwise use the actual photo
                  return isGeneratedAvatar ? generateInitialsAvatar(owner.name) : owner.image;
                })()}
                alt={owner.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // If image fails to load, use initials avatar
                  (e.target as HTMLImageElement).src = generateInitialsAvatar(owner.name);
                }}
              />
            </div>
            {/* Verified Badge - Blue Tick */}
            <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5 border-2 border-white">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{owner.name}</h4>
            <div className="flex items-center text-xs text-gray-500 mt-0.5">
              <span>{owner.location}</span>
              {owner.distance && owner.distance !== 'Unknown' && (
                <>
                  <MapPin size={12} className="mx-1 text-brand" />
                  <span className="text-brand font-medium">{owner.distance} away</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center text-yellow-500 font-bold text-sm">
            <Star size={14} fill="currentColor" className="mr-1" />
            {rating}
          </div>
          <span className="text-xs text-gray-400">{reviewCount} Reviews</span>
        </div>
      </div>
    </div>
  );
};



