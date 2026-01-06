import { useState, useCallback } from 'react';
import { Product } from '../types';
import { getStoredToken, apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { transformListingToProduct, createAdItem } from '../utils/productTransformers';

export const useItems = (activeTab: 'marketplace' | 'services' | 'barter', activeCategory: string, currentCity: string) => {
  const [items, setItems] = useState<Product[]>([]);
  const [history, setHistory] = useState<Product[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [swipeCount, setSwipeCount] = useState(0);

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

      // Add city filter - send 'all' to show all cities, or specific city name
      if (currentCity === "All Locations") {
        params.push('city=all');
        // Also add ignore_city to ensure all listings are shown regardless of environment
        params.push('ignore_city=true');
      } else {
        // Send the city name exactly as it appears in the database
        // The city name should match what's stored in listings.city field
        params.push(`city=${encodeURIComponent(currentCity)}`);
        // Don't send ignore_city when filtering by specific city
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
      setSwipeCount(0);
    } catch (error) {
      console.error('[Discover] Failed to fetch items:', error);
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [activeTab, activeCategory, currentCity]);

  const undoLast = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setItems(prev => [...prev, last]);
    setHistory(prev => prev.slice(0, -1));
  }, [history]);

  const removeItem = useCallback((item: Product) => {
    // If it's an ad, just remove it and return
    if (item.isAd) {
      setItems(prev => prev.slice(0, -1));
      return;
    }

    const nextSwipeCount = swipeCount + 1;
    setSwipeCount(nextSwipeCount);

    setHistory(prev => [...prev, item]);
    setItems(prev => {
      const newList = prev.slice(0, -1);
      // If we've reached 3 swipes, insert an ad card as the next item
      if (nextSwipeCount % 3 === 0 && newList.length > 0) {
        return [...newList, createAdItem()];
      }
      return newList;
    });
  }, [swipeCount]);

  return {
    items,
    setItems,
    history,
    setHistory,
    loadingItems,
    swipeCount,
    setSwipeCount,
    fetchItems,
    undoLast,
    removeItem
  };
};

