import { useWishlistQuery } from './api/useWishlist';

export const useWishlist = () => {
  const { data: likedItems = [], refetch: fetchWishlist } = useWishlistQuery();

  const removeFromWishlist = async (id: number) => {
    // Current backend doesn't support immediate deletion, just filters locally for now
    // Note: React Query's setQueryData could be used for optimistic local updates
  };

  return {
    likedItems,
    fetchWishlist,
    removeFromWishlist
  };
};


