
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { AppHeader } from './AppHeader';
import { LoginPrompt } from './common/LoginPrompt';
import { ProfileCard } from './profile/ProfileCard';
import { ProfileTabs } from './profile/ProfileTabs';
import { ItemsGrid } from './profile/ItemsGrid';
import { SettingsList } from './profile/SettingsList';
import { SwipeItem } from '../types';

interface ProfileScreenProps {
  onEditProfile: () => void;
  onLoginRequest?: (method: 'google' | 'email') => void;
  onSignUpRequest?: () => void;
  onItemClick?: (item: SwipeItem) => void;
  onItemEdit?: (item: any) => void;
  onAddItem?: () => void;
}

interface UserItem {
  id: number;
  title: string;
  image: string;
  description?: string;
  condition?: string;
  category_id?: number;
  type?: string;
  price?: string;
  looking_for?: string;
  images?: string[];
  gallery?: string[];
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  onEditProfile, 
  onLoginRequest, 
  onSignUpRequest,
  onItemClick,
  onItemEdit,
  onAddItem
}) => {
  const { user, logout, token, refreshUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'items' | 'settings'>('items');
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user items from profile endpoint
  useEffect(() => {
    const fetchUserItems = async () => {
      if (!token || !isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile which includes items
        const res = await apiFetch(ENDPOINTS.profile.me, { token });
        const userData = res.user || {};
        const items = (userData.items || []).filter((item: any) => item.status === 'active');
        
        // Format items for display
        const formattedItems: UserItem[] = items.map((item: any) => ({
          id: item.id,
          title: item.title || 'Untitled Item',
          description: item.description,
          condition: item.condition,
          category_id: item.category_id,
          type: item.type,
          price: item.price ? `$${parseFloat(item.price).toFixed(2)}` : undefined,
          looking_for: item.looking_for,
          image: item.images?.[0] || item.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E',
          images: item.images || [],
          gallery: item.images || [],
        }));
        setUserItems(formattedItems);
      } catch (error) {
        console.error('Failed to fetch user items:', error);
        setUserItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserItems();
  }, [token, isAuthenticated]); // Re-fetch when auth state changes

  // Also refresh items when user data changes (e.g., after editing items)
  useEffect(() => {
    if (user && token && isAuthenticated) {
      const items = ((user as any).items || []).filter((item: any) => item.status === 'active');
      const formattedItems: UserItem[] = items.map((item: any) => ({
        id: item.id,
        title: item.title || 'Untitled Item',
        description: item.description,
        condition: item.condition,
        category_id: item.category_id,
        type: item.type,
        price: item.price ? `$${parseFloat(item.price).toFixed(2)}` : undefined,
        looking_for: item.looking_for,
        image: item.images?.[0] || item.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E',
        images: item.images || [],
        gallery: item.images || [],
      }));
      setUserItems(formattedItems);
    }
  }, [user, token, isAuthenticated]);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      window.location.reload(); // Reload to reset app state
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <AppHeader 
          title="Profile" 
          className="sticky top-0"
        />
        <LoginPrompt 
          title="Sign In Required"
          message="Please sign in to view and manage your profile."
          onLoginRequest={onLoginRequest}
          onSignUpRequest={onSignUpRequest}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <AppHeader 
        title="Profile" 
        className="sticky top-0"
      />

      <div className="flex-1 overflow-y-auto">
        {/* Profile Card Section */}
        <ProfileCard user={user} onEditProfile={onEditProfile} />

        {/* Tabs Navigation */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="px-6 pb-6">
          {activeTab === 'items' ? (
            <ItemsGrid 
              items={userItems} 
              loading={loading}
              onItemClick={onItemClick}
              onItemEdit={onItemEdit}
              onAddItem={onAddItem}
            />
          ) : (
            <SettingsList onLogout={handleLogout} />
          )}
        </div>
      </div>
    </div>
  );
};
