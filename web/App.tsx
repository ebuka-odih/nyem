import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Compass,
  PlusCircle,
  MessageSquare,
  User,
  RotateCcw,
  Share2,
  Globe,
  MapPin,
  Check,
  ChevronRight,
  Zap,
  Trash2,
  Heart,
  Settings,
  Sparkles,
  BadgeCheck,
  Star,
  Info,
  SendHorizontal,
  ChevronLeft
} from 'lucide-react';
import { Product, Vendor } from './types';
import { CATEGORIES_DATA, NIGERIA_CITIES } from './data';
import { SwipeCard } from './components/SwipeCard';
import { SwipeControls } from './components/SwipeControls';
import { Modal } from './components/Modal';
import { UploadPage } from './pages/UploadPage';
import { MatchesPage } from './pages/MatchesPage';
import { ProfilePage } from './pages/ProfilePage';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OtpVerificationPage } from './pages/OtpVerificationPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ComingSoonState } from './components/ComingSoonState';
import { RatingStars } from './components/RatingStars';
import { SellerProfileView } from './components/SellerProfileView';
import { LoginPrompt } from './components/LoginPrompt';
import { LocationPermissionModal } from './components/LocationPermissionModal';
import { removeToken, getStoredToken, apiFetch } from './utils/api';
import { ENDPOINTS } from './constants/endpoints';

// New Layouts
import { AuthLayout } from './components/AuthLayout';
import { DiscoverLayout } from './components/DiscoverLayout';
import { GeneralLayout } from './components/GeneralLayout';
import { BottomNav } from './components/BottomNav';

type AuthState = 'welcome' | 'login' | 'register' | 'otp' | 'forgot' | 'authenticated' | 'discover';

const App = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [history, setHistory] = useState<Product[]>([]);
  const [likedItems, setLikedItems] = useState<Product[]>([]);
  const [showWishlist, setShowWishlist] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [viewingSeller, setViewingSeller] = useState<Vendor | null>(null);
  const [triggerDir, setTriggerDir] = useState<'left' | 'right' | 'up' | null>(null);
  const [showSellerToast, setShowSellerToast] = useState(false);
  const [lastSparkedItem, setLastSparkedItem] = useState<Product | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [currentCity, setCurrentCity] = useState("All Locations");
  const [cities, setCities] = useState<Array<{id: number; name: string}>>([]);
  const [categories, setCategories] = useState<Array<{id: number; name: string}>>([]);

  const [activeTab, setActiveTab] = useState<'marketplace' | 'services' | 'barter'>('marketplace');
  const [activePage, setActivePage] = useState<'discover' | 'upload' | 'matches' | 'profile'>('discover');

  // Initialize authState from localStorage synchronously to prevent showing login on refresh
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    // If we have both token and user, set to 'discover' (same as after login)
    // We'll validate the token in the background
    if (token && user) {
      return 'discover';
    }
    return 'welcome';
  });
  const [tempUserEmail, setTempUserEmail] = useState("");
  const [tempRegisterData, setTempRegisterData] = useState<{ name: string; password: string } | null>(null);
  const [forceProfileSettings, setForceProfileSettings] = useState(0);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationPermissionChecked, setLocationPermissionChecked] = useState(false);

  // Check location status and show modal if needed
  const checkLocationAndShowModal = async () => {
    if (locationPermissionChecked) return;

    const token = getStoredToken();
    if (!token) return;

    try {
      const { apiFetch } = await import('./utils/api');
      const response = await apiFetch<{ data?: { has_location?: boolean } }>(ENDPOINTS.location.status, { token });
      if (!response.data?.has_location) {
        setShowLocationModal(true);
      }
    } catch (err) {
      // If location status check fails, show modal anyway to be safe
      console.error('Failed to check location status:', err);
      setShowLocationModal(true);
    } finally {
      setLocationPermissionChecked(true);
    }
  };

  // Validate existing auth token on mount (runs in background)
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    if (token && user) {
      // Validate token by checking user profile
      const validateToken = async () => {
        try {
          const { apiFetch } = await import('./utils/api');
          const { ENDPOINTS } = await import('./constants/endpoints');
          const response = await apiFetch(ENDPOINTS.profile.me, { token });
          if (response.user || response.data?.user) {
            // Token is valid, ensure we're in discover state (same as after login)
            setAuthState('discover');
          } else {
            // Token invalid, clear it and redirect to welcome
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setAuthState('welcome');
          }
        } catch (error: any) {
          // Check if this is an authentication error (401, 403) vs server/network error
          const errorMessage = error?.message || String(error || '');
          
          // Explicitly check for authentication errors
          const isAuthError = 
            errorMessage.includes('401') || 
            errorMessage.includes('403') ||
            errorMessage.includes('Unauthorized') ||
            errorMessage.includes('Unauthenticated') ||
            errorMessage.includes('Invalid credentials');
          
          // Explicitly check for server errors (500, 502, 503, 504, etc.)
          const isServerError = 
            errorMessage.includes('500') ||
            errorMessage.includes('502') ||
            errorMessage.includes('503') ||
            errorMessage.includes('504') ||
            errorMessage.includes('Server error') ||
            errorMessage.includes('Internal Server Error') ||
            errorMessage.includes('Service temporarily unavailable');
          
          // Check if it's a network error (shouldn't clear token)
          const isNetworkError = 
            errorMessage.includes('Network error') ||
            errorMessage.includes('Cannot connect') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('Cannot reach API') ||
            error?.name === 'TypeError';
          
          // Only clear token on authentication errors, not server errors or network errors
          if (isAuthError && !isServerError && !isNetworkError) {
            // Token invalid, clear it and redirect to welcome
            console.warn('[App] Token validation failed (auth error), clearing auth state:', errorMessage);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setAuthState('welcome');
          } else {
            // Server error (500, 503, etc.) or network error - keep token, just log warning
            // The token might still be valid, it's just the server having issues or network problems
            const errorType = isServerError ? 'server error' : (isNetworkError ? 'network error' : 'unknown error');
            console.warn(`[App] Token validation failed (${errorType}), keeping auth state. Error:`, errorMessage);
            // Keep the user logged in - don't clear token or change auth state
            // The authState should remain 'discover' from the initial state
          }
        }
      };
      validateToken();
    } else {
      // No token found, ensure we're in welcome state
      // If we're in an authenticated state (discover or authenticated) but no token, reset to welcome
      if (authState === 'authenticated' || authState === 'discover') {
        setAuthState('welcome');
      }
    }
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Fetch cities and categories from backend on mount
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        // Fetch cities
        const citiesResponse = await apiFetch(ENDPOINTS.locationsCities);
        const citiesData = citiesResponse.data?.cities || citiesResponse.cities || [];
        setCities(citiesData);
        
        // Fetch categories (marketplace categories)
        const categoriesResponse = await apiFetch(`${ENDPOINTS.categories}?parent=Shop`);
        const categoriesData = categoriesResponse.categories || categoriesResponse.data?.categories || [];
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch filters:', error);
      }
    };
    
    fetchFilters();
  }, []);

  const sendNativeNotification = (title: string, body: string, icon?: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: icon || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=100'
      });
    }
  };

  // Transform API listing to Product type - matches ListingResource structure
  const transformListingToProduct = (listing: any): Product => {
    // Handle user/owner data (ListingResource provides both 'user' and 'owner')
    const user = listing.user || listing.owner || {};
    
    // Handle images - ListingResource provides 'images' array and 'gallery' array (both same)
    // Also check for 'image' (singular) as fallback
    let images: string[] = [];
    if (Array.isArray(listing.images) && listing.images.length > 0) {
      images = listing.images;
    } else if (Array.isArray(listing.gallery) && listing.gallery.length > 0) {
      images = listing.gallery;
    } else if (listing.image) {
      images = [listing.image];
    }
    
    // Format price - ListingResource formats price with commas for marketplace type
    let price = 'Price on request';
    if (listing.price) {
      // Price might already be formatted with commas from backend, or might be a number
      const priceValue = typeof listing.price === 'string' 
        ? listing.price.replace(/,/g, '') 
        : listing.price;
      // Format with commas for display
      const formattedPrice = typeof priceValue === 'number' 
        ? priceValue.toLocaleString('en-US')
        : priceValue;
      price = `₦${formattedPrice}`;
    } else if (listing.looking_for) {
      price = 'Trade';
    }

    // Format distance - ListingResource provides 'distance_km' and 'distance_display'
    let distance = 'Unknown';
    if (listing.distance_km !== null && listing.distance_km !== undefined) {
      if (listing.distance_km < 1) {
        distance = `${Math.round(listing.distance_km * 1000)}M`;
      } else {
        distance = `${listing.distance_km.toFixed(1)}KM`;
      }
    } else if (listing.distance_display) {
      distance = listing.distance_display.toUpperCase();
    }

    // Format vendor location - prioritize owner.location (formatted "Area, City") from ListingResource
    // Fallback to constructing from user.area and user.city if owner.location is not available
    const fullLocation = listing.owner?.location 
      ? listing.owner.location 
      : (user.area 
          ? `${user.area}, ${user.city || listing.city || 'Unknown'}` 
          : (user.city || listing.city || 'Unknown'));

    return {
      id: listing.id,
      name: listing.title || 'Untitled Item',
      price: price,
      category: listing.category || 'UNCATEGORIZED', // ListingResource provides category name
      description: listing.description || '',
      longDescription: listing.description || '',
      images: images.length > 0 ? images : ['https://via.placeholder.com/800'],
      color: '#f3f4f6',
      distance: distance,
      vendor: {
        name: user.username || user.name || 'Unknown Seller',
        avatar: user.profile_photo || user.image || 'https://i.pravatar.cc/150?u=default',
        location: fullLocation,
        rating: 4.5, // Default rating if not available
        reviewCount: 0,
        followers: 0,
        joinedDate: '2024',
        bio: '',
        verified: !!user.phone_verified_at,
        reviews: []
      },
      isSuper: false
    };
  };

  // Fetch items from API - matches the approach used in UploadPage
  const fetchItems = useCallback(async () => {
    if (activeTab !== 'marketplace') return; // Only fetch for marketplace tab
    
    setLoadingItems(true);
    try {
      const token = getStoredToken();
      
      // Build query parameters - same approach as other parts of the app
      const params: string[] = [];
      
      // Add type filter for marketplace (matches UploadPage which creates with type='marketplace')
      // Note: We filter for 'marketplace' type to match listings created via UploadPage
      params.push('type=marketplace');
      
      // Add category filter
      if (activeCategory !== "All") {
        params.push(`category=${encodeURIComponent(activeCategory)}`);
      }
      
      // Add city filter - send 'all' to show all cities, or specific city
      if (currentCity === "All Locations") {
        params.push('city=all');
        // Also add ignore_city to ensure all listings are shown regardless of environment
        params.push('ignore_city=true');
      } else {
        params.push(`city=${encodeURIComponent(currentCity)}`);
      }
      
      // Build feed URL
      let feedUrl = ENDPOINTS.items.feed;
      if (params.length > 0) {
        feedUrl += `?${params.join('&')}`;
      }
      
      console.log('[Discover] Fetching items from:', feedUrl);
      console.log('[Discover] Filters:', { activeCategory, currentCity, activeTab });
      
      // Fetch items from API - same endpoint used by UploadPage to fetch user listings
      const response = await apiFetch(feedUrl, { token: token || undefined });
      const apiItems = response.listings || response.items || response.data || [];
      
      console.log('[Discover] Received items from API:', apiItems.length);
      if (apiItems.length > 0) {
        console.log('[Discover] First item sample:', {
          id: apiItems[0].id,
          title: apiItems[0].title,
          type: apiItems[0].type,
          status: apiItems[0].status,
          city: apiItems[0].city,
          price: apiItems[0].price
        });
      }
      
      // Transform API items to Product format
      // Backend already filters by status='active', but we double-check here
      const transformedItems = apiItems
        .filter((item: any) => {
          // Only show active items
          if (item.status && item.status !== 'active') {
            console.log('[Discover] Filtered out inactive item:', item.id, item.status);
            return false;
          }
          // Only show marketplace type (matching UploadPage which creates with type='marketplace')
          const itemType = item.type?.toLowerCase();
          if (itemType !== 'marketplace' && itemType !== 'shop') {
            console.log('[Discover] Filtered out non-marketplace item:', item.id, itemType);
            return false;
          }
          return true;
        })
        .map(transformListingToProduct);
      
      console.log('[Discover] Transformed items for display:', transformedItems.length);
      
      setItems(transformedItems);
      setHistory([]);
    } catch (error) {
      console.error('[Discover] Failed to fetch items:', error);
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [activeTab, activeCategory, currentCity]);

  // Fetch items when discover page is active and filters change
  useEffect(() => {
    if (activePage === 'discover' || authState === 'discover') {
      fetchItems();
    }
  }, [activePage, authState, fetchItems]);

  const activeIndex = items.length - 1;

  const handleSwipe = useCallback(async (direction: 'left' | 'right' | 'up') => {
    const swipedItem = items[activeIndex];
    if (!swipedItem) return;

    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('auth_token') !== null;

    // Allow left swipe (pass) for everyone
    if (direction === 'left') {
      setHistory(prev => [...prev, swipedItem]);
      setItems(prev => prev.slice(0, -1));
      setTriggerDir(null);
      return;
    }

    // Require authentication for right (like) and up (super interest) swipes
    if (!isAuthenticated) {
      // Show login page
      setAuthState('login');
      return;
    }

    // Send swipe to backend API
    if (direction === 'right' || direction === 'up') {
      try {
        const token = getStoredToken();
        if (token) {
          // Send swipe request to backend
          // For 'up' direction (star), we'll send it as 'right' with a special flag, or handle it separately
          await apiFetch(ENDPOINTS.swipes.create, {
            method: 'POST',
            token,
            body: {
              target_listing_id: swipedItem.id,
              direction: direction === 'up' ? 'up' : 'right', // Send 'up' for star action
            },
          });
        }
      } catch (err) {
        console.error('Failed to send swipe:', err);
        // Continue with UI update even if API call fails
      }
    }

    if (direction === 'up') {
      setLastSparkedItem(swipedItem);
      setShowSellerToast(true);
      sendNativeNotification(
        "New Super Interest! ⚡️",
        `A buyer is highly interested in your "${swipedItem.name}". Open Nyem to chat!`,
        swipedItem.images[0]
      );
      setTimeout(() => setShowSellerToast(false), 3500);
    }

    if (direction === 'right' || direction === 'up') {
      const enhancedItem = direction === 'up' ? { ...swipedItem, isSuper: true } : swipedItem;
      setLikedItems(prev => prev.find(i => i.id === enhancedItem.id) ? prev : [...prev, enhancedItem]);
    }
    setHistory(prev => [...prev, swipedItem]);
    setItems(prev => prev.slice(0, -1));
    setTriggerDir(null);
  }, [items, activeIndex]);

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

  const undoLast = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setItems(prev => [...prev, last]);
    setHistory(prev => prev.slice(0, -1));
    setLikedItems(prev => prev.filter(i => i.id !== last.id));
  };

  const refreshDrops = () => {
    if (activeCategory === "All" && currentCity === "All Locations") {
      fetchItems();
    } else {
      setActiveCategory("All");
      setCurrentCity("All Locations");
    }
  };

  const removeFromWishlist = (id: number) => {
    setLikedItems(prev => prev.filter(item => item.id !== id));
  };

  const openSellerProfile = (vendor: Vendor) => {
    setViewingSeller(vendor);
  };

  const handleProfileSettingsClick = () => {
    setForceProfileSettings(prev => prev + 1);
  };

  // Check authentication status - use throughout component
  const hasValidToken = localStorage.getItem('auth_token') !== null;
  const isAuthenticated = authState === 'authenticated' && hasValidToken;


  // Show auth pages (welcome, login, register, etc.)
  if (authState === 'welcome' || authState === 'login' || authState === 'register' || authState === 'otp' || authState === 'forgot') {
    return (
      <>
        {showLocationModal && (
          <LocationPermissionModal
            onAllow={() => {
              setShowLocationModal(false);
            }}
            onSkip={() => {
              setShowLocationModal(false);
            }}
          />
        )}
        <AuthLayout>
          <AnimatePresence mode="wait">
            {authState === 'welcome' && (
              <WelcomePage
                onStart={() => {
                  setAuthState('discover');
                  setActivePage('discover');
                }} // Go directly to discovery
                onLogin={() => setAuthState('login')}
                onRegister={() => setAuthState('register')}
              />
            )}
            {authState === 'login' && (
              <LoginPage
                onLogin={async () => {
                  // Check if user has location, if not show modal
                  await checkLocationAndShowModal();
                  setAuthState('discover');
                  setActivePage('discover');
                }}
                onGoToRegister={() => setAuthState('register')}
                onGoToForgot={() => setAuthState('forgot')}
                onSkip={() => {
                  setAuthState('discover');
                  setActivePage('discover');
                }} // Allow skipping to discovery
              />
            )}
            {authState === 'register' && (
              <RegisterPage
                onRegister={(email, name, password) => {
                  setTempUserEmail(email);
                  setTempRegisterData({ name, password });
                  setAuthState('otp');
                }}
                onGoToLogin={() => setAuthState('login')}
                onSkip={() => {
                  setAuthState('discover');
                  setActivePage('discover');
                }} // Allow skipping to discovery
              />
            )}
            {authState === 'otp' && (
              <OtpVerificationPage
                email={tempUserEmail}
                name={tempRegisterData?.name}
                password={tempRegisterData?.password}
                onVerify={async () => {
                  // Clear temp data
                  setTempRegisterData(null);
                  // Check if user has location, if not show modal
                  await checkLocationAndShowModal();
                  setAuthState('discover');
                  setActivePage('discover');
                }}
                onBack={() => {
                  setTempRegisterData(null);
                  setAuthState('register');
                }}
              />
            )}
            {authState === 'forgot' && (
              <ForgotPasswordPage
                onBack={() => setAuthState('login')}
                onSubmit={() => setAuthState('login')}
              />
            )}
          </AnimatePresence>
        </AuthLayout>
      </>
    );
  }

  // Handle discover state - allow access without auth
  if (authState === 'discover' || (authState === 'authenticated' && activePage === 'discover')) {
    // Set activePage to discover if not already set
    if (activePage !== 'discover') {
      setActivePage('discover');
    }
  }

  if (activePage === 'discover' || authState === 'discover') {
    return (
      <>
        {showLocationModal && (
          <LocationPermissionModal
            onAllow={() => {
              setShowLocationModal(false);
            }}
            onSkip={() => {
              setShowLocationModal(false);
            }}
          />
        )}
        <DiscoverLayout
          headerProps={{
            onFilter: () => setShowFilterDialog(true),
            onLocation: () => setShowLocationDialog(true),
            onWishlist: () => setShowWishlist(true),
            activeCategory,
            setActiveTab,
            activeTab,
            wishlistCount: likedItems.length
          }}
          bottomNav={
            <BottomNav
              activePage={activePage}
              setActivePage={setActivePage}
              authState={authState}
              setAuthState={setAuthState}
              isChatOpen={isChatOpen}
            />
          }
          floatingControls={activeTab === 'marketplace' && items.length > 0 ? (
            <SwipeControls
              onUndo={undoLast}
              onNope={() => setTriggerDir('left')}
              onStar={() => {
                if (!hasValidToken) {
                  setAuthState('login');
                } else {
                  setTriggerDir('up');
                }
              }}
              onLike={() => {
                if (!hasValidToken) {
                  setAuthState('login');
                } else {
                  setTriggerDir('right');
                }
              }}
              onShare={handleShare}
              canUndo={history.length > 0}
            />
          ) : undefined}
        >
          <div className="flex items-center justify-center pt-0 pb-1 shrink-0 mt-[-2px]">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-full border border-neutral-200/50 shadow-sm">
              <MapPin size={9} className="text-[#830e4c]" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-900/60">
                Discovery in <span className="text-[#830e4c] italic">{currentCity}</span>
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
                    <SwipeCard
                      key={`${product.id}-${items.length}`} product={product} index={activeIndex - idx} isTop={idx === activeIndex}
                      onSwipe={handleSwipe} triggerDirection={idx === activeIndex ? triggerDir : null}
                      onShowDetail={(p) => { setActiveImageIndex(0); setSelectedProduct(p); }}
                    />
                  ))
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center px-8">
                    <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6 border border-neutral-100 shadow-inner">
                      <RotateCcw size={32} className="text-neutral-300" />
                    </div>
                    <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tighter">End of the line</h3>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em] mt-2 mb-8">No more drops to show right now</p>
                    <button onClick={refreshDrops} className="px-10 py-5 bg-[#830e4c] hover:bg-[#830e4c]/90 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl active:scale-95 transition-all">Refresh Drops</button>
                  </motion.div>
                )
              ) : (
                <div className="h-full flex items-center justify-center px-2">
                  <ComingSoonState type={activeTab === 'services' ? 'services' : 'barter'} />
                </div>
              )}
            </AnimatePresence>
          </div>

          <Modal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} title="Item Details" fullHeight>
            {selectedProduct && (
              <div className="flex flex-col gap-6 pb-32 no-scrollbar max-w-[390px] mx-auto">
                <div className="space-y-4">
                  <motion.div
                    key={selectedProduct.images[activeImageIndex]}
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                    className="w-full aspect-square rounded-[2rem] overflow-hidden bg-neutral-100 border border-neutral-100 shadow-sm"
                  >
                    <img src={selectedProduct.images[activeImageIndex]} className="w-full h-full object-cover" />
                  </motion.div>

                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
                    {selectedProduct.images.map((img, i) => (
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
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-[#830e4c] uppercase tracking-[0.2em] bg-[#830e4c1a] px-3 py-1.5 rounded-xl border border-[#830e4c33]">
                        {selectedProduct.category}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-[2.2rem] font-black text-neutral-900 tracking-tighter leading-[0.9] uppercase italic w-full">
                        {selectedProduct.name}
                      </h2>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-3xl font-black text-[#830e4c] tracking-tighter">{selectedProduct.price}</span>
                          <div className="w-1 h-1 rounded-full bg-neutral-200" />
                          <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest italic">Negotiable</span>
                        </div>

                        <button
                          onClick={() => handleShare(selectedProduct)}
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
                      {selectedProduct.longDescription}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h4 className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.25em]">Owner of Item</h4>
                    <div
                      onClick={() => openSellerProfile(selectedProduct.vendor)}
                      className="bg-white rounded-[3rem] p-5 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.04)] border border-neutral-50 cursor-pointer active:scale-[0.98] transition-all hover:bg-neutral-50 group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="relative shrink-0">
                          <div className="w-20 h-20 rounded-full overflow-hidden border-[6px] border-white shadow-lg ring-1 ring-neutral-100">
                            <img src={selectedProduct.vendor.avatar} className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow-md border border-neutral-100">
                            <div className="w-3.5 h-3.5 bg-[#29B3F0] rounded-full shadow-inner" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 min-w-0">
                          <h4 className="text-xl font-black text-neutral-900 uppercase tracking-tighter italic leading-none truncate">{selectedProduct.vendor.name}</h4>
                          <div className="flex flex-col gap-1">
                            <RatingStars rating={selectedProduct.vendor.rating} />
                            <div className="flex items-center gap-1 text-neutral-400">
                              <MapPin size={10} strokeWidth={3} />
                              <span className="text-[10px] font-black uppercase tracking-tight">
                                {selectedProduct.distance !== 'Unknown' && selectedProduct.distance !== 'UNKNOWN' ? `${selectedProduct.distance} ` : ''}
                                {selectedProduct.vendor.location}
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
                        setAuthState('login');
                      }
                      // TODO: Implement send request functionality for authenticated users
                    }}
                    className="w-full max-w-[360px] mx-auto bg-[#830e4c] text-white py-6 rounded-[2.2rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-[0_20px_60px_rgba(131,14,76,0.25)] active:scale-95 transition-all flex items-center justify-center gap-3 italic"
                  >
                    <SendHorizontal size={18} strokeWidth={3} className="text-white/60" />
                    SEND REQUEST TO SELLER
                  </button>
                </div>
              </div>
            )}
          </Modal>

          <Modal isOpen={!!viewingSeller} onClose={() => setViewingSeller(null)} title="Seller Profile" fullHeight showBack onBack={() => setViewingSeller(null)}>
            {viewingSeller && <SellerProfileView vendor={viewingSeller} onClose={() => setViewingSeller(null)} onProductClick={(p) => { setViewingSeller(null); setSelectedProduct(p); }} />}
          </Modal>

          <Modal isOpen={showWishlist} onClose={() => setShowWishlist(false)} title="Your Wishlist" fullHeight>
            <div className="space-y-4 pb-10">
              {likedItems.length > 0 ? likedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-2xl border border-neutral-100 group">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-200"><img src={item.images[0]} className="w-full h-full object-cover" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">{item.isSuper && <Zap size={10} className="text-[#29B3F0]" fill="currentColor" />}<span className="text-[8px] font-black text-[#830e4c] uppercase tracking-widest">{item.category}</span></div>
                    <h4 className="text-sm font-black text-neutral-900 truncate tracking-tight">{item.name}</h4>
                    <p className="text-xs font-black text-[#830e4c] mt-0.5">{item.price}</p>
                    <div className="flex items-center gap-3 mt-2"><button onClick={() => { setSelectedProduct(item); setShowWishlist(false); }} className="text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors">Details</button><button onClick={() => removeFromWishlist(item.id)} className="text-[9px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1"><Trash2 size={10} /> Remove</button></div>
                  </div>
                  <button onClick={() => { setShowWishlist(false); setSelectedProduct(item); }} className="p-3 bg-white rounded-xl shadow-sm border border-neutral-100 text-neutral-900 active:scale-90 transition-all"><MessageSquare size={18} strokeWidth={2.5} /></button>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4"><div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center border border-neutral-100"><Heart size={32} className="text-neutral-200" /></div><div className="space-y-1"><h4 className="text-base font-black text-neutral-900 uppercase tracking-tighter">No items yet</h4><p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Swipe right on items you want to buy!</p></div></div>
              )}
            </div>
          </Modal>

          <Modal isOpen={showFilterDialog} onClose={() => setShowFilterDialog(false)} title="DISCOVERY FILTER">
            <div className="space-y-2">{CATEGORIES_DATA.map(cat => (
              <button key={cat.name} onClick={() => { setActiveCategory(cat.name); setShowFilterDialog(false); }} className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border-2 active:scale-[0.98] ${activeCategory === cat.name ? 'bg-[#830e4c] border-[#830e4c] shadow-md text-white' : 'bg-white border-neutral-50 hover:border-neutral-100'}`}>
                <div className="flex items-center gap-3.5"><div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${activeCategory === cat.name ? 'bg-white/20 text-white' : 'bg-neutral-50 text-neutral-400'}`}><cat.icon size={20} /></div><div className="text-left"><h4 className={`text-base font-black tracking-tight leading-tight uppercase italic ${activeCategory === cat.name ? 'text-white' : 'text-neutral-900'}`}>{cat.name}</h4><p className={`text-[8px] font-black uppercase tracking-[0.15em] mt-0.5 ${activeCategory === cat.name ? 'text-white/70' : 'text-neutral-300'}`}>EXPLORE COLLECTION</p></div></div>
                <div className="flex items-center justify-center">{activeCategory === cat.name ? <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm"><Check size={14} strokeWidth={4} className="text-[#830e4c]" /></div> : <ChevronRight size={18} className="text-neutral-200" />}</div>
              </button>
            ))}</div>
          </Modal>

          <Modal isOpen={showLocationDialog} onClose={() => setShowLocationDialog(false)} title="SELECT CITY">
            <div className="space-y-2">{NIGERIA_CITIES.map(cityObj => (
              <button key={cityObj.city} onClick={() => { setCurrentCity(cityObj.city); setShowLocationDialog(false); }} className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border-2 active:scale-[0.98] ${currentCity === cityObj.city ? 'bg-[#830e4c1a] border-[#830e4c] shadow-sm' : 'bg-white border-neutral-50 hover:border-neutral-100'}`}>
                <div className="flex items-center gap-3.5"><div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${currentCity === cityObj.city ? 'bg-[#830e4c] text-white' : 'bg-neutral-50 text-neutral-400'}`}>{cityObj.city === "All Locations" ? <Globe size={20} /> : <MapPin size={20} />}</div><div className="text-left"><h4 className={`text-base font-black tracking-tight leading-tight uppercase italic ${currentCity === cityObj.city ? 'text-[#830e4c]' : 'text-neutral-900'}`}>{cityObj.city}</h4><p className="text-[8px] font-black text-neutral-300 uppercase tracking-[0.15em] mt-0.5">{cityObj.city === "All Locations" ? "NATIONWIDE COVERAGE" : "CITY-WIDE SEARCH"}</p></div></div>
                <div className="flex items-center justify-center">{currentCity === cityObj.city ? <div className="w-7 h-7 bg-[#830e4c] rounded-full flex items-center justify-center shadow-sm"><Check size={14} strokeWidth={4} className="text-white" /></div> : <ChevronRight size={18} className="text-neutral-200" />}</div>
              </button>
            ))}</div>
          </Modal>

          <AnimatePresence>
            {showSellerToast && lastSparkedItem && (
              <motion.div initial={{ opacity: 0, y: 50, x: '-50%', scale: 0.9 }} animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }} exit={{ opacity: 0, y: 40, x: '-50%', scale: 0.9 }} className="fixed bottom-36 left-1/2 -translate-x-1/2 w-[85%] max-w-[340px] bg-white/20 backdrop-blur-[40px] px-5 py-4 rounded-[2.5rem] flex items-center gap-4 z-[200] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.12)] border border-white/40 ring-1 ring-black/5">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md flex-shrink-0 border border-white/50"><img src={lastSparkedItem.images[0]} className="w-full h-full object-cover" /></div>
                <div className="flex flex-col flex-1 min-w-0"><div className="flex items-center gap-1.5 mb-1"><Zap size={10} className="text-[#29B3F0]" fill="currentColor" /><span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#29B3F0] leading-none">Super Interest Sent!</span></div><span className="text-[11px] font-black uppercase tracking-tight text-neutral-900 truncate">Request sent for {lastSparkedItem.name}</span></div>
              </motion.div>
            )}
          </AnimatePresence>
        </DiscoverLayout>
      </>
    );
  }

  const pageTitles = { upload: 'Studio', matches: 'Inbox', profile: 'Account' };
  const rightActions = {
    upload: { icon: <Sparkles size={20} strokeWidth={2.5} />, onClick: () => { } },
    matches: { icon: <Sparkles size={20} strokeWidth={2.5} />, onClick: () => { } },
    profile: { icon: <Settings size={20} strokeWidth={2.5} />, onClick: handleProfileSettingsClick }
  };

  // Show login prompt for protected pages if not authenticated
  if ((activePage === 'upload' || activePage === 'matches' || activePage === 'profile') && !hasValidToken) {
    return (
      <>
        {showLocationModal && (
          <LocationPermissionModal
            onAllow={() => {
              setShowLocationModal(false);
            }}
            onSkip={() => {
              setShowLocationModal(false);
            }}
          />
        )}
        <GeneralLayout
          title={pageTitles[activePage]}
          rightAction={rightActions[activePage]}
          bottomNav={
            <BottomNav
              activePage={activePage}
              setActivePage={setActivePage}
              authState={authState}
              setAuthState={setAuthState}
              isChatOpen={isChatOpen}
            />
          }
        >
          <LoginPrompt
            onLogin={() => setAuthState('login')}
            onRegister={() => setAuthState('register')}
            title={`${pageTitles[activePage]} Requires Login`}
            message={`Please login or register to access ${pageTitles[activePage].toLowerCase()}`}
          />
        </GeneralLayout>
      </>
    );
  }

  return (
    <>
      {showLocationModal && (
        <LocationPermissionModal
          onAllow={() => {
            setShowLocationModal(false);
          }}
          onSkip={() => {
            setShowLocationModal(false);
          }}
        />
      )}
      <GeneralLayout
        title={pageTitles[activePage]}
        rightAction={rightActions[activePage]}
        bottomNav={
          <BottomNav
            activePage={activePage}
            setActivePage={setActivePage}
            authState={authState}
            setAuthState={setAuthState}
            isChatOpen={isChatOpen}
          />
        }
      >
        {activePage === 'upload' ? (
          <UploadPage />
        ) : activePage === 'matches' ? (
          <MatchesPage onChatToggle={setIsChatOpen} />
        ) : (
          <ProfilePage
            key={`profile-${forceProfileSettings}`}
            forceSettingsTab={forceProfileSettings > 0}
            onSignOut={() => {
              // Remove token and user data (removeToken also removes user)
              removeToken();
              // Reset auth state and redirect to welcome
              setAuthState('welcome');
              setActivePage('discover');
            }}
            onNavigateToUpload={() => {
              setActivePage('upload');
            }}
          />
        )}
      </GeneralLayout>
    </>
  );
};

export default App;