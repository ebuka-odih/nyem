
import React from 'react';

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Vendor {
  id?: string | number;
  name: string;
  avatar: string;
  location: string;
  rating: number;
  reviewCount: number;
  joinedDate: string;
  bio: string;
  verified: boolean;
  followers: number;
  reviews?: Review[];
}

export interface Product {
  id: number | string; // Can be number (legacy) or string (UUID from API)
  name: string;
  price: string;
  category: string;
  description: string;
  images: string[];
  color: string;
  longDescription: string;
  vendor: Vendor;
  distance: string;
  isSuper?: boolean;
  isAd?: boolean;
  isWelcome?: boolean;
  userId?: string | number; // User ID of the listing owner
  stats?: {
    views?: number;
    likes?: number;
    stars?: number; // Super interest / wishlist count
    super_interest?: number; // Alias for stars
    shares?: number;
  };
}

export interface CityData {
  city: string;
}

export interface CategoryData {
  name: string;
  icon: React.ElementType;
}
