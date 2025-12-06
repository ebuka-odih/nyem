import React from 'react';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../Button';
import { SwipeItem } from '../../types';

interface SwipeModalsProps {
  showOfferModal: boolean;
  showMarketplaceModal: boolean;
  currentItem: SwipeItem | null;
  activeTab: 'Shop' | 'Services' | 'Swap';
  onCloseOffer: () => void;
  onCloseMarketplace: () => void;
  onComplete: () => void;
}

const MOCK_USER_ITEMS = [
  { id: 101, title: "AirPod Pro", subtitle: "Used • Electronics", image: "https://images.unsplash.com/photo-1603351154351-5cf233081e35?auto=format&fit=crop&w=300&q=80" },
  { id: 102, title: "Camera", subtitle: "Used • Electronics", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80" },
  { id: 103, title: "Shoes", subtitle: "Used • Fashion", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80" },
];

export const SwipeModals: React.FC<SwipeModalsProps> = ({
  showOfferModal,
  showMarketplaceModal,
  currentItem,
  activeTab,
  onCloseOffer,
  onCloseMarketplace,
  onComplete,
}) => {
  return (
    <AnimatePresence>
      {/* Barter Offer Modal */}
      {showOfferModal && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
        >
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }} 
            className="bg-white w-full rounded-t-3xl overflow-hidden max-h-[85vh] flex flex-col shadow-2xl"
          >
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="font-extrabold text-xl text-gray-900">Make an Offer</h3>
                <p className="text-sm text-gray-500">Select an item to exchange</p>
              </div>
              <button 
                onClick={onCloseOffer} 
                className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Target Item Context */}
            {currentItem && (
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  You Want to Exchange For:
                </div>
                <div className="flex items-center bg-brand/5 p-3 rounded-xl border-2 border-brand shadow-sm">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                    <img src={currentItem.image} alt={currentItem.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{currentItem.title}</h4>
                    <p className="text-xs text-gray-500 truncate">Owned by {currentItem.owner.name}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-y-auto p-4 space-y-3 pb-8">
              {MOCK_USER_ITEMS.map(item => (
                <button 
                  key={item.id} 
                  onClick={onComplete} 
                  className="w-full flex items-center p-3 rounded-2xl border border-gray-100 hover:border-brand hover:bg-brand/5 transition-all group text-left"
                >
                  <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                    <img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-bold text-gray-900 group-hover:text-brand transition-colors">{item.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-brand group-hover:border-brand group-hover:text-white transition-all">
                    <Check size={16} />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Marketplace Interaction Modal */}
      {showMarketplaceModal && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.9, opacity: 0 }} 
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
              <Check size={32} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Interested?</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              You liked <strong>{currentItem?.title}</strong>. What would you like to do next?
            </p>
            <div className="space-y-3">
              <Button fullWidth onClick={onComplete}>Chat with Seller</Button>
              <button 
                onClick={onComplete} 
                className="w-full py-3.5 rounded-full font-bold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Keep Swiping
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

