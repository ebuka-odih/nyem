import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    MapPin,
    Star,
    CheckCircle2,
    MessageCircle,
    Package,
    Calendar,
    Shield,
    ExternalLink,
    Heart,
    Share2,
    UserPlus,
    UserCheck,
    Clock,
    Eye
} from 'lucide-react';
import { PLACEHOLDER_AVATAR, generateInitialsAvatar } from '../constants/placeholders';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { useAuth } from '../contexts/AuthContext';
import { SwipeItem } from '../types';

interface UserProfileProps {
    user: {
        id?: string | number;
        name: string;
        image: string;
        location: string;
        distance?: string;
        rating?: number;
        reviews?: number;
        itemsListed?: number;
        memberSince?: string;
        verified?: boolean;
        bio?: string;
        phone_verified_at?: string | null;
    };
    onBack: () => void;
    onChat?: () => void;
    isAuthenticated?: boolean;
    onLoginPrompt?: () => void;
    onItemClick?: (item: SwipeItem) => void;
}

interface UserItem {
    id: number;
    title: string;
    image: string;
    type?: string;
    price?: string;
    condition?: string;
}

export const UserProfileScreen: React.FC<UserProfileProps> = ({
    user,
    onBack,
    onChat,
    isAuthenticated = false,
    onLoginPrompt,
    onItemClick,
}) => {
    const [isLiked, setIsLiked] = useState(false);
    const [isFollowed, setIsFollowed] = useState(false);
    const [userItems, setUserItems] = useState<UserItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const { token } = useAuth();

    // Helper function to check if URL is a generated avatar
    const isGeneratedAvatar = (url: string): boolean => {
      if (!url || url.trim() === '') return false;
      const generatedAvatarPatterns = [
        'ui-avatars.com',
        'pravatar.cc',
        'i.pravatar.cc',
        'robohash.org',
        'dicebear.com',
        'avatar.vercel.sh',
      ];
      return generatedAvatarPatterns.some(pattern => 
        url.toLowerCase().includes(pattern.toLowerCase())
      );
    };

    // Fetch user items when component mounts
    useEffect(() => {
        const fetchUserItems = async () => {
            if (!user.id) {
                setLoadingItems(false);
                return;
            }

            setLoadingItems(true);
            try {
                // Fetch items from feed and filter by user_id
                // Note: This is a workaround since there's no direct endpoint to get items by user ID
                // In production, you might want to add a dedicated endpoint like /api/users/{id}/items
                const res = await apiFetch(ENDPOINTS.items.feed, { 
                    token: token || undefined 
                });
                
                const allItems = res.items || res.data || [];
                
                // Filter items by user ID
                const filteredItems = allItems
                    .filter((item: any) => {
                        const itemUserId = item.user?.id || item.user_id;
                        return String(itemUserId) === String(user.id);
                    })
                    .filter((item: any) => item.status === 'active') // Only show active items
                    .slice(0, 6) // Limit to 6 items for display
                    .map((item: any) => {
                        const photos = item.photos || item.images || [];
                        const primaryImage = photos[0] || item.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                        
                        return {
                            id: item.id,
                            title: item.title || 'Untitled Item',
                            image: primaryImage,
                            type: item.type,
                            price: item.price ? (typeof item.price === 'string' ? item.price : `₦${item.price}`) : undefined,
                            condition: item.condition,
                        };
                    });
                
                setUserItems(filteredItems);
            } catch (error) {
                console.error('Failed to fetch user items:', error);
                setUserItems([]);
            } finally {
                setLoadingItems(false);
            }
        };

        fetchUserItems();
    }, [user.id, token]);

    // Use actual user data, only show fields if they exist (no dummy/mock data)
    const userData = {
        ...user,
        // Only use provided values, don't set defaults
        rating: user.rating,
        reviews: user.reviews,
        itemsListed: user.itemsListed,
        memberSince: user.memberSince,
        verified: user.verified,
        bio: user.bio,
        // Ensure image uses actual profile photo or initials avatar (filter out generated avatars)
        image: (() => {
          const userName = user.name || 'User';
          if (!user.image || user.image.trim() === '') {
            return generateInitialsAvatar(userName);
          }
          // Filter out generated avatar URLs
          return isGeneratedAvatar(user.image) ? generateInitialsAvatar(userName) : user.image;
        })(),
    };

    // Check if phone is verified
    const isPhoneVerified = user.phone_verified_at !== null && user.phone_verified_at !== undefined;

    const handleChatClick = () => {
        if (isAuthenticated) {
            onChat?.();
        } else {
            onLoginPrompt?.();
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 relative">
            {/* Fixed Back Button - Always visible */}
            <button
                onClick={onBack}
                className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
                style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
            >
                <ArrowLeft size={22} />
            </button>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))' }}>
                {/* Header with gradient background */}
                <div className="relative h-48 bg-gradient-to-br from-brand via-brand-600 to-brand-700 shrink-0">
                    {/* Decorative circles */}
                    <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/5" />
                    <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5" />
                </div>

                {/* Profile Card - Overlapping header */}
                <div className="relative -mt-20 mx-4 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden z-10 mb-4">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center pt-6 pb-4 border-b border-gray-100">
                        {/* Avatar */}
                        <div className="relative mb-3">
                            <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden ring-4 ring-white shadow-lg">
                                <img
                                    src={userData.image}
                                    alt={userData.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // If image fails to load, use initials avatar
                                        (e.target as HTMLImageElement).src = generateInitialsAvatar(userData.name);
                                    }}
                                />
                            </div>
                            {userData.verified && (
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-xl flex items-center justify-center ring-3 ring-white">
                                    <CheckCircle2 size={14} className="text-white" />
                                </div>
                            )}
                        </div>

                        {/* Name & Verified */}
                        <h1 className="text-xl font-bold text-gray-900 mb-1">{userData.name}</h1>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                            <span>{userData.location}</span>
                            {userData.distance && userData.distance !== 'Unknown' && (
                                <>
                                    <MapPin size={14} className="text-brand ml-1" />
                                    <span className="text-brand font-medium">{userData.distance} away</span>
                                </>
                            )}
                        </div>

                        {/* Profile Actions */}
                        <div className="flex items-center justify-center gap-3 mt-5 w-full px-6">
                            <button
                                onClick={() => {
                                    if (isAuthenticated) setIsLiked(!isLiked);
                                    else onLoginPrompt?.();
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${isLiked
                                    ? 'bg-red-50 border-red-200 text-red-500'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Heart size={20} className={isLiked ? "fill-current" : ""} />
                            </button>

                            <button
                                onClick={() => {
                                    // Share functionality
                                    if (navigator.share) {
                                        navigator.share({
                                            title: `${userData.name}'s Profile`,
                                            text: `Check out ${userData.name}'s profile on Nyem`,
                                            url: window.location.href,
                                        }).catch((err) => {
                                            console.log('Error sharing:', err);
                                        });
                                    } else {
                                        // Fallback: copy to clipboard
                                        navigator.clipboard.writeText(window.location.href).then(() => {
                                            alert('Profile link copied to clipboard!');
                                        }).catch((err) => {
                                            console.log('Error copying to clipboard:', err);
                                        });
                                    }
                                }}
                                className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all"
                            >
                                <Share2 size={20} />
                            </button>

                            <button
                                onClick={() => {
                                    if (isAuthenticated) setIsFollowed(!isFollowed);
                                    else onLoginPrompt?.();
                                }}
                                className={`flex-1 h-10 rounded-full flex items-center justify-center gap-2 text-sm font-semibold transition-all ${isFollowed
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-black text-white hover:bg-gray-800'
                                    }`}
                            >
                                {isFollowed ? (
                                    <>
                                        <UserCheck size={18} />
                                        Following
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={18} />
                                        Follow
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Stats Row - Only show if data exists */}
                    {(userData.rating !== undefined || userData.itemsListed !== undefined || userData.memberSince) && (
                        <div className="grid grid-cols-3 divide-x divide-gray-100 py-4">
                            {/* Rating */}
                            {userData.rating !== undefined && (
                                <div className="flex flex-col items-center px-4">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Star size={16} className="text-amber-400 fill-amber-400" />
                                        <span className="text-lg font-bold text-gray-900">{userData.rating}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{userData.reviews || 0} Reviews</span>
                                </div>
                            )}

                            {/* Items Listed */}
                            {userData.itemsListed !== undefined && (
                                <div className="flex flex-col items-center px-4">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Package size={16} className="text-brand" />
                                        <span className="text-lg font-bold text-gray-900">{userData.itemsListed}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">Items</span>
                                </div>
                            )}

                            {/* Member Since */}
                            {userData.memberSince && (
                                <div className="flex flex-col items-center px-4">
                                    <div className="flex items-center gap-1 mb-1">
                                        <Calendar size={16} className="text-emerald-500" />
                                    </div>
                                    <span className="text-xs text-gray-500">{userData.memberSince}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="px-4 space-y-4">
                    {/* About Section - Only show if bio exists */}
                    {userData.bio && (
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="w-1 h-4 bg-brand rounded-full" />
                                About
                            </h2>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {userData.bio}
                            </p>
                        </div>
                    )}

                    {/* Trust & Safety */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-emerald-500 rounded-full" />
                            Trust & Safety
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    isPhoneVerified ? 'bg-blue-50' : 'bg-gray-50'
                                }`}>
                                    {isPhoneVerified ? (
                                        <CheckCircle2 size={18} className="text-blue-500" />
                                    ) : (
                                        <Clock size={18} className="text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Verified Account</p>
                                    <p className={`text-xs ${isPhoneVerified ? 'text-gray-500' : 'text-amber-600'}`}>
                                        {isPhoneVerified ? 'Phone number verified' : 'Not Verified'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User's Listings */}
                    {user.id && (
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="w-1 h-4 bg-brand rounded-full" />
                                Uploaded Items
                            </h2>
                            {loadingItems ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
                                    <p className="text-gray-500 text-xs mt-2">Loading items...</p>
                                </div>
                            ) : userItems.length > 0 ? (
                                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                                    {userItems.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                if (onItemClick) {
                                                    // Convert to SwipeItem format
                                                    const swipeItem: SwipeItem = {
                                                        id: item.id,
                                                        type: (item.type as 'marketplace' | 'barter') || 'barter',
                                                        title: item.title,
                                                        image: item.image,
                                                        description: '',
                                                        condition: item.condition || 'used',
                                                        lookingFor: '',
                                                        owner: {
                                                            id: user.id,
                                                            name: user.name,
                                                            image: userData.image,
                                                            location: user.location,
                                                            distance: user.distance || 'Unknown',
                                                        },
                                                        gallery: [item.image],
                                                        ...(item.type === 'marketplace' && item.price ? { price: item.price } : {}),
                                                    };
                                                    onItemClick(swipeItem);
                                                }
                                            }}
                                            className="flex-shrink-0 w-32 bg-gray-50 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                                        >
                                            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                                <img
                                                    src={item.image}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                />
                                                {item.price && (
                                                    <div className="absolute top-2 left-2 bg-gradient-to-r from-brand to-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                                                        {item.price}
                                                    </div>
                                                )}
                                                {!item.price && item.condition && (
                                                    <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md uppercase">
                                                        {item.condition}
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (onItemClick) {
                                                                // Convert to SwipeItem format
                                                                const swipeItem: SwipeItem = {
                                                                    id: item.id,
                                                                    type: (item.type as 'marketplace' | 'barter') || 'barter',
                                                                    title: item.title,
                                                                    image: item.image,
                                                                    description: '',
                                                                    condition: item.condition || 'used',
                                                                    lookingFor: '',
                                                                    owner: {
                                                                        id: user.id,
                                                                        name: user.name,
                                                                        image: userData.image,
                                                                        location: user.location,
                                                                        distance: user.distance || 'Unknown',
                                                                    },
                                                                    gallery: [item.image],
                                                                    ...(item.type === 'marketplace' && item.price ? { price: item.price } : {}),
                                                                };
                                                                onItemClick(swipeItem);
                                                            }
                                                        }}
                                                        className="pointer-events-auto bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
                                                        title="View Item"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-2">
                                                <h3 className="font-semibold text-gray-900 text-xs truncate">{item.title}</h3>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Package size={32} className="text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">No items uploaded yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recent Reviews Preview - Removed dummy reviews, should be populated from actual reviews */}
                </div>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}>
                <div className="px-4 pt-3 pb-2">
                    <div className="flex gap-3 max-w-md mx-auto">
                        <button
                            onClick={handleChatClick}
                            className="flex-1 bg-gradient-to-r from-brand to-brand-600 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-brand/25 hover:shadow-xl hover:shadow-brand/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={18} strokeWidth={2} />
                            {isAuthenticated ? 'Send Message' : 'Login to Chat'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
