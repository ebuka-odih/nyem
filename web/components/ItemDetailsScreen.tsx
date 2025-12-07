
import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { SwipeItem } from '../types';
import { ImageGallery } from './item/ImageGallery';
import { ItemDetails } from './item/ItemDetails';
import { OwnerInfo } from './item/OwnerInfo';
import { ItemActions } from './item/ItemActions';

interface ItemDetailsScreenProps {
  item: SwipeItem | null;
  onBack: () => void;
}

export const ItemDetailsScreen: React.FC<ItemDetailsScreenProps> = ({ item, onBack }) => {
  if (!item) return <div>No item selected</div>;

  const isMarketplace = item.type === 'marketplace';

  return (
    <div className="flex flex-col h-full bg-white relative">
        {/* Transparent Header for Back/Close Buttons */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start pointer-events-none" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingLeft: '1rem', paddingRight: '1rem' }}>
            <button 
                onClick={onBack}
                className="pointer-events-auto w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
            >
                <ArrowLeft size={22} />
            </button>

            {/* Close Button */}
            <button 
                onClick={onBack}
                className="pointer-events-auto w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
            >
                <X size={22} />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            {/* Image Gallery with Title Overlay */}
            <div className="h-[45vh] relative bg-gray-200">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-12 left-4 right-4 text-white">
                    {isMarketplace ? (
                        <div className="inline-block bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full mb-2 shadow-sm">
                            ₦{item.price}
                        </div>
                    ) : (
                        <div className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 shadow-sm uppercase">
                            {item.condition}
                        </div>
                    )}
                    <h1 className="text-3xl font-extrabold leading-tight">{item.title}</h1>
                </div>
            </div>

            {/* Item Details */}
            <ItemDetails item={item} />

            {/* Owner Info */}
            <div className="px-6 pb-6">
                <OwnerInfo owner={item.owner} />
            </div>
        </div>

        {/* Sticky Bottom Action Footer */}
        <ItemActions />
    </div>
  );
};
