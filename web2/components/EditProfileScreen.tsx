import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { ArrowLeft, Camera, ChevronDown, Lock, ChevronRight, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from './AppHeader';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { PLACEHOLDER_AVATAR, generateInitialsAvatar } from '../constants/placeholders';

interface EditProfileScreenProps {
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

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onBack }) => {
  const { user, updateProfile, refreshUser, token } = useAuth();
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
        city_id: typeof cityId === 'number' ? cityId : parseInt(cityId as string),
        bio: bio || undefined,
      };

      // Add name (displayname) if provided
      if (displayname.trim()) {
        updateData.name = displayname.trim();
      }

      // Always include area_id - send null if not selected, or the ID if selected
      // This ensures the backend can properly clear or set the area
      // Convert to number if it's a valid number, otherwise send null
      if (areaId && areaId !== '' && !isNaN(Number(areaId))) {
        updateData.area_id = typeof areaId === 'number' ? areaId : parseInt(areaId as string);
      } else {
        updateData.area_id = null;
      }

      console.log('[EditProfileScreen] Sending update data:', updateData);

      await updateProfile(updateData);
      await refreshUser();
      onBack();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
      console.error('Update profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <AppHeader 
        title="Edit Profile"
        onBack={onBack}
        className="sticky top-0"
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        
        {/* Error Message */}
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
            </div>
        )}

        {/* Avatar Upload */}
        <div className="flex justify-center">
            <div className="relative">
                <img 
                    src={(() => {
                      const profilePhoto = user?.profile_photo;
                      const userName = (user as any)?.name || user?.username || 'User';
                      if (!profilePhoto || profilePhoto.trim() === '') {
                        return generateInitialsAvatar(userName);
                      }
                      // Filter out generated avatars
                      const generatedAvatarPatterns = [
                        'ui-avatars.com',
                        'pravatar.cc',
                        'i.pravatar.cc',
                        'robohash.org',
                        'dicebear.com',
                        'avatar.vercel.sh',
                      ];
                      const isGeneratedAvatar = generatedAvatarPatterns.some(pattern => 
                        profilePhoto.toLowerCase().includes(pattern.toLowerCase())
                      );
                      return isGeneratedAvatar ? generateInitialsAvatar(userName) : profilePhoto;
                    })()}
                    onError={(e) => {
                      const userName = (user as any)?.name || user?.username || 'User';
                      (e.target as HTMLImageElement).src = generateInitialsAvatar(userName);
                    }}
                    alt="Profile Avatar" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" 
                />
                <button 
                    type="button"
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shadow-sm hover:bg-brand-light transition-transform active:scale-90"
                    onClick={() => alert('Photo upload coming soon!')}
                >
                    <Camera size={16} />
                </button>
            </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
            {/* Display Name */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">Display Name</label>
                <input 
                    type="text" 
                    value={displayname}
                    onChange={(e) => setDisplayname(e.target.value)}
                    placeholder="Your display name"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                />
                <p className="text-xs text-gray-400 mt-2 pl-1">This is how your name appears to others</p>
            </div>

            {/* Username */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">Username *</label>
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                />
                <p className="text-xs text-gray-400 mt-2 pl-1">You can change your username once every 24 hours.</p>
            </div>

            {/* City */}
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

            {/* Area */}
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

            {/* Bio */}
            <div>
                <label className="block text-brand font-bold text-sm mb-2">Bio</label>
                <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..." 
                    className="w-full h-24 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none"
                ></textarea>
            </div>

            {/* Save Button */}
            <div className="pt-4">
                <Button 
                    fullWidth 
                    className="bg-brand hover:bg-brand-light text-white rounded-xl py-4 shadow-lg text-lg"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            {/* Change Password */}
            <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3 text-gray-700">
                    <Lock size={18} className="text-brand" />
                    <span className="font-bold text-sm">Change Password</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
            </button>
        </div>
      </div>
    </div>
  );
};