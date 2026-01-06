import { useQuery } from '@tanstack/react-query';
import { fetcher } from './fetcher';
import { ENDPOINTS } from '../../constants/endpoints';

export const useCities = () => {
    return useQuery({
        queryKey: ['locations', 'cities'],
        queryFn: () => fetcher<any>(ENDPOINTS.locationsCities),
        select: (data: any) => data.cities || data.data?.cities || data,
    });
};

export const useAreas = (cityId: number | string | null) => {
    return useQuery({
        queryKey: ['locations', 'areas', cityId],
        queryFn: () => fetcher<any>(ENDPOINTS.locationsAreas(cityId!)),
        enabled: !!cityId,
        select: (data: any) => data.areas || data.data?.areas || data,
    });
};
