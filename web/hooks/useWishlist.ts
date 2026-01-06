import { useState, useCallback } from 'react';
import { Product } from '../types';
import { getStoredToken, apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

export const useWishlist = () => {
  const [likedItems, setLikedItems] = useState<Product[]>([]);

  // Fetch wishlist from backend
  const fetchWishlist = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setLikedItems([]);
      return;
    }

    try {
      const response = await apiFetch(ENDPOINTS.swipes.wishlist, { token }) as any;
      const wishlistItems = response.data?.items || [];

      // Transform backend items to Product format
      const formattedItems: Product[] = wishlistItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        images: item.images || (item.image ? [item.image] : []),
        image: item.image || (item.images && item.images[0] ? item.images[0] : 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=800'),
        isSuper: item.isSuper || true,
        owner: item.owner,
      }));

      setLikedItems(formattedItems);
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
      // Keep existing wishlist items on error
    }
  }, []);

  const removeFromWishlist = async (id: number) => {
    // Optimistically update UI
    setLikedItems(prev => prev.filter(item => item.id !== id));

    // Note: We don't have a delete endpoint for wishlist items yet
    // The backend will automatically clean them up after 24 hours
    // For now, we just remove from local state
    // If you want immediate deletion, you could add a DELETE /swipes/{id} endpoint
  };

  return {
    likedItems,
    setLikedItems,
    fetchWishlist,
    removeFromWishlist
  };
};

