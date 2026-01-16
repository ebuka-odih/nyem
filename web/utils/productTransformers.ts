import { Product } from '../types';

/**
 * Transform API listing to Product type - matches ListingResource structure
 */
export const transformListingToProduct = (listing: any): Product => {
  // Handle user/owner data (ListingResource provides both 'user' and 'owner')
  const user = listing.user || listing.owner || {};

  // Handle images - ListingResource provides 'images' array and 'gallery' array (both same)
  // Also check for 'image' (singular) as fallback
  let images: string[] = [];
  if (Array.isArray(listing.images) && listing.images.length > 0) {
    images = listing.images;
  } else if (Array.isArray(listing.photos) && listing.photos.length > 0) {
    images = listing.photos;
  } else if (Array.isArray(listing.gallery) && listing.gallery.length > 0) {
    images = listing.gallery;
  } else if (listing.image) {
    images = [listing.image];
  }

  // Format price - ListingResource formats price with commas for marketplace type
  let price = 'Price on request';
  if (listing.price) {
    // If it's already a string with commas, use it as is (backend formatted)
    if (typeof listing.price === 'string' && listing.price.includes(',')) {
      price = listing.price.includes('₦') ? listing.price : `₦${listing.price}`;
    } else {
      // If it's a string without commas, parse and format it
      const priceValue = typeof listing.price === 'string'
        ? parseFloat(listing.price.replace(/[₦,]/g, ''))
        : listing.price;
      // Format with commas for display
      if (!isNaN(priceValue)) {
        price = `₦${priceValue.toLocaleString('en-US')}`;
      } else {
        price = `₦${listing.price}`;
      }
    }
  } else if (listing.looking_for) {
    price = 'Trade';
  }

  // Format distance - ListingResource provides 'distance_km' and 'distance_display'
  let distance = 'Unknown';
  if (listing.distance_km !== null && listing.distance_km !== undefined) {
    if (listing.distance_km < 1) {
      distance = `${Math.round(listing.distance_km * 1000)}M`;
    } else {
      distance = `${listing.distance_km.toFixed(1)}KM`;
    }
  } else if (listing.distance_display) {
    distance = listing.distance_display.toUpperCase();
  }

  // Format vendor location - prioritize owner.location (formatted "Area, City") from ListingResource
  // Fallback to constructing from user.area and user.city if owner.location is not available
  const fullLocation = listing.owner?.location
    ? listing.owner.location
    : (user.area
      ? `${user.area}, ${user.city || listing.city || 'Unknown'}`
      : (user.city || listing.city || 'Unknown'));

  return {
    id: listing.id,
    name: listing.title || 'Untitled Item',
    price: price,
    category: (typeof listing.category === 'object' && listing.category !== null) ? listing.category.name : (listing.category || 'UNCATEGORIZED'), // ListingResource provides category name or object
    description: listing.description || '',
    longDescription: listing.description || '',
    images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=800'],
    color: '#f3f4f6',
    distance: distance,
    createdAt: typeof listing.created_at === 'string'
      ? listing.created_at
      : (listing.created_at?.date || listing.created_at),
    vendor: {
      id: user.id || listing.user_id || listing.owner?.id,
      name: user.username || user.name || 'Unknown Seller',
      avatar: user.profile_photo || user.image || 'https://i.pravatar.cc/150?u=default',
      location: fullLocation,
      rating: 0, // No default rating - show 0 if user has no reviews
      reviewCount: 0,
      followers: 0,
      joinedDate: '2024',
      bio: '',
      verified: !!user.phone_verified_at,
      reviews: []
    },
    isSuper: false,
    userId: listing.user_id || user.id || listing.owner?.id || null, // Store user ID for ownership check
    stats: {
      views: listing.views || 0,
      likes: listing.likes || 0,
      stars: listing.stars || listing.super_interest || 0, // Super interest / wishlist count
      super_interest: listing.super_interest || listing.stars || 0, // Alias for better naming
      shares: listing.shares || 0
    }
  };
};

/**
 * Create a special Ad item
 */
export const createAdItem = (): Product => {
  return {
    id: `ad-${Date.now()}`,
    name: 'Small Business Support',
    description: 'Nyem empowers local artisans and micro-businesses. Join our community and shine together!',
    price: 'PROMO',
    category: 'COMMUNITY',
    images: ['https://images.unsplash.com/photo-1542744094-24638eff58bb?w=800'],
    color: '#830e4c',
    longDescription: '',
    distance: 'Local',
    vendor: {
      name: 'Nyem Community',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      location: 'Everywhere',
      rating: 5,
      reviewCount: 1000,
      joinedDate: '2024',
      bio: 'Supporting small businesses.',
      verified: true,
      followers: 10000
    },
    isAd: true
  };
};

/**
 * Create a special Welcome onboarding item
 */
export const createWelcomeItem = (): Product => {
  return {
    id: 'welcome-card',
    name: 'Welcome to Nyem',
    description: 'Learn how to use Nyem to discover amazing local items.',
    price: 'INFO',
    category: 'ONBOARDING',
    images: [], // Not used for welcome card
    color: '#830e4c',
    longDescription: '',
    distance: 'System',
    vendor: {
      name: 'Nyem Guide',
      avatar: '',
      location: 'Local',
      rating: 5,
      reviewCount: 0,
      joinedDate: '2024',
      bio: 'Your personal guide to Nyem.',
      verified: true,
      followers: 10000
    },
    isWelcome: true
  };
};

/**
 * Send native browser notification
 */
export const sendNativeNotification = (title: string, body: string, icon?: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: icon || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=100'
    });
  }
};

