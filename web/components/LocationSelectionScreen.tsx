import React, { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { AppHeader } from './AppHeader';
import { Button } from './Button';

interface LocationSelectionScreenProps {
  onComplete: () => void;
  onSkip?: () => void;
}

interface City {
  id: number;
  name: string;
  slug: string;
  sort_order?: number;
}

interface Area {
  id: number;
  name: string;
  slug: string;
  parent_id: number;
  sort_order?: number;
}

export const LocationSelectionScreen: React.FC<LocationSelectionScreenProps> = ({ 
  onComplete, 
  onSkip 
}) => {
  const { updateProfile, refreshUser, token } = useAuth();
  const [cityId, setCityId] = useState<number | ''>('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Location data
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // Fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        setError(null);
        const res = await apiFetch(ENDPOINTS.locationsCities);
        // Handle both response formats: { data: { cities: [...] } } or { cities: [...] }
        const citiesData = res.data?.cities || res.cities || [];
        if (citiesData.length === 0) {
          console.warn('No cities returned from API');
        }
        setCities(citiesData);
      } catch (err) {
        console.error('Failed to fetch cities:', err);
        setError('Failed to load cities. Please try again.');
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, []);

  // Fetch areas when city is selected
  useEffect(() => {
    const fetchAreas = async () => {
      if (!cityId) {
        setAreas([]);
        setAreaId('');
        return;
      }

      try {
        setLoadingAreas(true);
        const res = await apiFetch(ENDPOINTS.locationsAreas(cityId));
        const areasData = res.data?.areas || res.areas || [];
        setAreas(areasData);
        
        // Clear area selection when city changes
        setAreaId('');
      } catch (err) {
        console.error('Failed to fetch areas:', err);
        setAreas([]);
      } finally {
        setLoadingAreas(false);
      }
    };

    fetchAreas();
  }, [cityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cityId) {
      setError('Please select your city');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        city_id: cityId,
      };

      // Add area_id if selected
      if (areaId) {
        updateData.area_id = areaId;
      }

      await updateProfile(updateData);
      await refreshUser();
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to update location. Please try again.');
      console.error('Update location error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <AppHeader 
        title="Select Location" 
        className="sticky top-0"
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-md mx-auto">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand/10 flex items-center justify-center">
              <MapPin size={32} className="text-brand" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Where are you located?
            </h2>
            <p className="text-gray-600 text-sm">
              Help us show you items and services near you
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* City Selection */}
            <div>
              <label className="block text-brand font-bold text-sm mb-2 flex items-center gap-2">
                <MapPin size={14} />
                City *
              </label>
              <div className="relative">
                <select 
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value ? parseInt(e.target.value) : '')}
                  disabled={loadingCities}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select your city</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              </div>
              {loadingCities && (
                <p className="text-xs text-gray-400 mt-2 pl-1">Loading cities...</p>
              )}
            </div>

            {/* Area Selection (Optional) */}
            {cityId && (
              <div>
                <label className="block text-brand font-bold text-sm mb-2 flex items-center gap-2">
                  <MapPin size={14} />
                  Area {areas.length > 0 ? '(Optional)' : ''}
                </label>
                <div className="relative">
                  <select 
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value ? parseInt(e.target.value) : '')}
                    disabled={loadingAreas || areas.length === 0}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select your area (optional)</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
                {loadingAreas && (
                  <p className="text-xs text-gray-400 mt-2 pl-1">Loading areas...</p>
                )}
                {!loadingAreas && areas.length === 0 && cityId && (
                  <p className="text-xs text-gray-400 mt-2 pl-1">No areas available for this city</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                fullWidth 
                className="bg-brand hover:bg-brand-light text-white rounded-xl py-4 shadow-lg text-lg"
                onClick={handleSubmit}
                disabled={loading || !cityId}
                type="submit"
              >
                {loading ? 'Saving...' : 'Continue'}
              </Button>
            </div>

            {/* Skip Button */}
            {onSkip && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full text-center text-gray-500 hover:text-gray-700 text-sm font-medium py-2"
                  disabled={loading}
                >
                  Skip for now
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
