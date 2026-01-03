import React from 'react';
import { Star } from 'lucide-react';

export const RatingStars: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex items-center gap-1.5">
      <Star 
        size={16} 
        fill="#FFD700" 
        className="text-[#FFD700]"
      />
      <span className="text-sm font-black text-neutral-900 leading-none">{rating.toFixed(1)}</span>
    </div>
  );
};