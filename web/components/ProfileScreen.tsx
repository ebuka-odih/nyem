
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

interface ProfileScreenProps {
  onEditProfile: () => void;
  onLoginRequest?: (method: 'phone_otp' | 'google' | 'email') => void;
  onSignUpRequest?: () => void;
}

interface UserItem {
  id: number;
  title: string;
  image: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onEditProfile, onLoginRequest, onSignUpRequest }) => {
  const { user, logout, token, refreshUser, isAuthenticated } = useAuth();
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
        <div className="px-6 pb-20">
          {activeTab === 'items' ? (
            <ItemsGrid items={userItems} loading={loading} />
          ) : (
            <SettingsList onLogout={handleLogout} />
          )}
        </div>
      </div>
    </div>
  );
};
