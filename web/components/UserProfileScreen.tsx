import React from 'react';
import {
    ArrowLeft,
    MapPin,
    Star,
    CheckCircle2,
    MessageCircle,
    Package,
    Calendar,
    Shield,
    ExternalLink
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
            {/* Header with gradient background */}
            <div className="relative h-48 bg-gradient-to-br from-[#990033] via-[#b30039] to-[#cc0044]">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
                    style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
                >
                    <ArrowLeft size={22} />
                </button>

                {/* Decorative circles */}
                <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/5" />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5" />
            </div>

            {/* Profile Card - Overlapping header */}
            <div className="relative -mt-20 mx-4 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden z-10">
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
                        <MapPin size={14} className="text-[#990033]" />
                        <span>{userData.location}</span>
                        {userData.distance && userData.distance !== 'Unknown' && (
                            <>
                                <span className="text-gray-300">•</span>
                                <span className="text-[#990033] font-medium">{userData.distance} away</span>
                            </>
                        )}
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
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))' }}>
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
