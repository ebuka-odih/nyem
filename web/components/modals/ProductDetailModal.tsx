import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, MapPin, ChevronRight, SendHorizontal, Zap, TrendingUp, Flame } from 'lucide-react';
import { Product, Vendor } from '../../types';
import { RatingStars } from '../RatingStars';
import { Modal } from '../Modal';
import { getStoredUser } from '../../utils/api';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onShare: (product: Product) => void;
  onSellerClick: (vendor: Vendor) => void;
  onSendRequest: () => void;
  hasValidToken: boolean;
  onLogin: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onShare,
  onSellerClick,
  onSendRequest,
  hasValidToken,
  onLogin
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!product) return null;

  const stats = product.stats || {};
  const isNew = product.createdAt ? (Date.now() - new Date(product.createdAt.replace(' ', 'T')).getTime() < 7 * 24 * 60 * 60 * 1000) : false;
  const isMostViewed = (stats.views || 0) >= 10;
  const isPopular = (stats.stars || 0) >= 5;

  const currentUser = getStoredUser();
  const isOwnListing = currentUser && product.userId && String(currentUser.id) === String(product.userId);

  return (
    <Modal isOpen={!!product} onClose={onClose} title="Item Details" fullHeight>
      <div className="flex flex-col gap-6 pb-32 no-scrollbar max-w-[390px] mx-auto">
        <div className="space-y-4">
          <motion.div
            key={product.images[activeImageIndex]}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            className="w-full aspect-square rounded-[2rem] overflow-hidden bg-neutral-100 border border-neutral-100 shadow-sm"
          >
            <img src={product.images[activeImageIndex]} className="w-full h-full object-cover" />
          </motion.div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImageIndex(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${activeImageIndex === i ? 'border-[#830e4c] scale-105 shadow-md shadow-[#830e4c]/20' : 'border-transparent opacity-50 hover:opacity-100'}`}
              >
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="px-1 space-y-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-[#830e4c] uppercase tracking-[0.2em] bg-[#830e4c1a] px-3 py-1.5 rounded-xl border border-[#830e4c33]">
                {product.category}
              </span>
              {isNew && (
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 flex items-center gap-1.5">
                  <Zap size={10} fill="currentColor" />
                  New Drop
                </span>
              )}
              {isMostViewed && (
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1.5">
                  <TrendingUp size={10} strokeWidth={3} />
                  Most Viewed
                </span>
              )}
              {isPopular && (
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 flex items-center gap-1.5">
                  <Flame size={10} fill="currentColor" />
                  Popular
                </span>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-[2.2rem] font-black text-neutral-900 tracking-tighter leading-[0.9] uppercase italic w-full">
                {product.name}
              </h2>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl font-black text-[#830e4c] tracking-tighter">{product.price}</span>
                  <div className="w-1 h-1 rounded-full bg-neutral-200" />
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic">Negotiable</span>
                </div>

                <button
                  onClick={() => onShare(product)}
                  className="p-3.5 bg-neutral-900 text-white rounded-2xl active:scale-90 transition-all hover:bg-neutral-800"
                >
                  <Share2 size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>

          <div className="h-px bg-neutral-100 w-full" />

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.25em]">The Description</h4>
            <p className="text-neutral-600 text-sm font-medium leading-relaxed">
              {product.longDescription}
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <h4 className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.25em]">Owner of Item</h4>
            <div
              onClick={() => onSellerClick(product.vendor)}
              className="bg-white rounded-[3rem] p-5 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.04)] border border-neutral-50 cursor-pointer active:scale-[0.98] transition-all hover:bg-neutral-50 group"
            >
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-[6px] border-white shadow-lg ring-1 ring-neutral-100">
                    <img src={isOwnListing && currentUser?.profile_photo ? currentUser.profile_photo : product.vendor.avatar} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow-md border border-neutral-100">
                    <div className="w-3.5 h-3.5 bg-[#29B3F0] rounded-full shadow-inner" />
                  </div>
                </div>
                <div className="flex-col gap-2 min-w-0">
                  <h4 className="text-xl font-black text-neutral-900 uppercase tracking-tighter italic leading-none truncate">{isOwnListing && currentUser?.username ? currentUser.username : product.vendor.name}</h4>
                  <div className="flex flex-col gap-1">
                    <RatingStars rating={product.vendor.rating} />
                    <div className="flex items-center gap-1 text-neutral-400">
                      <MapPin size={10} strokeWidth={3} />
                      <span className="text-[10px] font-black uppercase tracking-tight">
                        {product.distance && product.distance !== 'Unknown' && product.distance !== 'UNKNOWN'
                          ? `${product.distance} ${product.vendor.location}`
                          : product.vendor.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-14 h-14 bg-neutral-50/50 rounded-[1.5rem] flex items-center justify-center text-neutral-300 group-hover:text-neutral-900 group-hover:bg-white group-hover:shadow-lg transition-all border border-neutral-100/50 shrink-0">
                <ChevronRight size={28} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent pt-12 z-[250]">
          <button
            onClick={() => {
              if (!hasValidToken) {
                onLogin();
              } else {
                onSendRequest();
              }
            }}
            className="w-full max-w-[360px] mx-auto bg-[#830e4c] text-white py-6 rounded-[2.2rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-[0_20px_60px_rgba(131,14,76,0.25)] active:scale-95 transition-all flex items-center justify-center gap-3 italic"
          >
            <SendHorizontal size={18} strokeWidth={3} className="text-white/60" />
            SEND REQUEST TO SELLER
          </button>
        </div>
      </div>
    </Modal>
  );
};


