
import React, { useState, useEffect } from 'react';
import { X, Heart, MapPin, Filter, Info, Check, RefreshCw, Flame } from 'lucide-react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { LoginPromptModal } from './LoginPromptModal';
import { SwipeItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

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

interface Category {
  id: number;
  name: string;
  order: number;
}

interface Location {
  id: number;
  name: string;
  order: number;
}

interface SwipeScreenProps {
  onBack: () => void;
  onItemClick: (item: SwipeItem) => void;
  onLoginRequest?: (method: 'phone_otp' | 'google' | 'email') => void;
}

export const SwipeScreen: React.FC<SwipeScreenProps> = ({ onBack, onItemClick, onLoginRequest }) => {
  const { token, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'Shop' | 'Services' | 'Swap'>('Shop');
  const [items, setItems] = useState<SwipeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // Dropdowns
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLocation, setSelectedLocation] = useState('all');
  
  // Categories and Locations from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Fetch categories and locations from API
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoadingFilters(true);
        const [categoriesRes, locationsRes] = await Promise.all([
          apiFetch(ENDPOINTS.categories),
          apiFetch(ENDPOINTS.locations),
        ]);
        
        const cats = (categoriesRes.categories || []) as Category[];
        const locs = (locationsRes.locations || []) as Location[];
        
        setCategories(cats);
        setLocations(locs);
      } catch (error) {
        console.error('Failed to fetch categories/locations:', error);
        // Fallback to empty arrays - will show "All Categories" and "all" as defaults
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilters();
  }, []);

  // Fetch items from API - works with or without authentication
  useEffect(() => {
    const fetchItems = async () => {
      // Services tab is coming soon - show empty state
      if (activeTab === 'Services') {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Build query parameters
        const params: string[] = [];
        
        // Add type parameter based on active tab
        // Map: Shop -> marketplace, Swap -> barter
        // Services is coming soon, so skip fetching
        let itemType = 'marketplace';
        if (activeTab === 'Swap') {
          itemType = 'barter';
        }
        params.push(`type=${encodeURIComponent(itemType)}`);
        
        // Add category filter if not "All Categories"
        if (selectedCategory && selectedCategory !== 'All Categories') {
          params.push(`category=${encodeURIComponent(selectedCategory)}`);
        }
        
        // Add city filter
        if (selectedLocation && selectedLocation !== 'all') {
          params.push(`city=${encodeURIComponent(selectedLocation)}`);
        } else if (selectedLocation === 'all') {
          params.push('city=all');
        }
        
        // Build feed URL with query parameters
        let feedUrl = ENDPOINTS.items.feed;
        if (params.length > 0) {
          feedUrl += `?${params.join('&')}`;
        }
        
        // Fetch items - token is optional (for browsing without login)
        const res = await apiFetch(feedUrl, { token: token || undefined });
        
        const apiItems = res.items || res.data || [];
        
        console.log(`[SwipeScreen] Fetched ${apiItems.length} items for ${activeTab} tab`, {
          type: itemType,
          category: selectedCategory,
          location: selectedLocation,
          items: apiItems.length,
        });
        
        // Transform API items to SwipeItem format
        const transformedItems: SwipeItem[] = apiItems.map((item: any) => ({
          id: item.id,
          type: item.type || (item.price ? 'marketplace' : 'barter'),
          title: item.title || item.name || 'Untitled Item',
          condition: item.condition || 'Used',
          image: item.images?.[0] || item.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="800"%3E%3Crect fill="%23f3f4f6" width="800" height="800"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E',
          description: item.description || '',
          lookingFor: item.looking_for || item.lookingFor || '',
          price: item.price ? (typeof item.price === 'string' ? `₦${item.price}` : `₦${item.price}`) : undefined,
          owner: {
            name: item.user?.username || item.owner?.name || 'Unknown',
            image: item.user?.profile_photo || item.owner?.image || 'https://i.pravatar.cc/150',
            // Use item.city (where the item is located) instead of user.city (user's current location)
            location: item.city || item.user?.city || item.owner?.location || 'Unknown',
            distance: (() => {
              // Check distance_km first, then distance, then owner.distance
              const distanceKm = item.distance_km ?? item.distance;
              if (distanceKm !== null && distanceKm !== undefined) {
                return distanceKm < 1 
                  ? `${Math.round(distanceKm * 1000)}m` 
                  : `${distanceKm}km`;
              }
              // Fallback to formatted distance from owner object
              if (item.owner?.distance) {
                return item.owner.distance;
              }
              return 'Unknown';
            })(),
          },
          gallery: item.images || item.gallery || [item.image].filter(Boolean),
        }));

        setItems(transformedItems.length > 0 ? transformedItems : []);
        setCurrentIndex(0); // Reset to first item when items change
      } catch (error: any) {
        // Handle 401 - token is invalid, but don't clear auth state if no token was provided
        if (error.message && (error.message.includes('Unauthenticated') || error.message.includes('Unauthorized'))) {
          if (token) {
            // Token was provided but is invalid - this will be handled by apiFetch
            console.log('[SwipeScreen] Token invalid, will be cleared by apiFetch');
          }
          // For unauthenticated users, 401 shouldn't happen now (endpoint is public)
          // But handle gracefully just in case
          setItems([]);
        } else {
          console.error('Failed to fetch items:', error);
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [activeTab, selectedCategory, selectedLocation, token]);
  
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

  // Check if action requires login
  const requiresLogin = (action: string): boolean => {
    if (isAuthenticated) return false;
    const loginRequiredActions = [
      'swipe_right',
      'buy_request',
      'book_artisan',
      'swap_request',
      'send_message',
      'upload_item',
      'view_matches'
    ];
    return loginRequiredActions.includes(action);
  };

  // INTERCEPTOR: Handle Right Swipe to show modals
  const handleRightSwipe = () => {
    // Check if login is required
    if (requiresLogin('swipe_right')) {
      setShowLoginPrompt(true);
      controls.start({ x: 0, opacity: 1, rotate: 0 });
      return;
    }

    // Reset the card position so it stays visible behind the modal
    controls.start({ x: 0, opacity: 1, rotate: 0 });

    if (activeTab === 'Swap') {
      setShowOfferModal(true);
    } else if (activeTab === 'Shop') {
      setShowMarketplaceModal(true);
    } else if (activeTab === 'Services') {
      // Services: book artisan action
      if (requiresLogin('book_artisan')) {
        setShowLoginPrompt(true);
      } else {
        setShowMarketplaceModal(true); // Or create a specific booking modal
      }
    }
  };

  const handleLoginMethod = (method: 'phone_otp' | 'google' | 'email') => {
    setShowLoginPrompt(false);
    if (onLoginRequest) {
      onLoginRequest(method);
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
  };
  
  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false);
  };
  
  // Build category options list (with "All Categories" first)
  const categoryOptions = ['All Categories', ...categories.map(cat => cat.name)];
  
  // Build location options list (with "All Locations" first)
  const locationOptions = ['all', ...locations.map(loc => loc.name)];

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* HEADER & FILTERS */}
      <div className="px-6 pb-1 bg-white z-20 shrink-0 app-header-safe">
        <div className="flex justify-center items-center mb-2 pt-1">
             <h1 className="text-lg font-extrabold text-gray-900 tracking-wide">Discover</h1>
        </div>
        <div className="bg-gray-100 p-1 rounded-full flex items-center mb-3 w-full">
            <button 
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all text-center ${activeTab === 'Shop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                onClick={() => setActiveTab('Shop')}
            >
                Shop
            </button>
            <button 
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all text-center ${activeTab === 'Services' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                onClick={() => setActiveTab('Services')}
            >
                Services
            </button>
            <button 
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all text-center ${activeTab === 'Swap' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                onClick={() => setActiveTab('Swap')}
            >
                Swap
            </button>
        </div>
        
        <div className="flex justify-between items-center w-full pb-1 relative">
            <div className="relative">
                <button 
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} 
                    disabled={loadingFilters}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-700 shadow-sm active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Filter size={12} />
                    <span>{selectedCategory}</span>
                </button>
                <AnimatePresence>
                    {showCategoryDropdown && !loadingFilters && (
                        <motion.div 
                            initial={{opacity: 0, y: -10}} 
                            animate={{opacity: 1, y: 0}} 
                            exit={{opacity: 0, y: -10}} 
                            className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-30 max-h-60 overflow-y-auto"
                        >
                            {categoryOptions.map(cat => (
                                <button 
                                    key={cat} 
                                    onClick={() => handleCategorySelect(cat)} 
                                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                                        selectedCategory === cat ? 'bg-brand/10 text-brand font-bold' : 'text-gray-700'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="relative">
                <button 
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)} 
                    disabled={loadingFilters}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-700 shadow-sm active:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <MapPin size={12} className="text-brand" />
                    <span>{selectedLocation === 'all' ? 'All Locations' : selectedLocation}</span>
                </button>
                <AnimatePresence>
                    {showLocationDropdown && !loadingFilters && (
                        <motion.div 
                            initial={{opacity: 0, y: -10}} 
                            animate={{opacity: 1, y: 0}} 
                            exit={{opacity: 0, y: -10}} 
                            className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-30 max-h-60 overflow-y-auto"
                        >
                            {locationOptions.map(loc => (
                                <button 
                                    key={loc} 
                                    onClick={() => handleLocationSelect(loc)} 
                                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                                        selectedLocation === loc ? 'bg-brand/10 text-brand font-bold' : 'text-gray-700'
                                    }`}
                                >
                                    {loc === 'all' ? 'All Locations' : loc}
                                </button>
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
                    {activeTab === 'Services' ? (
                        <>
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Flame size={40} className="text-gray-300" /></div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Coming Soon</h3>
                            <p className="text-gray-500 mb-6">Services feature is under development. Check back soon!</p>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4"><Flame size={40} className="text-gray-300" /></div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">You're all caught up!</h3>
                            <p className="text-gray-500 mb-6">Check back later for more items.</p>
                            <button onClick={resetStack} className="flex items-center space-x-2 px-6 py-3 bg-brand text-white rounded-full font-bold shadow-lg active:scale-95 transition-transform"><RefreshCw size={20} /><span>Start Over</span></button>
                        </>
                    )}
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

      {/* LOGIN PROMPT MODAL */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={handleLoginMethod}
      />

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
