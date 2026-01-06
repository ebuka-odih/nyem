
import React, { useState, useEffect, useRef } from 'react';
import { LoginPromptModal } from './LoginPromptModal';
import { SwipeItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { SwipeHeader } from './swipe/SwipeHeader';
import { SwipeCardStack } from './swipe/SwipeCardStack';
import { SwipeModals } from './swipe/SwipeModals';
import { BuyRequestToast } from './swipe/BuyRequestToast';
import { PLACEHOLDER_AVATAR, generateInitialsAvatar } from '../constants/placeholders';

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
  category?: string;
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
  category?: string;
  owner: Owner;
  gallery?: string[];
}

// Mock items with initials avatars
const MOCK_BARTER_ITEMS: BarterItem[] = [
  { id: 1, type: 'barter', title: "Vintage Camera", condition: "Antique", image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800", description: "Fully functional film camera from the 80s. Comes with original leather case.", lookingFor: "Smart Watch ⌚", owner: { name: "David", image: generateInitialsAvatar("David"), location: "Abuja", distance: "5km" }, gallery: ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f", "https://images.unsplash.com/photo-1516035069371-29a1b244cc32"] },
  { id: 2, type: 'barter', title: "Sony Headphones", condition: "Used", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800", description: "Premium noise cancelling headphones. Battery life is great. Minor scratches on ear cup.", lookingFor: "Mechanical Keyboard ⌨️", owner: { name: "Sarah", image: generateInitialsAvatar("Sarah"), location: "Lagos", distance: "2km" }, gallery: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e", "https://images.unsplash.com/photo-1546435770-a3e426bf472b"] },
];

const MOCK_MARKETPLACE_ITEMS: MarketplaceItem[] = [
  { id: 3, type: 'marketplace', title: "Phone holder", price: "15,000", image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=800", description: "Phone holder against flat wall or surface area. Great for hands-free video calls or watching movies in bed.", owner: { name: "Ebuka", image: generateInitialsAvatar("Ebuka"), location: "Abuja", distance: "30m" }, gallery: ["https://images.unsplash.com/photo-1585771724684-38269d6639fd"] },
  { id: 4, type: 'marketplace', title: "Macbook Stand", price: "25,000", image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=800", description: "Aluminum alloy laptop stand. Ergonomic design to improve posture.", owner: { name: "Miriam", image: generateInitialsAvatar("Miriam"), location: "Port Harcourt", distance: "12km" }, gallery: ["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf"] }
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
  onItemClick: (item: SwipeItem, currentTab?: 'Marketplace' | 'Services' | 'Swap', currentIndex?: number) => void;
  onLoginRequest?: (method: 'google' | 'email') => void;
  onSignUpRequest?: () => void;
  initialTab?: 'Marketplace' | 'Services' | 'Swap';
  onTabChange?: (tab: 'Marketplace' | 'Services' | 'Swap') => void;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

// Local storage key for welcome card dismissed state
const WELCOME_CARD_DISMISSED_KEY = 'nyem_welcome_card_dismissed';
const SIGNUP_WELCOME_CARD_DISMISSED_KEY = 'nyem_signup_welcome_card_dismissed';

export const SwipeScreen: React.FC<SwipeScreenProps> = ({ onBack, onItemClick, onLoginRequest, onSignUpRequest, initialTab = 'Marketplace', onTabChange, initialIndex = 0, onIndexChange }) => {
  const { token, isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'Marketplace' | 'Services' | 'Swap'>(initialTab);
  const [items, setItems] = useState<SwipeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  
  // Track index per tab so switching tabs preserves position
  const tabIndicesRef = useRef<{ [key: string]: number }>({
    'Marketplace': initialTab === 'Marketplace' ? initialIndex : 0,
    'Services': initialTab === 'Services' ? initialIndex : 0,
    'Swap': initialTab === 'Swap' ? initialIndex : 0,
  });
  // Track liked items (item IDs that have been liked)
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  // Show welcome card only once per user (stored in localStorage)
  const [showWelcomeCard, setShowWelcomeCard] = useState(() => {
    // Check if welcome card has been dismissed before
    const dismissed = localStorage.getItem(WELCOME_CARD_DISMISSED_KEY);
    return dismissed !== 'true';
  });
  
  // Show signup welcome card for new users (stored in localStorage)
  const [showSignupWelcomeCard, setShowSignupWelcomeCard] = useState(() => {
    // Check if user just signed up (check for a flag set after signup)
    const justSignedUp = localStorage.getItem('nyem_just_signed_up');
    const dismissed = localStorage.getItem(SIGNUP_WELCOME_CARD_DISMISSED_KEY);
    // Show if user just signed up and hasn't dismissed it
    if (justSignedUp === 'true' && dismissed !== 'true') {
      // Clear the flag so it only shows once
      localStorage.removeItem('nyem_just_signed_up');
      return true;
    }
    return false;
  });
  
  // Track swipe count for promo card (Marketplace and Swap tabs, every 5 swipes)
  const [swipeCount, setSwipeCount] = useState(0);
  const [showPromoCard, setShowPromoCard] = useState(false);
  const PROMO_CARD_INTERVAL = 5; // Show promo card every N swipes
  
  // Track swipe count for ad card (every 3 swipes - tracks both left and right swipes)
  const adSwipeCountRef = useRef(0);
  const [showAdCard, setShowAdCard] = useState(false);
  const AD_CARD_INTERVAL = 3; // Show ad card every N swipes
  
  // Helper function to track swipe and check if ad card should show
  const trackSwipeForAdCard = () => {
    // Only track for Marketplace and Swap tabs
    if (activeTab !== 'Marketplace' && activeTab !== 'Swap') {
      return false; // Don't show ad card on Services tab
    }
    
    // Increment ad card swipe count
    adSwipeCountRef.current = adSwipeCountRef.current + 1;
    const newAdCount = adSwipeCountRef.current;
    
    // Show ad card every AD_CARD_INTERVAL swipes
    if (newAdCount > 0 && newAdCount % AD_CARD_INTERVAL === 0) {
      setShowAdCard(true);
      return true; // Ad card will be shown
    }
    
    return false; // Ad card won't show
  };
  
  // Track previous filter values to detect when they change
  const prevFiltersRef = useRef<{ tab: string; categoryId: number | null; location: string }>({
    tab: initialTab,
    categoryId: null,
    location: 'all',
  });

  // Track last notified index to prevent unnecessary notifications
  const lastNotifiedIndexRef = useRef<number>(initialIndex);

  // Sync with initialTab prop when it changes (e.g., when returning from item details)
  useEffect(() => {
    if (initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  // Sync with initialIndex prop when it changes (e.g., when returning from item details)
  useEffect(() => {
    if (initialIndex !== undefined && initialIndex !== currentIndex) {
      setCurrentIndex(initialIndex);
      // Update the last notified index to match, so we don't notify for this sync
      lastNotifiedIndexRef.current = initialIndex;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIndex]);

  // Notify parent when index changes (only if it's different from last notified)
  useEffect(() => {
    if (onIndexChange && currentIndex !== lastNotifiedIndexRef.current) {
      lastNotifiedIndexRef.current = currentIndex;
      onIndexChange(currentIndex);
    }
  }, [currentIndex, onIndexChange]);

  // Handle tab change and notify parent
  const handleTabChange = (tab: 'Marketplace' | 'Services' | 'Swap') => {
    // Save current index for the current tab before switching
    tabIndicesRef.current[activeTab] = currentIndex;
    
    setActiveTab(tab);
    setLoading(true); // Show loading immediately when tab changes
    
    // Restore the saved index for the new tab (or start at 0)
    const savedIndex = tabIndicesRef.current[tab] || 0;
    setCurrentIndex(savedIndex);
    // Note: onIndexChange will be called by the effect at line 144-149 when currentIndex changes
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Modal States
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isSendingBuyRequest, setIsSendingBuyRequest] = useState(false);
  const [showBuyRequestToast, setShowBuyRequestToast] = useState(false);
  const [buyRequestSellerName, setBuyRequestSellerName] = useState('');

  // Dropdowns
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Categories and Locations from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Map activeTab to parent category name for filtering
  const getParentCategoryName = (tab: 'Marketplace' | 'Services' | 'Swap'): string => {
    // Map Marketplace to Shop for backend API (backend uses 'Shop' as parent category)
    if (tab === 'Marketplace') return 'Shop';
    return tab; // Services or Swap
  };

  // Fetch categories and locations from API - filtered by active tab
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoadingFilters(true);

        // Reset selected category when tab changes
        setSelectedCategory('All Categories');
        setSelectedCategoryId(null);

        // Fetch categories filtered by parent (activeTab)
        const parentCategory = getParentCategoryName(activeTab);
        const categoriesUrl = `${ENDPOINTS.categories}?parent=${encodeURIComponent(parentCategory)}`;

        const [categoriesRes, locationsRes] = await Promise.all([
          apiFetch(categoriesUrl),
          apiFetch(ENDPOINTS.locations),
        ]);

        const cats = (categoriesRes.categories || []) as Category[];
        const locs = (locationsRes.locations || []) as Location[];

        console.log(`[SwipeScreen] Loaded ${cats.length} categories for ${activeTab} tab:`, cats.map(c => c.name));

        setCategories(cats);
        setLocations(locs);
      } catch (error) {
        console.error('Failed to fetch categories/locations:', error);
        // Fallback to empty arrays - will show "All Categories" and "all" as defaults
        setCategories([]);
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilters();
  }, [activeTab]);

  // Fetch items from API - works with or without authentication
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        let apiItems: any[] = [];

        // Handle Services tab separately - fetch service providers
        if (activeTab === 'Services') {
          // Build query parameters for service providers
          const params: string[] = [];

          // Add category filter if not "All Categories"
          if (selectedCategoryId) {
            params.push(`category=${selectedCategoryId}`);
          }

          // Add city filter
          if (selectedLocation && selectedLocation !== 'all') {
            params.push(`city=${encodeURIComponent(selectedLocation)}`);
          } else if (selectedLocation === 'all') {
            params.push('city=all');
          }

          // Build feed URL with query parameters
          let feedUrl = ENDPOINTS.serviceProviders.feed;
          if (params.length > 0) {
            feedUrl += `?${params.join('&')}`;
          }

          console.log('[SwipeScreen] Fetching service providers with URL:', feedUrl);
          console.log('[SwipeScreen] Filter state:', { selectedCategory, selectedCategoryId, selectedLocation });

          // Fetch service providers - token is optional (for browsing without login)
          const res = await apiFetch(feedUrl, { token: token || undefined });
          apiItems = res.items || res.data || [];
        } else {
          // Build query parameters for items (Marketplace/Swap)
          const params: string[] = [];

          // Add type parameter based on active tab
          // Map: Shop -> marketplace, Swap -> barter
          let itemType = 'marketplace';
          if (activeTab === 'Swap') {
            itemType = 'barter';
          }
          params.push(`type=${encodeURIComponent(itemType)}`);

          // Add category filter if not "All Categories"
          if (selectedCategoryId) {
            params.push(`category_id=${selectedCategoryId}`);
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

          console.log('[SwipeScreen] Fetching items with URL:', feedUrl);
          console.log('[SwipeScreen] Filter state:', { selectedCategory, selectedCategoryId, selectedLocation });

          // Fetch items - token is optional (for browsing without login)
          const res = await apiFetch(feedUrl, { token: token || undefined });
          apiItems = res.items || res.data || [];
        }

        console.log(`[SwipeScreen] Fetched ${apiItems.length} ${activeTab === 'Services' ? 'service providers' : 'items'} for ${activeTab} tab`, {
          category: selectedCategory,
          categoryId: selectedCategoryId,
          location: selectedLocation,
          count: apiItems.length,
        });

        // Transform API items to SwipeItem format
        const transformedItems: SwipeItem[] = apiItems.map((item: any) => {
          // For service providers, use different title/description mapping
          const isServiceProvider = activeTab === 'Services';
          
          return {
            id: item.id,
            type: item.type || (isServiceProvider ? 'services' : (item.price ? 'marketplace' : 'barter')),
            title: isServiceProvider 
              ? (item.title || item.serviceCategory?.name || 'Service Provider')
              : (item.title || item.name || 'Untitled Item'),
            condition: item.condition || (isServiceProvider ? undefined : 'Used'),
            image: item.images?.[0] || item.image || item.work_images?.[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="800"%3E%3Crect fill="%23f3f4f6" width="800" height="800"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E',
            description: isServiceProvider
              ? (item.description || item.bio || '')
              : (item.description || ''),
            lookingFor: item.looking_for || item.lookingFor || '',
            price: (() => {
              const priceValue = item.price || item.starting_price;
              if (!priceValue) return undefined;
              
              // If it's already a string with commas, use it as is (backend formatted)
              if (typeof priceValue === 'string' && priceValue.includes(',')) {
                return priceValue.includes('₦') ? priceValue : `₦${priceValue}`;
              }
              
              // If it's a string without commas, parse and format it
              if (typeof priceValue === 'string') {
                const numValue = parseFloat(priceValue.replace(/[₦,]/g, ''));
                if (!isNaN(numValue)) {
                  return `₦${numValue.toLocaleString('en-US')}`;
                }
                return `₦${priceValue}`;
              }
              
              // If it's a number, format it with commas
              return `₦${priceValue.toLocaleString('en-US')}`;
            })(),
            category: item.category || item.serviceCategory?.name || undefined,
            owner: {
              id: item.user?.id || item.owner?.id,
              name: item.user?.username || item.owner?.name || 'Unknown',
              image: (() => {
                const profilePhoto = item.user?.profile_photo || item.owner?.image;
                const userName = item.user?.username || item.owner?.name || 'Unknown';
                if (!profilePhoto || profilePhoto.trim() === '') {
                  return generateInitialsAvatar(userName);
                }
                const generatedAvatarPatterns = [
                  'ui-avatars.com',
                  'pravatar.cc',
                  'i.pravatar.cc',
                  'robohash.org',
                  'dicebear.com',
                  'avatar.vercel.sh',
                ];
                const isGeneratedAvatar = generatedAvatarPatterns.some(pattern => 
                  profilePhoto.toLowerCase().includes(pattern.toLowerCase())
                );
                return isGeneratedAvatar ? generateInitialsAvatar(userName) : profilePhoto;
              })(),
              location: (() => {
                // Priority: owner.location (formatted "City, Area") > user.area + user.city > user.city > item.city
                if (item.owner?.location && item.owner.location !== 'Unknown') {
                  return item.owner.location;
                }
                if (item.user?.area && item.user?.city) {
                  return `${item.user.city}, ${item.user.area}`;
                }
                if (item.user?.city) {
                  return item.user.city;
                }
                if (item.city) {
                  return item.city;
                }
                return 'Unknown';
              })(),
              distance: (() => {
                const distanceKm = item.distance_km ?? item.distance;
                if (distanceKm !== null && distanceKm !== undefined) {
                  return distanceKm < 1
                    ? `${Math.round(distanceKm * 1000)}m`
                    : `${distanceKm}km`;
                }
                if (item.owner?.distance) {
                  return item.owner.distance;
                }
                return 'Unknown';
              })(),
              phone_verified_at: item.user?.phone_verified_at || item.owner?.phone_verified_at || null,
            },
            gallery: item.images || item.gallery || item.work_images || [item.image].filter(Boolean),
            // Include stats (views, likes, shares) from API
            views: item.views ?? 0,
            likes: item.likes ?? 0,
            shares: item.shares ?? 0,
            // Service provider specific fields
            ...(isServiceProvider && {
              rating: item.rating,
              rating_count: item.rating_count,
              availability: item.availability,
            }),
          };
        });

        // Use mock data as fallback ONLY if API returns no items AND no filters are applied
        // This ensures filtered results show empty state rather than mock data
        // Note: Services tab doesn't have mock data, so always use API results
        let finalItems: SwipeItem[];
        const hasFiltersApplied = selectedCategoryId !== null || selectedLocation !== 'all';
        
        if (transformedItems.length === 0 && !hasFiltersApplied && activeTab !== 'Services') {
          // No items and no filters - use mock data for design preview (only for Marketplace/Swap)
          const mockItems = activeTab === 'Marketplace'
            ? MOCK_MARKETPLACE_ITEMS.map(item => ({
                ...item,
                price: `₦${item.price}`,
              }))
            : MOCK_BARTER_ITEMS;
          finalItems = mockItems as SwipeItem[];
        } else {
          // Use API results (even if empty when filters are applied, or for Services tab)
          finalItems = transformedItems;
        }
        
        setItems(finalItems);
        
        // Check if category/location changed (not just tab)
        const categoryChanged = prevFiltersRef.current.categoryId !== selectedCategoryId;
        const locationChanged = prevFiltersRef.current.location !== selectedLocation;
        
        if (categoryChanged || locationChanged) {
          // Category or location filter changed - reset to first item
          setCurrentIndex(0);
          tabIndicesRef.current[activeTab] = 0;
          // Note: onIndexChange will be called by the effect at line 144-149 when currentIndex changes
        } else {
          // Tab change or initial load - clamp currentIndex to valid range
          const maxIndex = Math.max(0, finalItems.length - 1);
          const validIndex = Math.min(Math.max(0, currentIndex), maxIndex);
          if (validIndex !== currentIndex) {
            setCurrentIndex(validIndex);
          }
        }
        
        // Update ref to track current filters
        prevFiltersRef.current = {
          tab: activeTab,
          categoryId: selectedCategoryId,
          location: selectedLocation,
        };
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
  }, [activeTab, selectedCategoryId, selectedLocation, token]);

  const currentItem = items[currentIndex];

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
      return;
    }

    if (activeTab === 'Swap') {
      setShowOfferModal(true);
    } else if (activeTab === 'Marketplace') {
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

  // Handle direct buy request - sends message without modal
  const handleDirectBuyRequest = async () => {
    // Check if login is required
    if (requiresLogin('buy_request')) {
      setShowLoginPrompt(true);
      return;
    }

    const currentItem = items[currentIndex];
    if (!currentItem || !token) {
      return;
    }

    // Only for marketplace items
    if (currentItem.type !== 'marketplace') {
      return;
    }

    const sellerId = currentItem.owner?.id;
    if (!sellerId) {
      alert('Unable to find seller information');
      return;
    }

    // Set loading state
    setIsSendingBuyRequest(true);

    // Default buy request message
    const buyRequestMessage = "I'm interested in buying this item. Is it still available?";

    try {
      const response = await apiFetch(ENDPOINTS.conversations.start, {
        method: 'POST',
        token,
        body: {
          recipient_id: sellerId,
          message_text: buyRequestMessage,
          item_id: currentItem.id,
        },
      });

      // Track as a swipe right (like) since sending buy request acknowledges interest
      try {
        await apiFetch(ENDPOINTS.swipes.create, {
          method: 'POST',
          token,
          body: {
            target_item_id: currentItem.id,
            direction: 'right',
          },
        });

        // Update liked items state
        setLikedItems(prev => {
          const newSet = new Set(prev);
          newSet.add(currentItem.id);
          return newSet;
        });
      } catch (swipeError) {
        // Silently fail - swipe tracking is not critical for UX
        console.debug('Failed to track swipe:', swipeError);
      }

      // Show success toast that auto-dismisses
      setBuyRequestSellerName(currentItem.owner.name);
      setShowBuyRequestToast(true);

      // Advance to next item after a short delay to show the toast
      // This acknowledges the action and moves to the next card
      setTimeout(() => {
        // Track swipe count for Marketplace and Swap tabs (for promo card and ad card)
        if (activeTab === 'Marketplace' || activeTab === 'Swap') {
          // Track swipe for ad card (returns true if ad card should show)
          const shouldShowAdCard = trackSwipeForAdCard();
          
          if (shouldShowAdCard) {
            return; // Don't advance index yet, ad card will be shown
          }
          
          // Check for promo card (only if ad card won't show)
          setSwipeCount(prevCount => {
            const newCount = prevCount + 1;
            // Show promo card every PROMO_CARD_INTERVAL swipes
            if (newCount > 0 && newCount % PROMO_CARD_INTERVAL === 0) {
              setShowPromoCard(true);
              return prevCount; // Don't update count yet, promo card will be shown
            }
            // Only advance if not showing promo card
            setCurrentIndex(prev => prev + 1);
            return newCount;
          });
        } else {
          // For other tabs, just advance
          setCurrentIndex(prev => prev + 1);
        }
      }, 500); // Small delay to show toast before advancing
    } catch (err: any) {
      console.error('Failed to send buy request:', err);
      alert(err.message || 'Failed to send buy request. Please try again.');
    } finally {
      setIsSendingBuyRequest(false);
    }
  };

  const handleLoginMethod = (method: 'google' | 'email') => {
    setShowLoginPrompt(false);
    if (onLoginRequest) {
      onLoginRequest(method);
    }
  };

  const handleSignUp = () => {
    setShowLoginPrompt(false);
    if (onSignUpRequest) {
      onSignUpRequest();
    }
  };

  const completeRightSwipe = () => {
    setShowOfferModal(false);
    setShowMarketplaceModal(false);
    
    // Track swipe count for Marketplace and Swap tabs (for promo card and ad card)
    if (activeTab === 'Marketplace' || activeTab === 'Swap') {
      // Track swipe for ad card (returns true if ad card should show)
      const shouldShowAdCard = trackSwipeForAdCard();
      
      if (shouldShowAdCard) {
        return; // Don't advance index yet, ad card will be shown
      }
      
      // Check for promo card (only if ad card won't show)
      const newCount = swipeCount + 1;
      setSwipeCount(newCount);
      // Show promo card every PROMO_CARD_INTERVAL swipes
      if (newCount > 0 && newCount % PROMO_CARD_INTERVAL === 0) {
        setShowPromoCard(true);
        return; // Don't advance index yet, promo card will be shown
      }
    }
    
    setCurrentIndex(prev => {
      const newIndex = prev + 1;
      // Note: onIndexChange will be called by the effect at line 144-149 when currentIndex changes
      return newIndex;
    });
  };

  /**
   * Handle like button click on swipe card
   * Creates a right swipe (like) or left swipe (unlike) via API
   */
  const handleLike = async (itemId: number, isCurrentlyLiked: boolean) => {
    // Check if user is authenticated
    if (!isAuthenticated || !token) {
      setShowLoginPrompt(true);
      return;
    }

    // Find the current item to check its type
    const currentItem = items.find(item => item.id === itemId);
    if (!currentItem) {
      console.error('Item not found:', itemId);
      return;
    }

    try {
      // Determine direction: if currently liked, unlike (left), otherwise like (right)
      const direction = isCurrentlyLiked ? 'left' : 'right';

      // For barter items, right swipe requires an offered_item_id
      // For now, we'll allow likes on marketplace items without offering
      // Barter items will show an error if user tries to like without offering
      const payload: any = {
        target_item_id: itemId,
        direction: direction,
      };

      // Only include offered_item_id for barter items on right swipe
      // For marketplace items or left swipes, it's optional/not needed
      if (direction === 'right' && currentItem.type === 'barter') {
        // For barter items, we can't like without offering an item
        // This will trigger the modal flow instead
        // For now, we'll just show a message or handle it differently
        // You might want to show a modal asking user to select an item to offer
        console.warn('Barter items require an offered item to like');
        // For now, we'll still try to create the swipe, and the backend will return an error
        // which we'll handle gracefully
      }

      // Call the swipe API
      const response = await apiFetch(ENDPOINTS.swipes.create, {
        method: 'POST',
        token,
        body: payload,
      });

      // Update liked items state only if successful
      setLikedItems(prev => {
        const newSet = new Set(prev);
        if (direction === 'right') {
          newSet.add(itemId);
        } else {
          newSet.delete(itemId);
        }
        return newSet;
      });

      // If a match was created, we could show a notification here
      if (response.match_created) {
        console.log('Match created!', response.match_id);
        // You could show a toast notification here
      }
    } catch (error: any) {
      console.error('Failed to like/unlike item:', error);
      
      // Handle specific error cases
      if (error.message?.includes('offered_item_id is required')) {
        // For barter items, show a more helpful message
        alert('To like a swap item, you need to offer an item in return. Please use the swipe right button to make an offer.');
      } else if (error.message?.includes('Cannot swipe on your own item')) {
        alert('You cannot like your own items.');
      } else if (error.message?.includes('User blocked')) {
        alert('This action is not available.');
      } else {
        // Generic error message
        alert(error.message || 'Failed to update like status. Please try again.');
      }
    }
  };


  const resetStack = () => {
    setCurrentIndex(0);
    // Note: onIndexChange will be called by the effect at line 144-149 when currentIndex changes
  };

  /**
   * Handle view count update from view tracking
   * Updates the view count for a specific item in the items array
   */
  const handleViewCountUpdate = (itemId: number | string, viewCount: number) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, views: viewCount }
          : item
      )
    );
  };

  const handleCategorySelect = (category: string) => {
    console.log('[SwipeScreen] Category selected:', category);
    setSelectedCategory(category);
    // Find and store the category ID for API filtering
    if (category === 'All Categories') {
      setSelectedCategoryId(null);
    } else {
      const cat = categories.find(c => c.name === category);
      setSelectedCategoryId(cat?.id || null);
    }
    setShowCategoryDropdown(false);
  };

  const handleLocationSelect = (location: string) => {
    console.log('[SwipeScreen] Location selected:', location);
    setSelectedLocation(location);
    setShowLocationDropdown(false);
  };

  // Build category options list (with "All Categories" first)
  const categoryOptions = ['All Categories', ...categories.map(cat => cat.name)];

  // Build location options list (with "All Locations" first)
  const locationOptions = ['all', ...locations.map(loc => loc.name)];

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header & Filters */}
      <SwipeHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        selectedCategory={selectedCategory}
        selectedLocation={selectedLocation}
        showCategoryDropdown={showCategoryDropdown}
        showLocationDropdown={showLocationDropdown}
        loadingFilters={loadingFilters}
        categoryOptions={categoryOptions}
        locationOptions={locationOptions}
        onCategoryToggle={() => setShowCategoryDropdown(!showCategoryDropdown)}
        onLocationToggle={() => setShowLocationDropdown(!showLocationDropdown)}
        onCategorySelect={handleCategorySelect}
        onLocationSelect={handleLocationSelect}
      />

      {/* Card Stack */}
      <SwipeCardStack
        items={items}
        currentIndex={currentIndex}
        activeTab={activeTab}
        loading={loading}
        likedItems={likedItems}
        showWelcomeCard={showWelcomeCard}
        showPromoCard={showPromoCard}
        showAdCard={showAdCard}
        showSignupWelcomeCard={showSignupWelcomeCard}
        currentUserId={user?.id}
        onLike={handleLike}
        onSwipeLeft={async () => {
          // Track swipe count for Marketplace and Swap tabs (for promo card and ad card)
          if (activeTab === 'Marketplace' || activeTab === 'Swap') {
            // Track swipe for ad card (returns true if ad card should show)
            const shouldShowAdCard = trackSwipeForAdCard();
            
            if (shouldShowAdCard) {
              return; // Don't advance index yet, ad card will be shown
            }
            
            // Check for promo card (only if ad card won't show)
            setSwipeCount(prevCount => {
              const newCount = prevCount + 1;
              // Show promo card every PROMO_CARD_INTERVAL swipes
              if (newCount > 0 && newCount % PROMO_CARD_INTERVAL === 0) {
                setShowPromoCard(true);
                return prevCount; // Don't update count yet, promo card will handle it
              }
              // If neither card shows, advance to next item
              setCurrentIndex(prevIndex => prevIndex + 1);
              return newCount;
            });
            // Note: Don't return here - let the setSwipeCount callback handle advancement
          } else {
            // For other tabs, just advance
            setCurrentIndex(prev => {
              const newIndex = prev + 1;
              // Note: onIndexChange will be called by the effect at line 144-149 when currentIndex changes
              return newIndex;
            });
          }
        }}
        onSwipeRight={handleRightSwipe}
        onDirectBuyRequest={handleDirectBuyRequest}
        isSendingBuyRequest={isSendingBuyRequest}
        onItemClick={(item) => onItemClick(item, activeTab, currentIndex)}
        onReset={resetStack}
        onViewCountUpdate={handleViewCountUpdate}
        onWelcomeCardDismiss={() => {
          // Mark welcome card as dismissed and save to localStorage
          setShowWelcomeCard(false);
          localStorage.setItem(WELCOME_CARD_DISMISSED_KEY, 'true');
        }}
        onPromoCardDismiss={() => {
          // Hide promo card and continue to next item
          setShowPromoCard(false);
          setCurrentIndex(prev => {
            const newIndex = prev + 1;
            // Note: onIndexChange will be called by the effect at line 144-149 when currentIndex changes
            return newIndex;
          });
        }}
        onAdCardDismiss={() => {
          // Hide ad card and continue to next item
          setShowAdCard(false);
          setCurrentIndex(prev => {
            const newIndex = prev + 1;
            // Note: onIndexChange will be called by the effect at line 144-149 when currentIndex changes
            return newIndex;
          });
        }}
        onAdCardAction={() => {
          // Handle ad card action - could navigate to upload screen or show login prompt
          // For now, just dismiss the card
          setShowAdCard(false);
          setCurrentIndex(prev => {
            const newIndex = prev + 1;
            return newIndex;
          });
          // TODO: Navigate to upload screen if needed
        }}
        onSignupWelcomeCardDismiss={() => {
          // Mark signup welcome card as dismissed and save to localStorage
          setShowSignupWelcomeCard(false);
          localStorage.setItem(SIGNUP_WELCOME_CARD_DISMISSED_KEY, 'true');
          // Also dismiss the regular welcome card since they've seen the signup one
          setShowWelcomeCard(false);
          localStorage.setItem(WELCOME_CARD_DISMISSED_KEY, 'true');
        }}
      />

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={handleLoginMethod}
        onSignUp={onSignUpRequest ? handleSignUp : undefined}
      />

      {/* Modals */}
      <SwipeModals
        showOfferModal={showOfferModal}
        showMarketplaceModal={showMarketplaceModal}
        currentItem={currentItem}
        activeTab={activeTab}
        onCloseOffer={() => setShowOfferModal(false)}
        onCloseMarketplace={() => setShowMarketplaceModal(false)}
        onComplete={completeRightSwipe}
      />

      {/* Buy Request Success Toast */}
      <BuyRequestToast
        isOpen={showBuyRequestToast}
        onClose={() => setShowBuyRequestToast(false)}
        sellerName={buyRequestSellerName}
        duration={3000}
      />
    </div>
  );
};
