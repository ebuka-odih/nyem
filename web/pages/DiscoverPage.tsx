import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, RotateCcw, MapPin, Zap } from 'lucide-react';
import { Product, Vendor } from '../types';
import { SwipeCard } from '../components/SwipeCard';
import { AdSwipeCard } from '../components/AdSwipeCard';
import { WelcomeCard } from '../components/WelcomeCard';
import { SwipeControls } from '../components/SwipeControls';
import { SellerProfileView } from '../components/SellerProfileView';
import { ComingSoonState } from '../components/ComingSoonState';
import { ProductDetailModal } from '../components/modals/ProductDetailModal';
import { WishlistModal } from '../components/modals/WishlistModal';
import { FilterModal } from '../components/modals/FilterModal';
import { LocationModal } from '../components/modals/LocationModal';
import { Modal } from '../components/Modal';
import { useItems } from '../hooks/useItems';
import { useWishlist } from '../hooks/useWishlist';
import { createAdItem, sendNativeNotification } from '../utils/productTransformers';
import { getStoredToken, apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

interface DiscoverPageProps {
  activeTab: 'marketplace' | 'services' | 'barter';
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
  const {
    items,
    history,
    loadingItems,
    fetchItems,
    undoLast,
    removeItem
  } = useItems(activeTab, activeCategory, currentCity);

  const { fetchWishlist, removeFromWishlist } = useWishlist();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewingSeller, setViewingSeller] = useState<Vendor | null>(null);
  const [showSellerToast, setShowSellerToast] = useState(false);
  const [lastSparkedItem, setLastSparkedItem] = useState<Product | null>(null);

  // Expose items and history to parent component
  useEffect(() => {
    if (onItemsChange) {
      onItemsChange(items, history, undoLast);
    }
  }, [items, history, undoLast, onItemsChange]);

  // Expose modal state to parent component
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(!!selectedProduct || !!viewingSeller);
    }
  }, [selectedProduct, viewingSeller, onModalStateChange]);

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

  const activeIndex = items.length - 1;

  const handleSwipe = useCallback(async (direction: 'left' | 'right' | 'up') => {
    const swipedItem = items[activeIndex];
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

    // Send swipe to backend API
    if (direction === 'right' || direction === 'up') {
      try {
        const token = getStoredToken();
        if (token) {
          await apiFetch(ENDPOINTS.swipes.create, {
            method: 'POST',
            token,
            body: {
              target_listing_id: swipedItem.id,
              direction: direction === 'up' ? 'up' : 'right',
            },
          });
        }
      } catch (err) {
        console.error('Failed to send swipe:', err);
      }
    }

    if (direction === 'up') {
      setLastSparkedItem(swipedItem);
      setShowSellerToast(true);
      sendNativeNotification(
        "New Super Interest!",
        `A buyer is highly interested in your "${swipedItem.name}". Open Nyem to chat!`,
        swipedItem.images[0]
      );
      setTimeout(() => setShowSellerToast(false), 3500);

      // Refresh wishlist
      setTimeout(() => fetchWishlist(), 500);
    }

    finalizeSwipe();
  }, [items, activeIndex, removeItem, fetchWishlist, onLogin, setTriggerDir]);

  // Handle triggerDir changes from parent
  useEffect(() => {
    if (triggerDir && items.length > 0 && activeIndex >= 0) {
      const swipedItem = items[activeIndex];
      if (swipedItem) {
        handleSwipe(triggerDir);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerDir]);

  const handleShare = async (product: Product | null = null) => {
    const itemToShare = product || items[activeIndex] || selectedProduct;
    if (!itemToShare) return;

    const deepLink = `https://nyem.app/item/${itemToShare.id}`;

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
    setViewingSeller(vendor);
  };

  return (
    <>
      <div className="flex items-center justify-center pt-0 pb-2 shrink-0">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-full border border-neutral-100 shadow-sm mb-1">
          <MapPin size={10} className="text-[#830e4c]" />
          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
            Discovery in <span className="text-[#830e4c] font-black italic">{currentCity}</span>
          </span>
        </div>
      </div>

      <div className="relative flex-1 w-full mt-1 mb-[2px]">
        <AnimatePresence mode="popLayout">
          {activeTab === 'marketplace' ? (
            loadingItems ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6 border border-neutral-100 shadow-inner animate-pulse">
                  <Compass size={32} className="text-[#830e4c]" />
                </div>
                <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">Loading drops...</h3>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mt-2">Discovering amazing items</p>
              </motion.div>
            ) : items.length > 0 ? (
              items.map((product: Product, idx: number) => (
                product.isWelcome ? (
                  <WelcomeCard
                    key={product.id}
                    index={activeIndex - idx}
                    isTop={idx === activeIndex}
                    onSwipe={handleSwipe}
                    triggerDirection={idx === activeIndex ? triggerDir : null}
                  />
                ) : product.isAd ? (
                  <AdSwipeCard
                    key={product.id}
                    index={activeIndex - idx}
                    isTop={idx === activeIndex}
                    onSwipe={handleSwipe}
                    onAction={onNavigateToUpload}
                    triggerDirection={idx === activeIndex ? triggerDir : null}
                  />
                ) : (
                  <SwipeCard
                    key={`${product.id}-${items.length}`}
                    product={product}
                    index={activeIndex - idx}
                    isTop={idx === activeIndex}
                    onSwipe={handleSwipe}
                    triggerDirection={idx === activeIndex ? triggerDir : null}
                    onShowDetail={(p) => { setSelectedProduct(p); }}
                  />
                )
              ))
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6 border border-neutral-100 shadow-inner">
                  <RotateCcw size={32} className="text-neutral-300" />
                </div>
                <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">End of the line</h3>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mt-2 mb-8">No more drops to show right now</p>
                <button onClick={refreshDrops} className="px-10 py-5 bg-[#830e4c] hover:bg-[#830e4c]/90 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all">
                  Refresh Drops
                </button>
              </motion.div>
            )
          ) : (
            <div className="h-full flex items-center justify-center px-2">
              <ComingSoonState type={activeTab === 'services' ? 'services' : 'barter'} />
            </div>
          )}
        </AnimatePresence>
      </div>

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onShare={handleShare}
        onSellerClick={openSellerProfile}
        onSendRequest={() => {
          // TODO: Implement send request functionality for authenticated users
        }}
        hasValidToken={hasValidToken}
        onLogin={onLogin}
      />

      <Modal isOpen={!!viewingSeller} onClose={() => setViewingSeller(null)} title="Seller Profile" fullHeight showBack onBack={() => setViewingSeller(null)}>
        {viewingSeller && (
          <SellerProfileView
            vendor={viewingSeller}
            onClose={() => setViewingSeller(null)}
            onProductClick={(p) => {
              setViewingSeller(null);
              setSelectedProduct(p);
            }}
          />
        )}
      </Modal>

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
            className="fixed bottom-36 left-1/2 -translate-x-1/2 w-[85%] max-w-[340px] bg-white/20 backdrop-blur-[40px] px-5 py-4 rounded-[2.5rem] flex items-center gap-4 z-[200] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.12)] border border-white/40 ring-1 ring-black/5"
          >
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md flex-shrink-0 border border-white/50">
              <img src={lastSparkedItem.images[0]} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap size={10} className="text-[#29B3F0]" fill="currentColor" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#29B3F0] leading-none">Super Interest Sent!</span>
              </div>
              <span className="text-[11px] font-black uppercase tracking-tight text-neutral-900 truncate">
                Request sent for {lastSparkedItem.name}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

