
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, MapPin, BadgeCheck, Share2, Heart, UserPlus, MessageSquare, Star, Zap, Package, ChevronLeft, MoreVertical } from 'lucide-react';
import { fetcher } from '../hooks/api/fetcher';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { transformListingToProduct } from '../utils/productTransformers';
import { Product } from '../types';
import { useAuth } from '../hooks/useAuth';

export const SellerProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { hasValidToken } = useAuth();

    const isInvalidId = !id || id === 'undefined' || id === 'null';

    const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);
    const [rating, setRating] = React.useState(0);
    const [comment, setComment] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [showCallButton, setShowCallButton] = React.useState(false);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        if (scrollTop > 150) {
            setShowCallButton(true);
        } else {
            setShowCallButton(false);
        }
    };

    const { data, isLoading, error } = useQuery({
        queryKey: ['seller-profile', id],
        queryFn: () => fetcher<any>(ENDPOINTS.profile.show(id!)),
        enabled: !isInvalidId
    });

    const { data: reviewsData } = useQuery({
        queryKey: ['seller-reviews', id],
        queryFn: () => fetcher<any>(ENDPOINTS.reviews.list(id!)),
        enabled: !!id
    });

    const submitReviewMutation = useMutation({
        mutationFn: (newReview: { receiver_id: string | number; rating: number; comment: string }) =>
            apiFetch(ENDPOINTS.reviews.create, {
                method: 'POST',
                body: newReview,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seller-profile', id] });
            queryClient.invalidateQueries({ queryKey: ['seller-reviews', id] });
            setIsReviewModalOpen(false);
            setRating(0);
            setComment('');
            alert('Review submitted successfully!');
        },
        onError: (err: any) => {
            const errorMessage = err.message || '';
            if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Unauthenticated')) {
                navigate('/login', { state: { from: window.location.pathname } });
                return;
            }
            alert(errorMessage || 'Failed to submit review');
        },
        onSettled: () => {
            setIsSubmitting(false);
        }
    });

    const openReviewModal = () => {
        if (!hasValidToken) {
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }
        setIsReviewModalOpen(true);
    };

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        if (!hasValidToken) {
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }
        if (rating === 0) {
            alert('Please select a star rating');
            return;
        }
        setIsSubmitting(true);
        submitReviewMutation.mutate({
            receiver_id: id,
            rating,
            comment,
        });
    };

    const { data: followData, refetch: refetchFollowStatus } = useQuery({
        queryKey: ['follow-status', id],
        queryFn: async () => {
            try {
                return await fetcher<any>(ENDPOINTS.follow.status(id!));
            } catch (err) {
                console.error('Follow status check failed', err);
                return { is_following: false };
            }
        },
        enabled: !!id && hasValidToken
    });

    const isFollowing = followData?.is_following || false;

    const followMutation = useMutation({
        mutationFn: () => fetcher<any>(isFollowing ? ENDPOINTS.follow.unfollow(id!) : ENDPOINTS.follow.follow(id!), { method: 'POST' }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['follow-status', id] });
            queryClient.invalidateQueries({ queryKey: ['seller-profile', id] });
            if (res.is_following) {
                // The backend handles the actual push notification, but we can show a toast or alert
                alert(`You are now following this seller. You'll be notified when they upload new items!`);
            }
        },
        onError: (err: any) => {
            alert(err.message || 'Failed to update follow status');
        }
    });

    const handleFollowClick = () => {
        if (!hasValidToken) {
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }
        followMutation.mutate();
    };

    const startConversationMutation = useMutation({
        mutationFn: () => fetcher<any>(ENDPOINTS.conversations.start, {
            method: 'POST',
            body: {
                recipient_id: id,
                message_text: "Hi, I'm interested in your items!"
            }
        }),
        onSuccess: (res) => {
            // Check both unpacked and raw response formats
            const conversationId = res.conversation?.id || res.data?.conversation?.id;
            const isSuccess = res.success !== false; // if it was unpacked, success might be missing

            if (conversationId) {
                navigate(`/chat/${conversationId}`);
            }
        },
        onError: (err: any) => {
            alert(err.message || 'Failed to start conversation');
        }
    });

    const handleMessageClick = () => {
        if (!hasValidToken) {
            navigate('/login', { state: { from: window.location.pathname } });
            return;
        }
        startConversationMutation.mutate();
    };

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
                <h2 className="text-xl font-black text-neutral-900 uppercase italic">Seller Not Found</h2>
                <p className="text-neutral-500 mt-2 text-sm">The profile you're looking for doesn't exist or is unavailable.</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-8 bg-neutral-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                    Back to Feed
                </button>
            </div>
        );
    }

    const listings = (user.listings || []).map(transformListingToProduct);
    // fetcher automatically unpacks 'data' if it exists (like in paginated reviews)
    const reviewsList = Array.isArray(reviewsData) ? reviewsData : (reviewsData?.data || []);

    const vendor = {
        id: user.id,
        name: user.name || user.username || 'Anonymous',
        avatar: user.profile_photo || 'https://ui-avatars.com/api/?name=' + (user.name || user.username),
        location: (typeof user.city === 'object' && user.city !== null ? user.city.name : user.city) || 'Lagos, Nigeria',
        bio: user.bio || 'Product Designer & Vintage Collector',
        verified: !!user.phone_verified_at,
        phone: user.phone || null,
    };

    const stats = [
        { label: 'Listings', value: user.listings_count || 0, icon: Package },
        { label: 'Rating', value: user.average_rating || '0.0', icon: Star },
        { label: 'Followers', value: user.followers_count || '0', icon: UserPlus },
    ];

    return (
        <div className="h-[100svh] bg-slate-100 flex flex-col overflow-hidden relative items-center pb-0">
            <div className="w-full max-w-full sm:max-w-[768px] h-full flex flex-col relative bg-white shadow-[0_0_50px_rgba(0,0,0,0.05)] pb-0">
                <header className="shrink-0 flex items-center justify-between py-4 px-6 bg-white border-b border-neutral-100 z-30">
                    <button onClick={() => navigate(-1)} className="p-3 bg-neutral-50 rounded-2xl active:scale-90 transition-all">
                        <ChevronLeft size={20} className="text-neutral-900" strokeWidth={3} />
                    </button>
                    <h1 className="text-[11px] font-black text-neutral-900 uppercase tracking-[0.3em]">Seller Profile</h1>
                    <button className="p-3 bg-neutral-50 rounded-2xl active:scale-90 transition-all">
                        <MoreVertical size={20} className="text-neutral-900" />
                    </button>
                </header>

                <main className="flex-1 relative overflow-hidden flex flex-col min-h-0 bg-neutral-50/50">
                    <div
                        onScroll={handleScroll}
                        className="flex-1 relative w-full mx-auto px-4 flex flex-col overflow-y-auto no-scrollbar pt-6 pb-12"
                    >
                        <div className="flex flex-col gap-8">
                            {/* Combined Master Card */}
                            <div className="bg-white rounded-[3rem] shadow-xl border border-neutral-100 overflow-hidden">
                                <div className="p-8 flex flex-col items-center">
                                    <div className="max-w-[480px] w-full flex flex-col items-center">
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
                                        <div className="text-center space-y-2 w-full">
                                            <h2 className="text-3xl font-black text-neutral-900 tracking-tighter uppercase italic">{vendor.name}</h2>
                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center justify-center gap-1.5">
                                                <MapPin size={12} className="text-[#830e4c]" /> {vendor.location}
                                            </p>
                                            <div className="mt-6 pt-6 border-t border-neutral-50">
                                                <p className="text-xs font-medium text-neutral-500 leading-relaxed italic">
                                                    "{vendor.bio}"
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-8 bg-neutral-50/80 border-t border-neutral-50 flex flex-col items-center">
                                    <div className="max-w-[480px] w-full flex flex-col gap-6">
                                        <div className="flex items-center gap-3">
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleFollowClick}
                                                disabled={followMutation.isPending}
                                                className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg transition-all flex items-center justify-center gap-2 ${isFollowing ? 'bg-white text-[#830e4c] border-2 border-[#830e4c]' : 'bg-neutral-900 text-white border-2 border-transparent'}`}
                                            >
                                                {isFollowing ? (
                                                    <><BadgeCheck size={14} strokeWidth={3} /> Following</>
                                                ) : (
                                                    <><UserPlus size={14} strokeWidth={3} /> Follow</>
                                                )}
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleMessageClick}
                                                disabled={startConversationMutation.isPending}
                                                className="flex-1 bg-[#830e4c] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg transition-all flex items-center justify-center gap-2"
                                            >
                                                {startConversationMutation.isPending ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <><MessageSquare size={14} strokeWidth={3} /> Message</>
                                                )}
                                            </motion.button>
                                        </div>
                                        <div className="flex gap-4">
                                            <motion.button whileTap={{ scale: 0.9 }} className="flex-1 flex flex-col items-center gap-2 group">
                                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-center text-rose-500 group-hover:bg-rose-50 transition-colors">
                                                    <Heart size={20} strokeWidth={2.5} />
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-[0.1em] text-neutral-400">Favorite</span>
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                className="flex-1 flex flex-col items-center gap-2 group"
                                                onClick={() => {
                                                    if (navigator.share) {
                                                        navigator.share({ title: vendor.name, url: window.location.href }).catch(() => { });
                                                    }
                                                }}
                                            >
                                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-center text-neutral-900 group-hover:bg-neutral-50 transition-colors">
                                                    <Share2 size={20} strokeWidth={2.5} />
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-[0.1em] text-neutral-400">Share</span>
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                className="flex-1 flex flex-col items-center gap-2 group"
                                                onClick={openReviewModal}
                                            >
                                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-center text-[#830e4c] group-hover:bg-[#830e4c0a] group-hover:border-[#830e4c33] transition-all">
                                                    <Star size={20} strokeWidth={2.5} fill="currentColor" />
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-[0.1em] text-neutral-400 group-hover:text-[#830e4c] transition-colors">Add Review</span>
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 divide-x divide-neutral-50 border-t border-neutral-50 bg-white">
                                    {stats.map((stat) => (
                                        <div key={stat.label} className="py-6 flex flex-col items-center text-center">
                                            <stat.icon size={14} className="text-neutral-300 mb-2" />
                                            <span className="text-lg font-black text-neutral-900 leading-none tracking-tighter">{stat.value}</span>
                                            <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mt-1">{stat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Active Listings Section */}
                            <div className="flex flex-col gap-6">
                                <div className="max-w-[768px] w-full mx-auto flex flex-col gap-6">
                                    <div className="flex items-center justify-between px-10">
                                        <h4 className="text-[11px] font-black text-neutral-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Zap size={14} className="text-[#830e4c]" /> Active Listings
                                        </h4>
                                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">({listings.length})</span>
                                    </div>
                                    <div className="flex overflow-x-auto no-scrollbar gap-5 px-10 snap-x snap-mandatory pb-4">
                                        {listings.map((product: Product) => (
                                            <div key={product.id} className="flex-shrink-0 w-48 text-left group snap-start">
                                                <div className="aspect-[4/5] bg-white rounded-[2.5rem] overflow-hidden border border-neutral-100 mb-4 relative shadow-sm group-active:scale-95 transition-transform">
                                                    <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                                                    <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-white">
                                                        {product.price}
                                                    </div>
                                                </div>
                                                <h5 className="text-[11px] font-black text-neutral-900 truncate uppercase tracking-tight px-2">{product.name}</h5>
                                                <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest mt-1 px-2">{product.category}</p>
                                            </div>
                                        ))}
                                        {listings.length === 0 && (
                                            <div className="w-full py-16 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-neutral-100 border-dashed opacity-60">
                                                <Package size={32} className="mb-2 text-neutral-200" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">No Active Listings</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Reviews Section Card */}
                            <div className="bg-white rounded-[3rem] shadow-xl border border-neutral-100 overflow-hidden">
                                <div className="p-8 flex flex-col items-center">
                                    <div className="max-w-[520px] w-full flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[11px] font-black text-neutral-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Star size={14} className="text-[#830e4c]" fill="currentColor" /> Buyer Reviews
                                            </h4>
                                            <button
                                                onClick={openReviewModal}
                                                className="text-[9px] font-black text-[#830e4c] uppercase tracking-widest bg-[#830e4c0a] border border-[#830e4c33] px-3 py-1.5 rounded-lg active:scale-95 hover:bg-[#830e4c1a] hover:border-[#830e4c66] transition-all"
                                            >
                                                Add Review
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            {reviewsList.map((review: any) => (
                                                <div key={review.id} className="p-4 bg-neutral-50 rounded-[2rem] border border-neutral-100 flex flex-col gap-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-200 border-2 border-white shadow-sm">
                                                                <img
                                                                    src={review.reviewer?.profile_photo || `https://ui-avatars.com/api/?name=${review.reviewer?.name || 'User'}&background=random`}
                                                                    className="w-full h-full object-cover"
                                                                    alt={review.reviewer?.name}
                                                                />
                                                            </div>
                                                            <div>
                                                                <h5 className="text-[11px] font-black text-neutral-900 uppercase tracking-tight">{review.reviewer?.name || 'Anonymous'}</h5>
                                                                <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">@{review.reviewer?.username}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={10}
                                                                    fill={i < review.rating ? "#830e4c" : "none"}
                                                                    className={i < review.rating ? "text-[#830e4c]" : "text-neutral-200"}
                                                                    strokeWidth={3}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {review.comment && (
                                                        <p className="text-[11px] font-medium text-neutral-500 leading-relaxed italic px-2">
                                                            "{review.comment}"
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                            {reviewsList.length === 0 && (
                                                <div className="py-12 text-center bg-neutral-50/50 rounded-[2rem] border border-neutral-50 border-dashed">
                                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                                        <Star size={20} className="text-neutral-200" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">No buyer reviews yet</p>
                                                    <p className="text-[8px] font-medium text-neutral-400 mt-1 uppercase tracking-wider">Be the first to review {vendor.name}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <AnimatePresence>
                {showCallButton && vendor.phone && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 50 }}
                        className="fixed bottom-10 z-[150] w-full flex justify-center pointer-events-none"
                    >
                        <motion.a
                            href={`tel:${vendor.phone}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="pointer-events-auto bg-[#830e4c] text-white px-8 py-4 rounded-full font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_15px_35px_rgba(131,14,76,0.4)] flex items-center gap-3 transition-colors hover:bg-[#a0125d]"
                        >
                            <Phone size={16} fill="white" />
                            Call Seller
                        </motion.a>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isReviewModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsReviewModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
                        >
                            <button
                                onClick={() => setIsReviewModalOpen(false)}
                                className="absolute top-6 right-6 p-2 bg-neutral-50 rounded-xl text-neutral-400"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex flex-col items-center gap-6">
                                <div className="w-16 h-16 bg-[#830e4c1a] rounded-2xl flex items-center justify-center text-[#830e4c]">
                                    <Star size={32} fill="currentColor" />
                                </div>
                                <div className="text-center space-y-1">
                                    <h3 className="text-xl font-black text-neutral-900 uppercase italic">Add Review</h3>
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-relaxed">
                                        Share your experience with {vendor.name}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setRating(s)}
                                            className="p-1 transition-transform active:scale-90"
                                        >
                                            <Star
                                                size={32}
                                                fill={s <= rating ? "#830e4c" : "none"}
                                                className={s <= rating ? "text-[#830e4c]" : "text-neutral-200"}
                                                strokeWidth={2.5}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Write your review here..."
                                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 text-[13px] font-medium text-neutral-900 placeholder:text-neutral-300 focus:ring-2 focus:ring-[#830e4c1a] min-h-[120px] resize-none"
                                />
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleReviewSubmit}
                                    disabled={isSubmitting}
                                    className="w-full bg-[#830e4c] text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-[#830e4c4d] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "Submit Review"
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
