import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

interface Category {
  id: number;
  name: string;
  order: number;
}

interface Location {
  id: number;
  name: string;
  order: number;
}

export function useCategoriesAndLocations(parentCategory?: string) {
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Default to 'Swap' for React Native app (barter-focused)
        const parent = parentCategory || 'Swap';
        const categoriesUrl = parent 
          ? `${ENDPOINTS.categories}?parent=${encodeURIComponent(parent)}`
          : ENDPOINTS.categories;

        const [categoriesResponse, locationsResponse] = await Promise.all([
          apiFetch(categoriesUrl),
          apiFetch(ENDPOINTS.locations),
        ]);

        const categoryNames = (categoriesResponse.categories as Category[]).map((c) => c.name);
        const locationNames = (locationsResponse.locations as Location[]).map((l) => l.name);

        setCategories(categoryNames);
        setLocations(locationNames);
      } catch (err: any) {
        console.error('Failed to fetch categories/locations:', err);
        setError(err?.message || 'Failed to load data');
        // Fallback to empty array if API fails
        setCategories([]);
        setLocations(['Abuja', 'Lagos', 'Port Harcourt', 'Enugu', 'Asaba']);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [parentCategory]);

  return { categories, locations, loading, error };
}













