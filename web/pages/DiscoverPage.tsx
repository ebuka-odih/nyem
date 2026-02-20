import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, RotateCcw, MapPin, Zap, Star } from 'lucide-react';
import { Product, Vendor } from '../types';
import { fetcher } from '../hooks/api/fetcher';
import { SwipeCard } from '../components/SwipeCard';
import { AdSwipeCard } from '../components/AdSwipeCard';
import { WelcomeCard } from '../components/WelcomeCard';
import { ProductDetailModal } from '../components/modals/ProductDetailModal';
import { WishlistModal } from '../components/modals/WishlistModal';
import { FilterModal } from '../components/modals/FilterModal';
import { LocationModal } from '../components/modals/LocationModal';
import { useItems } from '../hooks/useItems';
import { useWishlist } from '../hooks/useWishlist';
import { createAdItem, sendNativeNotification, transformListingToProduct } from '../utils/productTransformers';
import { getStoredToken } from '../utils/api';
import { useCreateSwipe, useTrackView, useTrackShare } from '../hooks/api/useListings';
import { ENDPOINTS } from '../constants/endpoints';
import { DiscoverTab } from '../constants/discoverTabs';

interface DiscoverPageProps {
  activeTab: DiscoverTab;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  currentCity: string;
  setCurrentCity: (city: string) => void;
  cities: Array<{ id: number; name: string }>;
  likedItems: Product[];
  onWishlistClick: () => void;
  onNavigateToUpload: () => void;
  hasValidToken: boolean;
  onLogin: () => void;
  triggerDir: 'left' | 'right' | 'up' | null;
  setTriggerDir: (dir: 'left' | 'right' | 'up' | null) => void;
  showFilterDialog: boolean;
  setShowFilterDialog: (show: boolean) => void;
  showLocationDialog: boolean;
  setShowLocationDialog: (show: boolean) => void;
  showWishlist: boolean;
  setShowWishlist: (show: boolean) => void;
  onItemsChange?: (items: Product[], history: Product[], undoLast: () => void) => void;
  onModalStateChange?: (hasOpenModal: boolean) => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({
  activeTab,
  activeCategory,
  setActiveCategory,
  currentCity,
  setCurrentCity,
  cities,
  likedItems,
  onWishlistClick,
  onNavigateToUpload,
  hasValidToken,
  onLogin,
  triggerDir,
  setTriggerDir,
  showFilterDialog,
  setShowFilterDialog,
  showLocationDialog,
  setShowLocationDialog,
  showWishlist,
  setShowWishlist,
  onItemsChange,
  onModalStateChange
}) => {
  const isShopTab = activeTab === 'marketplace';
  const {
    items,
    history,
    loadingItems,
    fetchItems,
    undoLast,
    removeItem
  } = useItems(activeTab, activeCategory, currentCity);

  const { fetchWishlist, removeFromWishlist } = useWishlist();
  const trackViewMutation = useTrackView();
  const trackShareMutation = useTrackShare();
  const trackedViews = useRef<Set<string | number>>(new Set());

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const navigate = useNavigate();

  // Track view when details are opened
  useEffect(() => {
    if (selectedProduct && !selectedProduct.isAd && !selectedProduct.isWelcome) {
      if (!trackedViews.current.has(selectedProduct.id)) {
        trackViewMutation.mutate(selectedProduct.id);
        trackedViews.current.add(selectedProduct.id);
      }
    }
  }, [selectedProduct, trackViewMutation]);

  // Track view for the top stack item
  useEffect(() => {
    const activeItem = items[items.length - 1];
    if (activeItem && !activeItem.isAd && !activeItem.isWelcome) {
      if (!trackedViews.current.has(activeItem.id)) {
        // Delay view tracking for cards in stack to ensure they aren't just swiping past
        const timer = setTimeout(() => {
          trackViewMutation.mutate(activeItem.id);
          trackedViews.current.add(activeItem.id);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [items, trackViewMutation]);

  const [showSellerToast, setShowSellerToast] = useState(false);
  const [lastSparkedItem, setLastSparkedItem] = useState<Product | null>(null);
  const notifiedItems = useRef<Set<string | number>>(new Set());

  const createSwipeMutation = useCreateSwipe();

  // Expose items and history to parent component
  useEffect(() => {
    if (onItemsChange) {
      onItemsChange(items, history, undoLast);
    }
  }, [items, history, undoLast, onItemsChange]);

  // Expose modal state to parent component
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(!!selectedProduct);
    }
  }, [selectedProduct, onModalStateChange]);

  // Fetch items when discover page is active and filters change
  // Only fetch if we don't have items (i.e., no restored state)
  useEffect(() => {
    if (items.length === 0) {
      fetchItems();
    }
  }, [fetchItems, items.length]);

  // Fetch wishlist when authenticated
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      fetchWishlist();
    }
  }, [fetchWishlist]);

  // Deep linking handling
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const itemId = params.get('item');

    if (itemId) {
      const fetchSharedItem = async () => {
        try {
          // Check if item is already in current stack to avoid fetch
          const existingItem = items.find(i => String(i.id) === String(itemId));
          if (existingItem) {
            setSelectedProduct(existingItem);
          } else {
            // Fetch single item
            const data = await fetcher<any>(ENDPOINTS.items.show(itemId));
            if (data && data.data) {
              const product = transformListingToProduct(data.data);
              setSelectedProduct(product);
            }
          }
        } catch (e) {
          console.error("Failed to load shared item", e);
        }
      };
      fetchSharedItem();
    }
  }, [location.search, items]);

  const activeIndex = items.length - 1;

  const handleSwipe = useCallback(async (direction: 'left' | 'right' | 'up', productOverride?: Product) => {
    const swipedItem = productOverride || items[activeIndex];
    if (!swipedItem) return;

    // Use removeItem to handle state updates including ad injection
    const finalizeSwipe = () => {
      removeItem(swipedItem);
      setTriggerDir(null);
    };

    // If it's an ad card or welcome card, just remove it
    if (swipedItem.isAd || swipedItem.isWelcome) {
      finalizeSwipe();
      return;
    }

    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('auth_token') !== null;

    // Allow left swipe (pass) for everyone
    if (direction === 'left') {
      finalizeSwipe();
      return;
    }

    // Require authentication for right (like) and up (super interest) swipes
    if (!isAuthenticated) {
      onLogin();
      setTriggerDir(null);
      return;
    }

    const isBarterLike = activeTab === 'barter' && direction === 'right';
    const swipeDirection = (direction === 'up' || isBarterLike) ? 'up' : 'right';

    // Send swipe to backend API
    if (direction === 'right' || direction === 'up') {
      try {
        await createSwipeMutation.mutateAsync({
          target_listing_id: swipedItem.id,
          direction: swipeDirection,
        });
      } catch (err) {
        console.error('Failed to send swipe:', err);
      }
    }

    if (swipeDirection === 'up') {
      setLastSparkedItem(swipedItem);
      setShowSellerToast(true);

      // Send optimistic native notification (one-time per item session)
      if (!notifiedItems.current.has(swipedItem.id)) {
        sendNativeNotification(
          "Request Sent!",
          `You've sent a Super Interest for "${swipedItem.name}".`,
          swipedItem.images[0]
        );
        notifiedItems.current.add(swipedItem.id);
      }

      setTimeout(() => setShowSellerToast(false), 3500);

      // Refresh wishlist
      setTimeout(() => fetchWishlist(), 500);
    }

    finalizeSwipe();
  }, [items, activeIndex, removeItem, fetchWishlist, onLogin, setTriggerDir, activeTab]);

  // Handle triggerDir changes from parent
  // FIXED: Removed this useEffect because SwipeCard handles the animation and then calls onSwipe (which calls handleSwipe).
  // Calling it here causes the item to be removed immediately before animation completes, causing "bounce back".
  /*
  useEffect(() => {
    if (triggerDir && items.length > 0 && activeIndex >= 0) {
      const swipedItem = items[activeIndex];
      if (swipedItem) {
        handleSwipe(triggerDir);
      }
    }
  }, [triggerDir]);
  */

  const handleShare = async (product: Product | null = null) => {
    const itemToShare = product || items[activeIndex] || selectedProduct;
    if (!itemToShare) return;

    // Track share count
    if (!itemToShare.isAd && !itemToShare.isWelcome) {
      trackShareMutation.mutate(itemToShare.id);
    }

    // Generate a shareable link that opens the item
    const deepLink = `${window.location.origin}/discover?item=${itemToShare.id}`;

    window.focus();

    if (navigator.share) {
      try {
        await navigator.share({
          title: itemToShare.name,
          text: `Check out this ${itemToShare.name} on Nyem! It's going for ${itemToShare.price}.`,
          url: deepLink
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(deepLink);
      alert('Item link copied to clipboard!');
    } catch (err) {
      const dummy = document.createElement("input");
      document.body.appendChild(dummy);
      dummy.value = deepLink;
      dummy.select();
      document.execCommand("copy");
      document.body.removeChild(dummy);
      alert('Item link copied!');
    }
  };

  const refreshDrops = () => {
    if (activeCategory === "All" && currentCity === "All Locations") {
      fetchItems();
    } else {
      setActiveCategory("All");
      setCurrentCity("All Locations");
    }
  };

  const openSellerProfile = (vendor: Vendor) => {
    const sellerId = vendor.id || (vendor as any).userId;
    if (sellerId) {
      navigate(`/seller/${sellerId}`);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center pt-0 pb-2 shrink-0">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-neutral-100 shadow-sm mb-1">
          <MapPin size={10} className="text-[#830e4c]" />
          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
            Discovery in <span className="text-[#830e4c] font-black italic">{currentCity}</span>
            {activeCategory !== 'All' && (
              <>
                <span className="mx-1 text-neutral-300">•</span>
                <span className="text-[#830e4c] font-black italic">{activeCategory}</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="relative flex-1 w-full mt-1 mb-[2px]">
        <AnimatePresence mode="popLayout">
          {loadingItems ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6 border border-neutral-100 shadow-inner animate-pulse">
                <Compass size={32} className="text-[#830e4c]" />
              </div>
              <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">
                {isShopTab ? 'Loading shop drops...' : 'Loading barter offers...'}
              </h3>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mt-2">
                {isShopTab ? 'Discovering local deals' : 'Discovering nearby swaps'}
              </p>
            </motion.div>
          ) : items.length > 0 ? (
            items.slice(-4).map((product: Product, idx: number, arr: Product[]) => {
              const activeVisibleIndex = arr.length - 1;
              return product.isWelcome ? (
                <WelcomeCard
                  key={product.id}
                  index={activeVisibleIndex - idx}
                  isTop={idx === activeVisibleIndex}
                  onSwipe={handleSwipe}
                  triggerDirection={idx === activeVisibleIndex ? triggerDir : null}
                />
              ) : product.isAd ? (
                <AdSwipeCard
                  key={product.id}
                  index={activeVisibleIndex - idx}
                  isTop={idx === activeVisibleIndex}
                  onSwipe={handleSwipe}
                  onAction={onNavigateToUpload}
                  triggerDirection={idx === activeVisibleIndex ? triggerDir : null}
                />
              ) : (
                <SwipeCard
                  key={product.id}
                  product={product}
                  index={activeVisibleIndex - idx}
                  isTop={idx === activeVisibleIndex}
                  onSwipe={handleSwipe}
                  triggerDirection={idx === activeVisibleIndex ? triggerDir : null}
                  onShowDetail={(p) => { setSelectedProduct(p); }}
                />
              );
            })
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center px-8">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6 border border-neutral-100 shadow-inner">
                <RotateCcw size={32} className="text-neutral-300" />
              </div>
              <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">End of the line</h3>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mt-2 mb-8">
                {isShopTab ? 'No more shop drops right now' : 'No more barter offers right now'}
              </p>
              <button onClick={refreshDrops} className="px-10 py-5 bg-[#830e4c] hover:bg-[#830e4c]/90 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all">
                Refresh Feed
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onShare={handleShare}
        onSellerClick={openSellerProfile}
        onSendRequest={() => {
          if (selectedProduct) {
            handleSwipe('up', selectedProduct);
            setSelectedProduct(null);
          }
        }}
        hasValidToken={hasValidToken}
        onLogin={onLogin}
      />

      <WishlistModal
        isOpen={showWishlist}
        onClose={() => setShowWishlist(false)}
        likedItems={likedItems}
        onItemClick={(item) => {
          setShowWishlist(false);
          setSelectedProduct(item);
        }}
        onRemove={removeFromWishlist}
      />

      <FilterModal
        isOpen={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        activeCategory={activeCategory}
        onCategorySelect={(category) => {
          setActiveCategory(category);
          setShowFilterDialog(false);
        }}
        activeTab={activeTab}
      />

      <LocationModal
        isOpen={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        currentCity={currentCity}
        cities={cities}
        onCitySelect={(city) => {
          setCurrentCity(city);
          setShowLocationDialog(false);
        }}
      />

      <AnimatePresence>
        {showSellerToast && lastSparkedItem && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 40, x: '-50%', scale: 0.9 }}
            className="fixed bottom-36 left-1/2 -translate-x-1/2 w-[85%] max-w-[340px] bg-[#830e4c] px-5 py-4 rounded-[2.5rem] flex items-center gap-4 z-[200] shadow-[0_25px_60px_-12px_rgba(131,14,76,0.3)] border border-white/10"
          >
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 border border-white/20">
              <img src={lastSparkedItem.images[0]} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <Star size={12} className="text-white" fill="currentColor" strokeWidth={0} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 leading-none">Super Interest Sent</span>
              </div>
              <span className="text-[11px] font-black uppercase tracking-tight text-white truncate">
                {lastSparkedItem.name}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
