import React from 'react';
import { MapPin, Star } from 'lucide-react';

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
          <div className="w-12 h-12 rounded-full bg-gray-100 mr-3 overflow-hidden border border-gray-200">
            <img src={owner.image} alt={owner.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{owner.name}</h4>
            <div className="flex items-center text-xs text-gray-500 mt-0.5">
              <MapPin size={12} className="mr-1 text-brand" />
              <span>{owner.location} • {owner.distance} away</span>
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



