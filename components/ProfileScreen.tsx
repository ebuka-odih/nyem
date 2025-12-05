
import React, { useState, useEffect } from 'react';
import { MapPin, Pencil, Settings, HelpCircle, LogOut, ChevronRight, Grid, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { AppHeader } from './AppHeader';

interface ProfileScreenProps {
  onEditProfile: () => void;
}

interface UserItem {
  id: number;
  title: string;
  image: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onEditProfile }) => {
  const { user, logout, token, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'items' | 'settings'>('items');
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user items
  useEffect(() => {
    const fetchUserItems = async () => {
      if (!token) return;

      try {
        // Fetch items feed and filter for user's items
        const res = await apiFetch(ENDPOINTS.items.feed, { token });
        const items = res.data || res.items || [];
        
        // Filter items by current user (if backend doesn't provide user-specific endpoint)
        // For now, we'll show all items - you may want to add a user-specific endpoint
        const formattedItems = items.slice(0, 4).map((item: any) => ({
          id: item.id,
          title: item.title || item.name || 'Untitled Item',
          image: item.images?.[0] || item.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E',
        }));
        setUserItems(formattedItems);
      } catch (error) {
        console.error('Failed to fetch user items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserItems();
  }, [token]);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      window.location.reload(); // Reload to reset app state
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <AppHeader 
        title="Profile" 
        className="sticky top-0"
      />

      <div className="flex-1 overflow-y-auto">
        {/* Profile Card Section */}
        <div className="bg-white pb-8 px-6 pt-6 mb-3 border-b border-gray-100 shadow-sm rounded-b-[2rem]">
            <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="w-28 h-28 rounded-full bg-gray-100 p-1 mb-4 relative shadow-sm">
                    <img 
                        src={user?.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=random`}
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover border-4 border-white"
                    />
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                {/* Info */}
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{user?.username || 'User'}</h2>
                {user?.city && (
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-3">
                        <MapPin size={14} className="mr-1 text-brand" />
                        <span>{user.city}</span>
                    </div>
                )}
                
                {user?.bio && (
                    <p className="text-gray-500 text-sm max-w-[250px] leading-relaxed mb-6">
                        {user.bio}
                    </p>
                )}

                {/* Edit Button */}
                <button 
                  onClick={onEditProfile}
                  className="flex items-center space-x-2 bg-brand text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-brand/20 active:scale-95 transition-transform"
                >
                    <Pencil size={16} />
                    <span>Edit Profile</span>
                </button>
            </div>
        </div>

        {/* Tabs Navigation */}
        <div className="px-6 mb-4">
            <div className="flex border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('items')}
                    className={`flex-1 pb-3 text-sm font-bold transition-all relative ${activeTab === 'items' ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    My Items
                    {activeTab === 'items' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full"></div>}
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 pb-3 text-sm font-bold transition-all relative ${activeTab === 'settings' ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Settings
                    {activeTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full"></div>}
                </button>
            </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-20">
            {activeTab === 'items' ? (
                // My Items Grid
                <div className="grid grid-cols-2 gap-4">
                    {loading ? (
                        <div className="col-span-2 text-center py-8 text-gray-500">Loading items...</div>
                    ) : userItems.length > 0 ? (
                        userItems.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="aspect-square bg-gray-100 rounded-xl mb-3 overflow-hidden">
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-sm px-1 truncate">{item.title}</h3>
                        </div>
                        ))
                    ) : (
                        <div className="col-span-2 text-center py-8 text-gray-500">No items yet</div>
                    )}
                    {/* Add New Placeholder */}
                    <div className="aspect-[4/5] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors cursor-pointer">
                        <span className="text-4xl mb-2 font-light">+</span>
                        <span className="text-xs font-bold">Add Item</span>
                    </div>
                </div>
            ) : (
                // Settings List
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3 text-gray-700">
                            <Settings size={20} />
                            <span className="font-bold text-sm">App Settings</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-300" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3 text-gray-700">
                            <HelpCircle size={20} />
                            <span className="font-bold text-sm">Help & Support</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-300" />
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors group"
                    >
                        <div className="flex items-center space-x-3 text-red-500">
                            <LogOut size={20} />
                            <span className="font-bold text-sm">Logout</span>
                        </div>
                        <ChevronRight size={18} className="text-red-200 group-hover:text-red-300" />
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
