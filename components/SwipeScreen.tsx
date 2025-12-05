
import React, { useState, useEffect } from 'react';
import { X, Heart, MapPin, Filter, Info, Check, RefreshCw, Flame } from 'lucide-react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { SwipeItem } from '../types';

interface Owner {
    name: string;
    image: string;
    location: string;
    distance: string;
}

interface BarterItem {
    id: number;
    type: 'barter';
    title: string;
    condition: string;
    image: string;
    description: string;
    lookingFor: string;
    owner: Owner;
    gallery?: string[];
}

interface MarketplaceItem {
    id: number;
    type: 'marketplace';
    title: string;
    price: string;
    image: string;
    description: string;
    owner: Owner;
    gallery?: string[];
}

const MOCK_BARTER_ITEMS: BarterItem[] = [
  { id: 1, type: 'barter', title: "Vintage Camera", condition: "Antique", image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800", description: "Fully functional film camera from the 80s. Comes with original leather case.", lookingFor: "Smart Watch ⌚", owner: { name: "David", image: "https://i.pravatar.cc/150?img=3", location: "Abuja", distance: "5km" }, gallery: ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32"] },
  { id: 2, type: 'barter', title: "Sony Headphones", condition: "Used", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800", description: "Premium noise cancelling headphones. Battery life is great. Minor scratches on ear cup.", lookingFor: "Mechanical Keyboard ⌨️", owner: { name: "Sarah", image: "https://i.pravatar.cc/150?img=5", location: "Lagos", distance: "2km" }, gallery: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e", "https://images.unsplash.com/photo-1546435770-a3e426bf472b"] },
];

const MOCK_MARKETPLACE_ITEMS: MarketplaceItem[] = [
  { id: 3, type: 'marketplace', title: "Phone holder", price: "15,000", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=800", description: "Phone holder against flat wall or surface area. Great for hands-free video calls or watching movies in bed.", owner: { name: "Ebuka", image: "https://i.pravatar.cc/150?img=11", location: "Abuja", distance: "30m" }, gallery: ["https://images.unsplash.com/photo-1585771724684-38269d6639fd"] },
  { id: 4, type: 'marketplace', title: "Macbook Stand", price: "25,000", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800", description: "Aluminum alloy laptop stand. Ergonomic design to improve posture.", owner: { name: "Miriam", image: "https://i.pravatar.cc/150?img=9", location: "Port Harcourt", distance: "12km" }, gallery: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf"] }
];

const MOCK_USER_ITEMS = [
    { id: 101, title: "AirPod Pro", subtitle: "Used • Electronics", image: "https://images.unsplash.com/photo-1603351154351-5cf233081e35?auto=format&fit=crop&w=300&q=80" },
    { id: 102, title: "Camera", subtitle: "Used • Electronics", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80" },
    { id: 103, title: "Shoes", subtitle: "Used • Fashion", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80" },
];

const CATEGORY_OPTIONS = ["All Categories", "Electronics", "Fashion", "Home", "Books"];
const LOCATION_OPTIONS = ["Abuja", "Lagos", "Port Harcourt", "London"];

interface SwipeScreenProps {
  onBack: () => void;
  onItemClick: (item: SwipeItem) => void;
}

export const SwipeScreen: React.FC<SwipeScreenProps> = ({ onBack, onItemClick }) => {
  const [activeTab, setActiveTab] = useState<'exchange' | 'marketplace'>('exchange');
  const [items, setItems] = useState<SwipeItem[]>(MOCK_BARTER_ITEMS);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Modal States
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  
  // Dropdowns
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLocation, setSelectedLocation] = useState('Abuja');

  useEffect(() => {
    if (activeTab === 'exchange') {
      setItems(MOCK_BARTER_ITEMS);
    } else {
      setItems(MOCK_MARKETPLACE_ITEMS);
    }
    setCurrentIndex(0); 
  }, [activeTab]);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]); 
  const controls = useAnimation();

  useEffect(() => {
    controls.set({ scale: 0.9, y: 20, opacity: 0 });
    controls.start({ scale: 1, y: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } });
  }, [currentIndex, activeTab, controls]);

  const currentItem = items[currentIndex];
  const nextItem = items[currentIndex + 1];

  // INTERCEPTOR: Handle Right Swipe to show modals
  const handleRightSwipe = () => {
    // Reset the card position so it stays visible behind the modal
    controls.start({ x: 0, opacity: 1, rotate: 0 });

    if (activeTab === 'exchange') {
      setShowOfferModal(true);
    } else {
      setShowMarketplaceModal(true);
    }
  };

  const completeRightSwipe = async () => {
    setShowOfferModal(false);
    setShowMarketplaceModal(false);
    await swipe('right');
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      handleRightSwipe(); // <--- CALL INTERCEPTOR
    } else if (info.offset.x < -100) {
      await swipe('left');
    } else {
      controls.start({ x: 0, rotate: 0 });
    }
  };

  const swipe = async (direction: 'left' | 'right') => {
    await controls.start({ x: direction === 'left' ? -500 : 500, opacity: 0 });
    setCurrentIndex(prev => prev + 1);
    x.set(0);
  };

  const resetStack = () => setCurrentIndex(0);
  
  const handleCategorySelect = (category: string) => {
      setSelectedCategory(category);
      setShowCategoryDropdown(false);
  }
  const handleLocationSelect = (location: string) => {
      setSelectedLocation(location);
      setShowLocationDropdown(false);
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* HEADER & FILTERS */}
      <div className="px-6 pt-4 pb-1 bg-white z-20 shrink-0">
        <div className="flex justify-center items-center mb-2">
             <h1 className="text-lg font-extrabold text-gray-900 tracking-wide">Discover</h1>
        </div>
        <div className="bg-gray-100 p-1 rounded-full flex items-center mb-3 w-full">
            <button 
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all text-center ${activeTab === 'exchange' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                onClick={() => setActiveTab('exchange')}
            >
                Exchange
            </button>
            <button 
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all text-center ${activeTab === 'marketplace' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                onClick={() => setActiveTab('marketplace')}
            >
                Marketplace
            </button>
        </div>
        
        <div className="flex justify-between items-center w-full pb-1 relative">
            <div className="relative">
                <button onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-700 shadow-sm active:bg-gray-50">
                    <Filter size={12} />
                    <span>{selectedCategory}</span>
                </button>
                <AnimatePresence>
                    {showCategoryDropdown && (
                        <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-30">
                            {CATEGORY_OPTIONS.map(cat => (
                                <button key={cat} onClick={() => handleCategorySelect(cat)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg">{cat}</button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
             <div className="relative">
                 <button onClick={() => setShowLocationDropdown(!showLocationDropdown)} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-700 shadow-sm active:bg-gray-50">
                    <MapPin size={12} className="text-brand" />
                    <span>{selectedLocation}</span>
                </button>
                 <AnimatePresence>
                    {showLocationDropdown && (
                        <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}} className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-30">
                            {LOCATION_OPTIONS.map(loc => (
                                <button key={loc} onClick={() => handleLocationSelect(loc)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg">{loc}</button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </div>

      {/* CARD STACK */}
      <div className="flex-1 relative flex flex-col items-center pt-1 px-4 overflow-hidden w-full">
        <div className="relative w-full h-[65vh] md:h-[68vh]">
            {!currentItem && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-0">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Flame size={40} className="text-gray-300" /></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">You're all caught up!</h3>
                    <p className="text-gray-500 mb-6">Check back later for more items.</p>
                    <button onClick={resetStack} className="flex items-center space-x-2 px-6 py-3 bg-brand text-white rounded-full font-bold shadow-lg active:scale-95 transition-transform"><RefreshCw size={20} /><span>Start Over</span></button>
                </div>
            )}
            
            {nextItem && (
                <div className="absolute inset-0 w-full h-full bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden flex flex-col scale-[0.96] translate-y-3 opacity-60 z-0 pointer-events-none">
                    <CardContent item={nextItem} />
                </div>
            )}
            
            {currentItem && (
                <motion.div 
                    key={currentItem.id} 
                    className="absolute inset-0 w-full h-full bg-white rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.08)] z-10 overflow-hidden border border-gray-100 flex flex-col cursor-grab active:cursor-grabbing origin-bottom" 
                    style={{ x, rotate, opacity }} 
                    animate={controls} 
                    drag="x" 
                    dragConstraints={{ left: 0, right: 0 }} 
                    dragElastic={0.7} 
                    onDragEnd={handleDragEnd} 
                    whileTap={{ scale: 1.005 }}
                >
                    <CardContent 
                        item={currentItem} 
                        onInfoClick={() => onItemClick(currentItem)} 
                    />
                </motion.div>
            )}
        </div>
        
        {/* SWIPE BUTTONS */}
        <div className="absolute bottom-2 flex justify-center space-x-8 z-30 w-full pointer-events-none">
             <button onClick={() => currentItem && swipe('left')} disabled={!currentItem} className="pointer-events-auto w-14 h-14 rounded-full bg-white border border-red-100 shadow-[0_8px_20px_rgba(239,68,68,0.15)] flex items-center justify-center text-red-500 active:scale-95 transition-transform hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:scale-100"><X size={28} strokeWidth={2.5} /></button>
             <button onClick={() => currentItem && handleRightSwipe()} disabled={!currentItem} className="pointer-events-auto w-14 h-14 rounded-full bg-white border border-green-100 shadow-[0_8px_20px_rgba(34,197,94,0.15)] flex items-center justify-center text-green-500 active:scale-95 transition-transform hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:scale-100"><Check size={28} strokeWidth={3} /></button>
        </div>
      </div>

      {/* MODALS OVERLAY */}
      <AnimatePresence>
        {/* BARTER OFFER MODAL */}
        {showOfferModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-white w-full rounded-t-3xl overflow-hidden max-h-[85vh] flex flex-col shadow-2xl">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <div>
                            <h3 className="font-extrabold text-xl text-gray-900">Make an Offer</h3>
                            <p className="text-sm text-gray-500">Select an item to exchange</p>
                        </div>
                        <button 
                            onClick={() => setShowOfferModal(false)} 
                            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* TARGET ITEM CONTEXT - Added as requested */}
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
                             <button key={item.id} onClick={completeRightSwipe} className="w-full flex items-center p-3 rounded-2xl border border-gray-100 hover:border-brand hover:bg-brand/5 transition-all group text-left">
                                 <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden shrink-0"><img src={item.image} className="w-full h-full object-cover" /></div>
                                 <div className="ml-4 flex-1">
                                     <h4 className="font-bold text-gray-900 group-hover:text-brand transition-colors">{item.title}</h4>
                                     <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
                                 </div>
                                 <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-brand group-hover:border-brand group-hover:text-white transition-all"><Check size={16} /></div>
                             </button>
                         ))}
                    </div>
                </motion.div>
            </motion.div>
        )}

        {/* MARKETPLACE INTERACTION MODAL */}
        {showMarketplaceModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><Check size={32} strokeWidth={3} /></div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Interested?</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">You liked <strong>{currentItem?.title}</strong>. What would you like to do next?</p>
                    <div className="space-y-3">
                        <Button fullWidth onClick={completeRightSwipe}>Chat with Seller</Button>
                        <button onClick={completeRightSwipe} className="w-full py-3.5 rounded-full font-bold text-gray-500 hover:bg-gray-50 transition-colors">Keep Swiping</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Internal Component for Card Content
const CardContent: React.FC<{ item: SwipeItem; onInfoClick?: () => void }> = ({ item, onInfoClick }) => {
    const isMarketplace = item.type === 'marketplace';
    
    return (
        <>
            <div className="h-[60%] bg-gray-100 relative shrink-0">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                {/* INFO BUTTON */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onInfoClick && onInfoClick();
                    }}
                    className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg active:scale-90 border border-white/30 z-20 cursor-pointer hover:bg-white/30"
                >
                    <Info size={18} />
                </button>

                <div className="absolute bottom-3 left-4 right-4">
                     <div className="flex flex-col items-start gap-1">
                         {isMarketplace ? (
                            <span className="bg-yellow-400 text-black border border-yellow-300/50 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm mb-1 whitespace-nowrap shrink-0">₦{item.price}</span>
                         ) : (
                            <span className="bg-green-500 text-white border border-green-400/50 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide shadow-sm mb-1 whitespace-nowrap shrink-0">{item.condition}</span>
                         )}
                         <h2 className="text-2xl font-extrabold text-white leading-tight drop-shadow-md pr-2 line-clamp-2">{item.title}</h2>
                    </div>
                </div>
            </div>
            <div className="p-4 flex flex-col flex-1 bg-white relative overflow-y-auto pb-20">
                <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-snug font-medium select-none">{item.description}</p>
                
                {isMarketplace ? (
                    <div className="bg-green-50 rounded-lg px-3 py-2 mb-3 flex items-center border border-green-100 select-none">
                        <span className="text-green-700 text-xs truncate font-bold">Available for Purchase</span>
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3 flex items-center border border-gray-100 select-none">
                        <span className="text-gray-500 text-xs truncate">Looking for: <span className="font-bold text-gray-900 ml-1">{item.lookingFor}</span></span>
                    </div>
                )}
                
                <div className="flex-grow"></div>
                <div className="h-px bg-gray-50 w-full my-1.5"></div>
                <div className="flex items-center pt-1.5">
                    <div className="w-9 h-9 rounded-full bg-gray-200 mr-3 overflow-hidden shrink-0 border"><img src={item.owner.image} alt={item.owner.name} className="w-full h-full object-cover" /></div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">{item.owner.name}</h3>
                        <div className="flex items-center text-gray-400 text-xs font-medium mt-0.5">
                            <MapPin size={10} className="mr-1" />
                            <span>{item.owner.location}</span>
                            <span className="mx-1.5 text-gray-300">•</span>
                            <MapPin size={10} className="mr-0.5 text-brand" />
                            <span className="text-brand font-bold">{item.owner.distance} away</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
