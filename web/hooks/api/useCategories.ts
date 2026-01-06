import { useQuery } from '@tanstack/react-query';
import { fetcher } from './fetcher';
import { ENDPOINTS } from '../../constants/endpoints';

export interface Category {
    id: number;
    name: string;
}

export const useCategories = (parent: string = 'Shop') => {
    return useQuery({
        queryKey: ['categories', parent],
        queryFn: () => fetcher<any>(`${ENDPOINTS.categories}?parent=${parent}`),
        select: (data) => {
            if (Array.isArray(data)) return data;
            if (data && typeof data === 'object') {
                return data.categories || data.data?.categories || data.data || [];
            }
            return [];
        }
    });
};
