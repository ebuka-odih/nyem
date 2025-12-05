
import React from 'react';

export interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

export type ScreenState = 'welcome' | 'signin' | 'signup_phone' | 'signup_otp' | 'setup_profile' | 'home' | 'match_requests' | 'chat' | 'edit_profile' | 'item_details' | 'public_profile';

export type TabState = 'discover' | 'upload' | 'matches' | 'profile';

export interface FeatureItem {
  icon: React.ReactNode;
  text: string;
}

export interface Owner {
    name: string;
    image: string;
    location: string;
    distance: string;
}

export interface BarterItem {
    id: number;
    type: 'barter';
    title: string;
    condition: string;
    image: string;
    description: string;
    lookingFor: string;
    owner: Owner;
    gallery?: string[];
}

export interface MarketplaceItem {
    id: number;
    type: 'marketplace';
    title: string;
    price: string;
    image: string;
    description: string;
    owner: Owner;
    gallery?: string[];
}

export type SwipeItem = BarterItem | MarketplaceItem;
