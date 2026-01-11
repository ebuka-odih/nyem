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

export const usePaymentSettings = () => {
    const token = getStoredToken();
    return useQuery({
        queryKey: ['profile', 'payments'],
        queryFn: () => fetcher<any>(ENDPOINTS.profile.payments),
        enabled: !!token,
    });
};

export const useUpdatePaymentSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => fetcher(ENDPOINTS.profile.payments, { method: 'PUT', body: data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile', 'payments'] });
        },
    });
};

export const useBanks = () => {
    const token = getStoredToken();
    return useQuery({
        queryKey: ['profile', 'banks'],
        queryFn: () => fetcher<any>(ENDPOINTS.profile.getBanks),
        enabled: !!token,
        select: (data: any) => data.banks || [],
    });
};

export const useVerifyBank = () => {
    return useMutation({
        mutationFn: (data: { account_number: string; bank_code: string }) =>
            fetcher(ENDPOINTS.profile.verifyBank, { method: 'POST', body: data }),
    });
};

export const useUpdatePassword = () => {
    return useMutation({
        mutationFn: (data: any) => fetcher(ENDPOINTS.profile.updatePassword, { method: 'PUT', body: data }),
    });
};
