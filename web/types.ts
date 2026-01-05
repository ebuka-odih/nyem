
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
}

export interface CityData {
  city: string;
}

export interface CategoryData {
  name: string;
  icon: React.ElementType;
}
