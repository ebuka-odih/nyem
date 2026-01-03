import React from 'react';
import { Edit2, Eye, MapPin, Star, DollarSign, Briefcase, CheckCircle2 } from 'lucide-react';
import { Button } from '../Button';
import { generateInitialsAvatar } from '../../constants/placeholders';

interface ServiceProfile {
  id: string;
  service_category_id: number;
  serviceCategory?: {
    id: number;
    name: string;
  };
  starting_price?: number | string;
  city: string;
  work_images?: string[];
  bio?: string;
  availability?: 'available' | 'busy' | 'unavailable';
  rating?: number;
  rating_count?: number;
  user?: {
    username?: string;
    name?: string;
    profile_photo?: string;
    city?: string;
  };
}

interface ServiceProfileCardProps {
  profile: ServiceProfile;
  onEdit: () => void;
  onView: () => void;
}

export const ServiceProfileCard: React.FC<ServiceProfileCardProps> = ({
  profile,
  onEdit,
  onView,
}) => {
  const workImages = profile.work_images || [];
  const primaryImage = workImages[0] || profile.user?.profile_photo;
  const categoryName = profile.serviceCategory?.name || 'Service Provider';
  const userName = profile.user?.name || profile.user?.username || 'You';
  const userAvatar = profile.user?.profile_photo;

  // Format price
  const formattedPrice = profile.starting_price
    ? typeof profile.starting_price === 'string'
      ? parseFloat(profile.starting_price.replace(/,/g, ''))
      : profile.starting_price
    : null;

  const priceDisplay = formattedPrice
    ? `₦${formattedPrice.toLocaleString('en-NG')}`
    : 'Price on request';

  // Availability badge color
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

  const availability = profile.availability || 'available';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header with cover image */}
      <div className="relative h-32 bg-gradient-to-br from-brand/20 via-brand/10 to-gray-50">
        {/* Profile avatar overlay */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="relative w-24 h-24 rounded-full bg-white p-1 shadow-lg">
            <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden">
              <img
                src={userAvatar && userAvatar.trim() !== '' ? userAvatar : generateInitialsAvatar(userName)}
                alt={userName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = generateInitialsAvatar(userName);
                }}
              />
            </div>
            {/* Verified badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
              <CheckCircle2 size={14} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 px-6 pb-6">
        {/* Name and category */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-extrabold text-gray-900 mb-1">{userName}</h3>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Briefcase size={14} className="text-gray-400" />
            <p className="text-sm font-semibold text-brand">{categoryName}</p>
          </div>
          
          {/* Location */}
          <div className="flex items-center justify-center gap-1 text-gray-600 text-sm">
            <MapPin size={12} />
            <span>{profile.city}</span>
          </div>
        </div>

        {/* Availability badge */}
        <div className="flex justify-center mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${availabilityColors[availability]}`}>
            {availabilityLabels[availability]}
          </span>
        </div>

        {/* Rating and price */}
        <div className="flex items-center justify-center gap-6 mb-4 pb-4 border-b border-gray-100">
          {profile.rating !== undefined && profile.rating > 0 ? (
            <div className="flex items-center gap-1.5">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold text-gray-900">
                {profile.rating.toFixed(1)}
              </span>
              {profile.rating_count ? (
                <span className="text-xs text-gray-500">
                  ({profile.rating_count})
                </span>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-400">
              <Star size={16} />
              <span className="text-sm">No ratings yet</span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5">
            <DollarSign size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">{priceDisplay}</span>
          </div>
        </div>

        {/* Bio preview */}
        {profile.bio && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 line-clamp-2 text-center">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Work images preview */}
        {workImages.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Work Samples ({workImages.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {workImages.slice(0, 3).map((image, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <img
                    src={image}
                    alt={`Work sample ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200';
                    }}
                  />
                </div>
              ))}
              {workImages.length > 3 && (
                <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-500">
                    +{workImages.length - 3}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onView}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-3 font-semibold transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <Eye size={16} />
              <span>View</span>
            </div>
          </Button>
          <Button
            onClick={onEdit}
            className="flex-1 bg-brand hover:bg-brand-light text-white rounded-xl py-3 font-semibold shadow-lg transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <Edit2 size={16} />
              <span>Edit</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};



