
import React, { useState, useEffect, useRef } from 'react';
import { LoginPromptModal } from './LoginPromptModal';
import { SwipeItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { SwipeHeader } from './swipe/SwipeHeader';
import { SwipeCardStack } from './swipe/SwipeCardStack';
import { SwipeModals } from './swipe/SwipeModals';

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
  onItemClick: (item: SwipeItem, currentTab?: 'Marketplace' | 'Services' | 'Swap', currentIndex?: number) => void;
  onLoginRequest?: (method: 'google' | 'email') => void;
  onSignUpRequest?: () => void;
  initialTab?: 'Marketplace' | 'Services' | 'Swap';
  onTabChange?: (tab: 'Marketplace' | 'Services' | 'Swap') => void;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

export const SwipeScreen: React.FC<SwipeScreenProps> = ({ onBack, onItemClick, onLoginRequest, onSignUpRequest, initialTab = 'Marketplace', onTabChange, initialIndex = 0, onIndexChange }) => {
  const { token, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'Marketplace' | 'Services' | 'Swap'>(initialTab);
  const [items, setItems] = useState<SwipeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  
  // Track previous filter values to detect when they change
  const prevFiltersRef = useRef<{ tab: string; category: string; location: string }>({
    tab: initialTab,
    category: 'All Categories',
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
    setActiveTab(tab);
    setLoading(true); // Show loading immediately when tab changes
    // Reset to first item when tab changes (user explicitly changed tab)
    setCurrentIndex(0);
    if (onIndexChange) {
      onIndexChange(0);
    }
    if (onTabChange) {
      onTabChange(tab);
    }
  };

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
          description: item.description || 'This is a dummy description to demonstrate how the card displays longer text content. The description will be truncated to two lines with an ellipsis if it exceeds the available space. This helps maintain a clean and consistent card layout while still showing enough information to help users make informed decisions.',
          lookingFor: item.looking_for || item.lookingFor || '',
          price: item.price ? (typeof item.price === 'string' ? `₦${item.price}` : `₦${item.price}`) : undefined,
          category: item.category || undefined,
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

        // Use mock data as fallback if API returns no items (for design preview)
        let finalItems: SwipeItem[];
        if (transformedItems.length === 0) {
          const mockItems = activeTab === 'Marketplace'
            ? MOCK_MARKETPLACE_ITEMS.map(item => ({
              ...item,
              price: `₦${item.price}`,
            }))
            : MOCK_BARTER_ITEMS;
          finalItems = mockItems as SwipeItem[];
        } else {
          finalItems = transformedItems;
        }
        
        setItems(finalItems);
        
        // Only reset index if filters actually changed (not when just navigating back)
        const filtersChanged = 
          prevFiltersRef.current.tab !== activeTab ||
          prevFiltersRef.current.category !== selectedCategory ||
          prevFiltersRef.current.location !== selectedLocation;
        
        if (filtersChanged) {
          // Filters changed - reset to first item
          setCurrentIndex(0);
          if (onIndexChange) {
            onIndexChange(0);
          }
          // Update ref to track current filters
          prevFiltersRef.current = {
            tab: activeTab,
            category: selectedCategory,
            location: selectedLocation,
          };
        } else {
          // Filters didn't change - restore preserved index, but clamp to valid range
          const maxIndex = Math.max(0, finalItems.length - 1);
          const validIndex = Math.min(Math.max(0, initialIndex), maxIndex);
          if (validIndex !== currentIndex) {
            setCurrentIndex(validIndex);
            if (onIndexChange) {
              onIndexChange(validIndex);
            }
          }
        }
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
    setCurrentIndex(prev => {
      const newIndex = prev + 1;
      if (onIndexChange) {
        onIndexChange(newIndex);
      }
      return newIndex;
    });
  };


  const resetStack = () => {
    setCurrentIndex(0);
    if (onIndexChange) {
      onIndexChange(0);
    }
  };

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
        onSwipeLeft={async () => {
          setCurrentIndex(prev => {
            const newIndex = prev + 1;
            if (onIndexChange) {
              onIndexChange(newIndex);
            }
            return newIndex;
          });
        }}
        onSwipeRight={handleRightSwipe}
        onItemClick={(item) => onItemClick(item, activeTab, currentIndex)}
        onReset={resetStack}
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
    </div>
  );
};
