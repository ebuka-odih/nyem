import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from './fetcher';
import { ENDPOINTS } from '../../constants/endpoints';
import { transformListingToProduct } from '../../utils/productTransformers';

export const useListingsFeed = (filters: {
    activeTab: string;
    activeCategory: string;
    currentCity: string;
}) => {
    const { activeTab, activeCategory, currentCity } = filters;

    return useQuery({
        queryKey: ['listings', 'feed', filters],
        queryFn: () => {
            const params: string[] = [];
            params.push('type=marketplace');

            if (activeCategory !== "All") {
                params.push(`category=${encodeURIComponent(activeCategory)}`);
            }

            if (currentCity === "All Locations") {
                params.push('city=all');
                params.push('ignore_city=true');
            } else {
                params.push(`city=${encodeURIComponent(currentCity)}`);
            }

            const feedUrl = `${ENDPOINTS.items.feed}?${params.join('&')}`;
            return fetcher<any[]>(feedUrl);
        },
        enabled: activeTab === 'marketplace',
        select: (data) => data.map(transformListingToProduct),
    });
};

export const useCreateSwipe = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { target_listing_id: string | number; direction: 'left' | 'right' | 'up' }) =>
            fetcher(ENDPOINTS.swipes.create, { method: 'POST', body: data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            queryClient.invalidateQueries({ queryKey: ['message-requests'] });
        }
    });
};

export const useCreateListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => fetcher(ENDPOINTS.listings.create, { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    }
  });
};

export const useUpdateListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => 
      fetcher(ENDPOINTS.items.update(id), { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    }
  });
};

export const useDeleteListing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => 
      fetcher(ENDPOINTS.items.delete(id), { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    }
  });
};
