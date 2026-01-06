import React from 'lucide-react';
import { Heart, MessageSquare, Trash2, Zap } from 'lucide-react';
import { Product } from '../../types';
import { Modal } from '../Modal';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  likedItems: Product[];
  onItemClick: (item: Product) => void;
  onRemove: (id: number) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  likedItems,
  onItemClick,
  onRemove
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Wishlist" fullHeight>
      <div className="space-y-4 pb-10">
        {likedItems.length > 0 ? likedItems.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-2xl border border-neutral-100 group">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-200">
              <img src={item.images[0]} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                {item.isSuper && <Zap size={10} className="text-[#29B3F0]" fill="currentColor" />}
                <span className="text-[8px] font-black text-[#830e4c] uppercase tracking-widest">{item.category}</span>
              </div>
              <h4 className="text-sm font-black text-neutral-900 truncate tracking-tight">{item.name}</h4>
              <p className="text-xs font-black text-[#830e4c] mt-0.5">{item.price}</p>
              <div className="flex items-center gap-3 mt-2">
                <button 
                  onClick={() => { onItemClick(item); onClose(); }} 
                  className="text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
                >
                  Details
                </button>
                <button 
                  onClick={() => onRemove(item.id as number)} 
                  className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1"
                >
                  <Trash2 size={10} /> Remove
                </button>
              </div>
            </div>
            <button 
              onClick={() => { onClose(); onItemClick(item); }} 
              className="p-3 bg-white rounded-xl shadow-sm border border-neutral-100 text-neutral-900 active:scale-90 transition-all"
            >
              <MessageSquare size={18} strokeWidth={2.5} />
            </button>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-100">
              <Heart size={32} className="text-neutral-200" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-neutral-900 uppercase tracking-tighter">No items yet</h4>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Swipe right on items you want to buy!</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

