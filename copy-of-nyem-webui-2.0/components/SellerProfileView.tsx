import React from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  UserPlus, 
  MessageSquare, 
  Star, 
  Zap, 
  ChevronLeft,
  X,
  Package,
  Heart,
  Share2
} from 'lucide-react';
import { Vendor, Product } from '../types';
import { PRODUCTS } from '../data';

interface SellerProfileViewProps {
  vendor: Vendor;
  onBack: () => void;
  onClose: () => void;
  onProductClick: (product: Product) => void;
}

// Fix: Casting to any to bypass environment-specific type errors for motion components
const MotionDiv = motion.div as any;

export const SellerProfileView: React.FC<SellerProfileViewProps> = ({ vendor, onBack, onClose, onProductClick }) => {
  const sellerProducts = PRODUCTS.filter(p => p.vendor.name === vendor.name);

  return (
    <MotionDiv 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 bg-white z-[400] flex flex-col overflow-y-auto no-scrollbar"
    >
      {/* Page Header */}
      <header className="shrink-0 px-6 py-6 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-xl z-10">
        <button onClick={onBack} className="p-3 bg-neutral-100 rounded-2xl text-[#830e4c] active:scale-90 transition-all">
          <ChevronLeft size={20} strokeWidth={3} />
        </button>
        <h3 className="text-[12px] font-black text-neutral-900 uppercase tracking-[0.2em]">Seller Profile</h3>
        <button onClick={onClose} className="p-3 bg-neutral-100 rounded-2xl text-neutral-400 active:scale-90 transition-all">
          <X size={20} strokeWidth={3} />
        </button>
      </header>

      <div className="flex flex-col gap-8 px-6 pb-20">
        {/* Profile Card Pill (Screenshot 2) */}
        <div className="bg-white rounded-[4rem] p-6 flex items-center gap-6 border border-neutral-100 shadow-[0_15px_45px_rgba(131,14,76,0.05)]">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-md ring-1 ring-[#830e4c1a]">
              <img src={vendor.avatar} className="w-full h-full object-cover" alt={vendor.name} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-black text-[#830e4c] tracking-tight uppercase italic leading-none">
              {vendor.name}
            </h2>
            <div className="flex items-center gap-2">
              <Star size={18} fill="#FFD700" className="text-[#FFD700]" />
              <span className="text-base font-black text-neutral-900 leading-none">{vendor.rating.toFixed(1)}</span>
              <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest leading-none">
                {vendor.reviewCount} REVIEWS
              </span>
            </div>
          </div>
        </div>

        {/* Profile Actions */}
        <div className="flex items-center gap-3">
          <button className="flex-1 bg-[#830e4c] text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
            <UserPlus size={16} strokeWidth={3} /> FOLLOW
          </button>
          <button className="flex-1 bg-white border-2 border-[#830e4c] text-[#830e4c] py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm italic">
            <MessageSquare size={16} strokeWidth={3} /> MESSAGE
          </button>
        </div>

        {/* Bio & Location Section (Screenshot 2) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black text-neutral-300 uppercase tracking-[0.25em]">Bio & Location</h4>
            <div className="flex items-center gap-3">
               <button className="text-[#830e4c1a] text-[#830e4c] transition-colors"><Heart size={18} /></button>
               <button className="text-neutral-300 hover:text-[#830e4c] transition-colors"><Share2 size={18} /></button>
            </div>
          </div>
          <p className="text-sm font-medium text-neutral-500 leading-relaxed max-w-[95%]">
            {vendor.bio}
          </p>
          <div className="flex items-center gap-2 text-neutral-900">
            <MapPin size={14} className="text-[#830e4c]" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em]">{vendor.location.toUpperCase()}</span>
          </div>
        </div>

        {/* Stats Section (Three circular pills from Screenshot 2) */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-[#830e4c1a] rounded-[2.5rem] p-6 flex flex-col items-center text-center shadow-sm">
            <span className="text-xl font-black text-[#830e4c] tracking-tighter">{vendor.reviewCount}</span>
            <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mt-2">DEALS</span>
          </div>
          <div className="bg-white border border-[#830e4c1a] rounded-[2.5rem] p-6 flex flex-col items-center text-center shadow-sm">
            <span className="text-xl font-black text-[#830e4c] tracking-tighter">{vendor.rating.toFixed(1)}</span>
            <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mt-2">RATING</span>
          </div>
          <div className="bg-white border border-[#830e4c1a] rounded-[2.5rem] p-6 flex flex-col items-center text-center shadow-sm">
            <span className="text-xl font-black text-[#830e4c] tracking-tighter">{vendor.followers}</span>
            <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mt-2">FOLLOWERS</span>
          </div>
        </div>

        {/* Active Drops Section (Screenshot 2) */}
        <div className="space-y-5 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[12px] font-black text-neutral-900 uppercase tracking-[0.2em] flex items-center gap-2 italic">
              <Zap size={16} className="text-[#830e4c]" fill="currentColor" /> Active Drops
            </h4>
            <button className="text-[10px] font-black text-[#830e4c] uppercase tracking-widest hover:text-[#830e4c]/70">View All</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {sellerProducts.map((product) => (
              <button 
                key={product.id}
                onClick={() => onProductClick(product)}
                className="text-left group"
              >
                <div className="aspect-[4/5] bg-neutral-100 rounded-[2.5rem] overflow-hidden border border-neutral-100 mb-3 relative shadow-sm">
                  <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#830e4c1a] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h5 className="text-[11px] font-black text-neutral-900 italic truncate uppercase tracking-tight px-1">{product.name}</h5>
                <p className="text-[10px] font-black text-[#830e4c] mt-0.5 px-1">{product.price}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </MotionDiv>
  );
};