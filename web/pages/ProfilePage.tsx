import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  ShieldCheck, 
  MapPin, 
  Package, 
  Star, 
  Wallet, 
  ChevronRight, 
  LogOut, 
  Bell, 
  CreditCard, 
  History,
  ExternalLink,
  Edit3,
  BadgeCheck,
  Zap,
  ArrowLeft,
  Plus,
  Lock,
  Smartphone,
  CheckCircle2,
  Clock,
  ShieldAlert,
  SmartphoneNfc,
  Building2,
  MoreVertical,
  Check,
  Banknote,
  Shield,
  Camera,
  ChevronDown
} from 'lucide-react';
import { apiFetch, getStoredUser, getStoredToken } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

const subtleTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 40,
  mass: 1
};

type SubPageView = 'main' | 'notifications' | 'payments' | 'security' | 'history' | 'edit';

interface ProfilePageProps {
  forceSettingsTab?: boolean;
  onSignOut?: () => void;
  onNavigateToUpload?: () => void;
}

const CustomToggle: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors duration-300 ${active ? 'bg-[#830e4c]' : 'bg-neutral-200'}`}
  >
    <motion.div 
      animate={{ x: active ? 24 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="w-4 h-4 bg-white rounded-full shadow-md"
    />
  </button>
);

interface User {
  id: number;
  username?: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  city_id?: number;
  area_id?: number;
  bio?: string;
  profile_photo?: string;
  items_count?: number;
  cityLocation?: {
    id: number;
    name: string;
    type: string;
  };
  areaLocation?: {
    id: number;
    name: string;
    type: string;
  };
}

interface Drop {
  id: string | number;
  name: string;
  price: string;
  image: string;
  views: number;
  status: string;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ forceSettingsTab, onSignOut, onNavigateToUpload }) => {
  const [activeTab, setActiveTab] = useState<'drops' | 'settings'>('drops');
  const [currentView, setCurrentView] = useState<SubPageView>('main');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [myDrops, setMyDrops] = useState<Drop[]>([]);
  
  // Edit Profile States
  const [displayName, setDisplayName] = useState('');
  const [cityId, setCityId] = useState<number | ''>('');
  const [areaId, setAreaId] = useState<number | ''>('');
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Settings States
  const [notifs, setNotifs] = useState({ push: true });
  const [escrowActive, setEscrowActive] = useState(true);
  const [bankDetails, setBankDetails] = useState({
    bankName: "Kuda Microfinance Bank",
    accountNumber: "2044291024",
    accountName: ""
  });

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Try to get cached user first for instant display
        const cachedUser = getStoredUser();
        if (cachedUser) {
          setUser(cachedUser);
          setBankDetails(prev => ({
            ...prev,
            accountName: cachedUser.name || cachedUser.username || ""
          }));
          // Initialize edit form - use name first, then username
          const cachedName = cachedUser.name || cachedUser.username || '';
          setDisplayName(cachedName);
          setCityId(cachedUser.city_id || '');
          setAreaId(cachedUser.area_id || '');
          setBio(cachedUser.bio || '');
          setProfilePhoto(cachedUser.profile_photo || null);
        }

        // Fetch fresh user data from API
        const response = await apiFetch<{ user: User }>(ENDPOINTS.profile.me, { token });
        const userData = response.user || response.data?.user;
        
        if (userData) {
          setUser(userData);
          setBankDetails(prev => ({
            ...prev,
            accountName: userData.name || userData.username || ""
          }));
          // Update edit form with fresh data - prioritize name field
          const fullName = userData.name || userData.username || '';
          setDisplayName(fullName);
          setCityId(userData.city_id || '');
          setAreaId(userData.area_id || '');
          setBio(userData.bio || '');
          setProfilePhoto(userData.profile_photo || null);
          
          // Format and set user items (drops) - get latest 5 active items
          const items = (userData as any).items || [];
          const formattedDrops: Drop[] = items
            .filter((item: any) => item.status === 'active') // Only show active items
            .slice(0, 5) // Get latest 5 items (already ordered by latest first from backend)
            .map((item: any) => {
              // Get primary image from photos array
              const photos = item.photos || [];
              const primaryImage = photos[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
              
              // Format price with naira symbol
              let formattedPrice = 'Price not set';
              if (item.price) {
                if (typeof item.price === 'string') {
                  formattedPrice = item.price.includes('₦') ? item.price : `₦${item.price}`;
                } else {
                  formattedPrice = `₦${parseFloat(item.price).toLocaleString()}`;
                }
              }
              
              // Get views count from item stats
              const viewsCount = (item.views_count || item.views || 0);
              
              return {
                id: item.id,
                name: item.title || 'Untitled Item',
                price: formattedPrice,
                image: primaryImage,
                views: viewsCount,
                status: item.status === 'active' ? 'Active' : 'Sold'
              };
            });
          
          setMyDrops(formattedDrops);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Keep cached user if API fails
        const cachedUser = getStoredUser();
        if (cachedUser) {
          setUser(cachedUser);
          // Initialize edit form with cached data
          setDisplayName(cachedUser.name || cachedUser.username || '');
          setCityId(cachedUser.city_id || '');
          setAreaId(cachedUser.area_id || '');
          setBio(cachedUser.bio || '');
          setProfilePhoto(cachedUser.profile_photo || null);
          
          // Set cached items if available
          const cachedItems = (cachedUser as any).items || [];
          const formattedDrops: Drop[] = cachedItems
            .filter((item: any) => item.status === 'active')
            .slice(0, 5)
            .map((item: any) => {
              const photos = item.photos || [];
              const primaryImage = photos[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
              let formattedPrice = 'Price not set';
              if (item.price) {
                if (typeof item.price === 'string') {
                  formattedPrice = item.price.includes('₦') ? item.price : `₦${item.price}`;
                } else {
                  formattedPrice = `₦${parseFloat(item.price).toLocaleString()}`;
                }
              }
              const viewsCount = (item.views_count || item.views || 0);
              return {
                id: item.id,
                name: item.title || 'Untitled Item',
                price: formattedPrice,
                image: primaryImage,
                views: viewsCount,
                status: item.status === 'active' ? 'Active' : 'Sold'
              };
            });
          setMyDrops(formattedDrops);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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
        if (areaId && !areasData.find((a: any) => a.id === areaId)) {
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

  // Fetch areas when user data loads and has city_id
  useEffect(() => {
    if (user?.city_id && areas.length === 0 && cityId) {
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
  }, [user, cityId]);

  useEffect(() => {
    if (forceSettingsTab) {
      setActiveTab('settings');
      setCurrentView('main');
    }
  }, [forceSettingsTab]);

  // Update edit form fields when user data changes or when entering edit view
  useEffect(() => {
    if (user && currentView === 'edit') {
      setDisplayName(user.name || user.username || '');
      setCityId(user.city_id || '');
      setAreaId(user.area_id || '');
      setBio(user.bio || '');
      setProfilePhoto(user.profile_photo || null);
    }
  }, [user, currentView]);

  const handlePhotoSelect = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setEditError('Image must be less than 2MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setEditError('Please select a valid image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
        setEditError(null);
      };
      reader.onerror = () => {
        setEditError('Failed to read image file');
      };
      reader.readAsDataURL(file);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stats = [
    { label: 'Deals', value: '24', icon: Package },
    { label: 'Rating', value: '4.9', icon: Star },
    { label: 'Drops', value: user?.items_count?.toString() || '0', icon: Zap },
  ];

  const menuItems = [
    { id: 'edit', label: 'Edit Profile', icon: Edit3, color: 'text-[#830e4c]' },
    { id: 'notifications', label: 'Notification Settings', icon: Bell, color: 'text-[#830e4c]' },
    { id: 'payments', label: 'Escrow & Payments', icon: CreditCard, color: 'text-emerald-600' },
    { id: 'security', label: 'Security & Password', icon: ShieldCheck, color: 'text-neutral-900' },
    { id: 'history', label: 'Trade History', icon: History, color: 'text-neutral-900' },
  ];


  const handleUpdateProfile = async () => {
    setEditError(null);

    if (!displayName.trim()) {
      setEditError('Display name is required');
      return;
    }

    if (!cityId) {
      setEditError('City is required');
      return;
    }

    setEditLoading(true);
    try {
      const token = getStoredToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const updateData: any = {
        name: displayName.trim(),
        city_id: typeof cityId === 'number' ? cityId : parseInt(cityId as string),
        bio: bio || undefined,
      };

      if (areaId && areaId !== '' && !isNaN(Number(areaId))) {
        updateData.area_id = typeof areaId === 'number' ? areaId : parseInt(areaId as string);
      } else {
        updateData.area_id = null;
      }

      // Include profile photo if it's a new upload (base64 data URI)
      if (profilePhoto && profilePhoto !== user?.profile_photo && profilePhoto.startsWith('data:image/')) {
        updateData.profile_photo = profilePhoto;
      }

      const response = await apiFetch<{ user: User }>(ENDPOINTS.profile.update, {
        method: 'PUT',
        token,
        body: updateData,
      });

      const userData = response.user || response.data?.user;
      if (userData) {
        setUser(userData);
        const freshResponse = await apiFetch<{ user: User }>(ENDPOINTS.profile.me, { token });
        const freshUser = freshResponse.user || freshResponse.data?.user;
        if (freshUser) {
          setUser(freshUser);
        }
        setCurrentView('main');
      }
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile. Please try again.');
      console.error('Update profile error:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const renderSubPage = () => {
    switch (currentView) {
      case 'edit':
        return (
          <div className="space-y-6">
            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {editError}
              </div>
            )}

            {/* Profile Photo */}
            <div className="flex justify-center">
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <div className="w-28 h-28 rounded-[2.5rem] bg-[#830e4c1a] border-4 border-white shadow-xl overflow-hidden">
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      className="w-full h-full object-cover" 
                      alt="Profile"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://i.pravatar.cc/300?u=${user?.id || user?.email || 'user'}`;
                      }}
                    />
                  ) : user?.profile_photo ? (
                    <img 
                      src={user.profile_photo} 
                      className="w-full h-full object-cover" 
                      alt="Profile"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://i.pravatar.cc/300?u=${user.id || user.email || 'user'}`;
                      }}
                    />
                  ) : (
                    <img 
                      src={`https://i.pravatar.cc/300?u=${user?.id || user?.email || user?.username || 'user'}`}
                      className="w-full h-full object-cover" 
                      alt="Profile"
                    />
                  )}
                </div>
                <button 
                  type="button"
                  className="absolute -bottom-1 -right-1 bg-[#830e4c] text-white p-2.5 rounded-2xl shadow-lg border border-white active:scale-90 transition-all"
                  onClick={handlePhotoSelect}
                >
                  <Camera size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Display Name *</label>
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="w-full bg-white border border-neutral-200 rounded-[1.5rem] px-6 py-5 text-sm font-black text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all shadow-sm placeholder:text-neutral-200"
              />
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1">This is how your name appears to others</p>
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1 flex items-center gap-2">
                <MapPin size={12} />
                City *
              </label>
              <div className="relative">
                <select 
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value ? parseInt(e.target.value) : '')}
                  disabled={loadingCities}
                  className="w-full bg-white border border-neutral-200 rounded-[1.5rem] px-6 py-5 text-sm font-black text-neutral-900 focus:outline-none focus:border-indigo-600 transition-all shadow-sm appearance-none cursor-pointer disabled:opacity-50"
                >
                  <option value="">Select your city</option>
                  {cities.map((city: any) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" size={18} />
              </div>
              {loadingCities && (
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1">Loading cities...</p>
              )}
            </div>

            {/* Area */}
            {cityId && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1 flex items-center gap-2">
                  <MapPin size={12} />
                  Area {areas.length > 0 ? '(Optional)' : ''}
                </label>
                <div className="relative">
                  <select 
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value ? parseInt(e.target.value) : '')}
                    disabled={loadingAreas || areas.length === 0}
                    className="w-full bg-white border border-neutral-200 rounded-[1.5rem] px-6 py-5 text-sm font-black text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all shadow-sm appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Select your area (optional)</option>
                    {areas.map((area: any) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" size={18} />
                </div>
                {loadingAreas && (
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1">Loading areas...</p>
                )}
                {!loadingAreas && areas.length === 0 && cityId && (
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest px-1">No areas available for this city</p>
                )}
              </div>
            )}

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..." 
                className="w-full bg-white border border-neutral-200 rounded-[1.5rem] px-6 py-5 text-sm font-black text-neutral-900 focus:outline-none focus:border-[#830e4c] transition-all shadow-sm resize-none min-h-[120px] placeholder:text-neutral-200"
              />
            </div>

            {/* Save Button */}
            <button 
              onClick={handleUpdateProfile}
              disabled={editLoading}
              className="w-full bg-[#830e4c] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.25em] text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-4">
            <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h4 className="text-sm font-black text-neutral-900 uppercase tracking-tight">Push Notifications</h4>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">Chat messages and system alerts</p>
                </div>
                <CustomToggle active={notifs.push} onClick={() => setNotifs({...notifs, push: !notifs.push})} />
              </div>
            </div>
            
            <div className="p-5 bg-[#830e4c1a] rounded-3xl border border-[#830e4c33] flex gap-4 items-start">
              <Zap size={18} className="text-[#830e4c] shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-[#830e4c] uppercase tracking-widest leading-relaxed">
                Stay updated on the latest drops in your area by enabling location-based alerts in your phone settings.
              </p>
            </div>
          </div>
        );
      case 'payments':
        return (
          <div className="space-y-6">
            {/* Escrow Activation Card */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Escrow Status</label>
              <div 
                onClick={() => setEscrowActive(!escrowActive)}
                className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer ${escrowActive ? 'bg-emerald-50 border-emerald-500 shadow-xl shadow-emerald-100' : 'bg-white border-neutral-100 shadow-sm'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${escrowActive ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                    <Shield size={24} strokeWidth={2.5} />
                  </div>
                  <CustomToggle active={escrowActive} onClick={() => setEscrowActive(!escrowActive)} />
                </div>
                <div className="space-y-1">
                  <h4 className={`text-base font-black uppercase tracking-tight ${escrowActive ? 'text-emerald-900' : 'text-neutral-900'}`}>
                    {escrowActive ? 'Escrow Protection Active' : 'Escrow Protection Disabled'}
                  </h4>
                  <p className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed ${escrowActive ? 'text-emerald-600' : 'text-neutral-400'}`}>
                    {escrowActive 
                      ? 'Your deals are secured by Nyem Escrow. Funds are held until buyers confirm delivery.' 
                      : 'Activate escrow to build trust and protect your transactions from disputes.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Withdrawal Destination */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Withdrawal Destination</label>
                <button className="text-[10px] font-black text-[#830e4c] uppercase tracking-widest flex items-center gap-1">
                  <Edit3 size={12} /> Edit
                </button>
              </div>
              
              <div className="bg-white border border-neutral-100 rounded-[2.5rem] p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#830e4c] rounded-2xl flex items-center justify-center text-white">
                    <Building2 size={24} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Bank Name</h5>
                    <p className="text-sm font-black text-neutral-900 truncate">{bankDetails.bankName}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <h5 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Account Number</h5>
                    <p className="text-sm font-black text-neutral-900 tracking-[0.1em]">{bankDetails.accountNumber}</p>
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Recipient Name</h5>
                    <p className="text-sm font-black text-neutral-900 truncate uppercase">{bankDetails.accountName}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-3xl p-4 border border-neutral-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                  <CheckCircle2 size={16} strokeWidth={3} />
                </div>
                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Account verified for instant settlement</p>
              </div>
            </div>

            <button className="w-full bg-[#830e4c] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.25em] text-[11px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
              <Banknote size={16} strokeWidth={2.5} />
              Save Payment Settings
            </button>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Authentication</label>
              <div className="bg-white border border-neutral-100 rounded-[2rem] p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                      <SmartphoneNfc size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-neutral-900 tracking-tight">Two-Factor Auth</h4>
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1 flex items-center gap-1">
                        <Check size={10} strokeWidth={4} /> Enabled
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-neutral-200" />
                </div>
                <div className="h-px bg-neutral-50" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#830e4c1a] text-[#830e4c] rounded-2xl">
                      <Lock size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-neutral-900 tracking-tight">Biometric Login</h4>
                      <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mt-1">FaceID or Fingerprint</p>
                    </div>
                  </div>
                  <CustomToggle active={true} onClick={() => {}} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Active Sessions</label>
              <div className="bg-white border border-neutral-100 rounded-[2rem] p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-neutral-900 tracking-tight">iPhone 15 Pro</h4>
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Current Device</p>
                  </div>
                </div>
                <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest px-2 py-1 bg-neutral-50 rounded-lg">Lagos, NG</span>
              </div>
            </div>
            
            <button className="w-full py-5 bg-[#830e4c] text-white rounded-[2rem] font-black uppercase tracking-[0.25em] text-[10px] shadow-xl active:scale-95 transition-all">
              Change Login Password
            </button>
          </div>
        );
      case 'history':
        return (
          <div className="space-y-4">
            {[
              { id: '1', item: 'Nike Air Max', price: '₦125,000', date: 'Oct 12, 2023', type: 'PURCHASE', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=100' },
              { id: '2', item: 'Sony WH-1000XM5', price: '₦340,000', date: 'Sep 28, 2023', type: 'SALE', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=100' },
              { id: '3', item: 'Coffee Grinder', price: '₦45,000', date: 'Sep 15, 2023', type: 'PURCHASE', img: 'https://images.unsplash.com/photo-1544350285-1811bc3bb970?auto=format&fit=crop&q=80&w=100' }
            ].map((order) => (
              <div key={order.id} className="bg-white border border-neutral-100 rounded-[2.5rem] p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-neutral-100 shrink-0">
                  <img src={order.img} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full w-fit mb-1 ${order.type === 'SALE' ? 'bg-[#830e4c1a] text-[#830e4c]' : 'bg-emerald-50 text-emerald-600'}`}>
                        {order.type}
                      </span>
                      <h4 className="text-sm font-black text-neutral-900 tracking-tight uppercase truncate">{order.item}</h4>
                    </div>
                    <span className="text-xs font-black text-neutral-900">{order.price}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={10} /> {order.date}
                    </p>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle2 size={10} /> Completed
                    </span>
                  </div>
                </div>
                <button className="p-2 text-neutral-200 hover:text-neutral-900 transition-colors">
                  <ChevronRight size={18} strokeWidth={3} />
                </button>
              </div>
            ))}
            
            <button className="w-full py-5 text-[10px] font-black text-neutral-300 uppercase tracking-[0.25em] mt-4 flex items-center justify-center gap-2">
              <History size={14} /> Request Transaction Export
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  // Show loading state while fetching user data
  if (loading && !user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={subtleTransition}
        className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center pb-48 px-4 min-h-[400px]"
      >
        <div className="w-16 h-16 border-4 border-[#830e4c] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-black text-neutral-400 uppercase tracking-widest">Loading profile...</p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={subtleTransition}
      className="w-full max-w-2xl mx-auto flex flex-col pb-48 px-4"
    >
      <AnimatePresence mode="wait">
        {currentView === 'main' ? (
          <motion.div 
            key="main-profile"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="w-full"
          >
            {/* Profile Header */}
            <div className="flex flex-col items-center pt-8 pb-10">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-[2.5rem] bg-[#830e4c1a] border-4 border-white shadow-xl overflow-hidden">
                  {user?.profile_photo ? (
                    <img 
                      src={user.profile_photo} 
                      className="w-full h-full object-cover" 
                      alt="Profile"
                      onError={(e) => {
                        // Fallback to generated avatar if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = `https://i.pravatar.cc/300?u=${user.id || user.email || 'user'}`;
                      }}
                    />
                  ) : (
                    <img 
                      src={`https://i.pravatar.cc/300?u=${user?.id || user?.email || user?.username || 'user'}`}
                      className="w-full h-full object-cover" 
                      alt="Profile"
                    />
                  )}
                </div>
                <button className="absolute -bottom-1 -right-1 bg-white p-2.5 rounded-2xl shadow-lg border border-neutral-100 text-[#830e4c] active:scale-90 transition-all">
                  <Edit3 size={16} strokeWidth={2.5} />
                </button>
              </div>
              
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-2xl font-black text-neutral-900 tracking-tighter uppercase italic">
                    {loading ? 'Loading...' : (user?.name || user?.username || 'User')}
                  </h2>
                  {user?.email_verified_at && (
                    <BadgeCheck size={20} className="text-[#29B3F0]" fill="currentColor" />
                  )}
                </div>
                <p className="text-xs font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
                  <MapPin size={12} /> {user?.cityLocation?.name || user?.city || 'Location not set'}
                </p>
                {user?.bio && (
                  <p className="text-xs font-medium text-neutral-500 mt-2 max-w-xs">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>


            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white border border-neutral-100 rounded-3xl p-4 flex flex-col items-center text-center">
                  <stat.icon size={18} className="text-neutral-400 mb-2" />
                  <span className="text-lg font-black text-neutral-900 leading-none">{stat.value}</span>
                  <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mt-1.5">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Content Tabs */}
            <div className="flex gap-4 mb-6">
              <button 
                onClick={() => setActiveTab('drops')}
                className={`relative px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'drops' ? 'bg-[#830e4c] text-white shadow-lg' : 'bg-white text-neutral-400 border border-neutral-100'}`}
              >
                My Listings
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`relative px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-[#830e4c] text-white shadow-lg' : 'bg-white text-neutral-400 border border-neutral-100'}`}
              >
                Account
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'drops' ? (
                <motion.div 
                  key="drops-list"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-3"
                >
                  {myDrops.length > 0 ? (
                    <>
                      {myDrops.map((drop) => (
                        <div key={drop.id} className="bg-white border border-neutral-100 rounded-[2rem] p-3 flex items-center gap-4 group">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-neutral-100">
                            <img src={drop.image} className="w-full h-full object-cover" alt={drop.name} onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${drop.status === 'Active' ? 'bg-[#830e4c1a] text-[#830e4c]' : 'bg-neutral-100 text-neutral-400'}`}>
                                {drop.status}
                              </span>
                              <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">{drop.views} Views</span>
                            </div>
                            <h4 className="text-sm font-black text-neutral-900 truncate tracking-tight">{drop.name}</h4>
                            <p className="text-xs font-black text-[#830e4c] mt-0.5">{drop.price}</p>
                          </div>
                          <button className="p-3 text-neutral-300 hover:text-neutral-900 transition-colors">
                            <ChevronRight size={20} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          if (onNavigateToUpload) {
                            onNavigateToUpload();
                          }
                        }}
                        className="w-full py-6 border-2 border-dashed border-neutral-100 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-neutral-300 hover:border-[#830e4c1a] hover:text-[#830e4c] transition-all group"
                      >
                        <Zap size={24} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Post a new drop</span>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-100">
                        <Package size={32} className="text-neutral-300" />
                      </div>
                      <div className="text-center space-y-1">
                        <h4 className="text-base font-black text-neutral-900 uppercase tracking-tighter">No drops yet</h4>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Start sharing your items with the community!</p>
                      </div>
                      <button 
                        onClick={() => {
                          if (onNavigateToUpload) {
                            onNavigateToUpload();
                          }
                        }}
                        className="w-full py-6 border-2 border-dashed border-neutral-100 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-neutral-300 hover:border-[#830e4c1a] hover:text-[#830e4c] transition-all group"
                      >
                        <Zap size={24} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Post a new drop</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="settings-list"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-2 pb-24"
                >
                  {menuItems.map((item) => (
                    <button 
                      key={item.label}
                      onClick={() => setCurrentView(item.id as SubPageView)}
                      className="w-full flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-[1.5rem] hover:bg-neutral-50 active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 bg-neutral-50 rounded-xl ${item.color}`}>
                          <item.icon size={20} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm font-black text-neutral-900 tracking-tight">{item.label}</span>
                      </div>
                      <ChevronRight size={18} className="text-neutral-200" strokeWidth={3} />
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => {
                      if (onSignOut) {
                        onSignOut();
                      }
                    }}
                    className="w-full flex items-center justify-between p-4 bg-rose-50 border border-rose-100 rounded-[1.5rem] mt-6 hover:bg-rose-100 active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white rounded-xl text-rose-500 shadow-sm">
                        <LogOut size={20} strokeWidth={2.5} />
                      </div>
                      <span className="text-sm font-black text-rose-600 tracking-tight">Sign Out</span>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            key="sub-page"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="w-full"
          >
            <div className="flex items-center gap-4 mb-8 pt-4">
              <button 
                onClick={() => setCurrentView('main')}
                className="p-3 bg-neutral-100 rounded-2xl text-neutral-900 active:scale-90 transition-all"
              >
                <ArrowLeft size={20} strokeWidth={3} />
              </button>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-[#830e4c] uppercase tracking-[0.2em] leading-none mb-1">Account Setting</span>
                <h3 className="text-xl font-black text-neutral-900 tracking-tighter uppercase italic">
                  {menuItems.find(i => i.id === currentView)?.label || 'Settings'}
                </h3>
              </div>
            </div>
            
            <div className="pb-32">
              {renderSubPage()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};