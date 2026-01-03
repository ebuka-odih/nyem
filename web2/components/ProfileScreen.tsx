
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
import { AboutTab } from './profile/AboutTab';
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
  const [activeTab, setActiveTab] = useState<'about' | 'listings' | 'settings'>('about');
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Determine if listings tab should be shown (always show it)
  const hasItems = userItems.length > 0;

  // Helper function to format items
  const formatItems = (items: any[]): UserItem[] => {
    return items.map((item: any) => {
      // Handle both 'photos' (from Item model) and 'images' (from ItemController feed)
      const photos = item.photos || item.images || [];
      const primaryImage = photos[0] || item.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
      
      // Format price with naira symbol
      let formattedPrice: string | undefined = undefined;
      if (item.price) {
        if (typeof item.price === 'string') {
          // If already a string, check if it has currency symbol
          if (item.price.includes('₦') || item.price.includes('$')) {
            // Replace $ with ₦ if present
            formattedPrice = item.price.replace('$', '₦');
          } else {
            // Add ₦ if not present
            formattedPrice = `₦${item.price}`;
          }
        } else {
          // If number, format with commas and add ₦
          formattedPrice = `₦${parseFloat(item.price).toLocaleString()}`;
        }
      }
      
      return {
        id: item.id,
        title: item.title || 'Untitled Item',
        description: item.description,
        condition: item.condition,
        category_id: item.category_id,
        type: item.type,
        price: formattedPrice,
        looking_for: item.looking_for,
        image: primaryImage,
        images: photos,
        gallery: photos,
      };
    });
  };

  // Fetch user items from feed endpoint (same approach as UserProfileScreen)
  useEffect(() => {
    const fetchUserItems = async () => {
      if (!token || !isAuthenticated || !user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch items from feed and filter by current user's ID
        // This is the same approach used in UserProfileScreen
        const res = await apiFetch(ENDPOINTS.items.feed, { 
          token: token || undefined 
        });
        
        const allItems = res.items || res.data || [];
        
        // Filter items by current user ID and only show active items
        const activeItems = allItems
          .filter((item: any) => {
            const itemUserId = item.user?.id || item.user_id;
            return String(itemUserId) === String(user.id) && item.status === 'active';
          });
        
        // Format items for display
        const formattedItems = formatItems(activeItems);
        setUserItems(formattedItems);
      } catch (error) {
        console.error('Failed to fetch user items:', error);
        setUserItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserItems();
  }, [token, isAuthenticated, user?.id]); // Re-fetch when auth state or user ID changes

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
        <ProfileTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          showListings={true}
        />

        {/* Tab Content */}
        <div className="px-6 pb-6">
          {activeTab === 'about' && (
            <AboutTab user={user} />
          )}
          {activeTab === 'listings' && (
            <ItemsGrid 
              items={userItems} 
              loading={loading}
              onItemClick={onItemClick}
              onItemEdit={onItemEdit}
              onAddItem={onAddItem}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsList onLogout={handleLogout} />
          )}
        </div>
      </div>
    </div>
  );
};
