import { useState, useEffect } from 'react';
import { getStoredToken, apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

export const useLocation = () => {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationPermissionChecked, setLocationPermissionChecked] = useState(false);
  const [currentCity, setCurrentCity] = useState("All Locations");
  const [cities, setCities] = useState<Array<{ id: number; name: string }>>([]);

  // Fetch cities from backend on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const citiesResponse = await apiFetch(ENDPOINTS.locationsCities);
        const citiesData = citiesResponse.data?.cities || citiesResponse.cities || [];
        setCities(citiesData);
      } catch (error) {
        console.error('Failed to fetch cities:', error);
      }
    };

    fetchCities();
  }, []);

  // Check location status and show modal if needed
  const checkLocationAndShowModal = async () => {
    if (locationPermissionChecked) return;

    // Always check status (auth or guest)
    const token = getStoredToken();

    try {
      const response = await apiFetch(ENDPOINTS.location.status, token ? { token } : {}) as any;
      if (!response.data?.has_location) {
        setShowLocationModal(true);
      }
    } catch (err) {
      // If location status check fails, show modal anyway to be safe
      console.error('Failed to check location status:', err);
      setShowLocationModal(true);
    } finally {
      setLocationPermissionChecked(true);
    }
  };

  return {
    showLocationModal,
    setShowLocationModal,
    currentCity,
    setCurrentCity,
    cities,
    checkLocationAndShowModal
  };
};


