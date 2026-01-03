
import { Globe, Star, Smartphone, Shirt, Home, Dumbbell, Sparkles, Gamepad2, Book, Car, Leaf, Activity, Dog } from 'lucide-react';
import { Product, CategoryData, CityData, Review } from './types';

const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev1',
    userName: 'Chidi K.',
    userAvatar: 'https://i.pravatar.cc/150?u=chidi',
    rating: 5,
    comment: 'Exceptional quality and very fast communication. The item was exactly as described.',
    date: '2 days ago'
  },
  {
    id: 'rev2',
    userName: 'Amaka O.',
    userAvatar: 'https://i.pravatar.cc/150?u=amaka',
    rating: 4,
    comment: 'Great seller. The packaging was top-notch. Would definitely buy again.',
    date: '1 week ago'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Aura Minimalist Watch",
    price: "₦145,000",
    category: "ACCESSORIES",
    description: "Swiss movement with sapphire crystal and Italian leather.",
    longDescription: "The Aura Minimalist Watch is a testament to timeless design. Featuring a precision Swiss quartz movement, it is encased in a scratch-resistant sapphire crystal. The strap is crafted from full-grain Italian leather and ages beautifully over time. Perfect for those who appreciate understated luxury.",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=800"
    ],
    color: "#f3f4f6",
    distance: "2.4KM",
    vendor: {
      name: "Chrono Labs",
      avatar: "https://i.pravatar.cc/150?u=chrono",
      location: "Wuse, Abuja",
      rating: 4.8,
      reviewCount: 124,
      followers: 1240,
      joinedDate: "Jan 2023",
      bio: "Premium timepiece curators specializing in minimalist designs and heritage restoration.",
      verified: true,
      reviews: MOCK_REVIEWS
    }
  },
  {
    id: 2,
    name: "Sonic Pro Headphones",
    price: "₦320,000",
    category: "ELECTRONICS",
    description: "Industry-leading noise cancellation and spatial audio.",
    longDescription: "Experience sound like never before with Sonic Pro. Our proprietary ANC blocks out 98% of ambient noise, while custom-tuned drivers deliver rich, balanced audio. Includes a luxury hardshell carrying case.",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?auto=format&fit=crop&q=80&w=800"
    ],
    color: "#e5e7eb",
    distance: "1.8KM",
    vendor: {
      name: "AudioFlow",
      avatar: "https://i.pravatar.cc/150?u=audio",
      location: "Ikeja, Lagos",
      rating: 4.9,
      reviewCount: 89,
      followers: 842,
      joinedDate: "Mar 2022",
      bio: "Your destination for high-fidelity audio equipment in Lagos. Authorized dealer for major brands.",
      verified: true,
      reviews: MOCK_REVIEWS
    }
  },
  {
    id: 3,
    name: "Nebula Smart Bottle",
    price: "₦48,500",
    category: "LIFESTYLE",
    description: "Tracks hydration and glows to remind you to drink.",
    longDescription: "The Nebula Smart Bottle syncs with your phone to track every sip. It features a triple-insulated stainless steel core and a LED ring that pulses when you're behind on your goals.",
    images: [
      "https://images.unsplash.com/photo-1602143399827-bd95968c471c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1556843029-644774ed7d7d?auto=format&fit=crop&q=80&w=800"
    ],
    color: "#d1d5db",
    distance: "3.2KM",
    vendor: {
      name: "HydroTech",
      avatar: "https://i.pravatar.cc/150?u=hydro",
      location: "Independence Layout, Enugu",
      rating: 4.5,
      reviewCount: 56,
      followers: 310,
      joinedDate: "Nov 2023",
      bio: "Smart wellness solutions for the modern Nigerian. Focus on sustainability and tech.",
      verified: false,
      reviews: MOCK_REVIEWS
    }
  }
];

export const CATEGORIES_DATA: CategoryData[] = [
  { name: "All", icon: Globe },
  { name: "Accessories", icon: Star },
  { name: "Electronics", icon: Smartphone },
  { name: "Fashion", icon: Shirt },
  { name: "Home & Decor", icon: Home },
  { name: "Sports & Fitness", icon: Dumbbell },
  { name: "Beauty & Care", icon: Sparkles },
  { name: "Toys & Games", icon: Gamepad2 },
  { name: "Books & Media", icon: Book },
  { name: "Automotive", icon: Car },
  { name: "Garden & Outdoor", icon: Leaf },
  { name: "Health & Wellness", icon: Activity },
  { name: "Pet Supplies", icon: Dog }
];

export const NIGERIA_CITIES: CityData[] = [
  { city: "All Locations" },
  { city: "Abuja" },
  { city: "Lagos" },
  { city: "Port Harcourt" },
  { city: "Enugu" },
  { city: "Asaba" },
  { city: "Kano" },
  { city: "Ibadan" }
];
