
import React from 'react';
import { ArrowLeft, MapPin, Star, MessageCircle, Info, X } from 'lucide-react';
import { Button } from './Button';
import { SwipeItem } from '../types';

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
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-start pointer-events-none">
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
        <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
            {/* Image Gallery */}
            <div className="h-[45vh] relative bg-gray-200">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
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

            <div className="p-6 -mt-6 bg-white rounded-t-[32px] relative z-10">
                {/* Gallery Thumbnails */}
                {item.gallery && item.gallery.length > 0 && (
                    <div className="flex space-x-3 overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar">
                        {item.gallery.map((img, i) => (
                            <div key={i} className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                                <img src={img} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Description */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                        {item.description}
                    </p>
                </div>

                {/* Looking For (if barter) */}
                {!isMarketplace && (
                    <div className="mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">Looking For</h3>
                        <p className="text-gray-700 font-medium">{item.lookingFor}</p>
                    </div>
                )}

                {/* Owner Info */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Listed by</h3>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-gray-100 mr-3 overflow-hidden border border-gray-200">
                                <img src={item.owner.image} alt={item.owner.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900">{item.owner.name}</h4>
                                <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                    <MapPin size={12} className="mr-1 text-brand" />
                                    <span>{item.owner.location} • {item.owner.distance} away</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="flex items-center text-yellow-500 font-bold text-sm">
                                 <Star size={14} fill="currentColor" className="mr-1" />
                                 4.9
                             </div>
                             <span className="text-xs text-gray-400">12 Reviews</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Sticky Bottom Action */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-8">
            <div className="flex space-x-3">
                <button className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3.5 rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
                    View Profile
                </button>
                <button className="flex-[2] bg-brand text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand/20 active:scale-95 transition-transform flex items-center justify-center">
                    <MessageCircle size={18} className="mr-2" />
                    Chat Now
                </button>
            </div>
        </div>
    </div>
  );
};
