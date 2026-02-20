import { useState, useCallback, useEffect, useRef } from 'react';
import { Product } from '../types';
import { getStoredToken } from '../utils/api';
import { transformListingToProduct, createAdItem, createWelcomeItem } from '../utils/productTransformers';
import { useListingsFeed } from './api/useListings';
import { DiscoverTab } from '../constants/discoverTabs';

// Storage key generator based on filters
const getStorageKey = (activeTab: string, activeCategory: string, currentCity: string) => {
  return `discover_state_${activeTab}_${activeCategory}_${currentCity}`;
};

// Interface for persisted state
interface PersistedState {
  items: Product[];
  history: Product[];
  swipeCount: number;
  timestamp: number;
  filters: {
    activeTab: string;
    activeCategory: string;
    currentCity: string;
  };
}

export const useItems = (activeTab: DiscoverTab, activeCategory: string, currentCity: string) => {
  // Try to restore from localStorage on initial mount
  const storageKey = getStorageKey(activeTab, activeCategory, currentCity);
  const restoredState = (() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: PersistedState = JSON.parse(stored);
        // Check if stored state matches current filters and is not too old (24 hours)
        const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
        const filtersMatch =
          parsed.filters.activeTab === activeTab &&
          parsed.filters.activeCategory === activeCategory &&
          parsed.filters.currentCity === currentCity;

        if (!isExpired && filtersMatch && parsed.items.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to restore discover state:', e);
    }
    return null;
  })();

  const [items, setItems] = useState<Product[]>(() => {
    if (!restoredState?.items) return [];
    const uniqueMap = new Map();
    restoredState.items.forEach(item => uniqueMap.set(item.id, item));
    return Array.from(uniqueMap.values());
  });
  const [history, setHistory] = useState<Product[]>(restoredState?.history || []);
  const [swipeCount, setSwipeCount] = useState(restoredState?.swipeCount || 0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Track previous filters to detect changes
  const prevFiltersRef = useRef({ activeTab, activeCategory, currentCity });
  const hasRestoredRef = useRef(!!restoredState);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    const stateToPersist: PersistedState = {
      items,
      history,
      swipeCount,
      timestamp: Date.now(),
      filters: { activeTab, activeCategory, currentCity }
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(stateToPersist));
    } catch (e) {
      console.warn('Failed to persist discover state:', e);
    }
  }, [items, history, swipeCount, activeTab, activeCategory, currentCity, storageKey]);

  // Clear persisted state when filters change
  useEffect(() => {
    const prevFilters = prevFiltersRef.current;
    const filtersChanged =
      prevFilters.activeTab !== activeTab ||
      prevFilters.activeCategory !== activeCategory ||
      prevFilters.currentCity !== currentCity;

    if (filtersChanged) {
      // Clear old storage key
      try {
        const oldKey = getStorageKey(prevFilters.activeTab, prevFilters.activeCategory, prevFilters.currentCity);
        localStorage.removeItem(oldKey);
      } catch (e) {
        console.warn('Failed to clear old discover state:', e);
      }

      // Reset state when filters change
      setItems([]);
      setHistory([]);
      setSwipeCount(0);
      hasRestoredRef.current = false;
      prevFiltersRef.current = { activeTab, activeCategory, currentCity };
    }
  }, [activeTab, activeCategory, currentCity]);

  // Use React Query for fetching
  const {
    data: fetchedItems,
    isLoading: loadingItems,
    refetch: fetchItems
  } = useListingsFeed({ activeTab, activeCategory, currentCity });

  // Sync fetched items with local items state
  useEffect(() => {
    if (fetchedItems && fetchedItems.length > 0 && items.length === 0 && !hasRestoredRef.current) {
      // Reverse so latest items are at the end of the array (top of the stack)
      let finalItems = [...fetchedItems].reverse();

      // Deduplicate items by ID to prevent duplicate key errors
      const uniqueItemsMap = new Map();
      finalItems.forEach(item => {
        uniqueItemsMap.set(item.id, item);
      });
      finalItems = Array.from(uniqueItemsMap.values());

      // Add Welcome Card if needed
      const hasSeenWelcome = localStorage.getItem('has_seen_welcome_card') === 'true';
      if (!hasSeenWelcome) {
        finalItems.push(createWelcomeItem());
      }
      setItems(finalItems);
    }
  }, [fetchedItems, items.length, refreshTrigger]);

  const undoLast = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setItems(prev => [...prev, last]);
    setHistory(prev => prev.slice(0, -1));
  }, [history]);

  const removeItem = useCallback((item: Product) => {
    // If it's an ad or welcome card, just remove it and return
    if (item.isAd || item.isWelcome) {
      if (item.isWelcome) {
        localStorage.setItem('has_seen_welcome_card', 'true');
      }
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
    fetchItems: useCallback(() => {
      hasRestoredRef.current = false;
      setRefreshTrigger(p => p + 1);
      return fetchItems();
    }, [fetchItems]),
    undoLast,
    removeItem
  };
};
