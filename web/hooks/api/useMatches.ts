import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from './fetcher';
import { ENDPOINTS } from '../../constants/endpoints';

export const useConversations = () => {
    return useQuery({
        queryKey: ['conversations'],
        queryFn: () => fetcher<any[]>(ENDPOINTS.conversations.list),
    });
};

export const useMessageRequests = () => {
    return useQuery({
        queryKey: ['message-requests'],
        queryFn: () => fetcher<any[]>(ENDPOINTS.messageRequests.pending),
    });
};

export const useRespondToRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, decision }: { id: string | number; decision: 'accept' | 'decline' }) =>
            fetcher(ENDPOINTS.messageRequests.respond(id), {
                method: 'POST',
                body: { decision }
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['message-requests'] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    });
};

export const useMessages = (conversationId: string | number) => {
    return useQuery({
        queryKey: ['messages', conversationId],
        queryFn: () => fetcher<any[]>(ENDPOINTS.conversations.messages(conversationId)),
        enabled: !!conversationId,
    });
};

export const useSendMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { conversation_id: string | number; message_text: string; receiver_id: string | number }) =>
            fetcher(ENDPOINTS.messages.create, { method: 'POST', body: data }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['messages', variables.conversation_id] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    });
};
