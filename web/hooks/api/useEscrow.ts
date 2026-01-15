import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, getStoredToken } from '../../utils/api';
import { ENDPOINTS } from '../../constants/endpoints';

export const useCreateEscrow = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { seller_id: string | number; amount: number; description?: string }) => {
            const token = getStoredToken();
            if (!token) throw new Error('Authentication required');

            return await apiFetch(ENDPOINTS.escrows.store, {
                method: 'POST',
                token,
                body: data,
            });
        },
        onSuccess: () => {
            // Invalidate relevant queries if needed
            queryClient.invalidateQueries({ queryKey: ['escrows'] });
        },
    });
};

export const useConfirmEscrowPayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ escrowId, reference }: { escrowId: string | number; reference: string }) => {
            const token = getStoredToken();
            if (!token) throw new Error('Authentication required');

            return await apiFetch(ENDPOINTS.escrows.verifyPayment(escrowId), {
                method: 'POST',
                token,
                body: { reference },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['escrows'] });
        },
    });
};

export const useConfirmEscrowDelivery = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (escrowId: string | number) => {
            const token = getStoredToken();
            if (!token) throw new Error('Authentication required');

            return await apiFetch(ENDPOINTS.escrows.confirm(escrowId), {
                method: 'POST',
                token,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['escrows'] });
        },
    });
};
