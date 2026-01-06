import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from './fetcher';
import { ENDPOINTS } from '../../constants/endpoints';
import { storeUser, getStoredToken } from '../../utils/api';

export const useProfile = () => {
    const token = getStoredToken();
    return useQuery({
        queryKey: ['profile', 'me'],
        queryFn: () => fetcher<any>(ENDPOINTS.profile.me),
        enabled: !!token,
        select: (data: any) => data.user || data.data?.user || data,
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => fetcher(ENDPOINTS.profile.update, { method: 'PUT', body: data }),
        onSuccess: (data: any) => {
            const user = data.user || data.data?.user || data;
            if (user) {
                storeUser(user);
            }
            queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
        },
    });
};
