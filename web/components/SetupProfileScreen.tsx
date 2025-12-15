import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { ArrowLeft, Camera, User, MapPin, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

interface SetupProfileScreenProps {
  onComplete: () => void;
  onBack: () => void;
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

export const SetupProfileScreen: React.FC<SetupProfileScreenProps> = ({ onComplete, onBack }) => {
  const { updateProfile, user } = useAuth();
  const [displayname, setDisplayname] = useState((user as any)?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [cityId, setCityId] = useState<number | ''>(user?.city_id || '');
  const [areaId, setAreaId] = useState<number | ''>(user?.area_id || '');
  const [bio, setBio] = useState(user?.bio || '');
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
        const res = await apiFetch(ENDPOINTS.locationsCities);
        const citiesData = res.data?.cities || res.cities || [];
        setCities(citiesData);
      } catch (err) {
        console.error('Failed to fetch cities:', err);
        setError('Failed to load cities. Please try again.');
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
        
        // If user had an area_id but it's not in the new city's areas, clear it
        if (areaId && !areasData.find((a: Area) => a.id === areaId)) {
          setAreaId('');
        }
      } catch (err) {
        console.error('Failed to fetch areas:', err);
        setAreas([]);
      } finally {
        setLoadingAreas(false);
      }
    };

    fetchAreas();
  }, [cityId]);

  // Initialize form when user data loads
  useEffect(() => {
    if (user) {
      setDisplayname((user as any)?.name || '');
      setUsername(user.username || '');
      setCityId(user.city_id || '');
      setAreaId(user.area_id || '');
      setBio(user.bio || '');
      
      // If user has city_id but areas aren't loaded yet, fetch them
      if (user.city_id && areas.length === 0) {
        const fetchAreas = async () => {
          try {
            setLoadingAreas(true);
            const res = await apiFetch(ENDPOINTS.locationsAreas(user.city_id!));
            const areasData = res.data?.areas || res.areas || [];
            setAreas(areasData);
          } catch (err) {
            console.error('Failed to fetch areas:', err);
          } finally {
            setLoadingAreas(false);
          }
        };
        fetchAreas();
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (!cityId) {
      setError('City is required');
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        username: username.trim(),
        city_id: cityId,
        bio: bio || undefined,
      };

      // Add name (displayname) if provided
      if (displayname.trim()) {
        updateData.name = displayname.trim();
      }

      // Always include area_id - send null if not selected, or the ID if selected
      // This ensures the backend can properly clear or set the area
      updateData.area_id = areaId || null;

      await updateProfile(updateData);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
      console.error('Update profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-brand relative header-safe-top-brand">
        {/* Top Section: Header */}
        <div className="px-6 pt-8 pb-8 md:pt-10 md:pb-8 shrink-0">
            <button 
                onClick={onBack} 
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                aria-label="Go back"
            >
                <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <div className="mt-4 md:mt-6 mb-4 text-center">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-wide">
                    Setup your<br/>profile
                </h1>
            </div>
        </div>

        {/* Bottom Section: Form Card */}
        <div className="flex-1 bg-white w-full rounded-t-[36px] px-6 md:px-8 pt-10 md:pt-12 pb-6 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom duration-500">
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                
                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                        {error}
                    </div>
                )}

                {/* Avatar Upload */}
                <div className="flex justify-center mb-8">
                    <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                            <User className="w-12 h-12 text-gray-300" strokeWidth={1.5} />
                        </div>
                        <button type="button" className="absolute bottom-0 right-0 bg-brand text-white p-2.5 rounded-full shadow-md hover:bg-brand-light transition-colors z-10">
                            <Camera size={18} />
                        </button>
                    </div>
                </div>

                {/* Display Name Input */}
                <div className="flex flex-col space-y-2 mb-6">
                    <label className="text-brand font-bold text-sm">Display Name</label>
                    <input 
                        type="text" 
                        value={displayname}
                        onChange={(e) => setDisplayname(e.target.value)}
                        placeholder="Your display name" 
                        className="border-b border-gray-200 pb-2 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-brand font-medium text-lg w-full bg-transparent transition-colors rounded-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">This is how your name appears to others</p>
                </div>

                {/* Username Input */}
                <div className="flex flex-col space-y-2 mb-6">
                    <label className="text-brand font-bold text-sm">Username *</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose a username" 
                        className="border-b border-gray-200 pb-2 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-brand font-medium text-lg w-full bg-transparent transition-colors rounded-none"
                    />
                </div>

                {/* City Input */}
                <div className="flex flex-col space-y-2 mb-6">
                    <label className="text-brand font-bold text-sm flex items-center gap-2">
                        <MapPin size={14} />
                        City *
                    </label>
                    <div className="relative">
                        <select 
                            value={cityId}
                            onChange={(e) => setCityId(e.target.value ? parseInt(e.target.value) : '')}
                            disabled={loadingCities}
                            className="appearance-none border-b border-gray-200 pb-2 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-brand font-medium text-lg w-full bg-transparent transition-colors rounded-none pr-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">Select your city</option>
                            {cities.map((city) => (
                                <option key={city.id} value={city.id}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                            <ChevronDown size={18} />
                        </div>
                    </div>
                    {loadingCities && (
                        <p className="text-xs text-gray-400 mt-1">Loading cities...</p>
                    )}
                </div>

                {/* Area Input */}
                {cityId && (
                    <div className="flex flex-col space-y-2 mb-6">
                        <label className="text-brand font-bold text-sm flex items-center gap-2">
                            <MapPin size={14} />
                            Area {areas.length > 0 ? '(Optional)' : ''}
                        </label>
                        <div className="relative">
                            <select 
                                value={areaId}
                                onChange={(e) => setAreaId(e.target.value ? parseInt(e.target.value) : '')}
                                disabled={loadingAreas || areas.length === 0}
                                className="appearance-none border-b border-gray-200 pb-2 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-brand font-medium text-lg w-full bg-transparent transition-colors rounded-none pr-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">Select your area (optional)</option>
                                {areas.map((area) => (
                                    <option key={area.id} value={area.id}>
                                        {area.name}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                        {loadingAreas && (
                            <p className="text-xs text-gray-400 mt-1">Loading areas...</p>
                        )}
                        {!loadingAreas && areas.length === 0 && cityId && (
                            <p className="text-xs text-gray-400 mt-1">No areas available for this city</p>
                        )}
                    </div>
                )}

                {/* Bio Input */}
                <div className="flex flex-col space-y-2 mb-10">
                    <label className="text-brand font-bold text-sm">Short Bio</label>
                    <textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell others a little about yourself... (optional)" 
                        maxLength={500}
                        className="border-b border-gray-200 pb-2 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-brand font-medium text-lg w-full bg-transparent transition-colors rounded-none resize-none min-h-[60px]"
                    />
                    <div className="flex justify-end">
                        <p className="text-xs text-gray-400">{bio.length}/500</p>
                    </div>
                </div>
                
                {/* Submit Button */}
                <div className="mt-auto">
                     <Button 
                        fullWidth 
                        type="submit" 
                        className="shadow-xl py-4 font-extrabold text-lg tracking-wide rounded-full"
                        disabled={loading}
                     >
                        {loading ? 'Saving...' : 'Complete Setup'}
                    </Button>
                </div>

            </form>
        </div>
    </div>
  );
};