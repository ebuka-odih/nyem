import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from './fetcher';
import { ENDPOINTS } from '../../constants/endpoints';

export const useWishlistQuery = () => {
    return useQuery({
        queryKey: ['wishlist'],
        queryFn: () => fetcher<any>(ENDPOINTS.swipes.wishlist),
        select: (data) => data.items || [],
        enabled: !!localStorage.getItem('auth_token'),
    });
};
