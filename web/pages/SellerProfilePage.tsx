
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    X,
    Edit3,
    Trash2,
    MapPin,
    BadgeCheck,
    Share2,
    Heart,
    UserPlus,
    MessageSquare,
    Star,
    Zap,
    Package,
    ChevronLeft,
    MoreVertical
} from 'lucide-react';
import { fetcher } from '../hooks/api/fetcher';
import { ENDPOINTS } from '../constants/endpoints';
import { transformListingToProduct } from '../utils/productTransformers';
import { Product, Vendor } from '../types';
import { RatingStars } from '../components/RatingStars';

export const SellerProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const isInvalidId = !id || id === 'undefined' || id === 'null';

    const { data, isLoading, error } = useQuery({
        queryKey: ['seller-profile', id],
        queryFn: () => fetcher<any>(ENDPOINTS.profile.show(id!)),
        enabled: !isInvalidId
    });

    console.log('[SellerProfilePage] id:', id, 'isInvalid:', isInvalidId);
    console.log('[SellerProfilePage] data:', data);
    console.log('[SellerProfilePage] error:', error);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#830e4c] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const user = data?.user || data;

    if (isInvalidId || error || !user || (!user.id && !user.username)) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <X size={32} className="text-rose-500" />
                </div>
                <h2 className="text-xl font-black text-neutral-900 uppercase">
                    {error ? 'Profile Error' : isInvalidId ? 'Invalid Profile URL' : 'Seller not found'}
                </h2>
                {(error || isInvalidId) && (
                    <p className="mt-2 text-sm text-neutral-500 font-medium max-w-xs mx-auto">
                        {isInvalidId
                            ? 'The seller ID in the URL is missing or malformed.'
                            : (error as any).message || 'An unexpected error occurred while fetching the profile.'}
                    </p>
                )}
                <button
                    onClick={() => navigate(-1)}
                    className="mt-8 bg-neutral-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-lg"
                >
                    Go Back
                </button>
            </div>
        );
    }
    const listings = (user.listings || []).map((l: any) => transformListingToProduct({
        ...l,
        category: l.category?.name || l.category
    }));

    const vendor: Vendor = {
        id: user.id,
        name: user.name || user.username || 'Anonymous',
        avatar: user.profile_photo || 'https://ui-avatars.com/api/?name=' + (user.name || user.username),
        location: user.city || 'Lagos, Nigeria',
        rating: 0,
        reviewCount: 0,
        joinedDate: user.created_at,
        bio: user.bio || 'Product Designer & Vintage Collector',
        verified: !!user.phone_verified_at,
        followers: 0,
    };

    const stats = [
        { label: 'Deals', value: user.listings_count || 0, icon: Package },
        { label: 'Rating', value: '0.0', icon: Star },
        { label: 'Followers', value: '0', icon: UserPlus },
    ];

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col pt-safe px-4 pb-20 no-scrollbar overflow-y-auto">
            <header className="flex items-center justify-between py-4 sticky top-0 bg-neutral-50/80 backdrop-blur-md z-30 -mx-4 px-4 border-b border-neutral-100">
                <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm border border-neutral-100 active:scale-90 transition-all">
                    <ChevronLeft size={20} className="text-neutral-900" strokeWidth={3} />
                </button>
                <h1 className="text-[11px] font-black text-neutral-900 uppercase tracking-[0.3em]">Seller Profile</h1>
                <button className="p-3 bg-white rounded-2xl shadow-sm border border-neutral-100 active:scale-90 transition-all">
                    <MoreVertical size={20} className="text-neutral-900" />
                </button>
            </header>

            <div className="flex flex-col gap-8 pb-10 mt-6">
                {/* Header Profile Section */}
                <div className="flex flex-col items-center">
                    <div className="relative mb-6">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-50 border-4 border-white shadow-2xl overflow-hidden ring-1 ring-black/5">
                            <img src={vendor.avatar} className="w-full h-full object-cover" alt={vendor.name} />
                        </div>
                        {vendor.verified && (
                            <div className="absolute -bottom-1 -right-1 bg-white p-2 rounded-xl shadow-lg border border-neutral-100 text-[#29B3F0]">
                                <BadgeCheck size={20} fill="currentColor" />
                            </div>
                        )}
                    </div>

                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-black text-neutral-900 tracking-tighter uppercase italic">{vendor.name}</h2>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
                            <MapPin size={12} className="text-[#830e4c]" /> {vendor.location}
                        </p>
                        <p className="text-xs font-medium text-neutral-500 max-w-xs mx-auto leading-relaxed mt-4 bg-white p-4 rounded-3xl border border-neutral-100 shadow-sm">
                            {vendor.bio}
                        </p>
                    </div>
                </div>

                {/* Action Group */}
                <div className="bg-white rounded-[3rem] p-6 shadow-xl border border-neutral-100 flex flex-col gap-6">
                    {/* Main Actions */}
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 bg-neutral-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <UserPlus size={14} strokeWidth={3} /> Follow
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 bg-[#830e4c] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={14} strokeWidth={3} /> Message
                        </motion.button>
                    </div>

                    <div className="flex gap-4">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="flex-1 flex flex-col items-center gap-2 group"
                        >
                            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover:bg-rose-100 transition-colors">
                                <Heart size={20} strokeWidth={2.5} />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-[0.1em] text-neutral-400">Favorite</span>
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="flex-1 flex flex-col items-center gap-2 group"
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: vendor.name,
                                        url: window.location.href
                                    }).catch(() => { });
                                }
                            }}
                        >
                            <div className="w-14 h-14 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-900 group-hover:bg-neutral-100 transition-colors">
                                <Share2 size={20} strokeWidth={2.5} />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-[0.1em] text-neutral-400">Share Shop</span>
                        </motion.button>

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="flex-1 flex flex-col items-center gap-2 group"
                        >
                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-100 transition-colors">
                                <Star size={20} strokeWidth={2.5} />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-[0.1em] text-neutral-400">Review</span>
                        </motion.button>
                    </div>
                </div>


                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-white border border-neutral-100 rounded-3xl p-5 flex flex-col items-center text-center shadow-sm">
                            <stat.icon size={16} className="text-neutral-300 mb-2" />
                            <span className="text-xl font-black text-neutral-900 leading-none tracking-tighter">{stat.value}</span>
                            <span className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mt-1.5">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Active Drops */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-neutral-900 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Zap size={14} className="text-[#830e4c]" /> Active Drops
                        </h4>
                        <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">({listings.length})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {listings.map((product: Product) => (
                            <div
                                key={product.id}
                                className="text-left group"
                            >
                                <div className="aspect-[4/5] bg-white rounded-[2rem] overflow-hidden border border-neutral-100 mb-3 relative shadow-md">
                                    <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-white">
                                        {product.price}
                                    </div>
                                </div>
                                <h5 className="text-[10px] font-black text-neutral-900 truncate uppercase tracking-tight px-1">{product.name}</h5>
                                <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest mt-1 px-1">{product.category}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-neutral-900 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Star size={14} className="text-amber-400" /> Buyer Reviews
                        </h4>
                        <button className="text-[9px] font-black text-[#830e4c] uppercase tracking-widest bg-[#830e4c1a] px-3 py-1.5 rounded-lg active:scale-95 transition-all">Add Review</button>
                    </div>
                    {/* Empty state for reviews since we don't have real review data yet */}
                    <div className="py-16 text-center bg-white rounded-[2.5rem] border border-neutral-100 border-dashed shadow-sm">
                        <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star size={20} className="text-neutral-200" />
                        </div>
                        <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">No buyer reviews yet</p>
                        <p className="text-[8px] font-medium text-neutral-400 mt-1 uppercase tracking-wider">Be the first to review {vendor.name}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
