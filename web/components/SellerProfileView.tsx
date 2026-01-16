
import React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  BadgeCheck,
  Share2,
  Heart,
  UserPlus,
  MessageSquare,
  Star,
  Zap,
  Package,
  ChevronRight
} from 'lucide-react';
import { Vendor, Product } from '../types';
import { RatingStars } from './RatingStars';
import { PRODUCTS } from '../data';
import { getStoredUser } from '../utils/api';

interface SellerProfileViewProps {
  vendor: Vendor;
  onClose: () => void;
  onProductClick: (product: Product) => void;
}

export const SellerProfileView: React.FC<SellerProfileViewProps> = ({ vendor, onClose, onProductClick }) => {
  // Filter products for this specific vendor from the global list
  const sellerProducts = PRODUCTS.filter(p => p.vendor.name === vendor.name);
  const currentUser = getStoredUser();
  const isOwnProfile = currentUser && (String(currentUser.id) === String(vendor.id) || String(currentUser.id) === String((vendor as any).userId));

  const stats = [
    { label: 'Deals', value: vendor.reviewCount, icon: Package },
    { label: 'Rating', value: vendor.rating.toFixed(1), icon: Star },
    { label: 'Followers', value: vendor.followers, icon: UserPlus },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header Profile Section */}
      <div className="flex flex-col items-center pt-4">
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-[2.5rem] bg-indigo-50 border-4 border-white shadow-xl overflow-hidden">
            <img src={isOwnProfile && currentUser?.profile_photo ? currentUser.profile_photo : vendor.avatar} className="w-full h-full object-cover" alt={vendor.name} />
          </div>
          {vendor.verified && (
            <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-xl shadow-lg border border-neutral-100 text-indigo-600">
              <BadgeCheck size={20} fill="currentColor" />
            </div>
          )}
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-neutral-900 tracking-tighter uppercase italic">{isOwnProfile && currentUser?.username ? currentUser.username : vendor.name}</h2>
          <p className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
            <MapPin size={12} /> {vendor.location}
          </p>
          <p className="text-xs font-medium text-neutral-500 max-w-xs mx-auto leading-relaxed mt-2">
            {vendor.bio}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 px-2">
        <button className="flex-1 bg-neutral-900 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
          <UserPlus size={14} strokeWidth={3} /> Follow
        </button>
        <button className="flex-1 bg-white border-2 border-neutral-900 text-neutral-900 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2">
          <MessageSquare size={14} strokeWidth={3} /> Message
        </button>
        <button className="p-4 bg-neutral-100 rounded-2xl text-neutral-900 active:scale-90 transition-all">
          <Share2 size={18} strokeWidth={2.5} />
        </button>
        <button className="p-4 bg-rose-50 rounded-2xl text-rose-500 active:scale-90 transition-all">
          <Heart size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-neutral-50 border border-neutral-100 rounded-3xl p-4 flex flex-col items-center text-center">
            <stat.icon size={16} className="text-neutral-400 mb-2" />
            <span className="text-lg font-black text-neutral-900 leading-none tracking-tighter">{stat.value}</span>
            <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mt-1.5">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Active Drops - Horizontal Scroll */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[11px] font-black text-neutral-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <Zap size={14} className="text-indigo-600" /> Active Drops
          </h4>
          <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">See All</span>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-1 pb-4 snap-x">
          {sellerProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => onProductClick(product)}
              className="flex-shrink-0 w-40 snap-start text-left group"
            >
              <div className="aspect-[4/5] bg-neutral-100 rounded-3xl overflow-hidden border border-neutral-100 mb-3 relative">
                <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black text-white">
                  {product.price}
                </div>
              </div>
              <h5 className="text-[11px] font-black text-neutral-900 truncate uppercase tracking-tight">{product.name}</h5>
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{product.category}</p>
            </button>
          ))}
          {/* Add a placeholder if few items */}
          {sellerProducts.length < 3 && (
            <div className="flex-shrink-0 w-40 aspect-[4/5] bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-100 flex items-center justify-center text-neutral-300">
              <span className="text-[8px] font-black uppercase tracking-widest">More Soon</span>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="space-y-4">
        <div className="px-2">
          <h4 className="text-[11px] font-black text-neutral-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <Star size={14} className="text-amber-400" /> Buyer Reviews
          </h4>
        </div>
        <div className="space-y-3">
          {vendor.reviews?.map((review) => (
            <div key={review.id} className="bg-white border border-neutral-100 rounded-[2rem] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img src={review.userAvatar} className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-neutral-900 uppercase tracking-tight">{review.userName}</span>
                    <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">{review.date}</span>
                  </div>
                </div>
                <RatingStars rating={review.rating} />
              </div>
              <p className="text-xs font-medium text-neutral-600 leading-relaxed">
                "{review.comment}"
              </p>
            </div>
          ))}
          {!vendor.reviews?.length && (
            <div className="py-10 text-center bg-neutral-50 rounded-[2rem] border border-neutral-100 border-dashed">
              <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">No reviews yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
