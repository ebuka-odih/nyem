
import React from 'react';

export interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export type ScreenState = 'welcome' | 'signin' | 'signup' | 'signup_email_otp' | 'location_selection' | 'setup_profile' | 'forgot_password' | 'reset_password' | 'home' | 'match_requests' | 'chat' | 'edit_profile' | 'item_details' | 'public_profile';

export type TabState = 'discover' | 'upload' | 'matches' | 'profile';

export interface FeatureItem {
  icon: React.ReactNode;
  text: string;
}

export interface Owner {
    id?: string | number;  // Seller's user ID for starting conversations
    name: string;
    image: string;
    location: string;
    distance: string;
    phone_verified_at?: string | null;  // Phone verification timestamp
}

export interface BarterItem {
    id: number;
    type: 'barter';
    title: string;
    condition: string;
    image: string;
    description: string;
    lookingFor: string;
    category?: string;
    owner: Owner;
    gallery?: string[];
    views?: number;
    likes?: number;
    shares?: number;
}

export interface MarketplaceItem {
    id: number;
    type: 'marketplace';
    title: string;
    price: string;
    image: string;
    description: string;
    category?: string;
    owner: Owner;
    gallery?: string[];
    views?: number;
    likes?: number;
    shares?: number;
}

export type SwipeItem = BarterItem | MarketplaceItem;
