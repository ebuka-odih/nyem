/**
 * PreUploadProfileSetup Component
 * Shows a quick profile setup screen before users can upload their first items
 * Collects: display name, username (with uniqueness check), city, area, bio (optional)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../utils/api';
import { ENDPOINTS } from '../../constants/endpoints';
import { Camera, MapPin, ChevronDown, User, X, Check, AlertCircle, Loader2, Lightbulb } from 'lucide-react';

interface Location {
  id: number;
  name: string;
  type: 'city' | 'area';
  parent_id?: number;
}

interface PreUploadProfileSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

// Debounce hook for username check
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const PreUploadProfileSetup: React.FC<PreUploadProfileSetupProps> = ({ 
  onComplete,
  onSkip 
}) => {
  const { user, updateProfile, refreshUser } = useAuth();
  
  // Form state - auto-fill from existing user data
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profile_photo || null);
  const [cityId, setCityId] = useState<number | ''>(user?.city_id || '');
  const [areaId, setAreaId] = useState<number | ''>(user?.area_id || '');
  
  // Username validation state
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(true);
  
  // Location data
  const [cities, setCities] = useState<Location[]>([]);
  const [areas, setAreas] = useState<Location[]>([]);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Debounced username for API check
  const debouncedUsername = useDebounce(username, 500);

  // Fetch cities on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoadingLocations(true);
        setError(null);
        const response = await apiFetch(ENDPOINTS.locationsCities);
        // Handle both response formats: { data: { cities: [...] } } or { cities: [...] }
        const citiesData = response.data?.cities || response.cities || [];
        console.log('[PreUploadProfileSetup] Fetched cities:', citiesData.length);
        if (citiesData.length === 0) {
          console.warn('[PreUploadProfileSetup] No cities returned from API');
        }
        setCities(citiesData);
      } catch (err: any) {
        console.error('[PreUploadProfileSetup] Failed to fetch cities:', err);
        setError('Failed to load cities. Please try again.');
        setCities([]);
      } finally {
        setLoadingLocations(false);
      }
    };
    
    fetchCities();
  }, []);

  // Check username availability when debounced value changes
  useEffect(() => {
    const checkUsername = async () => {
      // Don't check if username is empty or too short
      if (!debouncedUsername || debouncedUsername.length < 3) {
        setUsernameAvailable(null);
        setUsernameError(null);
        return;
      }
      
      // Don't check if it's the same as the current user's username
      if (debouncedUsername === user?.username) {
        setUsernameAvailable(true);
        setUsernameError(null);
        return;
      }
      
      // Validate username format (alphanumeric, underscores, no spaces)
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(debouncedUsername)) {
        setUsernameAvailable(false);
        setUsernameError('Username can only contain letters, numbers, and underscores');
        return;
      }
      
      setCheckingUsername(true);
      setUsernameError(null);
      
      try {
        const response = await apiFetch(ENDPOINTS.profile.checkUsername, {
          method: 'POST',
          body: { 
            username: debouncedUsername,
            exclude_user_id: user?.id,
          },
        });
        
        setUsernameAvailable(response.available);
        if (!response.available) {
          setUsernameError(response.message || 'This username is already taken');
        }
      } catch (err: any) {
        console.error('Failed to check username:', err);
        // If endpoint not found (not deployed yet), assume available and verify on submit
        if (err.message?.includes('404') || err.message?.includes('not found')) {
          setUsernameAvailable(true); // Assume available, backend will validate on submit
          setUsernameError(null);
        } else {
          setUsernameError('Failed to check username availability');
          setUsernameAvailable(null);
        }
      } finally {
        setCheckingUsername(false);
      }
    };
    
    checkUsername();
  }, [debouncedUsername, user?.id, user?.username]);

  // Fetch areas when city is selected
  useEffect(() => {
    const fetchAreas = async () => {
      if (!cityId) {
        setAreas([]);
        setAreaId('');
        return;
      }

      try {
        const response = await apiFetch(ENDPOINTS.locationsAreas(cityId));
        // Handle both response formats: { data: { areas: [...] } } or { areas: [...] }
        const areasData = response.data?.areas || response.areas || [];
        console.log(`[PreUploadProfileSetup] Fetched ${areasData.length} areas for city ${cityId}`);
        setAreas(areasData);
        
        // If user had an area_id but it's not in the new city's areas, clear it
        if (areaId && !areasData.find((a: Location) => a.id === areaId)) {
          setAreaId('');
        }
      } catch (err: any) {
        console.error('[PreUploadProfileSetup] Failed to fetch areas:', err);
        setAreas([]);
      }
    };

    fetchAreas();
  }, [cityId]);

  // Handle photo selection
  const handlePhotoSelect = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (usernameAvailable === false) {
      setError('Please choose a different username');
      return;
    }
    
    if (!cityId) {
      setError('Please select your city');
      return;
    }

    setLoading(true);
    try {
      // Build update payload
      const payload: any = {
        name: displayName.trim(),
        username: username.trim().toLowerCase(),
        city_id: cityId,
      };
      
      // Always include area_id - send null if not selected, or the ID if selected
      // This ensures the backend can properly clear or set the area
      payload.area_id = areaId || null;
      
      if (bio.trim()) {
        payload.bio = bio.trim();
      }
      
      if (profilePhoto && profilePhoto !== user?.profile_photo) {
        payload.profile_photo = profilePhoto;
      }

      await updateProfile(payload);
      await refreshUser();
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
      console.error('Profile setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Render username status indicator
  const renderUsernameStatus = () => {
    if (checkingUsername) {
      return <Loader2 size={18} className="animate-spin text-gray-400" />;
    }
    if (usernameAvailable === true) {
      return <Check size={18} className="text-green-500" />;
    }
    if (usernameAvailable === false) {
      return <AlertCircle size={18} className="text-red-500" />;
    }
    return null;
  };

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Set Up Your Profile</h1>
        {onSkip && (
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <p className="text-gray-500 text-sm mb-8">
          Set up your profile to start uploading items. This helps build trust in our community.
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center mb-8">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={handlePhotoSelect}
              className="relative group"
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-brand/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                  <User size={40} className="text-gray-400" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-brand rounded-full flex items-center justify-center shadow-lg group-hover:bg-brand/90 transition-colors">
                <Camera size={16} className="text-white" />
              </div>
            </button>
            <p className="text-gray-400 text-xs mt-2">Tap to add photo</p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-brand font-bold text-sm mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name or business name"
              className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
            />
            {/* Tip */}
            <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <Lightbulb size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                <span className="font-medium">Tip:</span> Use your business name if you're selling as a business, or your personal name if selling individually.
              </p>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-brand font-bold text-sm mb-2">
              Username *
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="Choose a unique username"
                className={`w-full h-12 px-4 pr-12 rounded-xl border bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-all ${
                  usernameAvailable === false 
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200' 
                    : usernameAvailable === true 
                      ? 'border-green-300 focus:border-green-400 focus:ring-green-200'
                      : 'border-gray-200 focus:border-brand focus:ring-brand'
                }`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {renderUsernameStatus()}
              </div>
            </div>
            {/* Username feedback */}
            {usernameError && (
              <p className="text-red-500 text-xs mt-1">{usernameError}</p>
            )}
            {usernameAvailable === true && username.length >= 3 && (
              <p className="text-green-500 text-xs mt-1">Username is available!</p>
            )}
            {username && username.length < 3 && (
              <p className="text-gray-400 text-xs mt-1">Username must be at least 3 characters</p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-brand font-bold text-sm mb-2">
              <MapPin size={14} className="inline mr-1" />
              City *
            </label>
            <div className="relative">
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : '')}
                disabled={loadingLocations}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingLocations ? 'Loading cities...' : 'Select your city'}
                </option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              <ChevronDown 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
                size={20} 
              />
            </div>
            {loadingLocations && (
              <p className="text-gray-400 text-xs mt-1">Loading cities...</p>
            )}
            {!loadingLocations && cities.length === 0 && (
              <p className="text-red-500 text-xs mt-1">No cities available. Please check your connection.</p>
            )}
          </div>

          {/* Area */}
          {cityId && (
            <div>
              <label className="block text-brand font-bold text-sm mb-2">
                <MapPin size={14} className="inline mr-1" />
                Area {areas.length > 0 ? '(Optional)' : ''}
              </label>
              <div className="relative">
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value ? Number(e.target.value) : '')}
                  disabled={areas.length === 0}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {areas.length === 0 
                      ? 'No areas available for this city'
                      : 'Select your area (optional)'}
                  </option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
                <ChevronDown 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
                  size={20} 
                />
              </div>
              {areas.length === 0 && (
                <p className="text-gray-400 text-xs mt-1">No areas available for this city</p>
              )}
            </div>
          )}

          {/* Bio */}
          <div>
            <label className="block text-brand font-bold text-sm mb-2">
              About Your Business
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about what you sell or your business... (optional)"
              maxLength={500}
              className="w-full h-24 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all resize-none"
            />
            <p className="text-gray-400 text-xs mt-1 text-right">
              {bio.length}/500
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || checkingUsername || usernameAvailable === false}
            className="w-full h-14 bg-brand text-white font-bold text-lg rounded-xl shadow-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-8"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              'Update Profile'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
