import { useQuery } from '@tanstack/react-query';
import { fetcher } from './fetcher';
import { ENDPOINTS } from '../../constants/endpoints';

/**
 * Hook to fetch listing context for a conversation
 * This checks both matches and message requests to find the relevant listing
 */
export const useConversationListing = (conversationId: string) => {
    return useQuery({
        queryKey: ['conversation-listing', conversationId],
        queryFn: async () => {
            // First try to get from matches
            const matchesData = await fetcher<{ matches: any[] }>(
                ENDPOINTS.conversations.matches(conversationId)
            );

            if (matchesData?.matches && matchesData.matches.length > 0) {
                const match = matchesData.matches[0];
                const listing = match.my_listing || match.my_item || match.their_listing || match.their_item || match.listing1 || match.listing2;

                if (listing) {
                    return {
                        id: listing.id,
                        title: listing.title || 'Unknown Listing',
                        photo: listing.photos?.[0] || listing.photo || null,
                        price: listing.price,
                    };
                }
            }

            return null;
        },
        enabled: !!conversationId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
