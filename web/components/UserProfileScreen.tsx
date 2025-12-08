import React, { useState } from 'react';
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
    UserCheck
} from 'lucide-react';

interface UserProfileProps {
    user: {
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
    };
    onBack: () => void;
    onChat?: () => void;
    isAuthenticated?: boolean;
    onLoginPrompt?: () => void;
}

export const UserProfileScreen: React.FC<UserProfileProps> = ({
    user,
    onBack,
    onChat,
    isAuthenticated = false,
    onLoginPrompt,
}) => {
    const [isLiked, setIsLiked] = useState(false);
    const [isFollowed, setIsFollowed] = useState(false);

    // Generate mock data for demo purposes
    const userData = {
        ...user,
        rating: user.rating || 4.9,
        reviews: user.reviews || 12,
        itemsListed: user.itemsListed || 8,
        memberSince: user.memberSince || 'Dec 2023',
        verified: user.verified !== undefined ? user.verified : true,
        bio: user.bio || 'Passionate about quality items and fair trades. Always looking for unique finds and great deals! 🛍️',
    };

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
                <div className="relative h-48 bg-gradient-to-br from-[#990033] via-[#b30039] to-[#cc0044] shrink-0">
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
                                    <MapPin size={14} className="text-[#990033] ml-1" />
                                    <span className="text-[#990033] font-medium">{userData.distance} away</span>
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

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 divide-x divide-gray-100 py-4">
                        {/* Rating */}
                        <div className="flex flex-col items-center px-4">
                            <div className="flex items-center gap-1 mb-1">
                                <Star size={16} className="text-amber-400 fill-amber-400" />
                                <span className="text-lg font-bold text-gray-900">{userData.rating}</span>
                            </div>
                            <span className="text-xs text-gray-500">{userData.reviews} Reviews</span>
                        </div>

                        {/* Items Listed */}
                        <div className="flex flex-col items-center px-4">
                            <div className="flex items-center gap-1 mb-1">
                                <Package size={16} className="text-[#990033]" />
                                <span className="text-lg font-bold text-gray-900">{userData.itemsListed}</span>
                            </div>
                            <span className="text-xs text-gray-500">Items</span>
                        </div>

                        {/* Member Since */}
                        <div className="flex flex-col items-center px-4">
                            <div className="flex items-center gap-1 mb-1">
                                <Calendar size={16} className="text-emerald-500" />
                            </div>
                            <span className="text-xs text-gray-500">{userData.memberSince}</span>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="px-4 space-y-4">
                    {/* About Section */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <h2 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="w-1 h-4 bg-[#990033] rounded-full" />
                            About
                        </h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {userData.bio}
                        </p>
                    </div>

                    {/* Trust & Safety */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="w-1 h-4 bg-emerald-500 rounded-full" />
                            Trust & Safety
                        </h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <CheckCircle2 size={18} className="text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Verified Account</p>
                                    <p className="text-xs text-gray-500">Phone number verified</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <Shield size={18} className="text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Trusted Seller</p>
                                    <p className="text-xs text-gray-500">Great track record</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User's Listings */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-1 h-4 bg-purple-500 rounded-full" />
                                Listings
                            </h2>
                            <button className="text-xs text-[#990033] font-medium flex items-center gap-1">
                                View All <ExternalLink size={12} />
                            </button>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="w-32 shrink-0">
                                    <div className="aspect-square rounded-xl bg-gray-100 mb-2 overflow-hidden relative">
                                        <img
                                            src={`https://source.unsplash.com/random/200x200?product&sig=${item}`}
                                            alt="Product"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-1 right-1 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                                            <span className="text-[10px] font-bold text-white">₦{(item * 15000).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-xs font-bold text-gray-900 truncate">Product Item {item}</h3>
                                    <p className="text-[10px] text-gray-500 truncate">Electronics • Used</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Reviews Preview */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-1 h-4 bg-amber-400 rounded-full" />
                                Reviews
                            </h2>
                            <button className="text-xs text-[#990033] font-medium flex items-center gap-1">
                                View All <ExternalLink size={12} />
                            </button>
                        </div>

                        {/* Sample Review */}
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={12}
                                            className={star <= 5 ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                                        />
                                    ))}
                                </div>
                                <span className="text-xs text-gray-500">2 days ago</span>
                            </div>
                            <p className="text-sm text-gray-600">
                                "Great seller! Item was exactly as described. Fast communication and smooth transaction. Highly recommend!"
                            </p>
                            <p className="text-xs text-gray-400 mt-1">- Happy Buyer</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}>
                <div className="px-4 pt-3 pb-2">
                    <div className="flex gap-3 max-w-md mx-auto">
                        <button
                            onClick={handleChatClick}
                            className="flex-1 bg-gradient-to-r from-[#990033] to-[#cc0044] text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-[#990033]/25 hover:shadow-xl hover:shadow-[#990033]/30 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
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
